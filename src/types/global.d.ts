import { KonvaManager } from "@/KonvaManager";
import type { SquareSide } from "@/helpers/SquareHelper";

interface CallBackPropsType {
    message: string;
}

type SquareSideT = SquareSide;

export type WallPresence = {
    [key in SquareSideT]: boolean;
}

interface BacksplashesPresence extends WallPresence {}
interface HaveRoundedCornersPresence extends WallPresence {}

interface ShapeSizeType {
    height: string
    width: string
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

    // Response
    id: number;
    shapeId: number;
    addWall: boolean; // true - add wall, false - remove wall
    shapeName: string; // name of the wall
    againstTheWall?: WallPresence;
    backsplashes?: BacksplashesPresence;
    haveRoundedCorners?: HaveRoundedCornersPresence;
    shapeSize?: ShapeSizeType;
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
