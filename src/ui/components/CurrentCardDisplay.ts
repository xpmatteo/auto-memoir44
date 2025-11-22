// ABOUTME: Current card display component showing the selected card
// ABOUTME: Positioned to the left of the game board

import {GameState} from "../../domain/GameState";

export class CurrentCardDisplay {
  private container: HTMLDivElement;
  private gameState: GameState;

  constructor(gameState: GameState) {
    this.gameState = gameState;
    this.container = document.createElement("div");
    this.container.id = "current-card-display";
    this.setupStyles();
  }

  private setupStyles(): void {
    this.container.style.display = "flex";
    this.container.style.alignItems = "center";
    this.container.style.justifyContent = "center";
    this.container.style.padding = "20px";
  }

  /**
   * Render the current card if one is selected
   */
  render(): void {
    // Clear existing content
    this.container.innerHTML = "";

    const card = this.gameState.activeCard;

    if (card === null) {
      // No card selected, show nothing
      return;
    }

    // Create and display the card image
    const cardImg = document.createElement("img");
    cardImg.src = card.imagePath;
    cardImg.alt = card.name;
    cardImg.title = card.name;
    cardImg.style.height = "200px";
    cardImg.style.width = "auto";
    cardImg.style.border = "3px solid #fbbf24";
    cardImg.style.borderRadius = "6px";
    cardImg.style.boxShadow = "0 4px 12px rgba(251, 191, 36, 0.3)";

    this.container.appendChild(cardImg);
  }

  /**
   * Get the DOM element for mounting
   */
  getElement(): HTMLDivElement {
    return this.container;
  }
}
