// ABOUTME: Hand display component showing active player's command cards
// ABOUTME: HTML-based UI positioned below the game canvas

import { Deck } from "../../domain/Deck";
import { CommandCard, CardLocation } from "../../domain/CommandCard";
import { GameState } from "../../domain/GameState";

export class HandDisplay {
  private container: HTMLDivElement;
  private deck: Deck;
  private gameState: GameState;
  private onCardClick: (() => void) | null = null;

  constructor(deck: Deck, gameState: GameState) {
    this.deck = deck;
    this.gameState = gameState;
    this.container = document.createElement("div");
    this.container.id = "hand-display";
    this.setupStyles();
  }

  /**
   * Set callback to be called when a card is clicked
   */
  setOnCardClick(callback: () => void): void {
    this.onCardClick = callback;
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
    const allCards = this.deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);

    // Filter out the current card (it's displayed separately)
    const currentCardId = this.gameState.getCurrentCard();
    const cards = allCards.filter((card) => card.id !== currentCardId);

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
    img.style.cursor = "pointer";
    img.style.border = "2px solid #666";
    img.style.borderRadius = "4px";
    img.style.transition = "transform 0.1s, border-color 0.1s";

    // Add hover effect
    img.addEventListener("mouseenter", () => {
      img.style.transform = "translateY(-4px)";
      img.style.borderColor = "#fbbf24";
    });

    img.addEventListener("mouseleave", () => {
      img.style.transform = "translateY(0)";
      img.style.borderColor = "#666";
    });

    // Add click handler
    img.addEventListener("click", () => {
      try {
        this.gameState.setCurrentCard(card.id);
        // Trigger re-render callback if set
        if (this.onCardClick) {
          this.onCardClick();
        }
      } catch (error) {
        alert((error as Error).message);
      }
    });

    return img;
  }

  /**
   * Get the DOM element for mounting
   */
  getElement(): HTMLDivElement {
    return this.container;
  }
}
