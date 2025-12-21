// ABOUTME: Event log component showing game events in a scrollable panel
// ABOUTME: HTML-based UI positioned to the right of the game canvas

import {GameState} from "../../domain/GameState";
import {GameEvent, BattleEvent, UnitMovedEvent, MedalEarnedEvent, CardPlayedEvent, GameWonEvent} from "../../domain/GameEvent";

export class EventLog {
    private container: HTMLDivElement;
    private gameState: GameState;

    constructor(gameState: GameState) {
        this.gameState = gameState;
        this.container = document.createElement("div");
        this.container.id = "event-log";
    }

    /**
     * Render all events in chronological order (newest at bottom)
     */
    render(): void {
        // Clear existing events
        this.container.innerHTML = "";

        // Get all events
        const events = this.gameState.getEvents();

        if (events.length === 0) {
            // Show placeholder when no events
            const placeholder = document.createElement("div");
            placeholder.className = "event-placeholder";
            placeholder.textContent = "Events will appear here as you play...";
            this.container.appendChild(placeholder);
            return;
        }

        // Create event elements in chronological order (oldest first, newest last)
        events.forEach((event) => {
            const eventElement = this.createEventElement(event);
            this.container.appendChild(eventElement);
        });

        // Auto-scroll to bottom to show newest events
        this.container.scrollTop = this.container.scrollHeight;
    }

    private createEventElement(event: GameEvent): HTMLDivElement {
        const div = document.createElement("div");
        div.className = "event-entry";

        // Add event-type-specific classes for color coding
        if (event instanceof BattleEvent) {
            div.classList.add("event-battle");
        } else if (event instanceof MedalEarnedEvent) {
            div.classList.add("event-medal");
        } else if (event instanceof UnitMovedEvent) {
            div.classList.add("event-move");
        } else if (event instanceof CardPlayedEvent) {
            div.classList.add("event-card");
        } else if (event instanceof GameWonEvent) {
            div.classList.add("event-game-over");
        }

        div.textContent = event.description;

        return div;
    }

    /**
     * Get the DOM element for mounting
     */
    getElement(): HTMLDivElement {
        return this.container;
    }
}
