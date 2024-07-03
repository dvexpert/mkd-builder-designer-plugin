import Konva from "konva";
import { rotateGroup } from "./Helper.js";
import RotateIcon from "@/assets/image/rotate.svg?raw";
import {
    ShapeActions,
    ShapeTypes,
    SquareShapeIds,
} from "./enum/ShapeManagerEnum.js";
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
            const groups = this.stage.find(`#${SquareShapeIds.ShapeGroup}`);
            groups.forEach((group) => {
                this.updateAttributesOverlayPosition(group)
                this.updateHoverActionOverlayPosition(group)
            });
        });
        this.stage.on("scaleChange xChange yChange", (ev) => {
            setTimeout(() => {
                const groups = this.stage.find(`#${SquareShapeIds.ShapeGroup}`);
                groups.forEach((group) =>{
                    this.updateAttributesOverlayPosition(group)
                    this.updateHoverActionOverlayPosition(group)
                });
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
                /** @type {Konva.Group} */
                const shapeGroup =
                    this.currentShape.findAncestor("#shapeGroup");
                this.deleteShape(shapeGroup);
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

            if (
                ![
                    String(SquareShapeIds.ShapeGroup),
                    String(SquareShapeIds.ShapeObject),
                    String(SquareShapeIds.ShapePlaceholderObject),
                ].includes(e.target.id())
            ) {
                return;
            }

            this.currentShape = e.target;
            // context show menu
            this.contextMenuNode.style.display = "initial";

            this.contextMenuNode.style.top =
                this.stage.getPointerPosition().y + 4 + "px";
            this.contextMenuNode.style.left =
                this.stage.getPointerPosition().x + 4 + "px";
        });
    }

    /**
     *
     * @param {Konva.Group} shapeGroup
     */
    deleteShape(shapeGroup) {
        this.getShapeGroupAttributeOverlay(shapeGroup)?.remove();
        shapeGroup.destroy();

        // dispatch shape deleted event for external side effects.
        this.eventManager.dispatchShapeDelete(shapeGroup._id);
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
                this.rotateShapeGroup(this.currentHoverNode, 90);
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
     * @param {number} rotation
     */
    rotateShapeGroup(shapeGroup, rotation) {
        const $shape = this.getShapeObject(shapeGroup);
        rotateGroup(shapeGroup, $shape, rotation);

        this.updateHoverActionOverlayPosition(shapeGroup);
        this.updateAttributesOverlayPosition(shapeGroup);
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
        const scaleX = this.stage.scaleX();
        this.actionOverlayNode.style.transform = `scale(${scaleX})`;
    
        const overlyRect = this.actionOverlayNode.getBoundingClientRect();
        const overlayNewPosition = {
            left: shapePosition.x - (overlyRect.width / 2) / scaleX,
            top: shapePosition.y - (overlyRect.height / 2) / scaleX,
        };

        this.actionOverlayNode.style.left = `${overlayNewPosition.left}px`;
        this.actionOverlayNode.style.top = `${overlayNewPosition.top}px`;
    }

    /**
     *
     * @typedef {{materialName : string, productName: string}} AttributeOverlayMaterialName
     *
     * @param {string} materialImage
     * @param {boolean} onlyPlaceholder
     * @param {*} materialId
     * @param {null | Konva.Group} placeholderGroup - passed in from draw square (on re-rendering the canvas)
     * @param {string | number | null} prevShapeId - passed in from draw square (on re-rendering the canvas)
     * @param {AttributeOverlayMaterialName} overlayMaterialProductName - Material and productName to use for Attributes overlay.
     */
    drawSquare(
        materialImage,
        onlyPlaceholder = true,
        materialId = "",
        placeholderGroup = null, // used on redraw canvas
        prevShapeId = null, // used on redraw canvas
        shapeSize = null,
        overlayMaterialProductName = null
    ) {
        if (!materialImage) {
            throw new Error("Material Image is required.");
        }

        const stagePos = this.stage.position();
        const scale = this.stage.scaleX(); // Assuming uniform scaling (scaleX = scaleY)

        // Calculate the center position considering the stage's position and scale
        const posX = (this.stage.width() / 3 - stagePos.x) / scale;
        const posY = (this.stage.height() / 3 - stagePos.y) / scale;

        /** @type {Konva.Group} */
        let shapeGroup;

        if (onlyPlaceholder) {
            const height = shapeSize?.height ? Number(shapeSize?.height) : 50;
            const width = shapeSize?.width ? Number(shapeSize?.width) : 150;
            shapeGroup = new Konva.Group({
                x: posX,
                y: posY,
                draggable: this.stage.getAttr("shapeDraggable") === true,
                id: SquareShapeIds.ShapeGroup,
                materialId: materialId,
                shapeSize: {
                    height: height,
                    width: width,
                },
                shapeType: ShapeTypes.SquareShape,
                canvasShapeId: null,
                materialImage: materialImage,
                isPlaced: false,
                prevShapeId: prevShapeId,
                materialName: overlayMaterialProductName.materialName,
                productName: overlayMaterialProductName.productName,
            });
            shapeGroup.setAttr("canvasShapeId", shapeGroup._id);
            const squarePlaceHolderObject = new Konva.Rect({
                // x: posX,
                // y: posY,
                width: width * SizeDiff,
                id: SquareShapeIds.ShapePlaceholderObject,
                height: height * SizeDiff,
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
                    this.layer.find("Group").forEach((group) => {
                        // do not check intersection with itself
                        if (
                            group === hoverNode ||
                            group.id() !== SquareShapeIds.ShapeGroup
                        ) {
                            group.opacity(1);
                            return;
                        }
                        const shape = this.getShapeObject(group);
                        if (shape) {
                            const haveIntersection = this.haveIntersection(
                                shape.getClientRect(),
                                targetRect
                            );
                            group.opacity(haveIntersection ? 0.5 : 1);
                        }
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

            this.createEdgeGroups(shapeGroup);
            this.layer.add(shapeGroup);
        } else {
            shapeGroup = placeholderGroup ?? this.currentHoverNode;
            if (import.meta.env.VITE_BUILDING_FOR_DEMO === "true") {
                shapeGroup.on("click", () => {
                    this.eventManager.dispatchShapeSelect(shapeGroup);
                });
            }

            // Place image element onto the layer with actual material image
            /** @type {Konva.Rect} */
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
                cornerRadius: placeHolderElm.cornerRadius(),
                image: imageObj,
                // stroke: "#000",
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
            shapeGroup.setAttr("isPlaced", true);
        }

        return shapeGroup;
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

        subgroupNames.forEach((subgroupName, index) => {
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

            // To Add Border Radius checkbox by default.
            // this.addCheckboxGroup(subGroup, subgroupName, shapeGroup);

            // TODO: For development purposes only
            // const tempRect = new Konva.Rect({
            //     fill: subgroupColor[index],
            //     width: attributes.width,
            //     height: attributes.height,
            // });
            // subGroup.add(tempRect);
        });

        this.updateEdgeGroupsPosition(shapeGroup, true);
    }

    /**
     *
     * @param {import("./types/global.js").WallPresence} corners
     * @param {boolean} defaultValue
     * @returns {{ [key in import("./helpers/SquareHelper.js").SquareSide]: boolean}}
     */
    initializeCorners(corners, defaultValue) {
        if (!corners || typeof corners !== "object") {
            return {
                [SH.SideA]: defaultValue,
                [SH.SideB]: defaultValue,
                [SH.SideC]: defaultValue,
                [SH.SideD]: defaultValue,
            };
        }
        return corners;
    }

    /**
     *
     * @param {import("./helpers/SquareHelper.js").SquareSide} subgroupName
     * @param {Konva.Group} shapeGroup
     */
    removeCheckboxGroup(subgroupName, shapeGroup) {
        const checkboxGroup = shapeGroup.findOne(
            `#checkbox_node_${subgroupName}`
        );
        if (checkboxGroup) {
            /** @type {Konva.Rect} */
            const shapeObject = this.getShapeObject(shapeGroup);

            const haveRoundedCorners = this.initializeCorners(
                shapeGroup.getAttr("haveRoundedCorners"),
                false
            );
            haveRoundedCorners[subgroupName] = false;
            shapeGroup.setAttr("haveRoundedCorners", haveRoundedCorners);

            const roundedCorners = this.initializeCorners(
                shapeGroup.getAttr("roundedCorners"),
                false
            );
            roundedCorners[subgroupName] = false;
            shapeGroup.setAttr("roundedCorners", roundedCorners);

            shapeObject.cornerRadius([
                roundedCorners[SH.SideA] ? 15 : 0,
                roundedCorners[SH.SideB] ? 15 : 0,
                roundedCorners[SH.SideC] ? 15 : 0,
                roundedCorners[SH.SideD] ? 15 : 0,
            ]);
            checkboxGroup.destroy();
        }
        this.eventManager.dispatchShapeSelect(shapeGroup);
    }

    /**
     *
     * @param {Konva.Group} subGroupNode
     * @param {import("./helpers/SquareHelper.js").SquareSide} subgroupName
     * @param {Konva.Group} shapeGroup
     */
    addCheckboxGroup(
        subGroupNode,
        subgroupName,
        shapeGroup,
        defaultVal = false
    ) {
        const checkboxGroup = new Konva.Group({
            id: `checkbox_node_${subgroupName}`,
            name: `checkbox_node_${subgroupName}`,
        });
        const checkboxRect = new Konva.Rect({
            x: 0,
            y: 0,
            width: 20,
            height: 20,
            stroke: "black",
            strokeWidth: 2,
            fill: "white",
        });

        const checkMarkLine = new Konva.Line({
            points: [8, 10, 10, 15, 16, 5],
            stroke: "black",
            strokeWidth: 2,
            visible: false,
        });

        checkMarkLine.x(-2);
        checkboxGroup.add(checkboxRect, checkMarkLine);
        subGroupNode.add(checkboxGroup);

        checkboxGroup.on("click", () => {
            const isVisible = !checkMarkLine.visible();
            checkMarkLine.visible(isVisible);
            /** @type {Konva.Rect} */
            const shapeObject = this.getShapeObject(shapeGroup);

            const roundedCorners = this.initializeCorners(
                shapeGroup.getAttr("roundedCorners"),
                false
            );
            roundedCorners[subgroupName] = isVisible;
            shapeGroup.setAttr("roundedCorners", roundedCorners);

            shapeObject.cornerRadius([
                roundedCorners[SH.SideA] ? 15 : 0,
                roundedCorners[SH.SideB] ? 15 : 0,
                roundedCorners[SH.SideC] ? 15 : 0,
                roundedCorners[SH.SideD] ? 15 : 0,
            ]);
        });
        if (defaultVal === true) {
            checkboxGroup.fire("click");
        }

        const haveRoundedCorners = this.initializeCorners(
            shapeGroup.getAttr("haveRoundedCorners"),
            false
        );
        haveRoundedCorners[subgroupName] = true;
        shapeGroup.setAttr("haveRoundedCorners", haveRoundedCorners);

        /**
         * While Adding check box group this side must not be against the wall.
         * and because not against the wall then it cannot have backsplash either.
         */
        this.removeWall(shapeGroup, subgroupName);

        /**
         * While adding wall, wall edge corners, must not be rounded.
         * for ex: if we add Wall on edge "A" Then corner radius for
         * "A" and "B" must be disabled.
         */
        const groupMappings = {
            [SH.SideA]: [SH.SideA, SH.SideD],
            [SH.SideB]: [SH.SideA, SH.SideB],
            [SH.SideC]: [SH.SideB, SH.SideC],
            [SH.SideD]: [SH.SideD, SH.SideC],
        };

        const groupsToRemove = groupMappings[subgroupName] || [];

        groupsToRemove.forEach((group) => {
            this.removeWall(shapeGroup, group);
        });

        this.updateEdgeGroupsPosition(shapeGroup);
        this.eventManager.dispatchShapeSelect(shapeGroup);
    }

    /**
     *
     * @param {Konva.Group} shapeGroup
     * @param {boolean} createInputs
     */
    updateEdgeGroupsPosition(
        shapeGroup,
        createInputs = false,
        updateLabelPositionOnly = false
    ) {
        const groupShapeObject = this.getShapeObject(shapeGroup);
        const subgroupNames = SH.sides;

        const spacingOffset = 0;
        subgroupNames.forEach((subgroupName, index) => {
            /** @type {Konva.Group} */
            const subGroup = shapeGroup.findOne(`.${subgroupName}`);
            const sideLabel = shapeGroup.findOne(`#text_node_${subgroupName}`);
            const isHorizontal = SH.isHorizontal(subgroupName);

            const backsplash = shapeGroup.findOne(
                `.backsplash_${subgroupName}`
            );
            const checkboxGroup = shapeGroup.findOne(
                `.checkbox_node_${subgroupName}`
            );
            const checkboxRect = checkboxGroup
                ? checkboxGroup.findOne("Rect")
                : null;
            let backsplashOffset = 0;

            const attributes = {
                x: subGroup.x(),
                y: subGroup.y(),
            };

            if (isHorizontal) {
                if (backsplash) {
                    backsplashOffset =
                        backsplash.height() + SH.wallBacksplashGap;
                }
                if (SH.isFirstInHorizontalOrVertical(subgroupName)) {
                    attributes.x = groupShapeObject.x();
                    attributes.y =
                        groupShapeObject.y() -
                        subGroup.height() -
                        spacingOffset;

                    sideLabel.x(subGroup.width() - subGroup.width() * 0.8);
                    let y = subGroup.height() - 30 - backsplashOffset;
                    sideLabel.y(y);

                    checkboxGroup?.y(y);

                    createInputs && this.createWidthInput(subGroup);
                } else {
                    attributes.x = groupShapeObject.x();
                    attributes.y =
                        groupShapeObject.y() +
                        groupShapeObject.height() +
                        spacingOffset;

                    sideLabel.x(subGroup.width() - subGroup.width() * 0.8);
                    sideLabel.y(15 + backsplashOffset);

                    checkboxGroup?.x(
                        subGroup.width() - (checkboxRect.width() ?? 0)
                    );
                    checkboxGroup?.y(15 + backsplashOffset);

                    createInputs && this.createWidthInput(subGroup);
                }
            } else {
                if (backsplash) {
                    backsplashOffset =
                        backsplash.width() + SH.wallBacksplashGap;
                }
                if (SH.isFirstInHorizontalOrVertical(subgroupName)) {
                    attributes.x =
                        groupShapeObject.x() +
                        groupShapeObject.width() +
                        spacingOffset;
                    attributes.y = groupShapeObject.y();

                    const x = 15 + backsplashOffset;
                    sideLabel.x(x);
                    sideLabel.y(
                        subGroup.height() - subGroup.height() * 0.8 + 10
                    );
                    checkboxGroup?.x(x);
                    createInputs && this.createHeightInput(subGroup);
                } else {
                    attributes.x =
                        groupShapeObject.x() - subGroup.width() - spacingOffset;
                    attributes.y = groupShapeObject.y();

                    const x =
                        subGroup.width() -
                        subGroup.width() * 0.4 -
                        backsplashOffset;
                    sideLabel.x(x);
                    sideLabel.y(30);

                    checkboxGroup?.x(x);
                    checkboxGroup?.y(
                        subGroup.height() - (checkboxRect.height() ?? 0)
                    );

                    createInputs && this.createHeightInput(subGroup);
                }
            }

            if (updateLabelPositionOnly === false) {
                subGroup.position({
                    x: attributes.x,
                    y: attributes.y,
                });
            }
            this.updateInputsPosition(subGroup);
        });
    }

    /**
     *
     * @param {Konva.Group} SubGroup - border group, containing wall and size input
     * @param {Konva.Group} shapeGroup - main shape group containing everything, shape, edge group etc.
     */
    addWall(SubGroup, shapeGroup) {
        if (SubGroup.findOne(`.wall_${SubGroup.name()}`)) {
            console.error("Wall already exists");
            return;
        }

        const wall = new Konva.Rect({
            name: "wall_" + SubGroup.name(),
            id: "wall_" + SubGroup.name(),
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

        let againstTheWall = this.initializeCorners(
            shapeGroup.getAttr("againstTheWall"),
            false
        );
        againstTheWall[SubGroup.name()] = true;
        shapeGroup.setAttr("againstTheWall", againstTheWall);

        /**
         * While adding wall, wall edge corners, must not be rounded.
         * for ex: if we add Wall on edge "A" Then corner radius for
         * "A" and "B" must be disabled.
         */
        const groupMappings = {
            [SH.SideA]: [SH.SideA, SH.SideB],
            [SH.SideB]: [SH.SideB, SH.SideC],
            [SH.SideC]: [SH.SideC, SH.SideD],
            [SH.SideD]: [SH.SideD, SH.SideA],
        };

        const groupName = SubGroup.name();
        const groupsToRemove = groupMappings[groupName] || [];

        groupsToRemove.forEach((group) => {
            this.removeCheckboxGroup(group, shapeGroup);
        });
    }

    /**
     *
     * @param {Konva.Group} shapeGroup - main shape group, containing everything.
     * @param {import("./helpers/SquareHelper.js").SquareSide} wall
     */
    removeWall(shapeGroup, wall) {
        /** @type {Konva.Group} */
        const SubGroup = shapeGroup.findOne(`.${wall}`);
        const wallObj = SubGroup.findOne(`.wall_${wall}`);
        if (!wallObj) {
            return;
        }
        wallObj.destroy();

        let againstTheWall = shapeGroup.getAttr("againstTheWall");
        againstTheWall[SubGroup.name()] = false;
        shapeGroup.setAttr("againstTheWall", againstTheWall);

        // remove backsplash also when wall removed.
        this.removeBacksplash(SubGroup, shapeGroup, wall);

        EventManager.dispatchShapeSelect(shapeGroup);
    }

    /**
     *
     * @param {Konva.Group} SubGroup - border group, containing wall and size input
     * @param {Konva.Group} shapeGroup - main shape group containing everything, shape, edge group etc.
     */
    async addBacksplash(SubGroup, shapeGroup) {
        let dispatchShapeSelect = false;
        if (!SubGroup.findOne(`.wall_${SubGroup.name()}`)) {
            console.info("[Builder] Adding wall before adding backsplash");
            await this.addWall(SubGroup, shapeGroup);
            dispatchShapeSelect = true;
        }
        if (SubGroup.findOne(`.backsplash_${SubGroup.name()}`)) {
            console.error("Backsplash already exists");
            return;
        }
        const backsplash = new Konva.Rect({
            id: "backsplash_" + SubGroup.name(),
            name: "backsplash_" + SubGroup.name(),
            fill: "rgba(0, 0, 0, 0.65)",
            width: SubGroup.width(),
        });
        SubGroup.add(backsplash);

        /** @type {import("./helpers/SquareHelper.js").SquareSide} wall */
        const backsplashGroupName = SubGroup.name();
        const attributes = { x: 0, y: 0 };
        if (SH.isHorizontal(backsplashGroupName)) {
            const wallSizeOffset =
                SubGroup.findOne(`.wall_${SubGroup.name()}`).height() +
                SH.wallBacksplashGap;
            backsplash.height(30);
            backsplash.width(SubGroup.width());
            if (SH.isFirstInHorizontalOrVertical(backsplashGroupName)) {
                attributes.y = SubGroup.height() - backsplash.height();
                attributes.y -= wallSizeOffset;
            } else {
                attributes.y += wallSizeOffset;
            }
        } else {
            const wallSizeOffset =
                SubGroup.findOne(`.wall_${SubGroup.name()}`).width() +
                SH.wallBacksplashGap;
            backsplash.height(SubGroup.height());
            backsplash.width(30);
            if (!SH.isFirstInHorizontalOrVertical(backsplashGroupName)) {
                attributes.x =
                    SubGroup.width() - backsplash.width() - wallSizeOffset;
            } else {
                attributes.x = wallSizeOffset;
            }
        }

        backsplash.position(attributes);

        const backsplashes = this.initializeCorners(
            shapeGroup.getAttr("backsplashes"),
            false
        );
        backsplashes[SubGroup.name()] = true;
        shapeGroup.setAttr("backsplashes", backsplashes);

        if (dispatchShapeSelect) {
            EventManager.dispatchShapeSelect(shapeGroup);
        }
        this.updateInputsPosition(SubGroup);
        this.updateEdgeGroupsPosition(shapeGroup, false, true);
    }

    /**
     *
     * @param {Konva.Group} SubGroup - border group, containing wall and size input
     * @param {Konva.Group} shapeGroup - main shape group, containing everything.
     * @param {import("./helpers/SquareHelper.js").SquareSide} wall
     */
    removeBacksplash(SubGroup, shapeGroup, wall) {
        const backsplashObj = SubGroup.findOne(`.backsplash_${wall}`);
        if (backsplashObj) {
            backsplashObj.destroy();

            let backsplashes = shapeGroup.getAttr("backsplashes");
            backsplashes[SubGroup.name()] = false;
            shapeGroup.setAttr("backsplashes", backsplashes);

            this.updateInputsPosition(SubGroup);
            this.updateEdgeGroupsPosition(shapeGroup, false, true);
        }
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
     * @param {Konva.Group} subGroup
     */
    createHeightInput(subGroup) {
        const shapeGroup = subGroup.findAncestor(
            `#${SquareShapeIds.ShapeGroup}`
        );
        const shapeSize = shapeGroup.getAttr("shapeSize");

        const heightInput = new Konva.Text({
            id: SquareShapeIds.ShapeHeightTextLayer,
            text: String(shapeSize.height),
            fontSize: 20,
            fill: "black",
            width: 40,
            wall: subGroup.name(),
        });
        subGroup.add(heightInput);

        this.updateInputsPosition(subGroup, true, false);

        // create event listener to show text box to change width
        heightInput.on("click", (e) => {
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

            inputBox.value = heightInput.text();
            Object.assign(inputBox.style, inputBoxStyle);
            inputBox.focus();
            let inputRemoved = false;
            inputBox.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    inputRemoved = true;
                    this.handleInputValueChange(
                        "height",
                        subGroup,
                        heightInput,
                        inputBox
                    );
                }
            });
            inputBox.addEventListener("blur", (e) => {
                if (inputRemoved) return;
                this.handleInputValueChange(
                    "height",
                    subGroup,
                    heightInput,
                    inputBox
                );
            });
        });
    }

    /**
     *
     * @param {string} attr - "height" or "width"
     * @param {Konva.Group} subGroup
     * @param {Konva.Text} labelNode
     * @param {HTMLInputElement | string} inputBox
     */
    handleInputValueChange = (
        attr,
        subGroup,
        labelNode = null,
        inputBox = null
    ) => {
        /** @type {Konva.Group} */
        let shapeGroup;
        if (subGroup.id() === SquareShapeIds.ShapeGroup) {
            shapeGroup = subGroup;
        } else {
            /** @type {Konva.Group} */
            // @ts-ignore
            shapeGroup = subGroup.findAncestor(`#${SquareShapeIds.ShapeGroup}`);
        }
        const squarePlaceHolderObject = this.getShapeObject(shapeGroup);

        const dynamicLabelNodeId = `shape${
            attr.charAt(0).toUpperCase() + attr.slice(1)
        }TextLayer`;
        /** @type {Konva.Text[]} */
        const labelNodes = shapeGroup.find(
            `#${labelNode ? labelNode.id() : dynamicLabelNodeId}`
        );

        let inputBoxValue = "";
        if (['string', 'number'].includes(typeof inputBox)) {
            inputBoxValue = inputBox;
        } else {
            inputBoxValue = inputBox?.value;
            document.body.removeChild(inputBox);
        }
        // Update both width input positions
        labelNodes.forEach((labelNode) => {
            labelNode.text(inputBoxValue);
        });

        this.setDragging(shapeGroup, true);
        squarePlaceHolderObject.setAttr(attr, Number(inputBoxValue) * SizeDiff);

        const edgeGroups = SH.getDirectionalEdgeGroups(
            subGroup.name() ? subGroup.name() : attr,
            shapeGroup
        );
        edgeGroups.forEach((edgeGroup) => {
            edgeGroup.setAttr(attr, Number(inputBoxValue) * SizeDiff);

            // Update wall and backsplash size also.
            const wall = edgeGroup.findOne((node) => {
                return String(node.id()).startsWith("wall_");
            });
            if (wall) {
                wall.setAttr(attr, Number(inputBoxValue) * SizeDiff);
            }
            const backsplash = edgeGroup.findOne((node) => {
                return String(node.id()).startsWith("backsplash_");
            });
            if (backsplash) {
                backsplash.setAttr(attr, Number(inputBoxValue) * SizeDiff);
            }
        });
        this.updateInputsPosition(subGroup);
        this.updateHoverActionOverlayPosition(shapeGroup);
        this.updateEdgeGroupsPosition(shapeGroup);

        const shapeSize = shapeGroup.getAttr("shapeSize");
        shapeSize[attr] = inputBoxValue;
        shapeGroup.setAttr("shapeSize", shapeSize);

        this.eventManager.dispatchSizeUpdate(shapeGroup);
    };

    /**
     * Create Text and Input box for the Width adjustments
     * @param {Konva.Group} subGroup - edge sub group
     */
    createWidthInput(subGroup) {
        const shapeGroup = subGroup.findAncestor(
            `#${SquareShapeIds.ShapeGroup}`
        );
        const shapeSize = shapeGroup.getAttr("shapeSize");

        const widthInput = new Konva.Text({
            id: SquareShapeIds.ShapeWidthTextLayer,
            text: String(shapeSize.width),
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
        /** @type {Konva.Group} */
        let shapeGroup;
        if (subGroup.id() === SquareShapeIds.ShapeGroup) {
            shapeGroup = subGroup;
        } else {
            /** @type {Konva.Group} */
            // @ts-ignore
            shapeGroup = subGroup.findAncestor(`#${SquareShapeIds.ShapeGroup}`);
        }

        if (heightOnly) {
            const heightInputs = shapeGroup.find(
                `#${SquareShapeIds.ShapeHeightTextLayer}`
            );

            heightInputs.forEach((heightInput, index) => {
                let position = {
                    x: 0,
                    y: 0,
                };
                if (heightInput.getAttr("wall") === SH.SideB) {
                    const textNode = shapeGroup.findOne(
                        `#text_node_${heightInput.getAttr("wall")}`
                    );
                    if (textNode) {
                        position = { x: textNode.x(), y: textNode.y() };
                        position.x = position.x - 3;
                        position.y = position.y + 50;
                    }
                } else {
                    const textNode = shapeGroup.findOne(
                        `#text_node_${heightInput.getAttr("wall")}`
                    );
                    if (textNode) {
                        position = { x: textNode.x(), y: textNode.y() };
                        position.y = position.y + 50;
                    }
                }

                heightInput.position(position);
            });
        }

        if (widthOnly) {
            const widthInputs = shapeGroup.find(
                `#${SquareShapeIds.ShapeWidthTextLayer}`
            );

            // Update both width input positions
            widthInputs.forEach((widthInput) => {
                let position = {
                    x: 0,
                    y: 0,
                };
                if (widthInput.getAttr("wall") === SH.SideA) {
                    const textNode = shapeGroup.findOne(
                        `#text_node_${widthInput.getAttr("wall")}`
                    );
                    if (textNode) {
                        position = { x: textNode.x(), y: textNode.y() };
                        position.x = position.x + 50;
                        position.y = position.y - 3;
                    }
                } else {
                    const textNode = shapeGroup.findOne(
                        `#text_node_${widthInput.getAttr("wall")}`
                    );
                    if (textNode) {
                        position = { x: textNode.x(), y: textNode.y() };
                        position.x = position.x + 50;
                        position.y = position.y - 3;
                    }
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
        const shapeNameElm = attributeOverlay.querySelector("#shape-name");
        shapeNameElm.innerHTML = shapeName;
        shapeNameElm.setAttribute("title", shapeName);
        shapeGroup.setAttr("shapeName", shapeName);

        const materialName = shapeGroup.getAttr("materialName");
        if (materialName) {
            attributeOverlay.querySelector("#material-name").innerHTML =
                materialName;
        }

        const productName = shapeGroup.getAttr("productName");
        if (productName) {
            attributeOverlay.querySelector("#product-name").innerHTML =
                productName;
        }

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
        if (import.meta.env.VITE_BUILDING_FOR_DEMO === "true") {
            Array.from(Array(4)).forEach(() =>
                this.appendShapeCutOut(
                    shapeGroup,
                    undefined,
                    undefined,
                    attributeOverlay
                )
            );
        }
    }

    /**
     *
     * @param {Konva.Group} shapeGroup
     * @param {string} url
     * @param {string} title
     * @param {HTMLElement} attributeOverlay - when appending shapeCutout right after placing the attribute overlay element in dom.
     * in this case getting attribute overlay element from dom might be blank.
     * @param {string} propertyId - when appending shapeCutout right after placing the attribute overlay element in dom.
     */
    appendShapeCutOut(
        shapeGroup,
        url = "/dynamicAssets/sinkdropin-1.png",
        title = "Drop-in Sink",
        attributeOverlay = null,
        propertyId = null
    ) {
        // initialize attribute on shape group
        let attributesItems = shapeGroup.getAttr("attributesItems");
        if (!attributesItems || Object.keys(attributesItems).length === 0) {
            attributesItems = [];
        }

        // Check if already exists
        if (propertyId && attributesItems.length > 0) {
            const index = attributesItems.findIndex(
                (item) => item.id === propertyId
            );
            if (index !== -1) {
                console.warn("Attribute already exists.");
                return;
            }
        }

        const overlay =
            attributeOverlay ??
            document.querySelector(`#attributes-overlay-${shapeGroup._id}`);
        const container = overlay.querySelector("#shape-cutout-group");
        /** @type {HTMLElement} */
        const domObject = new DOMParser().parseFromString(
            AttributeShapeCutOutTemplate,
            "text/html"
        ).body.firstChild;
        domObject.id = `${domObject.id}-${propertyId}`;
        const image = domObject.querySelector("img");
        const titleElm = domObject.querySelector("span");

        if(url != '') {
            image.src = url;
            image.alt = url.split("/").reverse()[0];
        } else {
            image.style.display = 'none';
            const parentDiv = image.closest('div');
            parentDiv.style.border = '1px solid #fff'; 
        }


        titleElm.innerHTML = title;

        container.appendChild(domObject);

        attributesItems.push({ id: propertyId, image: url, name: title });
        shapeGroup.setAttr("attributesItems", attributesItems);
    }

    /**
     *
     * @param {Konva.Group} shapeGroup
     * @param {string} propertyId - when appending shapeCutout right after placing the attribute overlay element in dom.
     */
    removeShapeCutOut(
        shapeGroup,
        propertyId = null
    ) {
        const overlay = document.querySelector(`#attributes-overlay-${shapeGroup._id}`);
        const container = overlay.querySelector("#shape-cutout-group");
        const cutOutItem = container.querySelector(`#property-${propertyId}`);

        // initialize attribute on shape group
        let attributesItems = shapeGroup.getAttr("attributesItems");
        if (!attributesItems || Object.keys(attributesItems).length === 0) {
            attributesItems = [];
        }

        // Check if already exists
        if (attributesItems.length > 0) {
            const index = attributesItems.findIndex(
                (item) => item.id === propertyId
            );
            if (index !== -1) {
                attributesItems.splice(index, 1)
                shapeGroup.setAttr("attributesItems", attributesItems);
            }
        }

        cutOutItem?.remove();
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
