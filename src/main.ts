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
  showCoords: boolean;
  coordColor: string;
};

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
  canvas.width = 2007;
  canvas.height = 1417;
  return canvas;
}

function drawBoard(context: CanvasRenderingContext2D, image: HTMLImageElement) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height);
}

function drawGrid(context: CanvasRenderingContext2D, grid: GridConfig) {
  const { cols, rows, hexRadius, originX, originY, lineWidth, strokeStyle, showCoords, coordColor } = grid;
  const hexHeight = Math.sqrt(3) * hexRadius; // pointy-top height
  const horizStep = Math.sqrt(3) * hexRadius; // width of a column offset
  const vertStep = hexRadius * 1.5; // vertical spacing for pointy-top

  context.save();
  context.lineWidth = lineWidth;
  context.strokeStyle = strokeStyle;
  context.shadowColor = "rgba(0, 0, 0, 0.35)";
  context.shadowBlur = 1.5;
  context.font = `${Math.floor(hexRadius * 0.36)}px sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (let q = 0; q < cols; q += 1) {
    for (let r = 0; r < rows; r += 1) {
      const centerX = originX + horizStep * (q + r / 2);
      const centerY = originY + vertStep * r;
      drawHex(context, centerX, centerY, hexRadius);
      if (showCoords) {
        const label = `${q},${r}`;
        context.fillStyle = "rgba(255, 255, 255, 0.92)";
        context.strokeStyle = coordColor;
        context.lineWidth = 0.8;
        context.strokeText(label, centerX, centerY);
        context.fillText(label, centerX, centerY);
        context.strokeStyle = strokeStyle;
        context.lineWidth = lineWidth;
      }
    }
  }

  context.restore();
}

function drawHex(context: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  const corners = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30); // pointy-top orientation
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
