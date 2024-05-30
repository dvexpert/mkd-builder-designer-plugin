import Konva from "konva";

/**
 * @typedef { "a" } SquareSideA
 * @typedef { "b" } SquareSideB
 * @typedef { "c" } SquareSideC
 * @typedef { "d" } SquareSideD
 * @typedef { SquareSideA | SquareSideB | SquareSideC | SquareSideD } SquareSide
 */
export class SquareHelper {
    /**
     * @static
     * @type {SquareSideA}
     */
    static SideA = "a";

    /**
     * @static
     * @type {SquareSideB}
     */
    static SideB = "b";

    /**
     * @static
     * @type {SquareSideC}
     */
    static SideC = "c";

    /**
     * @static
     * @type {SquareSideD}
     */
    static SideD = "d";

    static sides = [
        SquareHelper.SideA,
        SquareHelper.SideB,
        SquareHelper.SideC,
        SquareHelper.SideD,
    ];

    static wallBacksplashGap = 8;

    /**
     *
     * @param {SquareSide} side
     * @returns {boolean}
     */
    static isHorizontal(side) {
        return Boolean(
            side === SquareHelper.SideA || side === SquareHelper.SideC
        );
    }

    /**
     *
     * @param {SquareSide} side
     * @returns {boolean}
     */
    static isFirstInHorizontalOrVertical(side) {
        return Boolean(
            side === SquareHelper.SideA || side === SquareHelper.SideB
        );
    }

    /**
     *
     * @typedef {"width" | "height"} SizeType
     * 
     * @param {SquareSide | SizeType} side
     * @param {Konva.Group} shapeGroup
     *
     * @returns {Array<Konva.Group>}
     */
    static getDirectionalEdgeGroups(side, shapeGroup) {
        if (this.isHorizontal(side) || side === 'width') {
            return shapeGroup.find(`.${this.SideA}, .${this.SideC}`);
        }

        return shapeGroup.find(`.${this.SideB}, .${this.SideD}`);
    }
}
