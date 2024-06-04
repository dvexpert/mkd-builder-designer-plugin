import { KonvaManager } from "@/KonvaManager";
import type { SquareSide } from "@/helpers/SquareHelper";

interface CallBackPropsType {
    message?: string;
    image?: string; // base64 image
    json?: string; // stringify JSON
    [key: string]: any;
}

type SquareSideT = SquareSide;

export type WallPresence = {
    [key in SquareSideT]: boolean;
};

interface BacksplashesPresence extends WallPresence {}
interface HaveRoundedCornersPresence extends WallPresence {}

interface ShapeSizeType {
    height: string;
    width: string;
}

type ShapeTypes = "SquareShape" | "LShape";

interface PositionType {
    x: number;
    y: number;
}

interface RequestObjectType {
    image: string; // for shape draw
    success: (prop: CallBackPropsType) => void;
    error: (prop: CallBackPropsType) => void;
    enable: boolean;
    wall: SquareSide;
    materialId: number | string | unknown;
    width: number;
    height: number;
    placed: boolean;
    prevShapeId: string | number;
    rotation: string | number;
    defaultValue: any;
    materialName: string;
    productName: string;
    propertyId: string;

    // Response
    id: number;
    shapeId: number;
    addWall: boolean; // true - add wall, false - remove wall
    shapeName: string; // name of the wall
    againstTheWall?: WallPresence;
    backsplashes?: BacksplashesPresence;
    haveRoundedCorners?: HaveRoundedCornersPresence;
    shapeSize?: ShapeSizeType;
    shapeType?: ShapeTypes;
    position?: PositionType
}

declare global {
    interface Event {
        detail: Partial<RequestObjectType>;
    }

    interface Document {
        activeShape?: number | null;
    }

    interface Window {
        KonvaManager?: typeof KonvaManager;
    }
}

// Ensure this file is a module by adding an empty export statement.
export {};
