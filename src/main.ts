import "./style.css";

const BOARD_IMAGE_PATH = "/images/boards/memoir-desert-map.jpg";

type GridConfig = {
  cols: number;
  rows: number;
  hexRadius: number;
  originX: number;
  originY: number;
  lineWidth: number;
  strokeStyle: string;
};

const defaultGrid: GridConfig = {
  cols: 13,
  rows: 9,
  hexRadius: 86,
  originX: 92,
  originY: 180,
  lineWidth: 2.5,
  strokeStyle: "rgba(0, 255, 255, 0.72)"
};

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

function drawGrid(context: CanvasRenderingContext2D, grid: GridConfig) {
  const { cols, rows, hexRadius, originX, originY, lineWidth, strokeStyle } = grid;
  const hexHeight = Math.sqrt(3) * hexRadius;
  const horizStep = hexRadius * 1.5;
  const vertStep = hexHeight;

  context.save();
  context.lineWidth = lineWidth;
  context.strokeStyle = strokeStyle;
  context.shadowColor = "rgba(0, 0, 0, 0.35)";
  context.shadowBlur = 1.5;

  for (let col = 0; col < cols; col += 1) {
    for (let row = 0; row < rows; row += 1) {
      const centerX = originX + col * horizStep;
      const centerY = originY + row * vertStep + (col % 2 === 0 ? 0 : vertStep / 2);
      drawHex(context, centerX, centerY, hexRadius);
    }
  }

  context.restore();
}

function drawHex(context: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  const corners = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i + 30); // flat-top orientation
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  });

  context.beginPath();
  context.moveTo(corners[0].x, corners[0].y);
  corners.slice(1).forEach((corner) => context.lineTo(corner.x, corner.y));
  context.closePath();
  context.stroke();
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
    drawGrid(context, defaultGrid);
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
