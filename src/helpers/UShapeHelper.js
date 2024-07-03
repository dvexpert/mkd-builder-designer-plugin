import Konva from "konva";

/**
 * @typedef { "a" } UShapeSideA
 * @typedef { "b" } UShapeSideB
 * @typedef { "c" } UShapeSideC
 * @typedef { "d" } UShapeSideD
 * @typedef { "e" } UShapeSideE
 * @typedef { "f" } UShapeSideF
 * @typedef { "i1" } UShapeSideI1
 * @typedef { "i2" } UShapeSideI2
 * @typedef { UShapeSideA | UShapeSideB | UShapeSideC | UShapeSideD | UShapeSideE |UShapeSideF | UShapeSideI1 | UShapeSideI2 } UShapeSide
 * @typedef { "a" | "b" | "c" | "d" | "e" | "f" | "i1" | "i2" } UShapeSideO
 */
export class UShapeHelper {
    /**
     * @static
     * @type {UShapeSideA}
     */
    static SideA = "a";

    /**
     * @static
     * @type {UShapeSideB}
     */
    static SideB = "b";

    /**
     * @static
     * @type {UShapeSideC}
     */
    static SideC = "c";

    /**
     * @static
     * @type {UShapeSideD}
     */
    static SideD = "d";

    /**
     *
     * @static
     * @type {UShapeSideE}
     */
    static SideE = "e";

    /**
     * @static
     * @type {UShapeSideF}
     */
    static SideF = "f";

    /**
     *
     * Interior angle group.
     * @static
     * @type {UShapeSideI1}
     */
    static SideI1 = "i1";

    /**
     *
     * Interior angle group.
     * @static
     * @type {UShapeSideI2}
     */
    static SideI2 = "i2";

    /**
     * @type {UShapeSideO[]}
     */
    static sides = [
        UShapeHelper.SideA,
        UShapeHelper.SideB,
        UShapeHelper.SideC,
        UShapeHelper.SideD,
        UShapeHelper.SideE,
        UShapeHelper.SideF,
        UShapeHelper.SideI1,
        UShapeHelper.SideI2,
    ];

    static corners = [
        UShapeHelper.SideA,
        UShapeHelper.SideB,
        UShapeHelper.SideC,
        UShapeHelper.SideD,
        UShapeHelper.SideE,
        UShapeHelper.SideF,
    ];

    static wallBacksplashGap = 8;

    static SizeDiff = 3;

    static AnglePrefix = String.fromCharCode(8736);

    static AnglePostfix = String.fromCharCode(176);

    /**
     *
     * @param {UShapeSide} side
     * @returns {boolean}
     */
    static isHorizontal(side) {
        return Boolean(
            side === UShapeHelper.SideA ||
                side === UShapeHelper.SideC ||
                side === UShapeHelper.SideE
        );
    }

    /**
     *
     * @param {UShapeSide} side
     * @returns {boolean}
     */
    static isFirstInHorizontalOrVertical(side) {
        return Boolean(side === UShapeHelper.SideA || side === UShapeHelper.SideB);
    }

    /**
     *
     * @typedef {"width" | "height"} SizeType
     *
     * @param {UShapeSide | SizeType} side
     * @param {Konva.Group} shapeGroup
     *
     * @returns {Array<Konva.Group>}
     */
    static getDirectionalEdgeGroups(side, shapeGroup) {
        if (this.isHorizontal(side) || side === "width") {
            return shapeGroup.find(`.${this.SideA}, .${this.SideC}`);
        }

        return shapeGroup.find(`.${this.SideB}, .${this.SideD}`);
    }

    /**
     *
     * @param {PointsType} point1
     * @param {PointsType} point2
     * @returns
     */
    static calculateDistance(point1, point2) {
        const { x: x1, y: y1 } = point1;
        const { x: x2, y: y2 } = point2;
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

        return Math.abs(distance);
    }

    /**
     * @typedef {Object} PointsType
     * @property {number} x - x coordinate
     * @property {number} y - y coordinate
     *
     * @param {PointsType[]} groupedPoints
     *
     * @returns {number[]}
     */
    static convertToKonvaLinePoints(groupedPoints) {
        return groupedPoints.flatMap((obj) => [obj.x, obj.y]);
    }

    /**
     *
     * @param {number[]} points
     * @returns {PointsType[]}
     */
    static convertKonvaLinePointsToPointsGroup(points) {
        return points.reduce((acc, val, index) => {
            if (index % 2 === 0) {
                acc.push({ x: val });
            } else {
                acc[acc.length - 1].y = val;
            }
            return acc;
        }, []);
    }

    /**
     * To get the starting and ending points coordinates.
     *
     * @param {UShapeSide} side
     * @param {number[]} points - Konva.Line.points
     *
     * @returns {PointsType[]}
     * ```json
     * [
     *  { "x": 0, "y": 0 }, // starting point
     *  { "x": 0, "y": 0 }, // ending point
     * ]
     * ```
     */
    static getSidePoints(side, points) {
        const pointGroups = UShapeHelper.convertKonvaLinePointsToPointsGroup(points);

        let sidePoints;
        switch (side) {
            case this.SideA:
                sidePoints = [pointGroups[0], pointGroups[1]];
                break;
            case this.SideB:
                sidePoints = [pointGroups[1], pointGroups[2]];
                break;
            case this.SideC:
                sidePoints = [pointGroups[2], pointGroups[3]];
                break;
            case this.SideD:
                sidePoints = [pointGroups[5], pointGroups[6]];
                break;
            case this.SideE:
                sidePoints = [pointGroups[6], pointGroups[7]];
                break;
            case this.SideF:
                sidePoints = [pointGroups[7], pointGroups[8]];
                break;
        }

        return sidePoints;
    }

    /**
     *
     * @param {UShapeSide | boolean} side - false to get all side lengths
     * @param {number[]} points - Konva.Line.points
     *
     * @typedef {{ [key in UShapeSide]: number}} AllSideLengthsType
     *
     * @returns {Partial<AllSideLengthsType> | number}
     */
    static getSideLength(side, points) {
        const pointGroups = UShapeHelper.convertKonvaLinePointsToPointsGroup(points);

        if (side === false) {
            // prettier-ignore
            /** @type {Partial<AllSideLengthsType>} */
            const allSideLengths = {
                [this.SideA]: this.calculateDistance(pointGroups[0], pointGroups[1]),
                [this.SideB]: this.calculateDistance(pointGroups[1], pointGroups[2]),
                [this.SideC]: this.calculateDistance(pointGroups[2], pointGroups[3]),
                [this.SideD]: this.calculateDistance(pointGroups[5], pointGroups[6]),
                [this.SideE]: this.calculateDistance(pointGroups[6], pointGroups[7]),
                [this.SideF]: this.calculateDistance(pointGroups[7], pointGroups[8]),
            };

            return allSideLengths;
        }

        let length = 0;
        switch (side) {
            case this.SideA:
                length = this.calculateDistance(pointGroups[0], pointGroups[1]);
                break;
            case this.SideB:
                length = this.calculateDistance(pointGroups[1], pointGroups[2]);
                break;
            case this.SideC:
                length = this.calculateDistance(pointGroups[2], pointGroups[3]);
                break;
            case this.SideD:
                length = this.calculateDistance(pointGroups[5], pointGroups[6]);
                break;
            case this.SideE:
                length = this.calculateDistance(pointGroups[6], pointGroups[7]);
                break;
            case this.SideF:
                length = this.calculateDistance(pointGroups[7], pointGroups[8]);
                break;
            case this.SideI1:
                length = this.calculateDistance(pointGroups[4], pointGroups[5]);
                break;
            case this.SideI2:
                length = this.calculateDistance(pointGroups[3], pointGroups[4]);
                break;
        }

        return length;
    }

    /**
     *
     * Get length between two points.
     *
     * @param {number} point1 - starting from 0 from top left corner
     * @param {number} point2 - starting from 0 from top left corner
     * @param {number[]} points - Konva.Line.points
     *
     * @returns {number}
     */
    static getPointDistance(point1, point2, points) {
        const pointGroups = UShapeHelper.convertKonvaLinePointsToPointsGroup(points);

        if (point1 > 8 || point1 < 1) {
            throw new Error("Invalid argument exception: parameter point1 value is out of bound");
        }
        if (point2 > 8 || point2 < 1) {
            throw new Error("Invalid argument exception: parameter point2 value is out of bound");
        }

        return this.calculateDistance(pointGroups[point1], pointGroups[point2]);
    }

    /**
     *
     * @param {string | number} angle
     * @returns
     */
    static getInteriorAngleText(angle = 90) {
        return `${this.AnglePrefix}${angle}${this.AnglePostfix}`;
    }

    /**
     *
     * @param {UShapeSide} side
     * 
     * @returns boolean
     */
    static isInteriorAngle(side) {
        return side === this.SideI1 || side === this.SideI2;
    }
}
