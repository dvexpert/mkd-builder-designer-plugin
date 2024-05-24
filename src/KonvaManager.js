import Konva from "konva";
import EventManager from "./EventManager.js";
import ShapeManager from "./ShapeManager.js";

export class KonvaManager {
    /**
     * 
     * @param {HTMLDivElement} container 
     * @param {string} backgroundPath 
     */
    constructor(container, backgroundPath = '/dist/image/background-grid.jpg') {
        this.backgroundPath = backgroundPath;
        /**
         * @type {Konva.Stage}
         */
        this.stage = new Konva.Stage({
            container: container,
            width: 1500,
            height: 800,
        });

        this.layer = new Konva.Layer();
        this.stage.add(this.layer);

        // EventManager instance to handle
        // generic events like zoom in/out/
        // enable/disable drag etc
        this.eventManager = new EventManager(this.stage, this);

        // ShapeManager instance to handle
        // creating shapes and tbd ...
        this.shapeManager = new ShapeManager(this.stage, this.layer, this.eventManager);

        this.setupBackground();
        this.layer.draw();
    }

    setupBackground() {
        this.stage.container().style.backgroundImage =
            `url('${this.backgroundPath}')`;
        this.stage.container().style.backgroundRepeat = "repeat";
    }
}
