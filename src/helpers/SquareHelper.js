import Konva from "konva";

/**
 * @typedef {"a"|"b"|"c"|"d"} SquareSide
 */
export class SquareHelper {
    /**
     * @static
     * @type {SquareSide}
     */
    static SideA = "a";

    /**
     * @static
     * @type {SquareSide}
     */
    static SideB = "b";

    /**
     * @static
     * @type {SquareSide}
     */
    static SideC = "c";

    /**
     * @static
     * @type {SquareSide}
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
     * @param {SquareSide} side
     * @param {Konva.Group} shapeGroup
     *
     * @returns {Array<Konva.Group>}
     */
    static getDirectionalEdgeGroups(side, shapeGroup) {
        if (this.isHorizontal(side)) {
            return shapeGroup.find(`.${this.SideA}, .${this.SideC}`);
        }

        return shapeGroup.find(`.${this.SideB}, .${this.SideD}`);
    }
}
