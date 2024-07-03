import Konva from "konva";
import EventManager from "./EventManager.js";
import ShapeManager from "./ShapeManager.js";
import LShapeManager from "./LShapeManager.js";
import { BackgroundNodeId } from "./enum/ShapeManagerEnum.js";
import CircleShapeManager from "./CircleShapeManager.js";
import UShapeManager from "./UShapeManager.js";

export class KonvaManager {
    /** @type {ShapeManager} */
    shapeManager;

    /** @type {LShapeManager} */
    lShapeManager;

    /** @type {UShapeManager} */
    uShapeManager;

    /** @type {CircleShapeManager} */
    circleShapeManager;

    /**
     *
     * @typedef {Object} SizeType
     * @property {number} width
     * @property {number} height
     *
     * @param {HTMLDivElement} container
     * @param {string} backgroundPath
     * @param {SizeType} size
     */
    constructor(container, backgroundPath = "/dist/image/background-grid.jpg", size = null) {
        this.backgroundPath = backgroundPath;
        /**
         * @type {Konva.Stage}
         */
        this.stage = new Konva.Stage({
            container: container,
            width: size?.width ?? 1500,
            height: size?.height ?? 800,
        });

        this.layer = new Konva.Layer();
        this.stage.add(this.layer);

        // EventManager instance to handle
        // generic events like zoom in/out/
        // enable/disable drag etc
        this.eventManager = new EventManager(this.stage, this);

        this.setupBackground();
        this.layer.draw();

        document.addEventListener("mkd-plugin:canvas-size", (e) => {
            const request = e.detail;
            if (request.height && request.width) {
                this.stage.width(request.width);
                this.stage.height(request.height);
                this.stage.draw();
                this.stage.fire("widthChange");
            }
        });
    }

    setupBackground() {
        this.stage.container().style.backgroundImage = `url('${this.backgroundPath}')`;
        this.stage.container().style.backgroundRepeat = "repeat";

        const img = document.createElement("img");
        img.src = this.backgroundPath;

        img.onload = () => {
            // Background image used when exporting as image
            // setting visible to false, so we don't have to worry about stage position update (on drag)
            // and stage scale update (on zoom in/out/reset)
            const background = new Konva.Rect({
                id: BackgroundNodeId,
                x: 0,
                y: 0,
                width: this.stage.width(),
                height: this.stage.height(),
                listening: false,
                fillPatternImage: img,
                visible: false,
            });

            this.layer.add(background);
            background.moveToBottom();
        };
    }

    /**
     * @returns {ShapeManager}
     */
    getSquareShapeManager() {
        if (!(this.shapeManager instanceof ShapeManager)) {
            this.shapeManager = new ShapeManager(this.stage, this.layer, this.eventManager);
        }

        return this.shapeManager;
    }

    /**
     * @returns {LShapeManager}
     */
    getLShapeManager() {
        if (!(this.lShapeManager instanceof LShapeManager)) {
            this.lShapeManager = new LShapeManager(this.stage, this.layer, this.eventManager);
        }

        return this.lShapeManager;
    }

    /**
     * @returns {UShapeManager}
     */
    getUShapeManager() {
        if (!(this.uShapeManager instanceof UShapeManager)) {
            this.uShapeManager = new UShapeManager(this.stage, this.layer, this.eventManager);
        }

        return this.uShapeManager;
    }

    /**
     * @returns {CircleShapeManager}
     */
    getCircleShapeManager() {
        if (!(this.circleShapeManager instanceof CircleShapeManager)) {
            this.circleShapeManager = new CircleShapeManager(
                this.stage,
                this.layer,
                this.eventManager
            );
        }

        return this.circleShapeManager;
    }
}
