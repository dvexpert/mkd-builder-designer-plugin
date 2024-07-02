import Konva from "konva";

/**
 * @param {number} angle
 */
export function degToRad(angle) {
    const shapeAngle = Number(angle)

    return (shapeAngle * Math.PI) / 180;
}

/**
 * Represents the coordinates of a center point.
 * @typedef {Object} CenterPointCords
 * @property {number} x - The x-coordinate.
 * @property {number} y - The y-coordinate.
 */

/**
 *
 * @param {Konva.Group} group
 * @param {Konva.Node} shape
 * @returns {CenterPointCords}
 */
function getGlobalCenter(group, shape) {
    const rotationRad = degToRad(group.rotation());
    // Calculate center of the shape in local coordinates
    const localCenterX = shape.x() + shape.width() / 2;
    const localCenterY = shape.y() + shape.height() / 2;

    // Transform local coordinates to global coordinates
    const globalCenterX =
        group.x() +
        localCenterX * Math.cos(rotationRad) -
        localCenterY * Math.sin(rotationRad);
    const globalCenterY =
        group.y() +
        localCenterX * Math.sin(rotationRad) +
        localCenterY * Math.cos(rotationRad);

    return { x: globalCenterX, y: globalCenterY };
}

/**
 *
 * @typedef {Object} CordsType
 * @property {Number} x - x coordinate
 * @property {Number} y - y coordinate
 *
 * @param {CordsType} param0
 * @param {number} rad
 * @returns
 */
const rotatePoint = ({ x, y }, rad) => {
    const rcos = Math.cos(rad);
    const rsin = Math.sin(rad);
    return { x: x * rcos - y * rsin, y: y * rcos + x * rsin };
};

/**
 * will work for shapes with top-left origin, like rectangle
 * @param {Konva.Node} node
 * @param {number} rotation
 */
function rotateAroundCenter(node, rotation) {
    //current rotation origin (0, 0) relative to desired origin - center (node.width()/2, node.height()/2)
    const topLeft = { x: -node.width() / 2, y: -node.height() / 2 };
    const current = rotatePoint(topLeft, Konva.getAngle(node.rotation()));
    const rotated = rotatePoint(topLeft, Konva.getAngle(rotation));
    const dx = rotated.x - current.x,
        dy = rotated.y - current.y;

    node.rotation(rotation);
    node.x(node.x() + dx);
    node.y(node.y() + dy);
}

/**
 *
 * @param {Konva.Group} group
 * @param {Konva.Node} square
 * @param {number} deltaDeg
 * @returns {void}
 */
export function rotateGroup(group, square, deltaDeg) {
    const { x: cx, y: cy } = getGlobalCenter(group, square);
    const deltaRad = degToRad(deltaDeg);
    const groupCenterX = group.x() + group.width() / 2;
    const groupCenterY = group.y() + group.height() / 2;

    // Calculating new center of the group
    const newGroupCenterX =
        Math.cos(deltaRad) * (groupCenterX - cx) -
        Math.sin(deltaRad) * (groupCenterY - cy) +
        cx;
    const newGroupCenterY =
        Math.sin(deltaRad) * (groupCenterX - cx) +
        Math.cos(deltaRad) * (groupCenterY - cy) +
        cy;

    // Update group position
    group.x(group.x() + (newGroupCenterX - groupCenterX));
    group.y(group.y() + (newGroupCenterY - groupCenterY));

    const updatedRotation = (group.rotation() + deltaDeg) % 360;
    // Update group rotation
    group.rotation(updatedRotation);

    // const textNodes = group.find(
    //     `#${SquareShapeIds.ShapeHeightTextLayer}, #${SquareShapeIds.ShapeWidthTextLayer}`
    // );
    // const isHorizontal = (updatedRotation / 90) % 2 === 0;

    // textNodes.forEach((node) => {
    //     if (isHorizontal) {
    //         if (updatedRotation > 0) {
    //             rotateAroundCenter(node, node.rotation() + 270);
    //         } else {
    //             rotateAroundCenter(node, 0);
    //         }
    //     } else {
    //         rotateAroundCenter(node, -updatedRotation);
    //     }
    // });

    // Redraw the group to apply changes
    group.getLayer().batchDraw();
}
