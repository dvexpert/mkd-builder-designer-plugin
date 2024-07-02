import Konva from "konva";
import {
    CircleShapeIds,
    ShapeActions,
    ShapeTypes,
} from "./enum/ShapeManagerEnum.js";
import AttributeOverlayTemplate from "@/templates/AttributesOverlay/index.html?raw";
import AttributeShapeCutOutTemplate from "@/templates/AttributesOverlay/ShapeCutOut.html?raw";
import EventManager from "./EventManager.js";
import { CircleShapeHelper as CSH } from "./helpers/CircleShapeHelper.js";

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
        this.createContextMenu();
        this.createActionOverlay();

        this.stage.on("dragmove", () => {
            const groups = this.stage.find(
                `#${CircleShapeIds.CircleShapeGroup}`
            );
            groups.forEach((group) => {
                this.updateAttributesOverlayPosition(group);
                this.updateHoverActionOverlayPosition(group);
            });
        });
        this.stage.on("scaleChange xChange yChange", (ev) => {
            setTimeout(() => {
                const groups = this.stage.find(
                    `#${CircleShapeIds.CircleShapeGroup}`
                );
                groups.forEach((group) => {
                    this.updateAttributesOverlayPosition(group);
                    this.updateHoverActionOverlayPosition(group);
                });
            });
        });
    }

    /**
     * To get Placeholder or placed shape object
     *
     * @param {Konva.Group} shapeGroup
     * @returns {Konva.Circle}
     */
    getShapeObject(shapeGroup) {
        return (
            shapeGroup.findOne(
                `#${CircleShapeIds.CircleShapePlaceholderObject}`
            ) ?? shapeGroup.findOne(`#${CircleShapeIds.CircleShapeObject}`)
        );
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
                    `#${CircleShapeIds.CircleShapeGroup}`
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
                    String(CircleShapeIds.CircleShapeObject),
                    String(CircleShapeIds.CircleShapePlaceholderObject),
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

        const scaleX = this.stage.scaleX();
        this.actionOverlayNode.style.transform = `scale(${scaleX})`;
        const boxRect = shapeNode.getClientRect();
        const shapePosition = {
            x: boxRect.x + boxRect.width / 2,
            y: boxRect.y + boxRect.height / 2,
        };

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
            const radius = shapeSize?.radius ? Number(shapeSize?.radius) : 100;
            shapeGroup = new Konva.Group({
                x: posX,
                y: posY,
                draggable: this.stage.getAttr("shapeDraggable") === true,
                id: CircleShapeIds.CircleShapeGroup,
                materialId: materialId,
                shapeSize: {
                    radius: radius,
                },
                shapeType: ShapeTypes.CircleShape,
                canvasShapeId: null,
                materialImage: materialImage,
                isPlaced: false,
                prevShapeId: prevShapeId,
                materialName: overlayMaterialProductName.materialName,
                productName: overlayMaterialProductName.productName,
            });
            shapeGroup.setAttr("canvasShapeId", shapeGroup._id);
            const circlePlaceHolderObject = new Konva.Circle({
                radius: (radius / 2) * SizeDiff,
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
                if (e.type === "dragmove") {
                    this.updateAttributesOverlayPosition(shapeGroup);
                    const targetShape = this.getShapeObject(hoverNode);
                    const targetRect = targetShape.getClientRect();
                    this.layer.find("Group").forEach((group) => {
                        // do not check intersection with itself
                        if (
                            group === hoverNode ||
                            group.id() !== CircleShapeIds.CircleShapeGroup
                        ) {
                            group.opacity(1);
                            return;
                        }
                        const shape = this.getShapeObject(group);
                        if (shape) {
                            const haveIntersection = this.haveIntersection(
                                {...shape.getAbsolutePosition(), radius: shape.radius()},
                                {...targetShape.getAbsolutePosition(), radius: targetShape.radius()},
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
        const radius = groupShapeObject.radius();

        const attributes = {
            height: 50,
            width: radius * 2,
        };

        const subGroup = new Konva.Group({
            name: CSH.side,
            height: attributes.height,
            width: attributes.width,
        });
        shapeGroup.add(subGroup);

        const sideLabel = new Konva.Text({
            id: `text_node_${CSH.side}`,
            text: '⌀',
            fill: "#000",
            fontSize: 22,
            fontVariant: "",
        });
        subGroup.add(sideLabel);

        // TODO: For development purposes only
        // const tempRect = new Konva.Rect({
        //     name: 'tempBG',
        //     fill: "red",
        //     opacity: 0.3,
        //     width: attributes.width,
        //     height: attributes.height,
        // });
        // subGroup.add(tempRect);

        this.updateEdgeGroupsPosition(shapeGroup, true);
    }

    /**
     *
     * @param {Konva.Group} shapeGroup
     * @param {boolean} createInput
     */
    updateEdgeGroupsPosition(shapeGroup, createInput = false) {
        const groupShapeObject = this.getShapeObject(shapeGroup);
        const radius = groupShapeObject.radius();

        /** @type {Konva.Group} */
        const subGroup = shapeGroup.findOne(`.${CSH.side}`);

        subGroup.width(radius * 2);
        // subGroup.findOne(`.tempBG`)?.width(radius * 2); // TODO: For development purposes only.
        subGroup.position({
            x: groupShapeObject.x() - subGroup.width() / 2,
            y: groupShapeObject.y() - radius - subGroup.height(),
        });

        const textNode = subGroup.findOne(`#text_node_${CSH.side}`);

        const textNodePosition = {
            x: subGroup.width() / 2.2,
            y: subGroup.height() - textNode.height() - CSH.edgeGroupGap,
        };
        textNode.position(textNodePosition);

        /** @type {Konva.Text} */
        let radiusInput = shapeGroup.findOne(
            `#${CircleShapeIds.CircleSizeTextLayer}`
        );
        if (createInput === true && !radiusInput) {
            const shapeSize = (groupShapeObject.radius() * 2) / SizeDiff;

            radiusInput = new Konva.Text({
                id: CircleShapeIds.CircleSizeTextLayer,
                text: String(shapeSize),
                fontSize: 20,
                fill: "black",
                wall: subGroup.name(),
            });
            subGroup.add(radiusInput);

            radiusInput.on("click", (e) => {
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

                inputBox.value = radiusInput.text();
                Object.assign(inputBox.style, inputBoxStyle);
                inputBox.focus();
                let inputRemoved = false;
                // inputBox.addEventListener("change", (e) => {
                //     this.handleInputValueChange(
                //         subGroup,
                //         radiusInput,
                //         inputBox,
                //         false
                //     );
                // });
                inputBox.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        inputRemoved = true;
                        this.handleInputValueChange(
                            subGroup,
                            radiusInput,
                            inputBox
                        );
                    }
                });
                inputBox.addEventListener("blur", () => {
                    if (inputRemoved) return;
                    this.handleInputValueChange(
                        subGroup,
                        radiusInput,
                        inputBox
                    );
                });
            });
        }

        radiusInput.position({
            x: textNodePosition.x + radiusInput.width(),
            y: textNodePosition.y + 3,
        });
    }

    /**
     *
     * @param {Konva.Node} element
     * @param {boolean} enable
     */
    setDragging(element, enable = true) {
        if (element.id() !== CircleShapeIds.CircleShapeGroup) {
            element = element.findAncestor(
                `#${CircleShapeIds.CircleShapeGroup}`
            );
        }
        element.draggable(enable);
        // ? set the cursors and other side effects of toggling the element draggable
    }

    /**
     *
     * @param {Konva.Group} subGroup
     * @param {Konva.Text} labelNode
     * @param {HTMLInputElement | string} inputBox
     */
    handleInputValueChange(subGroup, labelNode = null, inputBox = null, deleteInput = true) {
        /** @type {Konva.Group} */
        let shapeGroup;
        if (subGroup.id() === CircleShapeIds.CircleShapeGroup) {
            shapeGroup = subGroup;
        } else {
            /** @type {Konva.Group} */
            // @ts-ignore
            shapeGroup = subGroup.findAncestor(
                `#${CircleShapeIds.CircleShapeGroup}`
            );
        }
        const circlePlaceHolderObject = this.getShapeObject(shapeGroup);
        /** @type {Konva.Text} */
        const radiusLabelNode = shapeGroup.findOne(
            `#${
                labelNode ? labelNode.id() : CircleShapeIds.CircleSizeTextLayer
            }`
        );

        let inputBoxValue = "";
        if (["string", "number"].includes(typeof inputBox)) {
            inputBoxValue = inputBox;
        } else {
            inputBoxValue = inputBox?.value;
            deleteInput && document.body.removeChild(inputBox);
        }

        const value = Number(inputBoxValue);
        radiusLabelNode.text(inputBoxValue);
        this.setDragging(shapeGroup, true);
        circlePlaceHolderObject.radius((value / 2) * SizeDiff);

        this.updateHoverActionOverlayPosition(shapeGroup);
        this.updateEdgeGroupsPosition(shapeGroup);

        const shapeSize = shapeGroup.getAttr("shapeSize");
        shapeSize["radius"] = value;
        shapeGroup.setAttr("shapeSize", shapeSize);

        this.eventManager.dispatchSizeUpdate(shapeGroup);
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
     */
    updateAttributesOverlayPosition(shapeGroup) {
        const ShapeObject = this.getShapeObject(shapeGroup);
        if (ShapeObject.id() !== CircleShapeIds.CircleShapeObject) return;
        const boxRect = ShapeObject.getAbsolutePosition();

        const attributeOverlay = this.getShapeGroupAttributeOverlay(shapeGroup);
        const attributeOverlayRect = attributeOverlay.getBoundingClientRect();
        attributeOverlay.style.left = `${
            boxRect.x - attributeOverlayRect.width / 2
        }px`;
        attributeOverlay.style.top = `${
            boxRect.y - 50 / 2
        }px`;
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
     * Function to check collision between two circles
     * @typedef {Object} CircleRectType
     * @property {number} x - x-coordinate of the center of the circle.
     * @property {number} y - y-coordinate of the center of the first circle.
     * @property {number} radius - radius of the first circle
     * 
     * @param {CircleRectType} c1
     * @param {CircleRectType} c2
     * 
     * @returns {boolean} - true if the circles collide, false otherwise
     */
    haveIntersection(c1, c2) {
        // Calculate the distance between the two circle centers
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if the distance is less than or equal to the sum of the radii
        return distance <= (c1.radius + c2.radius);
    }
}
