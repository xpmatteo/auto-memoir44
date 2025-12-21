// ABOUTME: Manages UI-specific state like selected units and valid move destinations
// ABOUTME: Singleton pattern for sharing state across UI components

import {Unit} from '../domain/Unit';
import {HexCoord} from '../utils/hex';

export interface BattleTarget {
    coord: HexCoord;
    dice: number;
}

export class UIState {
    selectedUnit: Unit | null = null;
    selectedUnitLocation: HexCoord | null = null;
    validDestinations: HexCoord[] = [];
    validBattleTargets: BattleTarget[] = [];
    validRetreatHexes: HexCoord[] = [];

    selectUnit(unit: Unit, location: HexCoord, destinations: HexCoord[]): void {
        this.selectedUnit = unit;
        this.selectedUnitLocation = location;
        this.validDestinations = destinations;
    }

    selectAttackingUnit(unit: Unit, location: HexCoord, targets: BattleTarget[]): void {
        this.selectedUnit = unit;
        this.selectedUnitLocation = location;
        this.validBattleTargets = targets;
    }

    selectRetreatHexes(hexes: HexCoord[]): void {
        this.validRetreatHexes = hexes;
    }

    clearSelection(): void {
        this.selectedUnit = null;
        this.selectedUnitLocation = null;
        this.validDestinations = [];
        this.validBattleTargets = [];
        this.validRetreatHexes = [];
    }

    isDestinationValid(hex: HexCoord): boolean {
        return this.validDestinations.some(dest => dest === hex);
    }

    isBattleTargetValid(hex: HexCoord): boolean {
        return this.validBattleTargets.some(target => target.coord === hex);
    }

    getBattleTargetDice(hex: HexCoord): number | null {
        const target = this.validBattleTargets.find(t => t.coord === hex);
        return target ? target.dice : null;
    }

    isRetreatHexValid(hex: HexCoord): boolean {
        return this.validRetreatHexes.some(retreat => retreat === hex);
    }
}

// Singleton instance
export const uiState = new UIState();
