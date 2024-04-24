import Konva from "konva";
import EventHandler from "./EventHandler";

export class KonvaManager extends EventHandler {
    constructor(container) {
        super(); // Must call super constructor in derived class before accessing 'this' or returning from derived constructor

        /**
         * @type {Konva.Stage}
         */
        this.stage = new Konva.Stage({
            container: container,
            width: 500,
            height: 500,
        });

        this.layer = new Konva.Layer();
        this.stage.add(this.layer);

        this.initShapes();
        this.setupBackground();
        this.layer.draw();

        this.scaleBy = 0.05;
    }

    initShapes() {
        const circle = new Konva.Circle({
            x: this.stage.width() / 2,
            y: this.stage.height() / 2,
            radius: 70,
            fill: "red",
            stroke: "black",
            strokeWidth: 4,
        });

        this.layer.add(circle);
    }

    setupBackground() {
        this.stage.container().style.backgroundImage =
            "url('/dist/image/background-grid.jpg')";
        this.stage.container().style.backgroundRepeat = "repeat";
    }
}
