import Konva from "konva";
import {
    CircleShapeIds,
    ShapeActions,
    ShapeTypes,
} from "./enum/ShapeManagerEnum.js";
import AttributeOverlayTemplate from "@/templates/AttributesOverlay/index.html?raw";
import AttributeShapeCutOutTemplate from "@/templates/AttributesOverlay/ShapeCutOut.html?raw";
import EventManager from "./EventManager.js";

const SizeDiff = 3;

/**
 * @typedef {Partial<Pick<CSSStyleDeclaration, keyof CSSStyleDeclaration>>} CSSStyleDec
 */
export default class CircleShapeManager {
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
        // this.createContextMenu();
        this.createActionOverlay();

        this.stage.on("dragmove", () => {
            const groups = this.stage.find(`#${CircleShapeIds.CircleShapeGroup}`);
            groups.forEach((group) => {
                // this.updateAttributesOverlayPosition(group)
                this.updateHoverActionOverlayPosition(group)
            });
        });
        this.stage.on("scaleChange xChange yChange", (ev) => {
            setTimeout(() => {
                const groups = this.stage.find(`#${CircleShapeIds.CircleShapeGroup}`);
                groups.forEach((group) =>{
                    // this.updateAttributesOverlayPosition(group)
                    this.updateHoverActionOverlayPosition(group)
                });
            });
        });
    }

    /**
     * To get Placeholder or placed shape object
     *
     * @param {Konva.Group} shapeGroup
     */
    getShapeObject(shapeGroup) {
        return (
            shapeGroup.findOne(`#${CircleShapeIds.CircleShapePlaceholderObject}`) ??
            shapeGroup.findOne(`#${CircleShapeIds.CircleShapeObject}`)
        );
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

        // append menu to the canvas container in dom
        this.stage.container().append(this.actionOverlayNode);

        this.actionOverlayNode.addEventListener("mouseleave", () => {
            this.currentHoverNode.fire("mouseleave");
        });
        this.actionOverlayNode.addEventListener("click", (e) => {
            const targetElm = e.target;
            if (targetElm.id !== "action-overlay-btn") return;

            const action = targetElm.getAttribute("data-action");
            if (action === ShapeActions.Place) {
                let materialImage = this.currentHoverNode
                    .findOne(`#${CircleShapeIds.CircleShapePlaceholderObject}`)
                    .getAttr("materialImage");
                this.draw(materialImage, false);
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
    draw(
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
            const radius = shapeSize?.radius ? Number(shapeSize?.radius) : 50;
            shapeGroup = new Konva.Group({
                x: posX,
                y: posY,
                draggable: this.stage.getAttr("shapeDraggable") === true,
                id: CircleShapeIds.CircleShapeGroup,
                materialId: materialId,
                shapeSize: {
                    radius: radius,
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
            const circlePlaceHolderObject = new Konva.Circle({
                radius: radius * SizeDiff,
                id: CircleShapeIds.CircleShapePlaceholderObject,
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
                // if (e.type === "dragmove") {
                //     this.updateAttributesOverlayPosition(shapeGroup);
                //     const targetShape = this.getShapeObject(hoverNode);
                //     const targetRect = targetShape.getClientRect();
                //     this.layer.find("Group").forEach((group) => {
                //         // do not check intersection with itself
                //         if (
                //             group === hoverNode ||
                //             group.id() !== CircleShapeIds.CircleShapeGroup
                //         ) {
                //             group.opacity(1);
                //             return;
                //         }
                //         const shape = this.getShapeObject(group);
                //         if (shape) {
                //             const haveIntersection = this.haveIntersection(
                //                 shape.getClientRect(),
                //                 targetRect
                //             );
                //             group.opacity(haveIntersection ? 0.5 : 1);
                //         }
                //     });
                // }

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
                    !shapeGroup.findOne(
                        `#${CircleShapeIds.CircleShapePlaceholderObject}`
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

            shapeGroup.add(circlePlaceHolderObject);

            this.layer.add(shapeGroup);
        } else {
            shapeGroup = placeholderGroup ?? this.currentHoverNode;
            if (import.meta.env.VITE_BUILDING_FOR_DEMO === "true") {
                shapeGroup.on("click", () => {
                    this.eventManager.dispatchShapeSelect(shapeGroup);
                });
            }

            // Place image element onto the layer with actual material image
            /** @type {Konva.Circle} */
            const placeHolderElm = shapeGroup.findOne(
                `#${CircleShapeIds.CircleShapePlaceholderObject}`
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
            placeHolderElm.id(CircleShapeIds.CircleShapeObject);
            this.actionOverlayNode.style.display = "none";
            // this.createAttributesOverlay(shapeGroup);
            this.eventManager.dispatchShapeSelect(shapeGroup);
            shapeGroup.setAttr('isPlaced', true);
        }

        return shapeGroup;
    }
}
