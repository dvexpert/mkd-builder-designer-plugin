import Konva from "konva";
import { KonvaManager } from "./KonvaManager";
import ShapeManager from "./ShapeManager";

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
                this.manager.shapeManager.drawSquare(request?.image);
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
            this.changeShapeName(request.shapeId, request.shapeName);
        });
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
     * @param {Konva.Group} shapeGroup
     */
    static dispatchShapeSelect(shapeGroup) {
        const newEvent = new CustomEvent("mkd-plugin:active-shape", {
            detail: {
                id: shapeGroup._id,
                shapeName: shapeGroup.getAttr("shapeName"),
                againstTheWall: shapeGroup.getAttr("againstTheWall"),
                backsplashes: shapeGroup.getAttr("backsplashes"),
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
     * @param {import("./helpers/SquareHelper").SquareSide} wall - a | b | c | d
     */
    addWall(shapeId, wall) {
        /** @type {Konva.Group} */
        const shape = this.stage.findOne((node) => {
            return node._id === shapeId;
        });
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
        /** @type {Konva.Group} */
        const shape = this.stage.findOne((node) => {
            return node._id === shapeId;
        });
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
        /** @type {Konva.Group} */
        const shape = this.stage.findOne((node) => {
            return node._id === shapeId;
        });
        /** @type {Konva.Group} */
        const backsplashGroup = shape.findOne(`.${wall}`);
        this.manager.shapeManager.addBacksplash(backsplashGroup, shape)
    }

    /**
     *
     * @param {number} shapeId - this should be node._id and not the node.id()
     * @param {import("./helpers/SquareHelper").SquareSide} wall - a | b | c | d
     */
    removeBacksplash(shapeId, wall) {
        /** @type {Konva.Group} */
        const shape = this.stage.findOne((node) => {
            return node._id === shapeId;
        });
        /** @type {Konva.Group} */
        const backsplashGroup = shape.findOne(`.${wall}`);
        this.manager.shapeManager.removeBacksplash(backsplashGroup, shape, wall)
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
        /** @type {Konva.Group} */
        const shapeGroup = this.stage.findOne((node) => {
            return node._id === shapeId;
        });
        shapeGroup.setAttr("shapeName", shapeName);
        document.querySelector(
            `#attributes-overlay-${shapeGroup._id} #shape-name`
        ).innerHTML = shapeName;
    }
}
