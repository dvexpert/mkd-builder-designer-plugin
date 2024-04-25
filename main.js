import "@/assets/css/style.css";
import "@/assets/css/index.css";
import { KonvaManager } from "@/KonvaManager";

document.querySelector("#app").innerHTML = `<div id="canvas-container"></div>`;

const container = document.querySelector("#app #canvas-container");
container.classList.add("border", "w-max");

const konvaManager = new KonvaManager(container);