import Konva from "konva";
import { rotateGroup } from "./Helper.js";
import RotateIcon from "@/assets/image/rotate.svg?raw";
import { UShapeIds, ShapeActions, ShapeTypes } from "./enum/ShapeManagerEnum.js";
import AttributeOverlayTemplate from "@/templates/AttributesOverlay/index.html?raw";
import AttributeShapeCutOutTemplate from "@/templates/AttributesOverlay/ShapeCutOut.html?raw";
import EventManager from "./EventManager.js";
import { UShapeHelper as USH } from "./helpers/UShapeHelper.js";

/**
 * @typedef {Partial<Pick<CSSStyleDeclaration, keyof CSSStyleDeclaration>>} CSSStyleDec
 */
export default class UShapeManager {
    /**
     * @param {Konva.Stage} stage
     * @param {Konva.Layer} layer
     * @param {EventManager} eventManager
     */
    constructor(stage, layer, eventManager) {
        this.demoOnly = Boolean(import.meta.env.VITE_BUILDING_FOR_DEMO === "true");
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
            /** @type {Konva.Group[]} */
            const groups = this.stage.find(`#${UShapeIds.UShapeGroup}`);
            groups.forEach((group) => {
                this.updateAttributesOverlayPosition(group);
                this.updateHoverActionOverlayPosition(group);
            });
        });
        this.stage.on("scaleChange xChange yChange", (ev) => {
            setTimeout(() => {
                /** @type {Konva.Group[]} */
                const groups = this.stage.find(`#${UShapeIds.UShapeGroup}`);
                groups.forEach((group) => {
                    this.updateAttributesOverlayPosition(group);
                    this.updateHoverActionOverlayPosition(group);
                });
            });
        });
    }

    /**
     *
     * @typedef {{materialName : string, productName: string}} AttributeOverlayMaterialName
     * @typedef {{ [key in import("./helpers/UShapeHelper.js").UShapeSide]: number}} AllSideLengthsType
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

        const stagePos = this.stage.position();
        const scale = this.stage.scaleX(); // Assuming uniform scaling (scaleX = scaleY)

        // Calculate the center position considering the stage's position and scale
        const posX = (this.stage.width() / 3 - stagePos.x) / scale;
        const posY = (this.stage.height() / 3 - stagePos.y) / scale;

        /** @type {Konva.Group} */
        let shapeGroup;

        /** @type {Konva.Line} */
        let shapeObject;

        if (onlyPlaceholder) {
            const shapeInitialCord = this.getShapePointsCoordinates();

            /** @type {AllSideLengthsType} */
            const sidesLength = USH.getSideLength(false, shapeInitialCord);
            sidesLength.a = (shapeSize && shapeSize[USH.SideA]) ?? sidesLength.a / USH.SizeDiff;
            sidesLength.b = (shapeSize && shapeSize[USH.SideB]) ?? sidesLength.b / USH.SizeDiff;
            sidesLength.c = (shapeSize && shapeSize[USH.SideC]) ?? sidesLength.c / USH.SizeDiff;
            sidesLength.d = (shapeSize && shapeSize[USH.SideD]) ?? sidesLength.d / USH.SizeDiff;
            sidesLength.e = (shapeSize && shapeSize[USH.SideE]) ?? sidesLength.e / USH.SizeDiff;
            sidesLength.f = (shapeSize && shapeSize[USH.SideF]) ?? sidesLength.f / USH.SizeDiff;
            sidesLength.i1 = (shapeSize && shapeSize[USH.SideI1]) ?? 90;
            sidesLength.i2 = (shapeSize && shapeSize[USH.SideI2]) ?? 90;

            shapeGroup = new Konva.Group({
                x: posX,
                y: posY,
                draggable: this.stage.getAttr("shapeDraggable") === true,
                id: UShapeIds.UShapeGroup,
                materialId: materialId,
                materialImage: materialImage,
                shapeSize: sidesLength,
                shapeType: ShapeTypes.UShape,
                canvasShapeId: null,
                isPlaced: false,
                prevShapeId: prevShapeId,
                materialName: overlayMaterialProductName.materialName,
                productName: overlayMaterialProductName.productName,
            });
            shapeGroup.setAttr("canvasShapeId", shapeGroup._id);

            // Create the L-shape using a line polygon
            /** @type {Konva.Line} */
            shapeObject = new Konva.Line({
                id: UShapeIds.UShapePlaceholderObject,
                points: this.getShapePointsCoordinates(undefined, undefined, sidesLength),
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

                const attributeOverlay = this.getShapeGroupAttributeOverlay(shapeGroup);
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

                if (!shapeGroup.findOne(`#${UShapeIds.UShapePlaceholderObject}`)) {
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

                if (!Boolean(e.evt?.relatedTarget && elm?.closest("#attributes-overlay-group"))) {
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
                        UShapeIds.UShapeActionOverlayId,
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
            if (this.demoOnly) {
                shapeGroup.on("click", () => {
                    this.eventManager.dispatchShapeSelect(shapeGroup);
                });
            }
            shapeGroup.setAttr("show_action_overlay", false);

            // Place image element onto the layer with actual material image
            /** @type {Konva.Rect} */
            const placeHolderElm = shapeGroup.findOne(`#${UShapeIds.UShapePlaceholderObject}`);
            placeHolderElm.fill("");
            placeHolderElm.opacity(1);

            const imageObj = document.createElement("img");

            imageObj.src = materialImage;
            imageObj.onload = () => {
                // wait for image to be loaded, otherwise
                // shape will be filled with black color
                placeHolderElm.fillPatternImage(imageObj);
            };
            placeHolderElm.id(UShapeIds.UShapeObject);
            this.actionOverlayNode.style.display = "none";
            this.createAttributesOverlay(shapeGroup);
            this.eventManager.dispatchShapeSelect(shapeGroup);
            shapeGroup.setAttr("isPlaced", true);
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
        Object.assign(contextMenuItem_DeleteAction.style, contextMenuItemStyles);
        contextMenuItem_DeleteAction.id = "image-context-item";
        contextMenuItem_DeleteAction.innerText = "Delete";
        contextMenuItem_DeleteAction.addEventListener("click", () => {
            if (this.currentShape) {
                /** @type {Konva.Group} */
                const shapeGroup = this.currentShape.findAncestor(`#${UShapeIds.UShapeGroup}`);
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
                    String(UShapeIds.UShapeObject),
                    String(UShapeIds.UShapePlaceholderObject),
                ].includes(e.target.id())
            ) {
                return;
            }

            this.currentShape = e.target;
            // context show menu
            this.contextMenuNode.style.display = "initial";

            this.contextMenuNode.style.top = this.stage.getPointerPosition().y + 4 + "px";
            this.contextMenuNode.style.left = this.stage.getPointerPosition().x + 4 + "px";
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
        sidesLength = { a: 150, b: 100, c: 50, d: 40, e: 50, f: 90 }
    ) {
        const shapeSidesLength = JSON.parse(JSON.stringify(sidesLength));
        shapeSidesLength.a *= USH.SizeDiff;
        shapeSidesLength.b *= USH.SizeDiff;
        shapeSidesLength.c *= USH.SizeDiff;
        shapeSidesLength.d *= USH.SizeDiff;
        shapeSidesLength.e *= USH.SizeDiff;
        shapeSidesLength.f *= USH.SizeDiff;

        // Validate the dimensions
        if (
            shapeSidesLength.a <= 0 ||
            shapeSidesLength.b <= 0 ||
            shapeSidesLength.c <= 0 ||
            shapeSidesLength.d <= 0 ||
            shapeSidesLength.e <= 0 ||
            shapeSidesLength.f <= 0
        ) {
            throw new Error("All dimensions must be positive numbers.");
        }

        // prettier-ignore
        return [
         /* x1, y1 */
            x, y,
         /* x2, y2 */
            x + shapeSidesLength.a, y,
         /* x3, y3 */
            x + shapeSidesLength.a, y + shapeSidesLength.b,
         /* x4, y4 */
            (x + shapeSidesLength.a) - shapeSidesLength.c, y + shapeSidesLength.b,
         /* x5, y5 */
            (x + shapeSidesLength.a) - shapeSidesLength.c, (y + shapeSidesLength.f) - shapeSidesLength.d,
         /* x6, y6 */
            x + shapeSidesLength.e, (y + shapeSidesLength.f) - shapeSidesLength.d,
         /* x7, y7 */
            x + shapeSidesLength.e, y + shapeSidesLength.f,
         /* x8, y8 */
            x, y + shapeSidesLength.f,
         /* x9, y9 */
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
        this.actionOverlayNode.id = UShapeIds.UShapeActionOverlayId;

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
        actionOverlayBtnNodePlace.setAttribute("data-action", ShapeActions.Place);
        this.actionOverlayNode.append(actionOverlayBtnNodePlace);

        const actionOverlayBtnNodeRotate = document.createElement("button");
        Object.assign(actionOverlayBtnNodeRotate.style, actionOverlayBtnStyle);
        actionOverlayBtnNodeRotate.id = "action-overlay-btn";

        const rotateIcon = String(RotateIcon).replace(
            "<svg ",
            '<svg style="pointer-events: none;" '
        );
        actionOverlayBtnNodeRotate.innerHTML = `${rotateIcon} Rotate`;
        actionOverlayBtnNodeRotate.setAttribute("data-action", ShapeActions.Rotate);
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
                let materialImage = this.currentHoverNode.getAttr("materialImage");
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
        const shapeNode = this.getShapeObject(shapeGroup ?? this.currentHoverNode);
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
                top: boxRect.y + shapeNode.height() - this.actionOverlayNode.clientHeight - 30,
            };
        } else if (rotation > 180) {
            overlayNewPosition = {
                left: boxRect.x + 30,
                top: boxRect.y + shapeNode.width() - this.actionOverlayNode.clientHeight - 30,
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
            shapeGroup.findOne(`#${UShapeIds.UShapePlaceholderObject}`) ??
            shapeGroup.findOne(`#${UShapeIds.UShapeObject}`)
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
     * @param {boolean} updatePositionOnly
     */
    createEdgeGroups(shapeGroup, updatePositionOnly = false) {
        const groupShapeObject = this.getShapeObject(shapeGroup);
        const subgroupNames = USH.sides;
        // TODO: for demo only. also remove index param from subgroupNames loop callback params
        // const subgroupColor = ["yellow", "red", "green", "blue", "magenta", "#e479f2"];

        const points = groupShapeObject.points();
        subgroupNames.forEach((subgroupName, index) => {
            const isHorizontal = USH.isHorizontal(subgroupName);
            const attributes = {
                height: 0,
                width: 0,
                x: 0,
                y: 0,
            };
            if (isHorizontal) {
                attributes.height = 100;
                attributes.width = Number(USH.getSideLength(subgroupName, points));
            } else {
                attributes.height = Number(USH.getSideLength(subgroupName, points));
                attributes.width = 100;
            }

            if (subgroupName === USH.SideD) {
                attributes.width = Number(USH.getPointDistance(4, 5, points));
            }

            if (updatePositionOnly === true) {
                /** @type {Konva.Group} */
                const subGroup = shapeGroup.findOne(`.${subgroupName}`);
                subGroup?.setAttrs({
                    height: attributes.height,
                    width: attributes.width,
                });

                // if (this.demoOnly) {
                //     /** @type {Konva.Rect} */
                //     const tempRect = subGroup.findOne(".tempBG");
                //     tempRect?.setAttrs({
                //         width: attributes.width,
                //         height: attributes.height,
                //     });
                // }
            } else {
                /** @type {Konva.Group} */
                let subGroup;
                /** @type {Konva.Group} */
                const innerSubGroup = shapeGroup.findOne(`.${USH.SideD}`);
                if (
                    !USH.isInteriorAngle(subgroupName) ||
                    (USH.isInteriorAngle(subgroupName) && !innerSubGroup)
                ) {
                    subGroup = new Konva.Group({
                        name:
                            USH.isInteriorAngle(subgroupName) || subgroupName === USH.SideD
                                ? USH.SideD
                                : subgroupName,
                        height: attributes.height,
                        width: attributes.width,
                    });
                    shapeGroup.add(subGroup);
                } else {
                    subGroup = innerSubGroup;
                }

                const sideLabel = new Konva.Text({
                    id: `text_node_${subgroupName}`,
                    text: subgroupName.toUpperCase(),
                    fontSize: 16,
                    stroke: USH.isInteriorAngle(subgroupName) ? "#f00" : "#000",
                    strokeWidth: USH.isInteriorAngle(subgroupName) ? 0.7 : 1.2,
                    fontVariant: "",
                    fontFamily: "monospace",
                });
                subGroup.add(sideLabel);

                // if (this.demoOnly && !USH.isInteriorAngle(subgroupName)) {
                //     // TODO: For development purposes only
                //     const tempRect = new Konva.Rect({
                //         name: "tempBG",
                //         fill: subgroupColor[index],
                //         opacity: 0.5,
                //         width: attributes.width,
                //         height: attributes.height,
                //         stroke: "black",
                //     });
                //     subGroup.add(tempRect);
                // }
            }
        });

        this.updateEdgeGroupsPosition(shapeGroup, !updatePositionOnly);
    }

    /**
     *
     * @param {Konva.Group} shapeGroup
     * @param {boolean} createInputs
     */
    updateEdgeGroupsPosition(shapeGroup, createInputs = false, updateLabelPositionOnly = false) {
        const groupShapeObject = this.getShapeObject(shapeGroup);
        const subgroupNames = USH.sides;
        const points = groupShapeObject.points();

        const spacingOffset = 0;
        subgroupNames.forEach((subgroupName, index) => {
            /** @type {Konva.Group} */
            let subGroup = shapeGroup.findOne(`.${subgroupName}`);
            if (USH.isInteriorAngle(subgroupName)) {
                /** @type {Konva.Group} */
                subGroup = shapeGroup.findOne(`.${USH.SideD}`);
            }
            const sideLabel = shapeGroup.findOne(`#text_node_${subgroupName}`);
            const isHorizontal = USH.isHorizontal(subgroupName);
            const sidePosition = USH.getSidePoints(subgroupName, points);

            const backsplash = shapeGroup.findOne(`.backsplash_${subgroupName}`);
            let backsplashOffset = 0;

            const attributes = {
                x: subGroup.x(),
                y: subGroup.y(),
            };

            if (backsplash) {
                backsplashOffset =
                    backsplash.getAttr(isHorizontal ? "height" : "width") + USH.wallBacksplashGap;
            }
            if (subgroupName === USH.SideA) {
                const sidePositionS = sidePosition[0];
                attributes.x = sidePositionS.x;
                attributes.y = sidePositionS.y - subGroup.height() - spacingOffset;

                sideLabel.x(subGroup.width() - subGroup.width() * 0.8);
                let y = subGroup.height() - 30 - backsplashOffset;
                sideLabel.y(y);
            }

            if (subgroupName === USH.SideC || subgroupName === USH.SideE) {
                const sidePositionE = sidePosition[1];
                attributes.x = sidePositionE.x;
                attributes.y = sidePositionE.y + spacingOffset;

                sideLabel.x(subGroup.width() - subGroup.width() * 0.8);
                sideLabel.y(15 + backsplashOffset);
            }

            if (subgroupName === USH.SideB) {
                const sidePositionS = sidePosition[0];
                attributes.x = sidePositionS.x + spacingOffset;
                attributes.y = sidePositionS.y;

                const x = 15 + backsplashOffset;
                sideLabel.x(x);
                sideLabel.y(subGroup.height() - subGroup.height() * 0.8 + 10);
            }
            if (subgroupName === USH.SideD) {
                const sidePositionD = sidePosition[0];
                attributes.x = sidePositionD.x + spacingOffset;
                attributes.y = sidePositionD.y;

                const x = subGroup.width() - subGroup.width() * 0.9;
                sideLabel.x(x);
                sideLabel.y(50);

                const sideLabelI1 = shapeGroup.findOne(`#text_node_${USH.SideI1}`);
                const i1x = subGroup.width() - sideLabelI1.width() - 10;
                sideLabelI1.x(i1x);
                sideLabelI1.y(20);

                const sideLabelI2 = shapeGroup.findOne(`#text_node_${USH.SideI2}`);
                const i2x = 10;
                sideLabelI2.x(i2x);
                sideLabelI2.y(10);
            }
            if (subgroupName === USH.SideF) {
                const sidePositionS = sidePosition[1];
                attributes.x = sidePositionS.x - subGroup.width() - spacingOffset;
                attributes.y = sidePositionS.y;

                const x = subGroup.width() - subGroup.width() * 0.5 - backsplashOffset;
                sideLabel.x(x);
                sideLabel.y(30);
            }

            createInputs && this.createLengthInput(subGroup, subgroupName);

            if (updateLabelPositionOnly === false) {
                subGroup.position({
                    x: attributes.x,
                    y: attributes.y,
                });
            }
            this.updateInputsPosition(subGroup);
        });

        const corners = USH.corners;
        corners.forEach((subgroupName, index) => {
            /** @type {Konva.Group} */
            const subGroup = shapeGroup.findOne(`.${subgroupName}`);
            const backsplash = shapeGroup.findOne(`.backsplash_${subgroupName}`);

            /** @type {Konva.Group} */
            const checkboxGroup = shapeGroup.findOne(`.checkbox_node_${subgroupName}`);
            if (!checkboxGroup) {
                return;
            }
            const checkboxRect = checkboxGroup.findOne("Rect");

            const position = {
                x: 0,
                y: 0,
            };

            if (USH.SideA === subgroupName) {
                position.x = 0;
                position.y = subGroup.height() - (checkboxRect.height() + 10);
            } else if (USH.SideB === subgroupName) {
                position.x = 15;
                position.y = 0;
            } else if (USH.SideC === subgroupName) {
                /** @type {Konva.Group} */
                const subGroup = shapeGroup.findOne(`.${USH.SideC}`);
                position.x = subGroup.width() - checkboxRect.width();
                position.y = 10;
            } else if (USH.SideD === subgroupName) {
                position.x = -(checkboxRect.width() + 10);
                position.y = -checkboxRect.height();
            } else if (USH.SideE === subgroupName) {
                /** @type {Konva.Group} */
                const subGroup = shapeGroup.findOne(`.${USH.SideE}`);
                position.x = subGroup.width() - checkboxRect.width();
                position.y = 10;
            } else if (USH.SideF === subgroupName) {
                /** @type {Konva.Group} */
                const subGroup = shapeGroup.findOne(`.${USH.SideF}`);
                position.x = subGroup.width() - checkboxRect.width() - 10;
                position.y = subGroup.height() - checkboxRect.height();
            }

            checkboxGroup.x(position.x);
            checkboxGroup.y(position.y);
        });
    }

    /**
     * Create Text and Input box for the border length adjustments
     * @param {Konva.Group} subGroup - edge sub group
     * @param {import("./helpers/UShapeHelper.js").UShapeSide} side
     */
    createLengthInput(subGroup, side) {
        /** @type {Konva.Group} */
        const shapeGroup = subGroup.findAncestor(`#${UShapeIds.UShapeGroup}`);
        const shapeObject = this.getShapeObject(shapeGroup);
        const sideLength = USH.getSideLength(subGroup.name(), shapeObject.points());

        /** @type {string | number} */
        let value = sideLength / USH.SizeDiff;
        if (USH.isInteriorAngle(side)) {
            const shapeSize = shapeGroup.getAttr("shapeSize");
            let angle = undefined
            if (shapeSize && Object.keys(shapeSize).includes(side)) {
                angle = shapeSize[side];
            }
            value = USH.getInteriorAngleText(angle);
        }

        const subgroupName = USH.isInteriorAngle(side) ? side : subGroup.name();
        const lengthInput = new Konva.Text({
            id: UShapeIds.UShapeTextLayers[subgroupName],
            text: String(value),
            fontSize: 20,
            fill: USH.isInteriorAngle(side) ? '#970606' : "#000",
            // width: 80,
            wall: subGroup.name(),
        });
        subGroup.add(lengthInput);

        this.updateInputsPosition(subGroup, false, true);

        if (USH.isInteriorAngle(side)) {
            // We don't need click event listeners
            // for interior angle.
            return;
        }
        // create event listener to show text box to change width
        lengthInput.on("click", (e) => {
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

            inputBox.value = lengthInput.text();
            Object.assign(inputBox.style, inputBoxStyle);
            inputBox.focus();
            let inputRemoved = false;
            inputBox.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    inputRemoved = true;
                    this.handleInputValueChange(subGroup, lengthInput, inputBox);
                }
            });
            inputBox.addEventListener("blur", () => {
                if (inputRemoved) return;
                this.handleInputValueChange(subGroup, lengthInput, inputBox);
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
        if (subGroup.id() === UShapeIds.UShapeGroup) {
            shapeGroup = subGroup;
        } else {
            /** @type {Konva.Group} */
            // @ts-ignore
            shapeGroup = subGroup.findAncestor(`#${UShapeIds.UShapeGroup}`);
        }

        // const points = this.getShapeObject(shapeGroup).points();

        if (heightOnly && [USH.SideB, USH.SideD, USH.SideF].includes(subGroup.name())) {
            const heightInput = shapeGroup.findOne(
                `#${UShapeIds.UShapeTextLayers[subGroup.name()]}`
            );

            let position = {
                x: 0,
                y: 0,
            };
            const textNode = shapeGroup.findOne(`#text_node_${heightInput?.getAttr("wall")}`);
            if (textNode) {
                position = { x: textNode.x(), y: textNode.y() };
                position.x = position.x - 3;
                position.y = position.y + 35;
            }
            heightInput?.position(position);

            if (subGroup.name() === USH.SideD) {
                // This is interior subgroup so also update position of interior angles also.
                const i1Input = shapeGroup.findOne(`#${UShapeIds.UShapeTextLayers[USH.SideI1]}`);
                let positionI1 = {
                    x: 0,
                    y: 0,
                };
                const textNodeI1 = shapeGroup.findOne(`#text_node_${USH.SideI1}`);
                if (textNodeI1) {
                    positionI1 = { x: textNodeI1.x(), y: textNodeI1.y() };
                    positionI1.x = positionI1.x - i1Input?.width() / 1.75;
                    positionI1.y = positionI1.y + 30;
                }
                i1Input?.position(positionI1);

                // For Side I2
                const i2Input = shapeGroup.findOne(`#${UShapeIds.UShapeTextLayers[USH.SideI2]}`);

                let positionI2 = {
                    x: 0,
                    y: 0,
                };
                const textNodeI2 = shapeGroup.findOne(`#text_node_${USH.SideI2}`);
                if (textNodeI2) {
                    positionI2 = { x: textNodeI2.x(), y: textNodeI2.y() };
                    positionI2.x = positionI2.x + textNodeI2?.width() + 5;
                    positionI2.y = positionI2.y;
                }
                i2Input?.position(positionI2);
            }
        }

        if (widthOnly && [USH.SideA, USH.SideC, USH.SideE].includes(subGroup.name())) {
            const widthInput = shapeGroup.findOne(
                `#${UShapeIds.UShapeTextLayers[subGroup.name()]}`
            );
            if (!widthInput) {
                return;
            }

            // Update both width input positions
            let position = {
                x: 0,
                y: 0,
            };
            const textNode = shapeGroup.findOne(`#text_node_${widthInput.getAttr("wall")}`);
            if (textNode) {
                position = { x: textNode.x(), y: textNode.y() };
                position.x = position.x + 50;
                position.y = position.y - 3;
            }

            widthInput.position(position);
        }
    }

    /**
     *
     * @param {Konva.Group} subGroup - edge group
     * @param {Konva.Text} labelNode
     * @param {HTMLInputElement | string} inputBox
     */
    handleInputValueChange = (subGroup, labelNode = null, inputBox = null) => {
        const attr = USH.isHorizontal(subGroup.name()) ? "height" : "width";
        /** @type {Konva.Group} */
        // @ts-ignore
        let shapeGroup = subGroup.findAncestor(`#${UShapeIds.UShapeGroup}`);
        const squarePlaceHolderObject = this.getShapeObject(shapeGroup);

        let inputBoxValue = "";
        if (["string", "number"].includes(typeof inputBox)) {
            inputBoxValue = String(inputBox);
        } else {
            inputBoxValue = inputBox?.value;
            document.body.removeChild(inputBox);
        }

        this.setDragging(shapeGroup, true);
        const points = squarePlaceHolderObject.points();
        const position = USH.getSidePoints(USH.SideA, points)[0];

        const sideLengths = {
            a: Number(USH.getSideLength(USH.SideA, points)) / USH.SizeDiff,
            b: Number(USH.getSideLength(USH.SideB, points)) / USH.SizeDiff,
            c: Number(USH.getSideLength(USH.SideC, points)) / USH.SizeDiff,
            d: Number(USH.getSideLength(USH.SideD, points)) / USH.SizeDiff,
            e: Number(USH.getSideLength(USH.SideE, points)) / USH.SizeDiff,
            f: Number(USH.getSideLength(USH.SideF, points)) / USH.SizeDiff,
            [subGroup.name()]: Number(inputBoxValue),
        };

        // Validation to maintain U shape proper form
        if (
            !(
                sideLengths.a > sideLengths.c + sideLengths.e &&
                sideLengths.b > sideLengths.f - sideLengths.d &&
                sideLengths.c < sideLengths.a - sideLengths.e &&
                sideLengths.d > sideLengths.f - sideLengths.b &&
                sideLengths.e < sideLengths.a - sideLengths.c &&
                sideLengths.f > sideLengths.d
            )
        ) {
            return;
        }

        // Update label text with new value
        labelNode.text(inputBoxValue);

        const newCoordinates = this.getShapePointsCoordinates(position.x, position.y, sideLengths);
        squarePlaceHolderObject.points(newCoordinates);

        this.createEdgeGroups(shapeGroup, true);

        // Update wall and backsplash size also.
        const wall = subGroup.findOne((node) => {
            return String(node.id()).startsWith("wall_");
        });
        if (wall) {
            wall.setAttr(attr, Number(inputBoxValue) * USH.SizeDiff);
        }
        const backsplash = subGroup.findOne((node) => {
            return String(node.id()).startsWith("backsplash_");
        });
        if (backsplash) {
            backsplash.setAttr(attr, Number(inputBoxValue) * USH.SizeDiff);
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
        if (element.id() !== UShapeIds.UShapeGroup) {
            element = element.findAncestor(`#${UShapeIds.UShapeGroup}`);
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
            attributeOverlay.querySelector("#material-name").innerHTML = materialName;
        }

        const productName = shapeGroup.getAttr("productName");
        if (productName) {
            attributeOverlay.querySelector("#product-name").innerHTML = productName;
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
        if (this.demoOnly) {
            Array.from(Array(4)).forEach(() =>
                this.appendShapeCutOut(shapeGroup, undefined, undefined, attributeOverlay)
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
            const index = attributesItems.findIndex((item) => item.id === propertyId);
            if (index !== -1) {
                console.warn("Attribute already exists.");
                return;
            }
        }

        const overlay = attributeOverlay ?? this.getShapeGroupAttributeOverlay(shapeGroup);
        const container = overlay.querySelector("#shape-cutout-group");
        /** @type {HTMLElement} */
        const domObject = new DOMParser().parseFromString(AttributeShapeCutOutTemplate, "text/html")
            .body.firstChild;
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
    removeShapeCutOut(shapeGroup, propertyId = null) {
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
            const index = attributesItems.findIndex((item) => item.id === propertyId);
            if (index !== -1) {
                attributesItems.splice(index, 1);
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
        if (ShapeObject.id() !== UShapeIds.UShapeObject) return;

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
                top: boxRect.y + ShapeObject.height() - attributeOverlay.clientHeight - 30,
            };
        } else if (rotation > 180) {
            overlayNewPosition = {
                left: boxRect.x + 30,
                top: boxRect.y + ShapeObject.width() - attributeOverlay.clientHeight - 30,
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
        return this.stage.container().querySelector(`#attributes-overlay-${shapeGroup._id}`);
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
        if (USH.isHorizontal(wallGroupName)) {
            wall.height(5);
            wall.width(SubGroup.width());
            if (USH.isFirstInHorizontalOrVertical(wallGroupName)) {
                attributes.y = SubGroup.height() - wall.height();
            }
        } else {
            wall.height(SubGroup.height());
            wall.width(5);
            if (!USH.isFirstInHorizontalOrVertical(wallGroupName)) {
                attributes.x = SubGroup.width() - wall.width();
            }
        }

        wall.position(attributes);

        let againstTheWall = this.initializeCorners(shapeGroup.getAttr("againstTheWall"), false);
        againstTheWall[SubGroup.name()] = true;
        shapeGroup.setAttr("againstTheWall", againstTheWall);

        /**
         * While adding wall, wall edge corners, must not be rounded.
         * for ex: if we add Wall on edge "A" Then corner radius for
         * "A" and "B" must be disabled.
         */
        const groupMappings = {
            [USH.SideA]: [USH.SideA, USH.SideB],
            [USH.SideB]: [USH.SideB, USH.SideC],
            [USH.SideC]: [USH.SideC, USH.SideD],
            [USH.SideE]: [USH.SideE, USH.SideF],
            [USH.SideF]: [USH.SideA, USH.SideF],
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
     * @param {import("./helpers/UShapeHelper.js").UShapeSide} wall
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
     * @returns {{ [key in import("./helpers/UShapeHelper.js").UShapeSide]: boolean}}
     */
    initializeCorners(corners, defaultValue) {
        if (!corners || typeof corners !== "object") {
            return {
                [USH.SideA]: defaultValue,
                [USH.SideB]: defaultValue,
                [USH.SideC]: defaultValue,
                [USH.SideD]: defaultValue,
                [USH.SideE]: defaultValue,
                [USH.SideF]: defaultValue,
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
        if (USH.isHorizontal(backsplashGroupName)) {
            const wallSizeOffset =
                SubGroup.findOne(`.wall_${SubGroup.name()}`).height() + USH.wallBacksplashGap;
            backsplash.height(30);
            backsplash.width(SubGroup.width());
            if (USH.isFirstInHorizontalOrVertical(backsplashGroupName)) {
                attributes.y = SubGroup.height() - backsplash.height();
                attributes.y -= wallSizeOffset;
            } else {
                attributes.y += wallSizeOffset;
            }
        } else {
            const wallSizeOffset =
                SubGroup.findOne(`.wall_${SubGroup.name()}`).width() + USH.wallBacksplashGap;
            backsplash.height(SubGroup.height());
            backsplash.width(30);
            if (!USH.isFirstInHorizontalOrVertical(backsplashGroupName)) {
                attributes.x = SubGroup.width() - backsplash.width() - wallSizeOffset;
            } else {
                attributes.x = wallSizeOffset;
            }
        }

        backsplash.position(attributes);

        const backsplashes = this.initializeCorners(shapeGroup.getAttr("backsplashes"), false);
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
     * @param {import("./helpers/UShapeHelper.js").UShapeSide} subgroupName
     * @param {Konva.Group} shapeGroup
     */
    addCheckboxGroup(subgroupName, shapeGroup, defaultVal = false) {
        /** @type {Konva.Group} */
        let subGroupNode = shapeGroup.findOne(`.${subgroupName}`);

        if ([USH.SideC, USH.SideD].includes(subgroupName)) {
            subGroupNode = shapeGroup.findOne(`.${USH.SideC}`);
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

            const roundedCorners = this.initializeCorners(
                shapeGroup.getAttr("roundedCorners"),
                false
            );
            roundedCorners[subgroupName] = isVisible;
            shapeGroup.setAttr("roundedCorners", roundedCorners);
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
            [USH.SideA]: [USH.SideA, USH.SideF],
            [USH.SideB]: [USH.SideA, USH.SideB],
            [USH.SideC]: [USH.SideB, USH.SideC],
            [USH.SideD]: [USH.SideC],
            [USH.SideE]: [USH.SideE],
            [USH.SideF]: [USH.SideE, USH.SideF],
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
        const checkboxGroup = shapeGroup.findOne(`#checkbox_node_${subgroupName}`);
        if (checkboxGroup) {
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
            checkboxGroup.destroy();
        }
        this.eventManager.dispatchShapeSelect(shapeGroup);
    }
}
