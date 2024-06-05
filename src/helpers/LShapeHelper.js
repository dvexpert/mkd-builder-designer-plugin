import Konva from "konva";

/**
 * @typedef { "a" } LShapeSideA
 * @typedef { "b" } LShapeSideB
 * @typedef { "c" } LShapeSideC
 * @typedef { "d" } LShapeSideD
 * @typedef { "i" } LShapeSideI
 * @typedef { LShapeSideA | LShapeSideB | LShapeSideC | LShapeSideD | LShapeSideI } LShapeSide
 * @typedef { "a" | "b" | "c" | "d" | "i" } LShapeSideO
 */
export class LShapeHelper {
    /**
     * @static
     * @type {LShapeSideA}
     */
    static SideA = "a";

    /**
     * @static
     * @type {LShapeSideB}
     */
    static SideB = "b";

    /**
     * @static
     * @type {LShapeSideC}
     */
    static SideC = "c";

    /**
     * @static
     * @type {LShapeSideD}
     */
    static SideD = "d";

    /**
     * 
     * Interior angle group.
     * @static
     * @type {LShapeSideI}
     */
    static SideI = "i";

    static sides = [
        LShapeHelper.SideA,
        LShapeHelper.SideB,
        LShapeHelper.SideC,
        LShapeHelper.SideD,
        LShapeHelper.SideI,
    ];

    static wallBacksplashGap = 8;

    static SizeDiff = 3;

    /**
     *
     * @param {LShapeSide} side
     * @returns {boolean}
     */
    static isHorizontal(side) {
        return Boolean(
            side === LShapeHelper.SideA || side === LShapeHelper.SideC || side === LShapeHelper.SideI
        );
    }

    /**
     *
     * @param {LShapeSide} side
     * @returns {boolean}
     */
    static isFirstInHorizontalOrVertical(side) {
        return Boolean(
            side === LShapeHelper.SideA || side === LShapeHelper.SideB
        );
    }

    /**
     *
     * @typedef {"width" | "height"} SizeType
     *
     * @param {LShapeSide | SizeType} side
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

        return distance;
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
     * @param {LShapeSide} side
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
        const pointGroups =
            LShapeHelper.convertKonvaLinePointsToPointsGroup(points);

        let sidePoints;
        switch (side) {
            case this.SideA:
                sidePoints = [pointGroups[0], pointGroups[1]];
                break;
            case this.SideB:
                sidePoints = [pointGroups[1], pointGroups[2]];
                break;
            case this.SideC:
                sidePoints = [pointGroups[4], pointGroups[5]];
                break;
            case this.SideD:
                sidePoints = [pointGroups[5], pointGroups[6]];
                break;
            case this.SideI:
                sidePoints = [pointGroups[2], pointGroups[3]];
                break;
        }

        return sidePoints;
    }

    /**
     *
     * @param {LShapeSide | boolean} side - false to get all side lengths
     * @param {number[]} points - Konva.Line.points
     *
     * @typedef {{ [key in LShapeSide]: number}} AllSideLengthsType
     *
     * @returns {AllSideLengthsType | number}
     */
    static getSideLength(side, points) {
        const pointGroups =
            LShapeHelper.convertKonvaLinePointsToPointsGroup(points);

        if (side === false) {
            // prettier-ignore
            /** @type {AllSideLengthsType} */
            const allSideLengths = {
                [this.SideA]: this.calculateDistance(pointGroups[0], pointGroups[1]),
                [this.SideB]: this.calculateDistance(pointGroups[1], pointGroups[2]),
                [this.SideC]: this.calculateDistance(pointGroups[4], pointGroups[5]),
                [this.SideD]: this.calculateDistance(pointGroups[5], pointGroups[6]),
                [this.SideI]: this.calculateDistance(pointGroups[2], pointGroups[3])
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
                length = this.calculateDistance(pointGroups[4], pointGroups[5]);
                break;
            case this.SideD:
                length = this.calculateDistance(pointGroups[5], pointGroups[6]);
                break;
            case this.SideI:
                length = this.calculateDistance(pointGroups[2], pointGroups[3]);
                break;
        }

        return length;
    }
}
