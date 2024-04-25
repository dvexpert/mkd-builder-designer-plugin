import Konva from "konva";

export default class ShapeManager {
    /**
     * @param {Konva.Stage} stage
     */
    constructor(stage) {
        this.stage = stage;

        this.contextMenuNode = null;

        /**
         * On context menu open save current shape on which
         * context menu is opened
         */
        this.currentShape = null;
        this.createContextMenu();
    }
    createContextMenu() {
        const contextMenuStyles = {
            border: "1px solid",
            background: "white",
            width: "80px",
            position: "absolute",
            display: "none",
        };
        this.contextMenuNode = document.createElement("div");
        Object.assign(this.contextMenuNode.style, contextMenuStyles);
        this.contextMenuNode.id = "image-context-menu";

        const contextMenuItemStyles = {
            padding: "10px",
            border: "1px solid",
            cursor: "pointer",
            userSelect: "none",
        };
        const contextMenuItem_DeleteAction = document.createElement("div");
        Object.assign(
            contextMenuItem_DeleteAction.style,
            contextMenuItemStyles
        );
        contextMenuItem_DeleteAction.id = "image-context-item";
        contextMenuItem_DeleteAction.innerText = "Delete";
        contextMenuItem_DeleteAction.addEventListener(
            "click",
            () => this.currentShape && this.currentShape.destroy()
        );
        // Append menu items to menu
        this.contextMenuNode.append(contextMenuItem_DeleteAction);

        // append menu to the canvas container in dom
        this.stage.container().append(this.contextMenuNode);

        // on outside click hide the context menu
        window.addEventListener(
            "click",
            () => (this.contextMenuNode.style.display = "none")
        );

        this.stage.on("contextmenu", (e) => {
            // prevent default behavior
            e.evt.preventDefault();
            // if we are on empty place of the stage we will do nothing
            if (e.target === this.stage) return;

            this.currentShape = e.target;
            // context show menu
            this.contextMenuNode.style.display = "initial";
            const containerRect = this.stage
                .container()
                .getBoundingClientRect();

            this.contextMenuNode.style.top =
                containerRect.top +
                this.stage.getPointerPosition().y +
                4 +
                "px";
            this.contextMenuNode.style.left =
                containerRect.left +
                this.stage.getPointerPosition().x +
                4 +
                "px";
        });
    }
    drawSquare(materialImage = "") {
        if (!materialImage) {
            throw new Error("Material Image is required.");
        }

        const shapeLayer = new Konva.Layer();
        const imageObj = document.createElement("img");
        imageObj.src = materialImage;

        const squareObject = new Konva.Image({
            x: 20,
            y: 20,
            width: 200,
            height: 100,
            image: imageObj,
            draggable: true,
            dragBoundFunc: function (pos) {
                return {
                    x: Math.max(pos.x, 0),
                    y: Math.max(pos.y, 0),
                };
            },
        });

        shapeLayer.add(squareObject);
        this.stage.add(shapeLayer);
    }
}
