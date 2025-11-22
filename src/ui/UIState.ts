// ABOUTME: Manages UI-specific state like selected units and valid move destinations
// ABOUTME: Singleton pattern for sharing state across UI components

import { Unit } from '../domain/Unit';
import { HexCoord } from '../utils/hex';

export class UIState {
  selectedUnit: Unit | null = null;
  selectedUnitLocation: HexCoord | null = null;
  validDestinations: HexCoord[] = [];

  selectUnit(unit: Unit, location: HexCoord, destinations: HexCoord[]): void {
    this.selectedUnit = unit;
    this.selectedUnitLocation = location;
    this.validDestinations = destinations;
  }

  clearSelection(): void {
    this.selectedUnit = null;
    this.selectedUnitLocation = null;
    this.validDestinations = [];
  }

  isDestinationValid(hex: HexCoord): boolean {
    return this.validDestinations.some(dest => dest.q === hex.q && dest.r === hex.r);
  }
}

// Singleton instance
export const uiState = new UIState();
