import Konva from "konva";

/**
 * @param {number} angle
 */
export function degToRad(angle) {
    return (angle * Math.PI) / 180;
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

    // Update group rotation
    group.rotation((group.rotation() + deltaDeg) % 360);

    // Redraw the group to apply changes
    group.getLayer().batchDraw();
}
