import { KonvaManager } from "@/KonvaManager";
import type { SquareSide } from "@/helpers/SquareHelper";
import { SquareHelper as SH } from "@/helpers/SquareHelper";

interface CallBackPropsType {
    message: string;
}

type SquareSideT = SquareSide;

type WallPresence = {
    [key in SquareSideT]: boolean;
}

interface BacksplashesPresence extends WallPresence {}

interface RequestObjectType {
    image: string; // for shape draw
    success: (prop: CallBackPropsType) => void;
    error: (prop: CallBackPropsType) => void;
    enable: boolean;
    wall: SquareSide;
    materialId: number | string | unknown;

    // Response
    id: number;
    shapeId: number;
    addWall: boolean; // true - add wall, false - remove wall
    shapeName: string; // name of the wall
    againstTheWall?: WallPresence;
    backsplashes?: BacksplashesPresence;
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
