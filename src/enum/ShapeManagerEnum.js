import { LShapeHelper as LSH } from "@/helpers/LShapeHelper";

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

    LShapeTextLayers: {},

    LShapeActionOverlayId: "l-shape-action-overlay",
};

LShapeIdsObject.LShapeTextLayers = {
    [LSH.SideA]: LShapeIdsObject.LShapeATextLayer,
    [LSH.SideB]: LShapeIdsObject.LShapeBTextLayer,
    [LSH.SideC]: LShapeIdsObject.LShapeCTextLayer,
    [LSH.SideD]: LShapeIdsObject.LShapeDTextLayer,
};

export const LShapeIds = Object.freeze(LShapeIdsObject);


export const ShapeTypes = Object.freeze({
    SquareShape: "SquareShape",
    LShape: "LShape",
});