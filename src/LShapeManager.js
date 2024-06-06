import Konva from "konva";
import { rotateGroup } from "./Helper.js";
import RotateIcon from "@/assets/image/rotate.svg?raw";
import {
    LShapeIds,
    ShapeActions,
    ShapeTypes,
    // SquareShapeIds,
} from "./enum/ShapeManagerEnum.js";
import AttributeOverlayTemplate from "@/templates/AttributesOverlay/index.html?raw";
import AttributeShapeCutOutTemplate from "@/templates/AttributesOverlay/ShapeCutOut.html?raw";
import EventManager from "./EventManager.js";
import { LShapeHelper as LSH } from "./helpers/LShapeHelper.js";
// import { SquareHelper as SH } from "./helpers/SquareHelper.js";

/**
 * @typedef {Partial<Pick<CSSStyleDeclaration, keyof CSSStyleDeclaration>>} CSSStyleDec
 */
export default class LShapeManager {
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
            const groups = this.stage.find(`#${LShapeIds.LShapeGroup}`);
            groups.forEach((group) =>{
                this.updateAttributesOverlayPosition(group)
                this.updateHoverActionOverlayPosition(group)
            });
        });
        this.stage.on("scaleChange xChange yChange", (ev) => {
            setTimeout(() => {
                const groups = this.stage.find(`#${LShapeIds.LShapeGroup}`);
                groups.forEach((group) =>{
                    this.updateAttributesOverlayPosition(group)
                    this.updateHoverActionOverlayPosition(group)
                });
            });
        });
    }

    /**
     *
     * @typedef {{materialName : string, productName: string}} AttributeOverlayMaterialName
     * @typedef {{ [key in import("./helpers/LShapeHelper.js").LShapeSide]: number}} AllSideLengthsType
     *
     * @param {string} materialImage
     * @param {boolean} onlyPlaceholder
     * @param {*} materialId
     * @param {null | Konva.Group} placeholderGroup - passed in from draw (on re-rendering the canvas)
     * @param {string | number | null} prevShapeId - passed in from draw (on re-rendering the canvas)
     * @param {AllSideLengthsType} shapeSize - passed in from draw (on re-rendering the canvas)
     * @param {AttributeOverlayMaterialName} overlayMaterialProductName - Material and productName to use for Attributes overlay.
     */
    draw(
        materialImage = "",
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

        let posX = 20;
        let posY = 30;
        // if (this.layer.hasChildren()) {
        //     const child = this.layer.getChildren();
        //     const lastChild = child[child.length - 1];
        //     posX = 5 + lastChild.getClientRect().x + lastChild.width();
        //     posY = lastChild.getClientRect().y;
        // }

        /** @type {Konva.Group} */
        let shapeGroup;

        /** @type {Konva.Line} */
        let shapeObject;

        if (onlyPlaceholder) {
            const shapeInitialCord = this.getShapePointsCoordinates();
            /** @type {AllSideLengthsType} */
            const sidesLength = LSH.getSideLength(false, shapeInitialCord);
            sidesLength.a = (shapeSize && shapeSize[LSH.SideA]) ?? sidesLength.a / LSH.SizeDiff;
            sidesLength.b = (shapeSize && shapeSize[LSH.SideB]) ?? sidesLength.b / LSH.SizeDiff;
            sidesLength.c = (shapeSize && shapeSize[LSH.SideC]) ?? sidesLength.c / LSH.SizeDiff;
            sidesLength.d = (shapeSize && shapeSize[LSH.SideD]) ?? sidesLength.d / LSH.SizeDiff;
            sidesLength.i = (shapeSize && shapeSize[LSH.SideI]) ??  90;

            shapeGroup = new Konva.Group({
                x: 100,
                y: 10,
                draggable: this.stage.getAttr("shapeDraggable") === true,
                id: LShapeIds.LShapeGroup,
                materialId: materialId,
                materialImage: materialImage,
                shapeSize: sidesLength,
                shapeType: ShapeTypes.LShape,
                canvasShapeId: null,
                isPlaced: false,
                prevShapeId: prevShapeId,
                materialName: overlayMaterialProductName.materialName,
                productName: overlayMaterialProductName.productName,
            });
            shapeGroup.setAttr('canvasShapeId', shapeGroup._id);

            // Create the L-shape using a line polygon
            /** @type {Konva.Line} */
            shapeObject = new Konva.Line({
                id: LShapeIds.LShapePlaceholderObject,
                points: shapeInitialCord,
                closed: true, // Close the shape to form an L
                fill: "red",
                opacity: 0.3,
            });

            shapeGroup.add(shapeObject);
            this.createEdgeGroups(shapeGroup);
            this.layer.add(shapeGroup);

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
                // const hoverNode = e.target;
                if (e.type === "dragmove") {
                    this.updateAttributesOverlayPosition(shapeGroup);
                    // const targetShape = this.getShapeObject(hoverNode);
                    // const targetRect = targetShape.getClientRect();
                    // this.layer.find("Group").forEach(
                    //     /** @param {Konva.Group} group  */
                    //     (group) => {
                    //         // do not check intersection with itself
                    //         if (group === hoverNode) {
                    //             group.opacity(1);
                    //             return;
                    //         }
                    //         const shape = this.getShapeObject(group);
                    //         const haveIntersection = this.haveIntersection(
                    //             shape.getClientRect(),
                    //             targetRect
                    //         );
                    //         group.opacity(haveIntersection ? 0.5 : 1);
                    //     }
                    // );
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
                    // [
                    //     SquareShapeIds.ShapeHeightTextLayer,
                    //     SquareShapeIds.ShapeWidthTextLayer,
                    // ].includes(hoverNode.id()) ||
                    !shapeGroup.findOne(`#${LShapeIds.LShapePlaceholderObject}`)
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
                        LShapeIds.LShapeActionOverlayId,
                        "action-overlay-btn",
                        "image-context",
                    ].includes(elmId)
                ) {
                    this.actionOverlayNode.style.display = "none";
                    this.currentHoverNode = null;
                    this.stage.container().style.cursor = "initial";
                }
            });
        } else {
            // Replace Placeholder with an image
            shapeGroup = placeholderGroup ?? this.currentHoverNode;
            shapeGroup.on("click", () => {
                this.eventManager.dispatchShapeSelect(shapeGroup);
            });
            shapeGroup.setAttr("show_action_overlay", false);

            // Place image element onto the layer with actual material image
            /** @type {Konva.Rect} */
            const placeHolderElm = shapeGroup.findOne(
                `#${LShapeIds.LShapePlaceholderObject}`
            );
            placeHolderElm.fill("");
            placeHolderElm.opacity(1);

            const imageObj = document.createElement("img");

            imageObj.src = materialImage;
            imageObj.onload = () => {
                // wait for image to be loaded, otherwise
                // shape will be filled with black color
                placeHolderElm.fillPatternImage(imageObj);
            };
            placeHolderElm.id(LShapeIds.LShapeObject);
            this.actionOverlayNode.style.display = "none";
            // TODO: Dispatch Shape Select Overlay.
            this.createAttributesOverlay(shapeGroup);
            this.eventManager.dispatchShapeSelect(shapeGroup);
            shapeGroup.setAttr('isPlaced', true);
        }

        return shapeGroup;
    }

    createContextMenu() {
        /** @type {CSSStyleDec} */
        const contextMenuStyles = {
            border: "1px solid",
            background: "white",
            minWidth: "80px",
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
                const shapeGroup = this.currentShape.findAncestor(
                    `#${LShapeIds.LShapeGroup}`
                );
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
                    String(LShapeIds.LShapeObject),
                    String(LShapeIds.LShapePlaceholderObject),
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
        shapeGroup?.destroy();

        this.eventManager.dispatchShapeDelete(shapeGroup._id);
    }

    getShapePointsCoordinates(
        x = 100,
        y = 100,
        sidesLength = { a: 150, b: 50, c: 50, d: 100 }
    ) {
        sidesLength.a *= LSH.SizeDiff;
        sidesLength.b *= LSH.SizeDiff;
        sidesLength.c *= LSH.SizeDiff;
        sidesLength.d *= LSH.SizeDiff;

        // Validate the dimensions
        if (
            sidesLength.a <= 0 ||
            sidesLength.b <= 0 ||
            sidesLength.c <= 0 ||
            sidesLength.d <= 0
        ) {
            throw new Error("All dimensions must be positive numbers.");
        }

        // prettier-ignore
        return [
            x, y,
            x + sidesLength.a, y,
            x + sidesLength.a, y + sidesLength.b,
            x + sidesLength.c, y + sidesLength.b,
            x + sidesLength.c, y + sidesLength.d,
            x, y + sidesLength.d,
            x, y,
        ];
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
        this.actionOverlayNode.id = LShapeIds.LShapeActionOverlayId;

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
                // alert("Coming Soon...");
                this.rotateShapeGroup(this.currentHoverNode, 90);
            } else if (action === ShapeActions.Place) {
                let materialImage =
                    this.currentHoverNode.getAttr("materialImage");
                this.draw(materialImage, false);
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
        if (!shapeGroup) {
            shapeGroup = shapeNode.findAncestor("Group");
        }
        const rotation = shapeGroup.rotation();
        const boxRect = shapeNode.getClientRect();
        let overlayNewPosition = {
            left: boxRect.x + 30,
            top: boxRect.y + 30,
        };

        if (rotation === 180) {
            overlayNewPosition = {
                left: boxRect.x + 30,
                top:
                    boxRect.y +
                    shapeNode.height() -
                    this.actionOverlayNode.clientHeight -
                    30,
            };
        } else if (rotation > 180) {
            overlayNewPosition = {
                left: boxRect.x + 30,
                top:
                    boxRect.y +
                    shapeNode.width() -
                    this.actionOverlayNode.clientHeight -
                    30,
            };
        }

        this.actionOverlayNode.style.left = `${overlayNewPosition.left}px`;
        this.actionOverlayNode.style.top = `${overlayNewPosition.top}px`;
    }

    /**
     * To get Placeholder or placed shape object
     *
     * @param {Konva.Group} shapeGroup
     *
     * @returns {Konva.Line}
     */
    getShapeObject(shapeGroup) {
        return (
            shapeGroup.findOne(`#${LShapeIds.LShapePlaceholderObject}`) ??
            shapeGroup.findOne(`#${LShapeIds.LShapeObject}`)
        );
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

    /**
     *
     * @param {Konva.Group} shapeGroup
     */
    createEdgeGroups(shapeGroup) {
        const groupShapeObject = this.getShapeObject(shapeGroup);
        const subgroupNames = LSH.sides;
        // const subgroupNames = [LSH.SideA, LSH.SideB, LSH.SideC];
        // TODO: for demo only. also remove index param from subgroupNames loop callback params
        // const subgroupColor = ["yellow", "red", "green", "blue", "magenta"];

        const points = groupShapeObject.points();
        subgroupNames.forEach((subgroupName, index) => {
            const isHorizontal = LSH.isHorizontal(subgroupName);
            const attributes = {
                height: 0,
                width: 0,
                x: 0,
                y: 0,
            };
            if (isHorizontal) {
                attributes.height = 100;
                attributes.width = Number(LSH.getSideLength(subgroupName, points));
            } else {
                attributes.height = Number(LSH.getSideLength(subgroupName, points));
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
            //     name: 'tempBG',
            //     fill: subgroupColor[index],
            //     opacity: 0.3,
            //     width: attributes.width,
            //     height: attributes.height,
            // });
            // subGroup.add(tempRect);
        });

        this.updateEdgeGroupsPosition(shapeGroup, true);
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
        const subgroupNames = LSH.sides;
        const points = groupShapeObject.points();

        const spacingOffset = 0;
        subgroupNames.forEach((subgroupName, index) => {
            /** @type {Konva.Group} */
            const subGroup = shapeGroup.findOne(`.${subgroupName}`);
            const sideLabel = shapeGroup.findOne(`#text_node_${subgroupName}`);
            const isHorizontal = LSH.isHorizontal(subgroupName);
            const sidePosition = LSH.getSidePoints(subgroupName, points);

            const backsplash = shapeGroup.findOne(
                `.backsplash_${subgroupName}`
            );
            // const checkboxGroup = shapeGroup.findOne(
            //     `.checkbox_node_${subgroupName}`
            // );
            // const checkboxRect = checkboxGroup
            //     ? checkboxGroup.findOne("Rect")
            //     : null;
            let backsplashOffset = 0;

            const attributes = {
                x: subGroup.x(),
                y: subGroup.y(),
            };

            if (isHorizontal) {
                if (backsplash) {
                    backsplashOffset =
                        backsplash.height() + LSH.wallBacksplashGap;
                }
                if (LSH.isFirstInHorizontalOrVertical(subgroupName)) {
                    const sidePositionS = sidePosition[0];
                    attributes.x = sidePositionS.x;
                    attributes.y =
                        sidePositionS.y - subGroup.height() - spacingOffset;

                    sideLabel.x(subGroup.width() - subGroup.width() * 0.8);
                    let y = subGroup.height() - 30 - backsplashOffset;
                    sideLabel.y(y);

                    // checkboxGroup?.y(y);

                    createInputs && this.createWidthInput(subGroup);
                } else {
                    const sidePositionE = sidePosition[1];
                    attributes.x = sidePositionE.x;
                    attributes.y = sidePositionE.y + spacingOffset;

                    if (LSH.SideI === subgroupName) {
                        sideLabel.x(subGroup.width() - subGroup.width() * 0.95);
                    } else {
                        sideLabel.x(subGroup.width() - subGroup.width() * 0.8);
                    }
                    sideLabel.y(15 + backsplashOffset);

                    // checkboxGroup?.x(
                    //     subGroup.width() - (checkboxRect.width() ?? 0)
                    // );
                    // checkboxGroup?.y(15 + backsplashOffset);

                    createInputs && this.createWidthInput(subGroup);
                }
            } else {
                if (backsplash) {
                    backsplashOffset =
                        backsplash.width() + LSH.wallBacksplashGap;
                }
                if (LSH.isFirstInHorizontalOrVertical(subgroupName)) {
                    const sidePositionS = sidePosition[0];
                    attributes.x = sidePositionS.x + spacingOffset;
                    attributes.y = sidePositionS.y;

                    const x = 15 + backsplashOffset;
                    sideLabel.x(x);
                    sideLabel.y(
                        subGroup.height() - subGroup.height() * 0.8 + 10
                    );
                    // checkboxGroup?.x(x);
                    createInputs && this.createHeightInput(subGroup);
                } else {
                    const sidePositionS = sidePosition[1];
                    attributes.x =
                        sidePositionS.x - subGroup.width() - spacingOffset;
                    attributes.y = sidePositionS.y;

                    const x =
                        subGroup.width() -
                        subGroup.width() * 0.5 -
                        backsplashOffset;
                    sideLabel.x(x);
                    sideLabel.y(30);

                    // checkboxGroup?.x(x);
                    // checkboxGroup?.y(
                    //     subGroup.height() - (checkboxRect.height() ?? 0)
                    // );

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

        const corners = LSH.corners;
        corners.forEach((subgroupName, index) => {
            /** @type {Konva.Group} */
            const subGroup = shapeGroup.findOne(`.${subgroupName}`);
            const backsplash = shapeGroup.findOne(
                `.backsplash_${subgroupName}`
            );

            /** @type {Konva.Group} */
            const checkboxGroup = shapeGroup.findOne(
                `.checkbox_node_${subgroupName}`
            );
            if (!checkboxGroup){
                return;
            }
            const checkboxRect = checkboxGroup.findOne("Rect");

            const position = {
                x: 0,
                y: 0,
            };

            if (LSH.SideA === subgroupName) {
                position.x = 0
                position.y = subGroup.height() - (checkboxRect.height() + 10)
            } else if (LSH.SideB === subgroupName) {
                position.x = 15
                position.y = 0
            } else if (LSH.SideC === subgroupName) {
                /** @type {Konva.Group} */
                const subGroup = shapeGroup.findOne(`.${LSH.SideB}`);
                position.x = - (checkboxRect.width())
                position.y = subGroup.height() + checkboxRect.height()
            } else if (LSH.SideD === subgroupName) {
                /** @type {Konva.Group} */
                const subGroup = shapeGroup.findOne(`.${LSH.SideC}`);
                position.x = subGroup.width() - checkboxRect.width()
                position.y = 10
            } else if (LSH.SideE === subgroupName) {
                position.x = - (checkboxRect.width() + 10)
                position.y = - (checkboxRect.height())
            }

            checkboxGroup.x(position.x)
            checkboxGroup.y(position.y)
        })
    }

    /**
     * Create Text and Input box for the Width adjustments
     * @param {Konva.Group} subGroup - edge sub group
     */
    createWidthInput(subGroup) {
        const shapeObject = this.getShapeObject(
            subGroup.findAncestor(`#${LShapeIds.LShapeGroup}`)
        );
        const sideLength = LSH.getSideLength(
            subGroup.name(),
            shapeObject.points()
        );

        /** @type {string | number} */
        let value = sideLength / LSH.SizeDiff;
        if (subGroup.name() === LSH.SideI) {
            value = LSH.getInteriorAngleText()
        }


        const widthInput = new Konva.Text({
            id: LShapeIds.LShapeTextLayers[subGroup.name()],
            text: String(value),
            fontSize: 20,
            fill: "black",
            // width: 80,
            wall: subGroup.name(),
        });
        subGroup.add(widthInput);

        this.updateInputsPosition(subGroup, false, true);

        if (subGroup.name() === LSH.SideI) {
            // We don't need click event listeners
            // for interior angle.
            return;
        }
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
     * Create Text and Input box for the height adjustments
     * @param {Konva.Group} subGroup - edge sub group
     */
    createHeightInput(subGroup) {
        const shapeObject = this.getShapeObject(
            subGroup.findAncestor(`#${LShapeIds.LShapeGroup}`)
        );
        const sideLength = LSH.getSideLength(
            subGroup.name(),
            shapeObject.points()
        );
        const value = sideLength / LSH.SizeDiff;

        const heightInput = new Konva.Text({
            id: LShapeIds.LShapeTextLayers[subGroup.name()],
            text: String(value),
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
     * @param {Konva.Group} subGroup - shape edge sub group, containing wall, side label etc.
     */
    updateInputsPosition(subGroup, heightOnly = true, widthOnly = true) {
        /** @type {Konva.Group} */
        let shapeGroup;
        if (subGroup.id() === LShapeIds.LShapeGroup) {
            shapeGroup = subGroup;
        } else {
            /** @type {Konva.Group} */
            // @ts-ignore
            shapeGroup = subGroup.findAncestor(`#${LShapeIds.LShapeGroup}`);
        }

        if (heightOnly && [LSH.SideB, LSH.SideD].includes(subGroup.name())) {
            const heightInput = shapeGroup.findOne(
                `#${LShapeIds.LShapeTextLayers[subGroup.name()]}`
            );

            let position = {
                x: 0,
                y: 0,
            };
            if (heightInput.getAttr("wall") === LSH.SideB) {
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
        }

        if (widthOnly && [LSH.SideA, LSH.SideC, LSH.SideI].includes(subGroup.name())) {
            const widthInput = shapeGroup.findOne(
                `#${LShapeIds.LShapeTextLayers[subGroup.name()]}`
            );

            // Update both width input positions
            let position = {
                x: 0,
                y: 0,
            };
            if (widthInput.getAttr("wall") === LSH.SideA) {
                const textNode = shapeGroup.findOne(
                    `#text_node_${widthInput.getAttr("wall")}`
                );
                if (textNode) {
                    position = { x: textNode.x(), y: textNode.y() };
                    position.x = position.x + 50;
                    position.y = position.y - 3;
                }
            } else if (widthInput.getAttr("wall") === LSH.SideC) {
                const textNode = shapeGroup.findOne(
                    `#text_node_${widthInput.getAttr("wall")}`
                );
                if (textNode) {
                    position = { x: textNode.x(), y: textNode.y() };
                    position.x = position.x + 50;
                    position.y = position.y - 3;
                }
            } else if (widthInput.getAttr("wall") === LSH.SideI) {
                // Interior angle.
                const textNode = shapeGroup.findOne(
                    `#text_node_${widthInput.getAttr("wall")}`
                );
                if (textNode) {
                    position = { x: textNode.x(), y: textNode.y() };
                    position.x = position.x + 30;
                    position.y = position.y - 3;
                }
            }

            widthInput.position(position);
        }
    }

    /**
     *
     * @param {string} attr - "height" or "width"
     * @param {Konva.Group} subGroup - edge group
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
        // @ts-ignore
        let shapeGroup = subGroup.findAncestor(`#${LShapeIds.LShapeGroup}`);
        const squarePlaceHolderObject = this.getShapeObject(shapeGroup);

        let inputBoxValue = "";
        if (typeof inputBox === "string") {
            inputBoxValue = inputBox;
        } else {
            inputBoxValue = inputBox?.value;
            document.body.removeChild(inputBox);
        }

        // Update label text with new value
        labelNode.text(inputBoxValue);

        this.setDragging(shapeGroup, true);
        const points = squarePlaceHolderObject.points();
        const position = LSH.getSidePoints(LSH.SideA, points)[0];

        const sideLengths = {
            a: Number(LSH.getSideLength(LSH.SideA, points)) / LSH.SizeDiff,
            b: Number(LSH.getSideLength(LSH.SideB, points)) / LSH.SizeDiff,
            c: Number(LSH.getSideLength(LSH.SideC, points)) / LSH.SizeDiff,
            d: Number(LSH.getSideLength(LSH.SideD, points)) / LSH.SizeDiff,
            [subGroup.name()]: inputBoxValue,
        };
        const newCoordinates = this.getShapePointsCoordinates(
            position.x,
            position.y,
            sideLengths
        );
        squarePlaceHolderObject.points(newCoordinates);

        // const edgeGroup = shapeGroup.findOne(`.${subGroup.name()}`);
        subGroup.setAttr(attr, Number(inputBoxValue) * LSH.SizeDiff);
        // subGroup.findOne(".tempBG").setAttr(attr, Number(inputBoxValue) * LSH.SizeDiff);

        // Update wall and backsplash size also.
        const wall = subGroup.findOne((node) => {
            return String(node.id()).startsWith("wall_");
        });
        if (wall) {
            wall.setAttr(attr, Number(inputBoxValue) * LSH.SizeDiff);
        }
        const backsplash = subGroup.findOne((node) => {
            return String(node.id()).startsWith("backsplash_");
        });
        if (backsplash) {
            backsplash.setAttr(attr, Number(inputBoxValue) * LSH.SizeDiff);
        }

        this.updateInputsPosition(subGroup);
        this.updateHoverActionOverlayPosition(shapeGroup);
        this.updateEdgeGroupsPosition(shapeGroup);

        const shapeSize = shapeGroup.getAttr("shapeSize");
        shapeSize[subGroup.name()] = inputBoxValue;
        shapeGroup.setAttr("shapeSize", shapeSize);

        this.eventManager.dispatchSizeUpdate(shapeGroup);
    };

    /**
     *
     * @param {Konva.Node} element
     * @param {boolean} enable
     */
    setDragging(element, enable = true) {
        if (element.id() !== LShapeIds.LShapeGroup) {
            element = element.findAncestor(`#${LShapeIds.LShapeGroup}`);
        }
        element.draggable(enable);
        // ? set the cursors and other side effects of toggling the element draggable
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

        const overlay = attributeOverlay ?? this.getShapeGroupAttributeOverlay(shapeGroup);
        const container = overlay.querySelector("#shape-cutout-group");
        /** @type {HTMLElement} */
        const domObject = new DOMParser().parseFromString(
            AttributeShapeCutOutTemplate,
            "text/html"
        ).body.firstChild;
        domObject.id = `${domObject.id}-${propertyId}`;
        const image = domObject.querySelector("img");
        const titleElm = domObject.querySelector("span");
        image.src = url;
        image.alt = url.split("/").reverse()[0];

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
        if (ShapeObject.id() !== LShapeIds.LShapeObject) return;

        const boxRect = ShapeObject.getClientRect();
        const rotation = shapeGroup.rotation();
        const attributeOverlay = this.getShapeGroupAttributeOverlay(shapeGroup);

        let overlayNewPosition = {
            left: boxRect.x + 30,
            top: boxRect.y + 30,
        };

        if (rotation === 180) {
            overlayNewPosition = {
                left: boxRect.x + 30,
                top:
                    boxRect.y +
                    ShapeObject.height() -
                    attributeOverlay.clientHeight -
                    30,
            };
        } else if (rotation > 180) {
            overlayNewPosition = {
                left: boxRect.x + 30,
                top:
                    boxRect.y +
                    ShapeObject.width() -
                    attributeOverlay.clientHeight -
                    30,
            };
        }

        attributeOverlay.style.left = `${overlayNewPosition.left}px`;
        attributeOverlay.style.top = `${overlayNewPosition.top}px`;
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
        if (LSH.isHorizontal(wallGroupName)) {
            wall.height(5);
            wall.width(SubGroup.width());
            if (LSH.isFirstInHorizontalOrVertical(wallGroupName)) {
                attributes.y = SubGroup.height() - wall.height();
            }
        } else {
            wall.height(SubGroup.height());
            wall.width(5);
            if (!LSH.isFirstInHorizontalOrVertical(wallGroupName)) {
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
            [LSH.SideA]: [LSH.SideA, LSH.SideB],
            [LSH.SideB]: [LSH.SideB, LSH.SideC],
            [LSH.SideC]: [LSH.SideD, LSH.SideE],
            [LSH.SideD]: [LSH.SideA, LSH.SideE],
        };

        const groupName = SubGroup.name();
        const groupsToRemove = groupMappings[groupName] || [];

        groupsToRemove.forEach((group) => {
            this.removeCheckboxGroup(group, shapeGroup);
        });
    }

    /**
     *
     * @param {Konva.Group} SubGroup - border group, containing wall and size input
     * @param {Konva.Group} shapeGroup - main shape group, containing everything.
     * @param {import("./helpers/LShapeHelper.js").LShapeSide} wall
     */
    removeWall(SubGroup = null, shapeGroup, wall) {
        if (!SubGroup) {
            SubGroup = shapeGroup.findOne(`.${wall}`);
        }
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
     * @param {import("./types/global.js").WallPresence} corners
     * @param {boolean} defaultValue
     * @returns {{ [key in import("./helpers/LShapeHelper.js").LShapeSide]: boolean}}
     */
    initializeCorners(corners, defaultValue) {
        if (!corners || typeof corners !== "object") {
            return {
                [LSH.SideA]: defaultValue,
                [LSH.SideB]: defaultValue,
                [LSH.SideC]: defaultValue,
                [LSH.SideD]: defaultValue,
            };
        }
        return corners;
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
        if (LSH.isHorizontal(backsplashGroupName)) {
            const wallSizeOffset =
                SubGroup.findOne(`.wall_${SubGroup.name()}`).height() +
                LSH.wallBacksplashGap;
            backsplash.height(30);
            backsplash.width(SubGroup.width());
            if (LSH.isFirstInHorizontalOrVertical(backsplashGroupName)) {
                attributes.y = SubGroup.height() - backsplash.height();
                attributes.y -= wallSizeOffset;
            } else {
                attributes.y += wallSizeOffset;
            }
        } else {
            const wallSizeOffset =
                SubGroup.findOne(`.wall_${SubGroup.name()}`).width() +
                LSH.wallBacksplashGap;
            backsplash.height(SubGroup.height());
            backsplash.width(30);
            if (!LSH.isFirstInHorizontalOrVertical(backsplashGroupName)) {
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
     * @param {import("./helpers/LShapeHelper.js").LShapeSide} subgroupName
     * @param {Konva.Group} shapeGroup
     */
    addCheckboxGroup(
        subgroupName,
        shapeGroup,
        defaultVal = false
    ) {
        /** @type {Konva.Group} */
        let subGroupNode = shapeGroup.findOne(`.${subgroupName}`)

        if ([LSH.SideB, LSH.SideC].includes(subgroupName)) {
            subGroupNode = shapeGroup.findOne(`.${LSH.SideB}`)
        } else if ([LSH.SideD, LSH.SideE].includes(subgroupName)) {
            subGroupNode = shapeGroup.findOne(`.${LSH.SideC}`)
        }

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
            // /** @type {Konva.Rect} */
            // const shapeObject = this.getShapeObject(shapeGroup);

            const roundedCorners = this.initializeCorners(
                shapeGroup.getAttr("roundedCorners"),
                false
            );
            roundedCorners[subgroupName] = isVisible;
            shapeGroup.setAttr("roundedCorners", roundedCorners);

            // shapeObject.cornerRadius([
            //     roundedCorners[LSH.SideA] ? 15 : 0,
            //     roundedCorners[LSH.SideB] ? 15 : 0,
            //     roundedCorners[LSH.SideC] ? 15 : 0,
            //     roundedCorners[LSH.SideD] ? 15 : 0,
            // ]);
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
        // this.removeWall(subGroupNode, shapeGroup,subgroupName);

        /**
         * While adding wall, wall edge corners, must not be rounded.
         * for ex: if we add Wall on edge "A" Then corner radius for
         * "A" and "B" must be disabled.
         */
        const groupMappings = {
            [LSH.SideA]: [LSH.SideA, LSH.SideD],
            [LSH.SideB]: [LSH.SideA, LSH.SideB],
            [LSH.SideC]: [LSH.SideB],
            [LSH.SideD]: [LSH.SideC],
            [LSH.SideE]: [LSH.SideD, LSH.SideC],
        };

        const groupsToRemove = groupMappings[subgroupName] || [];

        groupsToRemove.forEach((wall) => {
            this.removeWall(null, shapeGroup, wall);
        });

        this.updateEdgeGroupsPosition(shapeGroup);
        this.eventManager.dispatchShapeSelect(shapeGroup);
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
            // /** @type {Konva.Rect} */
            // const shapeObject = this.getShapeObject(shapeGroup);

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

            // shapeObject.cornerRadius([
            //     roundedCorners[SH.SideA] ? 15 : 0,
            //     roundedCorners[SH.SideB] ? 15 : 0,
            //     roundedCorners[SH.SideC] ? 15 : 0,
            //     roundedCorners[SH.SideD] ? 15 : 0,
            // ]);
            checkboxGroup.destroy();
        }
        this.eventManager.dispatchShapeSelect(shapeGroup);
    }
}
