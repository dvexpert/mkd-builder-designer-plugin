import { SquareSide } from "@/helpers/SquareHelper";

interface CallBackPropsType {
    message: string;
}

interface RequestObjectType {
    image: string; // for shape draw
    success: (prop: CallBackPropsType) => void;
    error: (prop: CallBackPropsType) => void;
    enable: boolean;
    wall: SquareSide;

    // Response
    id: number;
    shapeId: number;
    addWall: boolean; // true - add wall, false - remove wall
    shapeName: string; // name of the wall
}

declare global {
    interface Event {
        detail: Partial<RequestObjectType>;
    }

    interface Document {
        activeShape?: number | null;
    }
}

// Ensure this file is a module by adding an empty export statement.
export {};
