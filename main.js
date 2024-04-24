import "@/assets/css/style.css";
import "@/assets/css/index.css";
import { KonvaManager } from "@/KonvaManager";

document.querySelector("#app").innerHTML = `<div id="canvas-container"></div>`;

const container = document.querySelector("#app #canvas-container");
container.classList.add("border", "w-max");

const konvaManager = new KonvaManager(container);

document.addEventListener("mkd-plugin:zoom-in", () => {
    konvaManager.zoomIn();
});
document.addEventListener("mkd-plugin:zoom-out", () => {
    konvaManager.zoomOut();
});
document.addEventListener("mkd-plugin:zoom-reset", () => {
    konvaManager.zoomReset();
});
document.addEventListener("mkd-plugin:drag", (e) => {
    konvaManager.setDraggable(Boolean(e.detail?.enable));
});
document.addEventListener("mkd-plugin:position-reset", (e) => {
    konvaManager.positionReset();
});
