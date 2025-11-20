import "./style.css";

const BOARD_IMAGE_PATH = "/images/boards/memoir-desert-map.jpg";

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.className = "board-canvas";
  canvas.width = 2007;
  canvas.height = 1417;
  return canvas;
}

function drawBoard(context: CanvasRenderingContext2D, image: HTMLImageElement) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height);
}

function loadBoardImage(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load board image"));
    img.src = BOARD_IMAGE_PATH;
  });
}

async function start() {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) {
    // Fail fast if root is missing.
    throw new Error("App root not found");
  }

  const canvas = createCanvas();
  app.appendChild(canvas);
  app.appendChild(createCaption());

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas rendering context unavailable");
  }

  try {
    const image = await loadBoardImage();
    drawBoard(context, image);
  } catch (error) {
    context.fillStyle = "#b22222";
    context.font = "16px sans-serif";
    context.fillText((error as Error).message, 20, 30);
  }
}

function createCaption(): HTMLDivElement {
  const caption = document.createElement("div");
  caption.className = "caption";
  caption.textContent = "Memoir '44 board ready";
  return caption;
}

start();
