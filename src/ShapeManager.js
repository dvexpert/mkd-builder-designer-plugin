import Konva from "konva";
import { rotateGroup } from "./Helper.js";
import RotateIcon from "@/assets/image/rotate.svg?raw";
import { ShapeActions, SquareShapeIds } from "./enum/ShapeManagerEnum.js";
import AttributeOverlayTemplate from "@/templates/AttributesOverlay/index.html?raw";
import AttributeShapeCutOutTemplate from "@/templates/AttributesOverlay/ShapeCutOut.html?raw";
import EventManager from "./EventManager.js";
import { SquareHelper as SH } from "./helpers/SquareHelper.js";

const SizeDiff = 3;

/**
 * @typedef {Partial<Pick<CSSStyleDeclaration, keyof CSSStyleDeclaration>>} CSSStyleDec
 */
export default class ShapeManager {
    /**
     * @param {Konva.Stage} stage
     * @param {Konva.Layer} layer
     * @param {EventManager} eventManager
     */
    constructor(stage, layer, eventManager) {
        this.currentHoverNode;
        this.stage = stage;
        this.layer = layer;
        this.eventManager = eventManager;

        this.contextMenuNode = null;
        this.actionOverlayNode = null;

        /**
         * On context menu open save current shape on which
         * context menu is opened
         */
        this.currentShape = null;
        this.createContextMenu();
        this.createActionOverlay();

        this.stage.on("dragmove", () => {
            const groups = this.stage.find("#shapeGroup");
            groups.forEach((group) =>
                this.updateAttributesOverlayPosition(group)
            );
        });
        this.stage.on("scaleChange", (ev) => {
            setTimeout(() => {
                const groups = this.stage.find("#shapeGroup");
                groups.forEach((group) =>
                    this.updateAttributesOverlayPosition(group)
                );
            });
        });
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
        contextMenuItem_DeleteAction.addEventListener("click", () => {
            if (this.currentShape) {
                const shapeGroup =
                    this.currentShape.findAncestor("#shapeGroup");
                this.getShapeGroupAttributeOverlay(shapeGroup)?.remove();
                shapeGroup.destroy();
            }
        });
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
                const $shape = this.getShapeObject(this.currentHoverNode);
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

    /**
     *
     * @param {Konva.Group} shapeGroup
     */
    updateHoverActionOverlayPosition(shapeGroup = null) {
        const shapeNode = this.getShapeObject(
            shapeGroup ?? this.currentHoverNode
        );
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
                if (shapeGroup.getAttr("show_action_overlay") !== false) {
                    this.actionOverlayNode.style.display = "flex";
                }
            });
            shapeGroup.on("mousedown dragstart", (e) => {
                this.stage.container().style.cursor = "grabbing";
            });
            shapeGroup.on("dragend", (e) => {
                this.stage.container().style.cursor = "grab";
            });
            shapeGroup.on("mouseenter dragmove", (e) => {
                const hoverNode = e.target;
                if (e.type === "dragmove") {
                    this.updateAttributesOverlayPosition(shapeGroup);
                    const targetShape = this.getShapeObject(hoverNode);
                    const targetRect = targetShape.getClientRect();
                    this.layer.children.forEach((group) => {
                        // do not check intersection with itself
                        if (group === hoverNode) {
                            group.opacity(1);
                            return;
                        }
                        const shape = this.getShapeObject(group);
                        const haveIntersection = this.haveIntersection(
                            shape.getClientRect(),
                            targetRect
                        );
                        group.opacity(haveIntersection ? 0.5 : 1);
                    });
                }

                const attributeOverlay =
                    this.getShapeGroupAttributeOverlay(shapeGroup);
                if (e.type === "mouseenter" && attributeOverlay) {
                    /**
                     * on shape group hover active the current group attribute overlay
                     * and in-active other groups attribute overlay
                     */
                    const overlayGroup = document.getElementById(
                        "attributes-overlay-group"
                    )?.childNodes;
                    overlayGroup.forEach((child) =>
                        child.classList.remove("active-attributes-overlay")
                    );

                    attributeOverlay.classList.add("active-attributes-overlay");
                }
                /**
                 * After placement action overlay is not required
                 * rotate will be performed from outside the canvas via events
                 */
                if (
                    [
                        SquareShapeIds.ShapeHeightTextLayer,
                        SquareShapeIds.ShapeWidthTextLayer,
                    ].includes(hoverNode.id()) ||
                    !shapeGroup.findOne(
                        `#${SquareShapeIds.ShapePlaceholderObject}`
                    )
                ) {
                    shapeGroup.setAttr("show_action_overlay", false);
                    return;
                }

                this.currentHoverNode = shapeGroup;
                if (!shapeGroup.draggable()) {
                    this.stage.container().style.cursor = "initial";
                } else if (!shapeGroup.isDragging()) {
                    this.stage.container().style.cursor = "grab";
                }

                // const currentPlaceHolder = this.getShapeObject(shapeGroup);
                // const placeBtn = this.actionOverlayNode.querySelector(
                //     'button[data-action="place"]'
                // );
                // if (currentPlaceHolder.id() === "shapeObject") {
                //     // Means shape is placed so need to hide the place button
                //     placeBtn.style.display = "none";
                // } else {
                //     placeBtn.style.display = "initial";
                // }

                this.actionOverlayNode.style.display = "flex";
                this.updateHoverActionOverlayPosition();
            });
            shapeGroup.on("mouseleave", (e) => {
                /**
                 * e.target is used in case of ripple effect created by action overlay mouseleave
                 * so in this case e.evt doesn't exist
                 */
                const elm = e.evt?.relatedTarget;
                const elmId = e.evt?.relatedTarget?.id ?? e.target.id();

                if (
                    !Boolean(
                        e.evt?.relatedTarget &&
                            elm?.closest("#attributes-overlay-group")
                    )
                ) {
                    /**
                     * on Mouse leave remove active state of the attributes overlay
                     */
                    const overlayGroup = document.getElementById(
                        "attributes-overlay-group"
                    )?.childNodes;
                    overlayGroup?.forEach((child) =>
                        child.classList.remove("active-attributes-overlay")
                    );
                }
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
            // this.createHeightInput(shapeGroup);
            // this.createWidthInput(shapeGroup);
            this.createEdgeGroups(shapeGroup);
            this.layer.add(shapeGroup);
        } else {
            shapeGroup = this.currentHoverNode;
            shapeGroup.on("click", () => {
                this.eventManager.dispatchShapeSelect(shapeGroup);
            });

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
            this.createAttributesOverlay(shapeGroup);
            this.eventManager.dispatchShapeSelect(shapeGroup);
        }
    }

    /**
     *
     * @param {Konva.Group} shapeGroup
     */
    createEdgeGroups(shapeGroup) {
        const groupShapeObject = this.getShapeObject(shapeGroup);
        const subgroupNames = SH.sides;
        // TODO: for demo only. also remove index param from subgroupNames loop callback params
        // const subgroupColor = ["yellow", "red", "green", "blue"];

        const spacingOffset = 0;
        subgroupNames.forEach((subgroupName /* index */) => {
            const isHorizontal = SH.isHorizontal(subgroupName);
            const attributes = {
                height: 0,
                width: 0,
                x: 0,
                y: 0,
            };
            if (isHorizontal) {
                attributes.height = 100;
                attributes.width = groupShapeObject.width();
            } else {
                attributes.height = groupShapeObject.height();
                attributes.width = 100;
            }
            const subGroup = new Konva.Group({
                name: subgroupName,
                height: attributes.height,
                width: attributes.width,
            });
            shapeGroup.add(subGroup);

            const sideLabel = new Konva.Text({
                id: `text_node_${subgroupName}`,
                text: subgroupName.toUpperCase(),
                fill: "#000",
                fontSize: 16,
                stroke: "#000",
                strokeWidth: 1.2,
                fontVariant: "",
            });
            subGroup.add(sideLabel);

            // TODO: For development purposes only
            // const tempRect = new Konva.Rect({
            //     fill: subgroupColor[index],
            //     width: attributes.width,
            //     height: attributes.height,
            // });
            // subGroup.add(tempRect);

            if (isHorizontal) {
                if (SH.isFirstInHorizontalOrVertical(subgroupName)) {
                    attributes.x = groupShapeObject.x();
                    attributes.y =
                        groupShapeObject.y() -
                        subGroup.height() -
                        spacingOffset;

                    sideLabel.x(subGroup.width() - subGroup.width() * 0.8);
                    sideLabel.y(subGroup.height() - 30);
                    this.createWidthInput(subGroup);
                } else {
                    attributes.x = groupShapeObject.x();
                    attributes.y =
                        groupShapeObject.y() +
                        groupShapeObject.height() +
                        spacingOffset;

                    sideLabel.x(subGroup.width() - subGroup.width() * 0.8);
                    sideLabel.y(30);

                    this.createWidthInput(subGroup);
                }
            } else {
                if (SH.isFirstInHorizontalOrVertical(subgroupName)) {
                    attributes.x =
                        groupShapeObject.x() +
                        groupShapeObject.width() +
                        spacingOffset;
                    attributes.y = groupShapeObject.y();

                    sideLabel.x(30);
                    sideLabel.y(subGroup.height() - subGroup.height() * 0.8);
                } else {
                    attributes.x =
                        groupShapeObject.x() - attributes.width - spacingOffset;
                    attributes.y = groupShapeObject.y();

                    sideLabel.x(subGroup.width() - subGroup.width() * 0.4);
                    sideLabel.y(30);
                }
            }

            subGroup.height(attributes.height);
            subGroup.width(attributes.width);
            subGroup.position({
                x: attributes.x,
                y: attributes.y,
            });
        });
    }

    /**
     *
     * @param {Konva.Group} SubGroup - border group, containing wall and size input
     * @param {Konva.Group} shapeGroup - main shape group containing everything, shape, edge group etc.
     */
    static addWall(SubGroup, shapeGroup) {
        if (SubGroup.findOne(`.wall_${SubGroup.name()}`)) {
            alert("Wall already exists");
            return;
        }

        const wall = new Konva.Rect({
            name: "wall_" + SubGroup.name(),
            fill: "#3b3b3b",
            width: SubGroup.width(),
            height: 10,
        });
        SubGroup.add(wall);

        /** @type {import("./helpers/SquareHelper.js").SquareSide} wall */
        const wallGroupName = SubGroup.name();
        const attributes = { x: 0, y: 0 };
        if (SH.isHorizontal(wallGroupName)) {
            wall.height(5);
            wall.width(SubGroup.width());
            if (SH.isFirstInHorizontalOrVertical(wallGroupName)) {
                attributes.y = SubGroup.height() - wall.height();
            }
        } else {
            wall.height(SubGroup.height());
            wall.width(5);
            if (!SH.isFirstInHorizontalOrVertical(wallGroupName)) {
                attributes.x = SubGroup.width() - wall.width();
            }
        }

        wall.position(attributes);

        let againstTheWall = shapeGroup.getAttr("againstTheWall");
        if (!againstTheWall || typeof againstTheWall !== "object") {
            againstTheWall = {
                [SH.SideA]: false,
                [SH.SideB]: false,
                [SH.SideC]: false,
                [SH.SideD]: false,
            };
        }

        againstTheWall[SubGroup.name()] = true;
        shapeGroup.setAttr("againstTheWall", againstTheWall);
    }

    /**
     *
     * @param {Konva.Group} SubGroup - border group, containing wall and size input
     * @param {Konva.Group} shapeGroup - main shape group, containing everything.
     * @param {import("./helpers/SquareHelper.js").SquareSide} wall
     */
    static removeWall(SubGroup, shapeGroup, wall) {
        const wallObj = SubGroup.findOne(`.wall_${wall}`);
        wallObj.destroy();

        let againstTheWall = SubGroup.getAttr("againstTheWall");
        againstTheWall[SubGroup.name()] = false;
        shapeGroup.setAttr("againstTheWall", againstTheWall);
    }

    /**
     *
     * @param {Konva.Node} element
     * @param {boolean} enable
     */
    setDragging(element, enable = true) {
        if (element.id() !== SquareShapeIds.ShapeGroup) {
            element = element.findAncestor(`#${SquareShapeIds.ShapeGroup}`);
        }
        element.draggable(enable);
        // ? set the cursors and other side effects of toggling the element draggable
    }

    /**
     * Create Text and Input box for the height adjustments
     * @param {Konva.Group} shapeGroup
     */
    createHeightInput(shapeGroup) {
        const heightInputs = [];
        ["50", "50"].forEach((text) => {
            const heightInput = new Konva.Text({
                id: SquareShapeIds.ShapeHeightTextLayer,
                text: text,
                fontSize: 20,
                fill: "black",
                width: 40,
            });
            heightInputs.push(heightInput);
            shapeGroup.add(heightInput);
        });

        this.updateInputsPosition(shapeGroup, true, false);

        heightInputs.forEach((heightInput) => {
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
                let inputRemoved = false;
                inputBox.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        inputRemoved = true;
                        this.handleInputValueChange(
                            "height",
                            shapeGroup,
                            heightInput,
                            inputBox
                        );
                    }
                });
                inputBox.addEventListener("blur", (e) => {
                    if (inputRemoved) return;
                    this.handleInputValueChange(
                        "height",
                        shapeGroup,
                        heightInput,
                        inputBox
                    );
                });
            });
        });
    }

    /**
     *
     * @param {string} attr - "height" or "width"
     * @param {Konva.Group} shapeGroup
     * @param {Konva.Text} labelNode
     * @param {HTMLInputElement} inputBox
     */
    handleInputValueChange = (attr, shapeGroup, labelNode, inputBox) => {
        const squarePlaceHolderObject = this.getShapeObject(shapeGroup);
        /** @type {Konva.Text[]} */
        const labelNodes = shapeGroup.find(`#${labelNode.id()}`);

        // Update both width input positions
        labelNodes.forEach((labelNode) => {
            labelNode.text(inputBox.value);
        });
        document.body.removeChild(inputBox);
        this.setDragging(shapeGroup, true);
        squarePlaceHolderObject.setAttr(
            attr,
            Number(inputBox.value) * SizeDiff
        );
        this.updateInputsPosition(shapeGroup);
        this.updateHoverActionOverlayPosition(shapeGroup);
    };

    /**
     * Create Text and Input box for the Width adjustments
     * @param {Konva.Group} subGroup - edge sub group
     */
    createWidthInput(subGroup) {
        console.log(
            "%ccreateWidthInput",
            "color:#00ff00;font-size:30px;font-weight:bold;"
        );
        console.log(subGroup);
        const widthInput = new Konva.Text({
            id: SquareShapeIds.ShapeWidthTextLayer,
            text: "150",
            fontSize: 20,
            fill: "black",
            width: 40,
            wall: subGroup.name(),
        });
        subGroup.add(widthInput);

        this.updateInputsPosition(subGroup, false, true);
        // create event listener to show text box to change width
        widthInput.on("click", (e) => {
            let wInput = e.target;
            this.setDragging(subGroup, false);
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
            let inputRemoved = false;
            inputBox.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    inputRemoved = true;
                    this.handleInputValueChange(
                        "width",
                        subGroup,
                        widthInput,
                        inputBox
                    );
                }
            });
            inputBox.addEventListener("blur", () => {
                if (inputRemoved) return;
                this.handleInputValueChange(
                    "width",
                    subGroup,
                    widthInput,
                    inputBox
                );
            });
        });
    }

    /**
     *
     * @param {Konva.Group} subGroup - shape edge sub group, containing wall, side label etc.
     */
    updateInputsPosition(subGroup, heightOnly = true, widthOnly = true) {
        /** @type {Konva.Group} shapeGroup */
        const shapeGroup = subGroup.findAncestor(
            `#${SquareShapeIds.ShapeGroup}`
        );
        console.log(
            "%cUpdaetg Position",
            "color:#ad79f2;font-size:30px;font-weight:bold;"
        );
        console.log(shapeGroup);
        // const squareObject = this.getShapeObject(shapeGroup);

        // if (heightOnly) {
        //     const heightInputs = shapeGroup.find(
        //         `#${SquareShapeIds.ShapeHeightTextLayer}`
        //     );
        //     heightInputs.forEach((heightInput, index) => {
        //         let x = squareObject.x() - 35;
        //         const y = squareObject.y() + squareObject.height() / 2 - 10;

        //         if (index % 2) {
        //             x += squareObject.width() + 40;
        //         }

        //         heightInput.position({ x, y });
        //     });
        // }

        if (widthOnly) {
            // let squareObject = this.getShapeObject(shapeGroup);
            const widthInputs = subGroup.find(
                `#${SquareShapeIds.ShapeWidthTextLayer}`
            );
            // Update both width input positions
            widthInputs.forEach((widthInput, index) => {
                let position = {
                    x: 0,
                    y: 0,
                };
                if (index % 2 === 0 && subGroup.name() === SH.SideA) {
                    console.log('%cWidth Input Loop', 'color:#d1f279;font-size:30px;font-weight:bold;')
                    console.log(subGroup)
                    console.log(subGroup.name())
                    let textNode = subGroup.findOne(`#text_node_${subGroup.name()}`);
                    console.log(textNode)
                    position = { x: textNode.x(), y: textNode.y() };
                    position.x = position.x + 50;
                } else {
                    console.log('%cTwo', 'color:#00ff00;font-size:30px;font-weight:bold;')
                    console.log(shapeGroup)
                    let textNode = shapeGroup.findOne(
                        `#text_node_${SH.SideC}`
                    );
                    console.log(textNode)
                    position = { x: textNode.x(), y: textNode.y() };
                    console.log(position)
                    position.x = position.x + 50
                    console.log( position)
                    // let edgeGroup = shapeGroup.findOne(`.${SH.SideC}`)
                    // position.x = (edgeGroup.width() - edgeGroup.width() * 0.8);
                    // position.y = (30);
                }

                widthInput.position(position);
            });
        }
    }

    /**
     * To get Placeholder or placed shape object
     *
     * @param {Konva.Group} shapeGroup
     */
    getShapeObject(shapeGroup) {
        return (
            shapeGroup.findOne(`#${SquareShapeIds.ShapePlaceholderObject}`) ??
            shapeGroup.findOne(`#${SquareShapeIds.ShapeObject}`)
        );
    }

    /**
     *
     * @param {Konva.Group} shapeGroup
     */
    createAttributesOverlay(shapeGroup) {
        let overlayGroup = document.getElementById("attributes-overlay-group");
        if (!overlayGroup) {
            overlayGroup = document.createElement("div");
            overlayGroup.id = "attributes-overlay-group";
            this.stage.container().append(overlayGroup);
        }

        /** @type {HTMLElement} */
        const attributeOverlay = new DOMParser().parseFromString(
            AttributeOverlayTemplate,
            "text/html"
        ).body.firstChild;
        attributeOverlay.id = `${attributeOverlay.id}-${shapeGroup._id}`;
        const shapeName = `Shape ${shapeGroup._id}`;
        attributeOverlay.querySelector("#shape-name").innerHTML = shapeName;
        shapeGroup.setAttr("shapeName", shapeName);

        attributeOverlay.addEventListener("mouseenter", (e) => {
            const elm = e.target;
            elm && elm.classList?.add("active-attributes-overlay");
        });
        attributeOverlay.addEventListener("mouseleave", (e) => {
            const elm = e.target;
            elm && elm.classList?.remove("active-attributes-overlay");
        });
        overlayGroup.appendChild(attributeOverlay);

        this.updateAttributesOverlayPosition(shapeGroup);

        // TODO: For demo purpose only
        Array.from(Array(4)).forEach(() =>
            this.appendShapeCutOut(
                shapeGroup,
                undefined,
                undefined,
                attributeOverlay
            )
        );
    }

    /**
     *
     * @param {Konva.Group} shapeGroup
     * @param {string} url
     * @param {string} title
     * @param {HTMLElement} attributeOverlay - when appending shapeCutout right after placing the attribute overlay element in dom.
     * in this case getting attribute overlay element from dom might be blank.
     */
    appendShapeCutOut(
        shapeGroup,
        url = "/dynamicAssets/sinkdropin-1.png",
        title = "Drop-in Sink",
        attributeOverlay = null
    ) {
        const overlay =
            attributeOverlay ??
            document.querySelector(`#attribute-overlay-${shapeGroup._id}`);
        const container = overlay.querySelector("#shape-cutout-group");
        /** @type {HTMLElement} */
        const domObject = new DOMParser().parseFromString(
            AttributeShapeCutOutTemplate,
            "text/html"
        ).body.firstChild;
        const image = domObject.querySelector("img");
        const titleElm = domObject.querySelector("span");
        image.src = url;
        image.alt = url.split("/").reverse()[0];

        titleElm.innerHTML = title;

        container.appendChild(domObject);
    }

    /**
     *
     * @param {Konva.Group} shapeGroup
     */
    updateAttributesOverlayPosition(shapeGroup) {
        const ShapeObject = this.getShapeObject(shapeGroup);
        if (ShapeObject.id() !== SquareShapeIds.ShapeObject) return;
        const boxRect = ShapeObject.getClientRect();

        const attributeOverlay = this.getShapeGroupAttributeOverlay(shapeGroup);

        attributeOverlay.style.left = `${boxRect.x + 10}px`;
        attributeOverlay.style.top = `${boxRect.y + 10}px`;
    }

    /**
     *
     * @param {Konva.Group} shapeGroup
     * @returns {HTMLDivElement}
     */
    getShapeGroupAttributeOverlay(shapeGroup) {
        return this.stage
            .container()
            .querySelector(`#attributes-overlay-${shapeGroup._id}`);
    }

    /**
     * @typedef {Object} ClientRect
     * @property {number} x - The x-coordinate.
     * @property {number} y - The y-coordinate.
     * @property {number} width - The width-coordinate.
     * @property {number} height - The height-coordinate.
     *
     * @param {ClientRect} r1
     * @param {ClientRect} r2
     * @returns
     */
    haveIntersection(r1, r2) {
        return !(
            r2.x > r1.x + r1.width ||
            r2.x + r2.width < r1.x ||
            r2.y > r1.y + r1.height ||
            r2.y + r2.height < r1.y
        );
    }
}
