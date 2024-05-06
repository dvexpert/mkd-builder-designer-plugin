import Konva from "konva";
import { KonvaManager } from "./KonvaManager";

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
                if (typeof request?.error === "function") {
                    request.success({ message: "Square shape created" });
                }
            } catch (e) {
                if (typeof request?.success === "function") {
                    request.error({ message: e.message });
                }
            }
        });
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
}
