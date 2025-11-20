// ABOUTME: Hand display component showing active player's command cards
// ABOUTME: HTML-based UI positioned below the game canvas

import { Deck } from "../../domain/Deck";
import { CommandCard, CardLocation } from "../../domain/CommandCard";

export class HandDisplay {
  private container: HTMLDivElement;
  private deck: Deck;

  constructor(deck: Deck) {
    this.deck = deck;
    this.container = document.createElement("div");
    this.container.id = "hand-display";
    this.setupStyles();
  }

  private setupStyles(): void {
    this.container.style.display = "flex";
    this.container.style.justifyContent = "center";
    this.container.style.gap = "10px";
    this.container.style.padding = "20px";
    this.container.style.backgroundColor = "#2a2a2a";
    this.container.style.borderTop = "2px solid #444";
  }

  /**
   * Render the hand for the bottom player
   */
  render(): void {
    // Clear existing cards
    this.container.innerHTML = "";

    // Get cards in bottom player's hand
    const cards = this.deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);

    // Create image elements for each card
    cards.forEach((card) => {
      const cardElement = this.createCardElement(card);
      this.container.appendChild(cardElement);
    });
  }

  private createCardElement(card: CommandCard): HTMLImageElement {
    const img = document.createElement("img");
    img.src = card.imagePath;
    img.alt = card.name;
    img.title = card.name;
    img.style.height = "150px";
    img.style.width = "auto";
    img.style.cursor = "default";
    img.style.border = "2px solid #666";
    img.style.borderRadius = "4px";
    return img;
  }

  /**
   * Get the DOM element for mounting
   */
  getElement(): HTMLDivElement {
    return this.container;
  }
}
