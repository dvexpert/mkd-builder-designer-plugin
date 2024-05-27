import Konva from "konva";
import { KonvaManager } from "./KonvaManager";
import { SquareShapeIds } from "./enum/ShapeManagerEnum";

export default class EventManager {
    /**
     * @param {Konva.Stage} stage
     * @param {KonvaManager} manager
     */
    constructor(stage, manager) {
        this.stage = stage;
        this.manager = manager;
        this.scaleBy = 1.1;

        document.addEventListener("mkd-plugin:zoom-in", () => {
            this.zoomIn();
        });
        document.addEventListener("mkd-plugin:zoom-out", () => {
            this.zoomOut();
        });
        document.addEventListener("mkd-plugin:zoom-reset", () => {
            this.zoomReset();
        });
        document.addEventListener("mkd-plugin:drag", (e) => {
            this.setDraggable(Boolean(e.detail?.enable));
        });
        document.addEventListener("mkd-plugin:position-reset", (e) => {
            this.positionReset();
        });
        document.addEventListener("mkd-plugin:draw:square", (e) => {
            const request = e?.detail;
            try {
                this.manager.shapeManager.drawSquare(
                    request?.image,
                    true,
                    request.materialId
                );
                if (typeof request?.success === "function") {
                    request.success({ message: "Square shape created" });
                }
            } catch (e) {
                console.error(e);
                if (typeof request?.error === "function") {
                    request.error({ message: e.message });
                }
            }
        });
        document.addEventListener("mkd-plugin:export", (e) => {
            this.export();
        });
        document.addEventListener("mkd-plugin:toggle-wall", (e) => {
            const request = e.detail;
            if (request.addWall) {
                this.addWall(request.shapeId, request.wall);
            } else {
                this.removeWall(request.shapeId, request.wall);
            }
        });
        document.addEventListener("mkd-plugin:toggle-backsplash", (e) => {
            const request = e.detail;
            if (request.addWall) {
                this.addBacksplash(request.shapeId, request.wall);
            } else {
                this.removeBacksplash(request.shapeId, request.wall);
            }
        });
        document.addEventListener("mkd-plugin:shape-name", (e) => {
            const request = e?.detail;
            if (!request?.shapeName) {
                request.error &&
                    request.error({ message: "Shape name not specified" });
                return;
            }
            if (!request?.shapeId) {
                request.error && request.error({ message: "No active shape." });
                return;
            }
            try {
                this.changeShapeName(request.shapeId, request.shapeName);
            } catch (e) {
                request.error && request.error({ message: e.message });
                return;
            }
            request.success &&
                request.success({
                    message: "Shape name updated successfully.",
                });
        });
        document.addEventListener("mkd-plugin:rotate-left", (e) => {
            const request = e?.detail;
            if (!request?.shapeId) {
                request.error && request.error({ message: "No active shape." });
                return;
            }
            this.rotate(request.shapeId, -90);
        });
        document.addEventListener("mkd-plugin:rotate-right", (e) => {
            const request = e?.detail;
            if (!request?.shapeId) {
                request.error && request.error({ message: "No active shape." });
                return;
            }
            this.rotate(request.shapeId, 90);
        });
        document.addEventListener("mkd-plugin:delete-shape", (e) => {
            const request = e?.detail;
            if (!request?.shapeId) {
                request.error && request.error({ message: "No active shape." });
                return;
            }
            this.deleteShape(request.shapeId);
        });
        document.addEventListener("mkd-plugin:enable-shape-drag", (e) => {
            const request = e?.detail;
            this.setShapeDrag(request?.enable);
        });
        document.addEventListener("mkd-plugin:shape-size", (e) => {
            const request = e?.detail;
            if (!request?.shapeId) {
                request.error && request.error({ message: "No active shape." });
                return;
            }
            if (request?.height <= 0 || request?.width <= 0) {
                request.error &&
                    request.error({ message: "Invalid size provided" });
                return;
            }

            const payload = {};
            if (request.height) {
                payload.attr = "height";
                payload.height = request.height;
            } else if (request.width) {
                payload.attr = "width";
                payload.width = request.width;
            }

            this.setShapeSize(request.shapeId, payload);
        });
        document.addEventListener("mkd-plugin:toggle-rounded-box", (e) => {
            const request = e.detail;
            try {
                this.toggleRoundedCheckbox(request.shapeId, request.wall, request.addWall);
            } catch (e) {
                request.error && request.error({ message: e.message });
            }
        });
    }

    /**
     *
     * @typedef {"height" | "width"} AttrType
     *
     * @typedef {Object} Payload
     * @property {string} width
     * @property {string} height
     * @property {AttrType} attr
     *
     * @param {number} shapeId
     * @param {Payload} payload
     */
    setShapeSize(shapeId, payload) {
        const shapeGroup = this.getShapeById(shapeId);
        if (shapeGroup) {
            this.manager.shapeManager.handleInputValueChange(
                payload.attr,
                shapeGroup,
                null,
                payload[payload.attr]
            );
        }
    }

    /**
     *
     * @param {Boolean} enable
     */
    setShapeDrag(enable) {
        this.stage.setAttr("shapeDraggable", enable);
        /** @type {Konva.Group[]} */
        const shapes = this.stage.find(`#${SquareShapeIds.ShapeGroup}`);
        shapes.forEach((shape) => shape.draggable(enable));
    }

    /**
     *
     * @param {number} shapeId
     */
    deleteShape(shapeId) {
        const shapeGroup = this.getShapeById(shapeId);
        if (shapeGroup) {
            this.manager.shapeManager.deleteShape(shapeGroup);
        }
    }

    /**
     *
     * @param {Konva.Group} shapeGroup
     */
    dispatchShapeSelect(shapeGroup) {
        EventManager.dispatchShapeSelect(shapeGroup);
    }

    /**
     *
     * @param {number} shapeId
     */
    dispatchShapeDelete(shapeId) {
        const newEvent = new CustomEvent("mkd-plugin:shape-deleted", {
            detail: {
                shapeId: shapeId,
            },
        });
        document.dispatchEvent(newEvent);
    }

    /**
     *
     * @param {Konva.Group} shapeGroup
     */
    static dispatchShapeSelect(shapeGroup) {
        const shapeSize = shapeGroup.getAttr("shapeSize");
        const newEvent = new CustomEvent("mkd-plugin:active-shape", {
            detail: {
                id: shapeGroup._id,
                materialId: shapeGroup.getAttr("materialId"),
                shapeName: shapeGroup.getAttr("shapeName"),
                againstTheWall: shapeGroup.getAttr("againstTheWall"),
                backsplashes: shapeGroup.getAttr("backsplashes"),
                haveRoundedCorners: shapeGroup.getAttr("haveRoundedCorners"),
                shapeSize: Object.keys(shapeSize).length > 0 ? shapeSize : {},
            },
        });
        document.dispatchEvent(newEvent);
    }

    /**
     *
     * @param {Konva.Group} shapeGroup
     */
    dispatchSizeUpdate(shapeGroup) {
        const shapeSize = shapeGroup.getAttr("shapeSize");
        const newEvent = new CustomEvent("mkd-plugin:shape-size-change", {
            detail: {
                id: shapeGroup._id,
                shapeSize: Object.keys(shapeSize).length > 0 ? shapeSize : {},
            },
        });
        document.dispatchEvent(newEvent);
    }

    zoomIn() {
        const oldScale = this.stage.scaleX();
        if (oldScale <= 2) {
            const newScale = oldScale * this.scaleBy;
            const newPos = this.getStageCenterNewPos(oldScale, newScale);

            this.stage.scale({
                x: newScale,
                y: newScale,
            });

            this.stage.position(newPos);
            this.stage.batchDraw();
        }
    }
    zoomOut() {
        const oldScale = this.stage.scaleX();
        const newScale = oldScale / this.scaleBy;
        const newPos = this.getStageCenterNewPos(oldScale, newScale);

        this.stage.scale({
            x: newScale,
            y: newScale,
        });

        this.stage.position(newPos);
        this.stage.batchDraw();
    }

    /**
     *
     * @param {number} oldScale
     * @param {number} newScale
     */
    getStageCenterNewPos(oldScale, newScale) {
        const center = {
            x: this.stage.width() / 2,
            y: this.stage.height() / 2,
        };

        const relatedTo = {
            x: (center.x - this.stage.x()) / oldScale,
            y: (center.y - this.stage.y()) / oldScale,
        };

        return {
            x: center.x - relatedTo.x * newScale,
            y: center.y - relatedTo.y * newScale,
        };
    }
    zoomReset() {
        this.stage.scale({ x: 1, y: 1 });
    }
    /**
     * @param {boolean} draggable
     */
    setDraggable(draggable = true) {
        this.stage.draggable(draggable);
        this.stage.container().style.cursor = draggable ? "grab" : "unset";
        this.stage.on("dragstart", (ev) => {
            ev.target.getStage().container().style.cursor = draggable
                ? "grabbing"
                : "unset";
        });
        this.stage.on("dragend", (ev) => {
            ev.target.getStage().container().style.cursor = draggable
                ? "grab"
                : "unset";
        });
    }

    positionReset() {
        this.stage.position({ x: 0, y: 0 });
    }

    /**
     *
     * @param {number} shapeId - this should be node._id and not the node.id()
     * @returns {Konva.Group}
     */
    getShapeById(shapeId) {
        return this.stage.findOne((node) => node._id === shapeId);
    }

    /**
     *
     * @param {number} shapeId - this should be node._id and not the node.id()
     * @param {import("./helpers/SquareHelper").SquareSide} wall - a | b | c | d
     */
    addWall(shapeId, wall) {
        const shape = this.getShapeById(shapeId);
        /** @type {Konva.Group} */
        const wallGroup = shape.findOne(`.${wall}`);
        this.manager.shapeManager.addWall(wallGroup, shape);
    }

    /**
     *
     * @param {number} shapeId - this should be node._id and not the node.id()
     * @param {import("./helpers/SquareHelper").SquareSide} wall - a | b | c | d
     */
    removeWall(shapeId, wall) {
        const shape = this.getShapeById(shapeId);
        /** @type {Konva.Group} */
        const wallGroup = shape.findOne(`.${wall}`);
        this.manager.shapeManager.removeWall(wallGroup, shape, wall);
    }

    /**
     *
     * @param {number} shapeId - this should be node._id and not the node.id()
     * @param {import("./helpers/SquareHelper").SquareSide} wall - a | b | c | d
     */
    addBacksplash(shapeId, wall) {
        const shape = this.getShapeById(shapeId);
        /** @type {Konva.Group} */
        const backsplashGroup = shape.findOne(`.${wall}`);
        this.manager.shapeManager.addBacksplash(backsplashGroup, shape);
    }

    /**
     *
     * @param {number} shapeId - this should be node._id and not the node.id()
     * @param {import("./helpers/SquareHelper").SquareSide} wall - a | b | c | d
     */
    removeBacksplash(shapeId, wall) {
        const shape = this.getShapeById(shapeId);
        /** @type {Konva.Group} */
        const backsplashGroup = shape.findOne(`.${wall}`);
        this.manager.shapeManager.removeBacksplash(
            backsplashGroup,
            shape,
            wall
        );
    }

    export() {
        // check has children
        if (!this.stage.findOne("Layer").hasChildren()) {
            alert("Stage has no children to export");
            return;
        }

        const opt = this.stage.toDataURL();
        this.downloadURI(opt, "stage.png");
        this.downloadObjectAsJson(this.stage.toObject(), "stage-object.json");
    }

    /**
     *
     * @param {string} uri
     * @param {string} name
     */
    downloadURI(uri, name) {
        const link = document.createElement("a");
        link.download = name;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     *
     * @param {Object} exportObj
     * @param {string} exportName
     */
    downloadObjectAsJson(exportObj, exportName) {
        const dataStr =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(exportObj));
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", exportName + ".json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    /**
     *
     * @param {number} shapeId
     * @param {string} shapeName
     */
    changeShapeName(shapeId, shapeName) {
        const shapeGroup = this.getShapeById(shapeId);
        shapeGroup.setAttr("shapeName", shapeName);
        const shapeNameElm = document.querySelector(
            `#attributes-overlay-${shapeGroup._id} #shape-name`
        );
        shapeNameElm.innerHTML = shapeName;
        shapeNameElm.setAttribute("title", shapeName);
    }

    /**
     *
     * @param {number} shapeId
     * @param {number} rotation - +90 or -90 degrees
     */
    rotate(shapeId, rotation) {
        const shape = this.getShapeById(shapeId);
        if (!shape) {
            console.error("Shape not found with id " + shapeId);
            return;
        }
        this.manager.shapeManager.rotateShapeGroup(shape, rotation);
    }

    /**
     *
     * @param {number} shapeId - this should be node._id and not the node.id()
     * @param {import("./helpers/SquareHelper").SquareSide} wall - a | b | c | d
     */
    toggleRoundedCheckbox(shapeId, wall, add) {
        const shape = this.getShapeById(shapeId);
        /** @type {Konva.Group} */
        const edgeSubGroup = shape.findOne(`.${wall}`);

        if (add === true) {
            if (shape.findOne(`#checkbox_node_${wall}`)) {
                throw new Error("Checkbox group already exists!");
            }
            this.manager.shapeManager.addCheckboxGroup(edgeSubGroup, wall, shape);
        } else {
            if (!shape.findOne(`#checkbox_node_${wall}`)) {
                throw new Error("Checkbox group does not exists!");
            }
            this.manager.shapeManager.removeCheckboxGroup(wall, shape);

        }
    }
}
