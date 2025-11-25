// ABOUTME: Board image rendering on canvas
// ABOUTME: Handles loading and drawing the board background image

/**
 * Load the board background image.
 */
export function loadBoardImage(imagePath: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load board image"));
        img.src = imagePath;
    });
}

/**
 * Draw the board background image on canvas.
 * Clears the canvas before drawing.
 */
export function drawBoard(context: CanvasRenderingContext2D, image: HTMLImageElement) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height);
}
