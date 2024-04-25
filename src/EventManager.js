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
            const newScale = oldScale + this.scaleBy;
            this.stage.scale({ x: newScale, y: newScale });
        }
    }
    zoomOut() {
        const oldScale = this.stage.scaleX();
        if (oldScale > 1) {
            const newScale = oldScale - this.scaleBy;
            this.stage.scale({ x: newScale, y: newScale });
        }
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
