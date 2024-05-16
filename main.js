import "@/assets/css/index.css";
import { KonvaManager } from "@/KonvaManager";

document.querySelector("#app").innerHTML = `<div id="canvas-container"></div>`;

/** @type {HTMLDivElement} */
const container = document.querySelector("#app #canvas-container");
container.classList.add("border", "w-max", "relative", "overflow-hidden");

const konvaManager = new KonvaManager(container);