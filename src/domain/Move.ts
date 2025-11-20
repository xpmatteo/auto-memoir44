// ABOUTME: Move types and definitions for game actions
// ABOUTME: Placeholder for future move implementations

import {CommandCard} from "./CommandCard";

export interface Move {
}

export class SelectCard implements Move {
    readonly card: CommandCard
    constructor(card: CommandCard) {
        this.card = card
    }
}

