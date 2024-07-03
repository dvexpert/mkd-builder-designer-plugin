import { LShapeHelper as LSH } from "@/helpers/LShapeHelper";
import { UShapeHelper as USH } from "@/helpers/UShapeHelper";

export const BackgroundNodeId = "BackgroundRect";

export const ShapeActions = Object.freeze({
    Place: "place",
    Rotate: "rotate",
});

export const SquareShapeIds = Object.freeze({
    ShapeGroup: "shapeGroup",
    ShapeObject: "shapeObject",
    ShapePlaceholderObject: "shapePlaceholderObject",
    ShapeHeightTextLayer: "shapeHeightTextLayer",
    ShapeWidthTextLayer: "shapeWidthTextLayer",
});

const LShapeIdsObject = {
    LShapeGroup: "LShapeGroup",

    LShapeObject: "LShapeObject",
    LShapePlaceholderObject: "LShapePlaceholderObject",
    LShapeATextLayer: "LShapeATextLayer",
    LShapeBTextLayer: "LShapeBTextLayer",
    LShapeCTextLayer: "LShapeCTextLayer",
    LShapeDTextLayer: "LShapeDTextLayer",
    LShapeITextLayer: "LShapeITextLayer",

    LShapeTextLayers: {},

    LShapeActionOverlayId: "l-shape-action-overlay",
};

LShapeIdsObject.LShapeTextLayers = {
    [LSH.SideA]: LShapeIdsObject.LShapeATextLayer,
    [LSH.SideB]: LShapeIdsObject.LShapeBTextLayer,
    [LSH.SideC]: LShapeIdsObject.LShapeCTextLayer,
    [LSH.SideD]: LShapeIdsObject.LShapeDTextLayer,
    [LSH.SideI]: LShapeIdsObject.LShapeITextLayer,
};

export const LShapeIds = Object.freeze(LShapeIdsObject);

export const ShapeTypes = Object.freeze({
    SquareShape: "SquareShape",
    LShape: "LShape",
    UShape: "UShape",
    CircleShape: "CircleShape",
});

const UShapeIdsObject = {
    UShapeGroup: "UShapeGroup",

    UShapeObject: "UShapeObject",
    UShapePlaceholderObject: "UShapePlaceholderObject",
    UShapeATextLayer: "UShapeATextLayer",
    UShapeBTextLayer: "UShapeBTextLayer",
    UShapeCTextLayer: "UShapeCTextLayer",
    UShapeDTextLayer: "UShapeDTextLayer",
    UShapeETextLayer: "UShapeETextLayer",
    UShapeFTextLayer: "UShapeFTextLayer",
    UShapeI1TextLayer: "UShapeI1TextLayer",
    UShapeI2TextLayer: "UShapeI2TextLayer",

    UShapeTextLayers: {},

    UShapeActionOverlayId: "u-shape-action-overlay",
};

UShapeIdsObject.UShapeTextLayers = {
    [USH.SideA]: UShapeIdsObject.UShapeATextLayer,
    [USH.SideB]: UShapeIdsObject.UShapeBTextLayer,
    [USH.SideC]: UShapeIdsObject.UShapeCTextLayer,
    [USH.SideD]: UShapeIdsObject.UShapeDTextLayer,
    [USH.SideE]: UShapeIdsObject.UShapeETextLayer,
    [USH.SideF]: UShapeIdsObject.UShapeFTextLayer,
    [USH.SideI1]: UShapeIdsObject.UShapeI1TextLayer,
    [USH.SideI2]: UShapeIdsObject.UShapeI2TextLayer
};

export const UShapeIds = Object.freeze(UShapeIdsObject);

export const CircleShapeIds = Object.freeze({
    CircleShapeGroup: "CircleShapeGroup",
    CircleShapeObject: "CircleShapeObject",
    CircleShapePlaceholderObject: "CircleShapePlaceholderObject",
    CircleSizeTextLayer: "CircleSizeTextLayer",
});
