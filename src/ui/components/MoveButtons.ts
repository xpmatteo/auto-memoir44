// ABOUTME: Generic component that renders buttons for any Move with a uiButton() method
// ABOUTME: Replaces hardcoded phase-specific button components with domain-driven approach

import {GameState} from "../../domain/GameState";

export class MoveButtons {
    private container: HTMLDivElement;
    private gameState: GameState;
    private onButtonClick: () => void;

    constructor(gameState: GameState) {
        this.gameState = gameState;
        this.onButtonClick = () => {
        };

        // Create container matching ConfirmOrdersButton structure
        this.container = document.createElement("div");
        this.container.id = "move-buttons-container";
    }

    setOnButtonClick(callback: () => void): void {
        this.onButtonClick = callback;
    }

    mount(parent: HTMLElement): void {
        parent.appendChild(this.container);
    }

    private handleClick(buttonCallback: (gameState: GameState) => void): void {
        buttonCallback(this.gameState);
        this.onButtonClick();
    }

    render(): void {
        // Clear existing buttons
        this.container.innerHTML = "";

        // Find all moves with UI buttons
        const moves = this.gameState.legalMoves();
        const allButtons: Array<{label: string, callback: (gameState: GameState) => void}> = [];

        // Collect all buttons from all moves
        moves.forEach(move => {
            const buttons = move.uiButton();
            allButtons.push(...buttons);
        });

        if (allButtons.length === 0) {
            // Hide container when no buttons to maintain layout consistency
            this.container.style.visibility = "hidden";
            return;
        }

        this.container.style.visibility = "visible";

        // Create a button element for each UI button
        allButtons.forEach(uiButton => {
            const button = document.createElement("button");
            button.textContent = uiButton.label;
            button.className = "move-button";
            button.addEventListener("click", () => this.handleClick(uiButton.callback));

            this.container.appendChild(button);
        });
    }
}
