import Konva from "konva";
import EventManager from "./EventManager.js";
import ShapeManager from "./ShapeManager.js";
import LShapeManager from "./LShapeManager.js";
import { BackgroundNodeId } from "./enum/ShapeManagerEnum.js";

export class KonvaManager {
    /**
     *
     * @param {HTMLDivElement} container
     * @param {string} backgroundPath
     */
    constructor(container, backgroundPath = "/dist/image/background-grid.jpg") {
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
        this.shapeManager = new ShapeManager(
            this.stage,
            this.layer,
            this.eventManager
        );

        // L Shape Manager
        this.lShapeManager = new LShapeManager(
            this.stage,
            this.layer,
            this.eventManager
        );

        this.setupBackground();
        this.layer.draw();
    }

    setupBackground() {
        const img = document.createElement("img");
        img.src = this.backgroundPath;

        img.onload = () => {
            const background = new Konva.Rect({
                id: BackgroundNodeId,
                x: 0,
                y: 0,
                width: this.stage.width(),
                height: this.stage.height(),
                listening: false,
                fillPatternImage: img,
            });

            this.layer.add(background);
            background.moveToBottom();
            this.stage.on("dragmove", () => {
                background.absolutePosition({ x: 0, y: 0 });
            });
        };
    }
}
