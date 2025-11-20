// ABOUTME: Entry point for Memoir '44 browser game
// ABOUTME: Bootstraps canvas, rendering, and event handling

import "./style.css";
import type { GridConfig } from "./utils/hex.js";
import { toCanvasCoords, pixelToHex } from "./utils/hex.js";
import { loadBoardImage, drawBoard } from "./ui/canvas/BoardRenderer.js";
import { drawGrid } from "./ui/canvas/HexGrid.js";

const BOARD_IMAGE_PATH = "/images/boards/memoir-desert-map.jpg";
const BOARD_WIDTH = 2007;
const BOARD_HEIGHT = 1417;

const defaultGrid: GridConfig = {
  cols: 13,
  rows: 9,
  hexRadius: 87.7,
  originX: 90,
  originY: 182,
  lineWidth: 2.5,
  strokeStyle: "rgba(0, 255, 255, 0.72)",
  showCoords: true,
  coordColor: "rgba(0, 0, 0, 0.85)"
};

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.className = "board-canvas";
  canvas.width = BOARD_WIDTH;
  canvas.height = BOARD_HEIGHT;
  return canvas;
}

function createBoardWrapper(canvas: HTMLCanvasElement, overlay: HTMLDivElement): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "board-wrapper";
  wrapper.appendChild(canvas);
  wrapper.appendChild(overlay);
  return wrapper;
}


async function start() {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) {
    // Fail fast if root is missing.
    throw new Error("App root not found");
  }

  const canvas = createCanvas();
  const overlay = createOverlay();
  const wrapper = createBoardWrapper(canvas, overlay);
  app.appendChild(wrapper);
  app.appendChild(createCaption());
  applyResponsiveSizing(canvas);
  window.addEventListener("resize", () => applyResponsiveSizing(canvas));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas rendering context unavailable");
  }

  attachHoverDisplay(canvas, overlay, defaultGrid);

  try {
    const image = await loadBoardImage(BOARD_IMAGE_PATH);
    drawBoard(context, image);
    drawGrid(context, defaultGrid);
  } catch (error) {
    context.fillStyle = "#b22222";
    context.font = "16px sans-serif";
    context.fillText((error as Error).message, 20, 30);
  }
}

function applyResponsiveSizing(canvas: HTMLCanvasElement) {
  // Preserve aspect ratio while fitting within viewport with some breathing room.
  const padding = 24;
  const captionAllowance = 100;
  const maxWidth = Math.max(200, window.innerWidth - padding * 2);
  const maxHeight = Math.max(200, window.innerHeight - padding * 2 - captionAllowance);
  const scale = Math.min(1, maxWidth / BOARD_WIDTH, maxHeight / BOARD_HEIGHT);
  canvas.style.width = `${BOARD_WIDTH * scale}px`;
  canvas.style.height = `${BOARD_HEIGHT * scale}px`;
}

function attachHoverDisplay(
  canvas: HTMLCanvasElement,
  overlay: HTMLDivElement,
  grid: GridConfig
) {
  canvas.addEventListener("mousemove", (event) => {
    const { x, y } = toCanvasCoords(event, canvas);
    const { q, r } = pixelToHex(x, y, grid);
    overlay.textContent = `q=${q}, r=${r}`;
  });

  canvas.addEventListener("mouseleave", () => {
    overlay.textContent = "";
  });
}


function createCaption(): HTMLDivElement {
  const caption = document.createElement("div");
  caption.className = "caption";
  caption.textContent = "Memoir '44 board ready";
  return caption;
}

function createOverlay(): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.className = "hover-overlay";
  overlay.textContent = "";
  return overlay;
}

start();
