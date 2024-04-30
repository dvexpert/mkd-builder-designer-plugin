import Konva from "konva";
import RotateIcon from "@/assets/image/rotate.svg?raw";

const ShapeActions = Object.freeze({
    Place: "place",
    Rotate: "rotate",
});

/**
 * @typedef {Partial<Pick<CSSStyleDeclaration, keyof CSSStyleDeclaration>>} CSSStyleDec
 */
export default class ShapeManager {
    /**
     * @param {Konva.Stage} stage
     * @param {Konva.Layer} layer
     */
    constructor(stage, layer) {
        this.currentHoverNode;
        this.stage = stage;
        this.layer = layer;

        this.contextMenuNode = null;
        this.actionOverlayNode = null;


        /**
         * On context menu open save current shape on which
         * context menu is opened
         */
        this.currentShape = null;
        this.createContextMenu();
        this.createActionOverlay();
    }
    createContextMenu() {
        /** @type {CSSStyleDec} */
        const contextMenuStyles = {
            border: "1px solid",
            background: "white",
            width: "80px",
            position: "absolute",
            display: "none",
            zIndex: "9999",
        };
        this.contextMenuNode = document.createElement("div");
        Object.assign(this.contextMenuNode.style, contextMenuStyles);
        this.contextMenuNode.id = "image-context-menu";

        /** @type {CSSStyleDec} */
        const contextMenuItemStyles = {
            padding: "10px",
            border: "1px solid",
            cursor: "pointer",
            userSelect: "none"
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
        window.addEventListener("click", () => {
            this.contextMenuNode.style.display = "none";
        });

        this.stage.on("contextmenu", (e) => {
            // prevent default behavior
            e.evt.preventDefault();
            // if we are on empty place of the stage we will do nothing
            if (e.target === this.stage) return;

            this.currentShape = e.target;
            // context show menu
            this.contextMenuNode.style.display = "initial";

            this.contextMenuNode.style.top =
                this.stage.getPointerPosition().y + 4 + "px";
            this.contextMenuNode.style.left =
                this.stage.getPointerPosition().x + 4 + "px";
        });
    }
    createActionOverlay() {
        /** @type {CSSStyleDec} */
        const actionOverlayStyle = {
            background: "rgba(255, 0, 0 , 0.1)",
            position: "absolute",
            padding: "10px",
            columnGap: "1rem",
            display: "none",
            pointerEvents: "none", // Need to evaluate this change.
        };
        this.actionOverlayNode = document.createElement("div");
        Object.assign(this.actionOverlayNode.style, actionOverlayStyle);
        this.actionOverlayNode.id = "action-overlay";

        /** @type {CSSStyleDec} */
        const actionOverlayBtnStyle = {
            border: "1px solid",
            backgroundColor: "#873D3D",
            color: "white",
            fontWeight: "700",
            fontSize: "17px",
            padding: "3px 17px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            userSelect: "none",
            pointerEvents: "all"
        };
        const actionOverlayBtnNodePlace = document.createElement("button");
        Object.assign(actionOverlayBtnNodePlace.style, actionOverlayBtnStyle);
        actionOverlayBtnNodePlace.id = "action-overlay-btn";
        actionOverlayBtnNodePlace.innerText = "Place";
        actionOverlayBtnNodePlace.setAttribute(
            "data-action",
            ShapeActions.Place
        );
        this.actionOverlayNode.append(actionOverlayBtnNodePlace);

        const actionOverlayBtnNodeRotate = document.createElement("button");
        Object.assign(actionOverlayBtnNodeRotate.style, actionOverlayBtnStyle);
        actionOverlayBtnNodeRotate.id = "action-overlay-btn";
        actionOverlayBtnNodeRotate.innerHTML = `${RotateIcon} Rotate`;
        actionOverlayBtnNodeRotate.setAttribute(
            "data-action",
            ShapeActions.Rotate
        );
        this.actionOverlayNode.append(actionOverlayBtnNodeRotate);

        // append menu to the canvas container in dom
        this.stage.container().append(this.actionOverlayNode);

        this.actionOverlayNode.addEventListener("click", (e) => {
            const targetElm = e.target;
            if (targetElm.id !== "action-overlay-btn") return;

            const action = targetElm.getAttribute("data-action");
            if (action === ShapeActions.Rotate) {
                this.currentHoverNode.rotate(90);

                this.updateHoverActionOverlayPosition();
            } else if (action === ShapeActions.Place) {
                this.drawSquare(
                    this.currentHoverNode.getAttr("materialImage"),
                    false
                );
            }
        });
    }
    updateHoverActionOverlayPosition() {
        const boxRect = this.currentHoverNode.getClientRect();
        const shapePosition = {
            x: boxRect.x + boxRect.width / 2,
            y: boxRect.y + boxRect.height / 2,
        };

        const overlyRect = this.actionOverlayNode.getBoundingClientRect();
        const overlayNewPosition = {
            left: shapePosition.x - overlyRect.width / 2,
            top: shapePosition.y - overlyRect.height / 2,
        };

        this.actionOverlayNode.style.left = `${overlayNewPosition.left}px`;
        this.actionOverlayNode.style.top = `${overlayNewPosition.top}px`;
    }
    drawSquare(materialImage = "", onlyPlaceholder = true) {
        if (!materialImage) {
            throw new Error("Material Image is required.");
        }

        let posX = 20;
        let posY = 0;
        if (this.layer.hasChildren()) {
            const child = this.layer.getChildren();
            const lastChild = child[child.length - 1];
            posX = 5 + lastChild.getClientRect().x + lastChild.width();
            posY = lastChild.getClientRect().y;
        }

        if (onlyPlaceholder) {
            const squarePlaceHolderObject = new Konva.Rect({
                x: posX,
                y: posY,
                width: 300,
                height: 100,
                fill: "red",
                opacity: 0.3,
                draggable: true,
                dragBoundFunc: function (pos) {
                    return {
                        x: Math.max(pos.x, 0),
                        y: Math.max(pos.y, 0),
                    };
                },
                materialImage: materialImage,
            });
            squarePlaceHolderObject.on("click dragend", (e) => {
                this.actionOverlayNode.style.display = "flex";
            });
            squarePlaceHolderObject.on("mousedown dragstart", (e) => {
                this.stage.container().style.cursor = "grabbing";
            });
            squarePlaceHolderObject.on("dragend", (e) => {
                this.stage.container().style.cursor = "grab";
            });
            squarePlaceHolderObject.on("mouseenter dragmove", (e) => {
                const currentPlaceHolder = e.target;
                if (!currentPlaceHolder.isDragging()) {
                    this.currentHoverNode = currentPlaceHolder;
                    this.stage.container().style.cursor = "grab";
                }

                this.actionOverlayNode.style.display = "flex";
                this.updateHoverActionOverlayPosition();
            });
            squarePlaceHolderObject.on("mouseleave", (e) => {
                const elmId = e.evt.relatedTarget?.id;
                if (
                    elmId === null ||
                    ![
                        "action-overlay",
                        "action-overlay-btn",
                        "image-context",
                    ].includes(elmId)
                ) {
                    this.actionOverlayNode.style.display = "none";
                    this.currentHoverNode = null;
                    this.stage.container().style.cursor = "initial";
                }
            });

            this.layer.add(squarePlaceHolderObject);
        } else {
            // Place image element onto the layer with actual material image
            const placeHolderElm = this.currentHoverNode;

            const imageObj = document.createElement("img");
            imageObj.src = materialImage;
            const squareObject = new Konva.Image({
                x: placeHolderElm.position().x,
                y: placeHolderElm.position().y,
                width: placeHolderElm.width(),
                height: placeHolderElm.height(),
                image: imageObj,
                draggable: true,
                rotation: placeHolderElm.rotation(),
                dragBoundFunc: function (pos) {
                    return {
                        x: Math.max(pos.x, 0),
                        y: Math.max(pos.y, 0),
                    };
                },
            });
            this.layer.add(squareObject);
            this.currentHoverNode.destroy();
            this.actionOverlayNode.style.display = "none";
        }
    }
}
