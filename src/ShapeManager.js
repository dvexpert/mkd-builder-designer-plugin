import Konva from "konva";
import { rotateGroup } from "./Helper.js";
import RotateIcon from "@/assets/image/rotate.svg?raw";
import { ShapeActions, SquareShapeIds } from "./enum/ShapeManagerEnum.js";

const SizeDiff = 3;

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
            pointerEvents: "all",
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

        const rotateIcon = String(RotateIcon).replace(
            "<svg ",
            '<svg style="pointer-events: none;" '
        );
        actionOverlayBtnNodeRotate.innerHTML = `${rotateIcon} Rotate`;
        actionOverlayBtnNodeRotate.setAttribute(
            "data-action",
            ShapeActions.Rotate
        );
        this.actionOverlayNode.append(actionOverlayBtnNodeRotate);

        // append menu to the canvas container in dom
        this.stage.container().append(this.actionOverlayNode);

        this.actionOverlayNode.addEventListener("mouseleave", () => {
            this.currentHoverNode.fire("mouseleave");
        });
        this.actionOverlayNode.addEventListener("click", (e) => {
            const targetElm = e.target;
            if (targetElm.id !== "action-overlay-btn") return;

            const action = targetElm.getAttribute("data-action");
            if (action === ShapeActions.Rotate) {
                const $shape =
                    this.currentHoverNode.findOne(
                        `#${SquareShapeIds.ShapePlaceholderObject}`
                    ) ??
                    this.currentHoverNode.findOne(
                        `#${SquareShapeIds.ShapeObject}`
                    );
                rotateGroup(this.currentHoverNode, $shape, 90);
                this.updateHoverActionOverlayPosition();
            } else if (action === ShapeActions.Place) {
                let materialImage = this.currentHoverNode
                    .findOne(`#${SquareShapeIds.ShapePlaceholderObject}`)
                    .getAttr("materialImage");
                this.drawSquare(materialImage, false);
                this.updateHoverActionOverlayPosition();
            }
        });
    }

    updateHoverActionOverlayPosition() {
        const shapeNode =
            this.currentHoverNode.findOne(
                `#${SquareShapeIds.ShapePlaceholderObject}`
            ) ??
            this.currentHoverNode.findOne(`#${SquareShapeIds.ShapeObject}`);
        const boxRect = shapeNode.getClientRect();
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
        let posY = 30;
        if (this.layer.hasChildren()) {
            const child = this.layer.getChildren();
            const lastChild = child[child.length - 1];
            posX = 5 + lastChild.getClientRect().x + lastChild.width();
            posY = lastChild.getClientRect().y;
        }

        /** @type {Konva.Group} */
        let shapeGroup;

        if (onlyPlaceholder) {
            shapeGroup = new Konva.Group({
                x: 100,
                y: 10,
                draggable: true,
                id: SquareShapeIds.ShapeGroup,
            });
            const squarePlaceHolderObject = new Konva.Rect({
                x: posX,
                y: posY,
                width: 150 * SizeDiff,
                id: SquareShapeIds.ShapePlaceholderObject,
                height: 50 * SizeDiff,
                fill: "red",
                opacity: 0.3,
                dragBoundFunc: function (pos) {
                    return {
                        x: Math.max(pos.x, 0),
                        y: Math.max(pos.y, 0),
                    };
                },
                materialImage: materialImage,
            });
            shapeGroup.on("click dragend", (e) => {
                this.actionOverlayNode.style.display = "flex";
            });
            shapeGroup.on("mousedown dragstart", (e) => {
                this.stage.container().style.cursor = "grabbing";
            });
            shapeGroup.on("dragend", (e) => {
                this.stage.container().style.cursor = "grab";
            });
            shapeGroup.on("mouseenter dragmove", (e) => {
                const hoverNode = e.target;
                if (
                    [
                        SquareShapeIds.ShapeHeightTextLayer,
                        SquareShapeIds.ShapeWidthTextLayer,
                    ].includes(hoverNode.id())
                ) {
                    return;
                }
                const currentPlaceHolder =
                    shapeGroup.findOne(
                        `#${SquareShapeIds.ShapePlaceholderObject}`
                    ) ?? shapeGroup.findOne(`#${SquareShapeIds.ShapeObject}`);
                this.currentHoverNode = shapeGroup;
                if (!shapeGroup.draggable()) {
                    this.stage.container().style.cursor = "initial";
                } else if (!shapeGroup.isDragging()) {
                    this.stage.container().style.cursor = "grab";
                }

                const placeBtn = this.actionOverlayNode.querySelector(
                    'button[data-action="place"]'
                );
                if (currentPlaceHolder.id() === "shapeObject") {
                    // Means shape is placed so need to hide the place button
                    placeBtn.style.display = "none";
                } else {
                    placeBtn.style.display = "initial";
                }

                this.actionOverlayNode.style.display = "flex";
                this.updateHoverActionOverlayPosition();
            });
            shapeGroup.on("mouseleave", (e) => {
                /**
                 * e.target is used in case of ripple effect created by action overlay mouseleave
                 * so in this case e.evt doesn't exist
                 */
                const elmId = e.evt?.relatedTarget?.id ?? e.target.id();
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

            shapeGroup.add(squarePlaceHolderObject);

            /**
             * Create Height Input
             */
            this.createHeightInput(shapeGroup);
            this.createWidthInput(shapeGroup);
            this.layer.add(shapeGroup);
        } else {
            shapeGroup = this.currentHoverNode;

            // Place image element onto the layer with actual material image
            const placeHolderElm = shapeGroup.findOne(
                `#${SquareShapeIds.ShapePlaceholderObject}`
            );

            const imageObj = document.createElement("img");
            imageObj.src = materialImage;
            const squareObject = new Konva.Image({
                id: "shapeObject",
                x: placeHolderElm.position().x,
                y: placeHolderElm.position().y,
                width: placeHolderElm.width(),
                height: placeHolderElm.height(),
                image: imageObj,
                dragBoundFunc: function (pos) {
                    return {
                        x: Math.max(pos.x, 0),
                        y: Math.max(pos.y, 0),
                    };
                },
            });
            shapeGroup.add(squareObject);
            placeHolderElm.destroy();
            this.actionOverlayNode.style.display = "none";
        }
    }

    /**
     *
     * @param {Konva.Node} element
     * @param {boolean} enable
     */
    setDragging(element, enable = true) {
        element.draggable(enable);
        // ? set the cursors and other side effects of toggling the element draggable
    }

    /**
     * Create Text and Input box for the height adjustments
     * @param {Konva.Group} shapeGroup
     */
    createHeightInput(shapeGroup) {
        const heightInput = new Konva.Text({
            id: SquareShapeIds.ShapeHeightTextLayer,
            text: "50",
            fontSize: 20,
            fill: "black",
            width: 40,
        });
        shapeGroup.add(heightInput);

        this.updateInputsPosition(shapeGroup, true, false);

        // create event listener to show text box to change width
        heightInput.on("click", (e) => {
            let wInput = e.target;
            this.setDragging(shapeGroup, false);
            // at first lets find position of text node relative to the stage:
            const textPosition = wInput.getClientRect();

            // then lets find position of stage container on the page:
            const stageBox = this.stage.container().getBoundingClientRect();

            // so position of textarea will be the sum of positions above:
            const areaPosition = {
                x: stageBox.left + textPosition.x,
                y: stageBox.top + textPosition.y,
            };

            // create textarea and style it
            const inputBox = document.createElement("input");
            inputBox.type = "number";
            document.body.appendChild(inputBox);
            /** @type {CSSStyleDec} */
            const inputBoxStyle = {
                position: "absolute",
                top: areaPosition.y + "px",
                left: areaPosition.x + "px",
                width: "60px",
                border: "1px solid",
                outline: "0",
                padding: "1px 8px",
                borderRadius: "4px",
            };

            inputBox.value = heightInput.text();
            Object.assign(inputBox.style, inputBoxStyle);
            inputBox.focus();

            inputBox.addEventListener("keydown", (e) => {
                // hide on enter
                if (e.key === "Enter") {
                    const squarePlaceHolderObject =
                        shapeGroup.findOne(
                            `#${SquareShapeIds.ShapePlaceholderObject}`
                        ) ??
                        shapeGroup.findOne(`#${SquareShapeIds.ShapeObject}`);
                    heightInput.text(inputBox.value);
                    document.body.removeChild(inputBox);
                    this.setDragging(shapeGroup, true);
                    squarePlaceHolderObject.height(
                        Number(inputBox.value) * SizeDiff
                    );
                    this.updateInputsPosition(shapeGroup);
                    this.updateHoverActionOverlayPosition();
                }
            });
        });
    }

    /**
     * Create Text and Input box for the Width adjustments
     * @param {Konva.Group} shapeGroup
     */
    createWidthInput(shapeGroup) {
        // const squarePlaceHolderObject = shapeGroup.findOne(
        //     `#${SquareShapeIds.ShapePlaceholderObject}`
        // );
        const widthInput = new Konva.Text({
            id: SquareShapeIds.ShapeWidthTextLayer,
            text: "150",
            fontSize: 20,
            fill: "black",
            width: 40,
        });
        shapeGroup.add(widthInput);
        this.updateInputsPosition(shapeGroup, false, true);

        // create event listener to show text box to change width
        widthInput.on("click", (e) => {
            let wInput = e.target;
            this.setDragging(shapeGroup, false);
            // at first lets find position of text node relative to the stage:
            const textPosition = wInput.getClientRect();

            // then lets find position of stage container on the page:
            const stageBox = this.stage.container().getBoundingClientRect();

            // so position of textarea will be the sum of positions above:
            const areaPosition = {
                x: stageBox.left + textPosition.x,
                y: stageBox.top + textPosition.y,
            };

            // create textarea and style it
            const inputBox = document.createElement("input");
            inputBox.type = "number";
            document.body.appendChild(inputBox);
            /** @type {CSSStyleDec} */
            const inputBoxStyle = {
                position: "absolute",
                top: areaPosition.y + "px",
                left: areaPosition.x + "px",
                width: "60px",
                border: "1px solid",
                outline: "0",
                padding: "1px 8px",
                borderRadius: "4px",
            };

            inputBox.value = widthInput.text();
            Object.assign(inputBox.style, inputBoxStyle);
            inputBox.focus();

            inputBox.addEventListener("keydown", (e) => {
                // hide on enter
                if (e.key === "Enter") {
                    const squarePlaceHolderObject =
                        shapeGroup.findOne(
                            `#${SquareShapeIds.ShapePlaceholderObject}`
                        ) ??
                        shapeGroup.findOne(`#${SquareShapeIds.ShapeObject}`);
                    widthInput.text(inputBox.value);
                    document.body.removeChild(inputBox);
                    this.setDragging(shapeGroup, true);
                    squarePlaceHolderObject.width(
                        Number(inputBox.value) * SizeDiff
                    );
                    this.updateInputsPosition(shapeGroup);
                    this.updateHoverActionOverlayPosition();
                }
            });
        });
    }

    /**
     *
     * @param {Konva.Group} shapeGroup
     */
    updateInputsPosition(shapeGroup, heightOnly = true, widthOnly = true) {
        // TODO: Create getter for this. (to get place holder or placed node)
        const squareObject =
            shapeGroup.findOne(`#${SquareShapeIds.ShapePlaceholderObject}`) ??
            shapeGroup.findOne(`#${SquareShapeIds.ShapeObject}`);

        if (heightOnly) {
            const heightInput = shapeGroup.findOne(
                `#${SquareShapeIds.ShapeHeightTextLayer}`
            );
            heightInput.position({
                x: squareObject.x() + squareObject.width() + 10,
                y: squareObject.y() + squareObject.height() / 2 - 10,
            });
        }

        if (widthOnly) {
            const widthInput = shapeGroup.findOne(
                `#${SquareShapeIds.ShapeWidthTextLayer}`
            );
            widthInput.position({
                x: squareObject.x() + squareObject.width() / 2,
                y: squareObject.y() - 30,
            });
        }
    }
}
