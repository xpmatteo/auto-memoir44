import {isHexInSection, Section} from "../Section";
import {CommandCard} from "./CommandCard";
import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {MovePhase} from "../phases/MovePhase";
import {OrderUnitsPhase} from "../phases/OrderUnitsPhase";
import {SituatedUnit} from "../SituatedUnit";
import {ReplenishHandDrawTwoChooseOnePhase} from "../phases/ReplenishHandDrawTwoChooseOnePhase";
import {Position} from "../Player";
import {cartesianProduct, combinations} from "../../utils/combinations";

export abstract class SectionCard extends CommandCard {
    abstract readonly howManyUnits: number;
    readonly sections: Section[] = [];

    onCardPlayed(gameState: GameState): void {
        gameState.setCurrentCard(this.id);
        gameState.replacePhase(new ReplenishHandPhase());
        gameState.pushPhase(new BattlePhase());
        gameState.pushPhase(new MovePhase());

        gameState.pushPhase(new OrderUnitsPhase(this.sections.map(section => ({
            predicate: (su: SituatedUnit) => isHexInSection(su.coord, section, gameState.activePlayer.position),
            maxCount: this.howManyUnits
        }))));
    }

    getOrderableSets(units: SituatedUnit[], position: Position): Set<Set<SituatedUnit>> {
        // For each section, get units in that section and generate combinations
        const perSectionCombinations: SituatedUnit[][][] = this.sections.map(section => {
            const unitsInSection = units.filter(u => isHexInSection(u.coord, section, position));
            if (unitsInSection.length === 0) return [];

            // Determine the combination size for this section
            const combinationSize = Math.min(this.howManyUnits, unitsInSection.length);
            return combinations(unitsInSection, combinationSize);
        });

        // Filter out empty sections (no units available)
        const nonEmptySectionCombinations = perSectionCombinations.filter(combos => combos.length > 0);

        // If no sections have units, return empty set
        if (nonEmptySectionCombinations.length === 0) {
            return new Set();
        }

        // Generate cartesian product of per-section combinations
        const cartesianCombinations = cartesianProduct(nonEmptySectionCombinations);

        // Flatten each cartesian product element and filter out duplicates
        const result = new Set<Set<SituatedUnit>>();
        for (const combo of cartesianCombinations) {
            const flatCombo = combo.flat();
            // Check for duplicate units (can happen when units straddle sections)
            const uniqueUnits = new Set(flatCombo);
            if (uniqueUnits.size === flatCombo.length) {
                // No duplicates, add to result
                result.add(new Set(flatCombo));
            }
        }

        return result;
    }
}

export class AssaultCenter extends SectionCard {
    readonly name = "Assault Center";
    readonly imagePath = "images/cards/a2_assault_center.png";
    readonly sections = [Section.CENTER];
    readonly howManyUnits = 1000;

    onCardPlayed(gameState: GameState): void {
        super.onCardPlayed(gameState);
        gameState.orderAllFriendlyUnitsInSection(this.sections[0]);
    }
}

export class AssaultLeft extends SectionCard {
    readonly name = "Assault Left";
    readonly imagePath = "images/cards/a2_assault_left.png";
    readonly sections = [Section.LEFT];
    readonly howManyUnits = 1000;

    onCardPlayed(gameState: GameState): void {
        super.onCardPlayed(gameState);
        gameState.orderAllFriendlyUnitsInSection(this.sections[0]);
    }
}

export class AssaultRight extends SectionCard {
    readonly name = "Assault Right";
    readonly imagePath = "images/cards/a2_assault_right.png";
    readonly sections = [Section.RIGHT];
    readonly howManyUnits = 1000;

    onCardPlayed(gameState: GameState): void {
        super.onCardPlayed(gameState);
        gameState.orderAllFriendlyUnitsInSection(this.sections[0]);
    }
}

// Attack cards
export class AttackCenter extends SectionCard {
    readonly name = "Attack Center";
    readonly imagePath = "images/cards/a4_attack_center.png";
    readonly sections = [Section.CENTER];
    readonly howManyUnits = 3;
}

export class AttackLeft extends SectionCard {
    readonly name = "Attack Left";
    readonly imagePath = "images/cards/a3_attack_left.png";
    readonly sections = [Section.LEFT];
    readonly howManyUnits = 3;
}

export class AttackRight extends SectionCard {
    readonly name = "Attack Right";
    readonly imagePath = "images/cards/a3_attack_right.png";
    readonly sections = [Section.RIGHT];
    readonly howManyUnits = 3;
}

// Probe cards
export class ProbeCenter extends SectionCard {
    readonly name = "Probe Center";
    readonly imagePath = "images/cards/a5_probe_center.png";
    readonly sections = [Section.CENTER];
    readonly howManyUnits = 2;
}

export class ProbeLeft extends SectionCard {
    readonly name = "Probe Left";
    readonly imagePath = "images/cards/a4_probe_left.png";
    readonly sections = [Section.LEFT];
    readonly howManyUnits = 2;
}

export class ProbeRight extends SectionCard {
    readonly name = "Probe Right";
    readonly imagePath = "images/cards/a4_probe_right.png";
    readonly sections = [Section.RIGHT];
    readonly howManyUnits = 2;
}

// Recon cards
function onReconCardPlayed(card: SectionCard, gameState: GameState): void {
    gameState.setCurrentCard(card.id);
    gameState.replacePhase(new ReplenishHandDrawTwoChooseOnePhase());
    gameState.pushPhase(new BattlePhase());
    gameState.pushPhase(new MovePhase());

    gameState.pushPhase(new OrderUnitsPhase(card.sections.map(section => ({
        predicate: (su: SituatedUnit) => isHexInSection(su.coord, section, gameState.activePlayer.position),
        maxCount: card.howManyUnits
    }))));
}

export class ReconCenter extends SectionCard {
    readonly name = "Recon Center";
    readonly imagePath = "images/cards/a4_recon_center.png";
    readonly sections = [Section.CENTER];
    readonly howManyUnits = 1;
    onCardPlayed(gameState: GameState): void {
        onReconCardPlayed(this, gameState);
    }
}

export class ReconLeft extends SectionCard {
    readonly name = "Recon Left";
    readonly imagePath = "images/cards/a2_recon_left.png";
    readonly sections = [Section.LEFT];
    readonly howManyUnits = 1;
    onCardPlayed(gameState: GameState): void {
        onReconCardPlayed(this, gameState);
    }
}

export class ReconRight extends SectionCard {
    readonly name = "Recon Right";
    readonly imagePath = "images/cards/a2_recon_right.png";
    readonly sections = [Section.RIGHT];
    readonly howManyUnits = 1;
    onCardPlayed(gameState: GameState): void {
        onReconCardPlayed(this, gameState);
    }
}

// Multi-section cards
export class PincerMove extends SectionCard {
    readonly name = "Pincer Move";
    readonly imagePath = "images/cards/a1_pincer.png";
    readonly sections = [Section.LEFT, Section.RIGHT];
    readonly howManyUnits = 2;
}

export class ReconInForce extends SectionCard {
    readonly name = "Recon In Force";
    readonly imagePath = "images/cards/a3_recon_in_force.png";
    readonly sections = [Section.LEFT, Section.CENTER, Section.RIGHT];
    readonly howManyUnits = 1;
}

export class GeneralAdvance extends SectionCard {
    readonly name = "General Advance";
    readonly imagePath = "images/cards/a1_general_advance.png";
    readonly sections = [Section.LEFT, Section.CENTER, Section.RIGHT];
    readonly howManyUnits = 2;
}
