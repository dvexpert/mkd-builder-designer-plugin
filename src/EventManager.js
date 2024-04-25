import Konva from "konva";

export default class EventManager {
    /**
     * @param {Konva.Stage} stage
     */
    constructor(stage) {
        this.stage = stage;
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
            this.positionReset();
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
