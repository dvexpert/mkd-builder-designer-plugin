import Konva from "konva";
import { rotateGroup } from "./Helper.js";
import RotateIcon from "@/assets/image/rotate.svg?raw";
import {
    LShapeIds,
    ShapeActions,
    // SquareShapeIds,
} from "./enum/ShapeManagerEnum.js";
// import AttributeOverlayTemplate from "@/templates/AttributesOverlay/index.html?raw";
// import AttributeShapeCutOutTemplate from "@/templates/AttributesOverlay/ShapeCutOut.html?raw";
import EventManager from "./EventManager.js";
// import { SquareHelper as SH } from "./helpers/SquareHelper.js";

const SizeDiff = 3;

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
    }

    draw(materialImage = "", onlyPlaceholder = true, materialId = "") {
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

        /** @type {Konva.Line} */
        let shapeObject;

        if (onlyPlaceholder) {
            shapeGroup = new Konva.Group({
                x: 100,
                y: 10,
                draggable: true, // ! TODO: this.stage.getAttr("shapeDraggable") === true,
                id: LShapeIds.LShapeGroup,
                materialId: materialId,
                materialImage: materialImage,
                // shapeSize: {
                //     height: 50,
                //     width: 150,
                // },
            });

            // Create the L-shape using a line polygon
            shapeObject = new Konva.Line({
                id: LShapeIds.LShapePlaceholderObject,
                points: this.getShapePointsCoordinates(),
                closed: true, // Close the shape to form an L
                fill: "red",
                opacity: 0.3,
            });

            shapeGroup.add(shapeObject);
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
                const hoverNode = e.target;
                if (e.type === "dragmove") {
                    // this.updateAttributesOverlayPosition(shapeGroup);
                    const targetShape = this.getShapeObject(hoverNode);
                    const targetRect = targetShape.getClientRect();
                    this.layer.find("Group").forEach(
                        /** @param {Konva.Group} group  */
                        (group) => {
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
                        }
                    );
                }

                // const attributeOverlay =
                //     this.getShapeGroupAttributeOverlay(shapeGroup);
                // if (e.type === "mouseenter" && attributeOverlay) {
                //     /**
                //      * on shape group hover active the current group attribute overlay
                //      * and in-active other groups attribute overlay
                //      */
                //     const overlayGroup = document.getElementById(
                //         "attributes-overlay-group"
                //     )?.childNodes;
                //     overlayGroup.forEach((child) =>
                //         child.classList.remove("active-attributes-overlay")
                //     );

                //     attributeOverlay.classList.add("active-attributes-overlay");
                // }
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
            shapeGroup = this.currentHoverNode;
            // TODO: dispatch shape select event here.

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
        }
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
        // this.getShapeGroupAttributeOverlay(shapeGroup)?.remove();
        shapeGroup?.destroy();

        // ! TODO: dispatch shape deleted event for external side effects.
        // this.eventManager.dispatchShapeDelete(shapeGroup._id);
    }

    getShapePointsCoordinates(a = 150, b = 50, c = 50, d = 100) {
        let x = 100;
        let y = 100;

        a *= SizeDiff;
        b *= SizeDiff;
        c *= SizeDiff;
        d *= SizeDiff;

        // Validate the dimensions
        if (a <= 0 || b <= 0 || c <= 0 || d <= 0) {
            throw new Error("All dimensions must be positive numbers.");
        }

        // prettier-ignore
        return [
            x, y,
            x + a, y,
            x + a, y + b,
            x + c, y + b,
            x + c, y + d,
            x, y + d,
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
        // this.updateAttributesOverlayPosition(shapeGroup);
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
}
