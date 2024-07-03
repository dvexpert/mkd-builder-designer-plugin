import Konva from "konva";
import { KonvaManager } from "./KonvaManager";
import {
    BackgroundNodeId,
    CircleShapeIds,
    LShapeIds,
    ShapeTypes,
    SquareShapeIds,
    UShapeIds,
} from "./enum/ShapeManagerEnum";
import { LShapeHelper as LSH } from "./helpers/LShapeHelper";
import { SquareHelper as SH } from "./helpers/SquareHelper";
import { UShapeHelper as USH } from "./helpers/UShapeHelper";

export default class EventManager {
    /**
     * @param {Konva.Stage} stage
     * @param {KonvaManager} manager
     */
    constructor(stage, manager) {
        this.stage = stage;
        this.manager = manager;
        this.scaleBy = 0.05;

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
                const shapeGroup = this.manager.getSquareShapeManager().drawSquare(
                    request?.image,
                    true,
                    request.materialId,
                    null,
                    request?.prevShapeId,
                    request?.shapeSize,
                    {
                        materialName: request.materialName,
                        productName: request.productName,
                    }
                );

                if (shapeGroup && request.placed && request.placed === true) {
                    this.manager.getSquareShapeManager().drawSquare(
                        request?.image,
                        false,
                        request.materialId,
                        shapeGroup
                    );
                    this.manager.getSquareShapeManager().updateHoverActionOverlayPosition(
                        shapeGroup
                    );
                }

                if (typeof request?.success === "function") {
                    request.success({
                        message: "Square shape created",
                        shapeId: shapeGroup._id,
                    });
                }
            } catch (e) {
                console.error(e);
                if (typeof request?.error === "function") {
                    request.error({ message: e.message });
                }
            }
        });
        document.addEventListener("mkd-plugin:export-download", (e) => {
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
        document.addEventListener("mkd-plugin:rotate", (e) => {
            const request = e?.detail;
            if (!request?.shapeId) {
                request.error && request.error({ message: "No active shape." });
                return;
            }
            if (!request?.rotation) {
                request.error &&
                    request.error({
                        message:
                            "Invalid request parameter value for `rotate`.",
                    });
                return;
            }
            request.success &&
                request.success({ message: "Rotation updated." });
            this.rotate(request.shapeId, Number(request?.rotation));
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

            const shapeGroup = this.getShapeById(request.shapeId);
            if (
                shapeGroup &&
                shapeGroup.getAttr("shapeType") === ShapeTypes.SquareShape
            ) {
                const payload = {};
                payload.attr = SH.isHorizontal(request.wall) ? "width" : "height";

                this.manager.getSquareShapeManager().handleInputValueChange(
                    payload.attr,
                    shapeGroup,
                    null,
                    request.value
                );
            } else if (
                shapeGroup &&
                shapeGroup.getAttr("shapeType") === ShapeTypes.LShape
            ) {
                /** @type {import("./helpers/LShapeHelper").LShapeSideO} - wall */
                const wall = request.wall
                /**
                 *
                 * Extract only sides length property from request object,
                 * request object has may keys like shapeId and more.
                 *
                 * ```json
                 * { "a" | "b" | "c" | "d" | "i": 10 }
                 * ```
                 * can have single side value.
                 */

                /** @type {Konva.Group} */
                const edgeGroup = shapeGroup.findOne(`.${wall}`);
                /** @type {Konva.Text} */
                const labelNode = shapeGroup.findOne(
                    `#${LShapeIds.LShapeTextLayers[wall]}`
                );

                if (LSH.SideI === wall) {
                    const interiorAngle = LSH.getInteriorAngleText(request.value);
                    labelNode.text(interiorAngle);
                    const shapeSize = shapeGroup.getAttr("shapeSize");
                    shapeSize[LSH.SideI] = request.value;
                    shapeGroup.setAttr("shapeSize", shapeSize);

                    return;
                }

                this.manager.getLShapeManager().handleInputValueChange(
                    LSH.isHorizontal(wall) ? "width" : "height",
                    edgeGroup,
                    labelNode,
                    request.value
                );
            } else if (
                shapeGroup &&
                shapeGroup.getAttr("shapeType") === ShapeTypes.UShape
            ) {
                /** @type {import("./helpers/UShapeHelper").UShapeSideO} - wall */
                const wall = request.wall
                /**
                 *
                 * Extract only sides length property from request object,
                 * request object has may keys like shapeId and more.
                 *
                 * ```json
                 * { "a" | "b" | "c" | "d" | "e" | "f": 10 }
                 * ```
                 * can have single side value.
                 */

                /** @type {Konva.Group} */
                const edgeGroup = shapeGroup.findOne(`.${USH.isInteriorAngle(wall) ? USH.SideD : wall}`);
                /** @type {Konva.Text} */
                const labelNode = shapeGroup.findOne(
                    `#${UShapeIds.UShapeTextLayers[wall]}`
                );

                if (USH.isInteriorAngle(wall)) {
                    const interiorAngle = USH.getInteriorAngleText(request.value);
                    labelNode.text(interiorAngle);
                    const shapeSize = shapeGroup.getAttr("shapeSize");
                    shapeSize[wall] = request.value;
                    shapeGroup.setAttr("shapeSize", shapeSize);

                    return;
                }

                this.manager.getUShapeManager().handleInputValueChange(
                    edgeGroup,
                    labelNode,
                    request.value
                );
            } else if (
                shapeGroup &&
                shapeGroup.getAttr("shapeType") === ShapeTypes.CircleShape
            ) {
                this.manager.getCircleShapeManager().handleInputValueChange(
                    shapeGroup,
                    null,
                    request.value
                );
            }
        });
        document.addEventListener("mkd-plugin:toggle-rounded-box", (e) => {
            const request = e.detail;
            try {
                this.toggleRoundedCheckbox(
                    request.shapeId,
                    request.wall,
                    request.addWall,
                    request.defaultValue
                );
            } catch (e) {
                request.error && request.error({ message: e.message });
            }
        });

        document.addEventListener("mkd-plugin:shape-position", (e) => {
            const request = e.detail;
            try {
                this.setShapePosition(
                    request.id ?? request.shapeId,
                    request.position
                );
                request.success &&
                    request.success({ message: "Shape position updated" });
            } catch (e) {
                request.error && request.error({ message: e.message });
            }
        });

        document.addEventListener("mkd-plugin:toggle-attribute-item", (e) => {
            const request = e.detail;
            if (request.addWall) {
                this.addAttribute(request.shapeId, request);
            } else {
                this.removeAttribute(request.shapeId, request.propertyId);
            }
        });

        this.handleShapeLEvents();
        this.handleUShapeEvents();
        this.handleCircleShapeEvents();
        this.handleExportEvents();
    }

    handleShapeLEvents() {
        document.addEventListener("mkd-plugin:draw:l", (e) => {
            const request = e?.detail;
            try {
                const shapeGroup = this.manager.getLShapeManager().draw(
                    request?.image,
                    true,
                    request.materialId,
                    null,
                    request?.prevShapeId,
                    request?.shapeSize,
                    {
                        materialName: request.materialName,
                        productName: request.productName
                    }
                );

                if (shapeGroup && request.placed && request.placed === true) {
                    this.manager.getLShapeManager().draw(
                        request?.image,
                        false,
                        request.materialId,
                        shapeGroup
                    );
                    this.manager.getLShapeManager().updateHoverActionOverlayPosition(
                        shapeGroup
                    );
                }

                if (typeof request?.success === "function") {
                    request.success({
                        message: "Square shape created",
                        shapeId: shapeGroup._id
                    });
                }
            } catch (e) {
                console.error(e);
                if (typeof request?.error === "function") {
                    request.error({ message: e.message });
                }
            }
        });
    }

    handleUShapeEvents() {
        document.addEventListener("mkd-plugin:draw:u", (e) => {
            const request = e?.detail;
            try {
                const shapeGroup = this.manager.getUShapeManager().draw(
                    request?.image,
                    true,
                    request.materialId,
                    null,
                    request?.prevShapeId,
                    request?.shapeSize,
                    {
                        materialName: request.materialName,
                        productName: request.productName
                    }
                );

                if (shapeGroup && request.placed && request.placed === true) {
                    this.manager.getUShapeManager().draw(
                        request?.image,
                        false,
                        request.materialId,
                        shapeGroup
                    );
                    this.manager.getUShapeManager().updateHoverActionOverlayPosition(
                        shapeGroup
                    );
                }

                if (typeof request?.success === "function") {
                    request.success({
                        message: "Square shape created",
                        shapeId: shapeGroup._id
                    });
                }
            } catch (e) {
                console.error(e);
                if (typeof request?.error === "function") {
                    request.error({ message: e.message });
                }
            }
        });
    }

    handleCircleShapeEvents() {
        document.addEventListener("mkd-plugin:draw:circle", (e) => {
            const request = e?.detail;
            try {
                const shapeGroup = this.manager.getCircleShapeManager().draw(
                    request?.image,
                    true,
                    request.materialId,
                    null,
                    request?.prevShapeId,
                    request?.shapeSize,
                    {
                        materialName: request.materialName,
                        productName: request.productName
                    }
                );

                if (shapeGroup && request.placed && request.placed === true) {
                    this.manager.getCircleShapeManager().draw(
                        request?.image,
                        false,
                        request.materialId,
                        shapeGroup
                    );
                    this.manager.getCircleShapeManager().updateHoverActionOverlayPosition(
                        shapeGroup
                    );
                }

                if (typeof request?.success === "function") {
                    request.success({
                        message: "Circle shape created",
                        shapeId: shapeGroup._id
                    });
                }
            } catch (e) {
                console.error(e);
                if (typeof request?.error === "function") {
                    request.error({ message: e.message });
                }
            }
        });
    }

    /**
     *
     * @param {Boolean} enable
     */
    setShapeDrag(enable) {
        this.stage.setAttr("shapeDraggable", enable);
        /** @type {Konva.Group[]} */
        const shapes = this.stage.find(
            `#${SquareShapeIds.ShapeGroup},#${LShapeIds.LShapeGroup},#${CircleShapeIds.CircleShapeGroup},#${UShapeIds.UShapeGroup}`
        );
        shapes.forEach((shape) => shape.setDraggable(enable));
    }

    /**
     *
     * @param {number} shapeId
     */
    deleteShape(shapeId) {
        const shapeGroup = this.getShapeById(shapeId);
        if (shapeGroup) {
            this.manager.getSquareShapeManager().deleteShape(shapeGroup);
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

        let request = {
            id: shapeGroup._id,
            materialId: shapeGroup.getAttr("materialId"),
            shapeName: shapeGroup.getAttr("shapeName"),
            againstTheWall: shapeGroup.getAttr("againstTheWall"),
            backsplashes: shapeGroup.getAttr("backsplashes"),
            haveRoundedCorners: shapeGroup.getAttr("haveRoundedCorners"),
            shapeSize: Object.keys(shapeSize).length > 0 ? shapeSize : {},
            shapeType: shapeGroup.getAttr("shapeType"),
            prevShapeId: shapeGroup.getAttr("prevShapeId"),
        };

        // To remove keys with undefine value (different shape has different attributes).
        request = JSON.parse(JSON.stringify(request));

        const newEvent = new CustomEvent("mkd-plugin:active-shape", {
            detail: request,
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
                shapeType: shapeGroup.getAttr("shapeType"),
            },
        });
        document.dispatchEvent(newEvent);
    }

    zoomIn() {
        const oldScale = this.stage.scaleX();
        if (oldScale <= 1.20) {
            const newScale = Number((oldScale + this.scaleBy).toFixed(2));
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
        if (oldScale < 0.80) return;
        const newScale = Number((oldScale - this.scaleBy).toFixed(2));
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
        this.stage.position({ x: 0, y: 0 });
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
        const edgeGroup = shape.findOne(`.${wall}`);
        if (shape.getAttr("shapeType") === ShapeTypes.SquareShape) {
            this.manager.getSquareShapeManager().addWall(edgeGroup, shape);
        } else if (shape.getAttr("shapeType") === ShapeTypes.LShape) {
            this.manager.getLShapeManager().addWall(edgeGroup, shape);
        } else if (shape.getAttr("shapeType") === ShapeTypes.UShape) {
            this.manager.getUShapeManager().addWall(edgeGroup, shape);
        }
    }

    /**
     *
     * @param {number} shapeId - this should be node._id and not the node.id()
     * @param {import("./helpers/SquareHelper").SquareSide} wall - a | b | c | d
     */
    removeWall(shapeId, wall) {
        const shape = this.getShapeById(shapeId);
        /** @type {Konva.Group} */
        const edgeGroup = shape.findOne(`.${wall}`);
        if (shape.getAttr("shapeType") === ShapeTypes.SquareShape) {
            this.manager.getSquareShapeManager().removeWall(shape, wall);
        } else if (shape.getAttr("shapeType") === ShapeTypes.LShape) {
            this.manager.getLShapeManager().removeWall(edgeGroup, shape, wall);
        } else if (shape.getAttr("shapeType") === ShapeTypes.UShape) {
            this.manager.getUShapeManager().removeWall(edgeGroup, shape, wall);
        }
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
        if (shape.getAttr("shapeType") === ShapeTypes.SquareShape) {
            this.manager.getSquareShapeManager().addBacksplash(backsplashGroup, shape);
        } else if (shape.getAttr("shapeType") === ShapeTypes.LShape) {
            this.manager.getLShapeManager().addBacksplash(backsplashGroup, shape);
        } else if (shape.getAttr("shapeType") === ShapeTypes.UShape) {
            this.manager.getUShapeManager().addBacksplash(backsplashGroup, shape);
        }
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
        if (shape.getAttr("shapeType") === ShapeTypes.SquareShape) {
            this.manager.getSquareShapeManager().removeBacksplash(
                backsplashGroup,
                shape,
                wall
            );
        } else if (shape.getAttr("shapeType") === ShapeTypes.LShape) {
            this.manager.getLShapeManager().removeBacksplash(
                backsplashGroup,
                shape,
                wall
            );
        } else if (shape.getAttr("shapeType") === ShapeTypes.UShape) {
            this.manager.getUShapeManager().removeBacksplash(
                backsplashGroup,
                shape,
                wall
            );
        }
    }

    /**
     * On `mkd-plugin:export-download` to download canvas as image and json data.
     * Currently only used for demo setup.
     */
    export() {
        // check has children
        if (
            this.stage
                .findOne("Layer")
                .find((node) => node.id() !== BackgroundNodeId).length === 0
        ) {
            console.error("Stage has no children to export");
            return;
        }

        const opt = this.getExportImageDataURL();
        this.downloadURI(opt, "stage.png");
        this.downloadObjectAsJson(this.stage.toObject(), "stage-object.json");
    }

    getExportImageDataURL() {
        const offset = 20;
        const groupNodes = this.stage.find(
            `#${SquareShapeIds.ShapeGroup}, #${LShapeIds.LShapeGroup}, #${CircleShapeIds.CircleShapeGroup}, #${UShapeIds.UShapeGroup}`
        );

        // Get the current scale of the stage
        const scale = this.stage.scale(); // assuming uniform scaling (scaleX = scaleY).
        this.stage.scale({ x: 1, y: 1, });

        const { minX, minY, newWidth, newHeight } = this.getNewStageDimensions(
            groupNodes,
            offset
        );

        const background = this.stage.findOne(`#${BackgroundNodeId}`)
        background.show();

        // Resize the stage
        const oldWidth = this.stage.width();
        const oldHeight = this.stage.height();

        this.stage.width(newWidth);
        this.stage.height(newHeight);

        background.width(newWidth + 100)
        background.height(newHeight + 100)

        // Set the background image position to match the stage's current position
        background.position({
            x: -this.stage.x(),
            y: -this.stage.y()
        });
        background.size({
            width: this.stage.width(),
            height: this.stage.height()
        });

        // Move all Shape Groups to adjust for negative minX and minY
        groupNodes.forEach((group) => {
            group.x(group.x() - minX + offset);
            group.y(group.y() - minY + offset);
        });

        const exportImageDataUrl = this.stage.toDataURL();

        this.stage.scale(scale);
        // Hide background rectangle node again.
        background.hide();

        // reset stage size.
        this.stage.width(oldWidth);
        this.stage.height(oldHeight);

        // Reset position of the nodes
        groupNodes.forEach((group) => {
            group.x(group.x() + minX - offset);
            group.y(group.y() + minY - offset);
        });

        return exportImageDataUrl;
    }

    /**
     * 
     * @param {Konva.Group[]} groupNodes 
     * @param {number} offset 
     * @returns 
     */
    getNewStageDimensions(groupNodes, offset) {
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;

        groupNodes.forEach((group) => {
            const boundingBox = group.getClientRect();
            if (boundingBox.x < minX) minX = boundingBox.x;
            if (boundingBox.y < minY) minY = boundingBox.y;
            if (boundingBox.x + boundingBox.width > maxX)
                maxX = boundingBox.x + boundingBox.width;
            if (boundingBox.y + boundingBox.height > maxY)
                maxY = boundingBox.y + boundingBox.height;
        });

        const newWidth = maxX - minX + 2 * offset;
        const newHeight = maxY - minY + 2 * offset;

        return {
            minX,
            minY,
            newWidth: Math.max(1500, newWidth), // Export image minimum width 1500
            newHeight: Math.max(800, newHeight), // Export image minimum height 800
        };
    }

    /**
     *
     * @param {string} uri
     * @param {string} name
     */
    downloadURI(uri, name) {
        const link = document.createElement("a");
        link.style.display = "none";
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
        if (shape.getAttr("shapeType") === ShapeTypes.SquareShape) {
            this.manager.getSquareShapeManager().rotateShapeGroup(shape, rotation);
        } else if (shape.getAttr("shapeType") === ShapeTypes.LShape) {
            this.manager.getLShapeManager().rotateShapeGroup(shape, rotation);
        } else if (shape.getAttr("shapeType") === ShapeTypes.UShape) {
            this.manager.getUShapeManager().rotateShapeGroup(shape, rotation);
        }
    }

    /**
     *
     * @param {number} shapeId - this should be node._id and not the node.id()
     * @param {import("./helpers/SquareHelper").SquareSide} wall - a | b | c | d
     * @param {boolean} add - true - To add the checkbox for rounded corners, false - remove the checkbox.
     * @param {boolean} defaultVal
     */
    toggleRoundedCheckbox(shapeId, wall, add, defaultVal = false) {
        const shape = this.getShapeById(shapeId);
        /** @type {Konva.Group} */
        const edgeSubGroup = shape.findOne(`.${wall}`);

        if (add === true) {
            if (shape.findOne(`#checkbox_node_${wall}`)) {
                throw new Error("Checkbox group already exists!");
            }
            if (shape.getAttr("shapeType") === ShapeTypes.SquareShape) {
                this.manager.getSquareShapeManager().addCheckboxGroup(
                    edgeSubGroup,
                    wall,
                    shape,
                    defaultVal
                );
            } else if (shape.getAttr("shapeType") === ShapeTypes.LShape) {
                this.manager.getLShapeManager().addCheckboxGroup(
                    wall,
                    shape,
                    defaultVal
                );
            } else if (shape.getAttr("shapeType") === ShapeTypes.UShape) {
                this.manager.getUShapeManager().addCheckboxGroup(
                    wall,
                    shape,
                    defaultVal
                );
            }
        } else {
            if (!shape.findOne(`#checkbox_node_${wall}`)) {
                throw new Error("Checkbox group does not exists!");
            }
            if (shape.getAttr("shapeType") === ShapeTypes.SquareShape) {
                this.manager.getSquareShapeManager().removeCheckboxGroup(wall, shape);
            } else if (shape.getAttr("shapeType") === ShapeTypes.LShape) {
                this.manager.getLShapeManager().removeCheckboxGroup(wall, shape);
            } else if (shape.getAttr("shapeType") === ShapeTypes.UShape) {
                this.manager.getUShapeManager().removeCheckboxGroup(wall, shape);
            }
        }
    }

    handleExportEvents() {
        document.addEventListener("mkd-plugin:export", (e) => {
            const request = e.detail;

            try {
                if (
                    this.stage
                        .findOne("Layer")
                        .find((node) => node.id() !== BackgroundNodeId)
                        .length === 0
                ) {
                    throw new Error("No Shape Added.");
                }
                const payload = {
                    image: this.getExportImageDataURL(),
                };
                const canvasJson = this.stage.toObject();
                const json = {
                    stage: {},
                    shapes: [],
                };
                // Canvas size and attributes.
                json.stage = canvasJson.attrs;

                canvasJson.children.forEach((child) => {
                    if (child.className === "Layer") {
                        Object.values(child.children).forEach((shapeGroup) => {
                            if (shapeGroup?.attrs?.id === BackgroundNodeId) {
                                return;
                            }
                            if (shapeGroup.attrs) {
                                json.shapes.push(shapeGroup.attrs);
                            }
                        });
                    }
                });

                payload.json = JSON.stringify(json);
                request.success && request.success(payload);
            } catch (e) {
                request.error &&
                    request.error({ message: e.message, trace: e });
            }
        });
    }

    /**
     *
     * @param {number} shapeId - this should be node._id and not the node.id()
     * @param {{x: number, y: number}} position
     */
    setShapePosition(shapeId, position) {
        const shapeGroup = this.getShapeById(shapeId);
        if (!shapeGroup) {
            throw new Error(`Shape ${shapeId} not found`);
        }
        if (shapeGroup.getAttr("shapeType") === ShapeTypes.SquareShape) {
            position?.x && shapeGroup.x(Number(position.x));
            position.y && shapeGroup.y(Number(position.y));
            this.manager.getSquareShapeManager().updateAttributesOverlayPosition(
                shapeGroup
            );
        } else if (shapeGroup.getAttr("shapeType") === ShapeTypes.LShape) {
            position?.x && shapeGroup.x(Number(position.x));
            position.y && shapeGroup.y(Number(position.y));
            this.manager.getLShapeManager().updateAttributesOverlayPosition(
                shapeGroup
            );
        } else if (shapeGroup.getAttr("shapeType") === ShapeTypes.UShape) {
            position?.x && shapeGroup.x(Number(position.x));
            position.y && shapeGroup.y(Number(position.y));
            this.manager.getUShapeManager().updateAttributesOverlayPosition(
                shapeGroup
            );
        } else if (shapeGroup.getAttr("shapeType") === ShapeTypes.CircleShape) {
            position?.x && shapeGroup.x(Number(position.x));
            position.y && shapeGroup.y(Number(position.y));
            this.manager.getCircleShapeManager().updateAttributesOverlayPosition(
                shapeGroup
            );
        }
    }

    /**
     *
     * @typedef {Object} AttributePayloadType
     * @property {string} propertyId
     * @property {string} image
     * @property {string} name
     *
     * @param {number} shapeId
     * @param {Partial<AttributePayloadType>} payload
     */
    addAttribute(shapeId, payload) {
        const shapeGroup = this.getShapeById(shapeId);
        if (!shapeGroup) {
            throw new Error(`Shape ${shapeId} not found`);
        }

        if (shapeGroup.getAttr("shapeType") === ShapeTypes.SquareShape) {
            this.manager.getSquareShapeManager().appendShapeCutOut(
                shapeGroup,
                payload.image,
                payload.name,
                null,
                payload.propertyId
            );
        } else if (shapeGroup.getAttr("shapeType") === ShapeTypes.LShape) {
            this.manager.getLShapeManager().appendShapeCutOut(
                shapeGroup,
                payload.image,
                payload.name,
                null,
                payload.propertyId
            );
        } else if (shapeGroup.getAttr("shapeType") === ShapeTypes.UShape) {
            this.manager.getUShapeManager().appendShapeCutOut(
                shapeGroup,
                payload.image,
                payload.name,
                null,
                payload.propertyId
            );
        } else if (shapeGroup.getAttr("shapeType") === ShapeTypes.CircleShape) {
            this.manager.getCircleShapeManager().appendShapeCutOut(
                shapeGroup,
                payload.image,
                payload.name,
                null,
                payload.propertyId
            );
        }
    }

    /**
     *
     * @param {number} shapeId
     * @param {string} propertyId
     */
    removeAttribute(shapeId, propertyId) {
        const shapeGroup = this.getShapeById(shapeId);
        if (!shapeGroup) {
            throw new Error(`Shape ${shapeId} not found`);
        }

        if (shapeGroup.getAttr("shapeType") === ShapeTypes.SquareShape) {
            this.manager.getSquareShapeManager().removeShapeCutOut(shapeGroup, propertyId);
        } else if (shapeGroup.getAttr("shapeType") === ShapeTypes.LShape) {
            this.manager.getLShapeManager().removeShapeCutOut(shapeGroup, propertyId);
        } else if (shapeGroup.getAttr("shapeType") === ShapeTypes.UShape) {
            this.manager.getUShapeManager().removeShapeCutOut(shapeGroup, propertyId);
        } else if (shapeGroup.getAttr("shapeType") === ShapeTypes.CircleShape) {
            this.manager.getCircleShapeManager().removeShapeCutOut(shapeGroup, propertyId);
        }
    }
}
