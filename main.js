import "@/assets/css/index.css";
import { KonvaManager } from "@/KonvaManager";

document.querySelector("#app").innerHTML = `<div id="canvas-container"></div>`;

/** @type {HTMLDivElement} */
const container = document.querySelector("#app #canvas-container");
container.classList.add("tw-border", "tw-w-max", "tw-relative", "tw-overflow-hidden");

const konvaManager = new KonvaManager(container);