import Konva from "konva";

export default class EventManager {
    constructor() {
        /**
         * @type {Konva.Stage}
         */
        this.stage = null;
        this.scaleBy = 0.05;
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
