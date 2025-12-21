// ABOUTME: Unit tests for GameState class
// ABOUTME: Tests current card management, unit positioning, and game state operations

import {describe, expect, it, test} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Side, Position} from "../../../src/domain/Player";
import {Deck} from "../../../src/domain/Deck";
import {Infantry} from "../../../src/domain/Unit";
import {hexOf} from "../../../src/utils/hex";
import {CardLocation} from "../../../src/domain/cards/CommandCard";
import {
    PlayCardMove,
    OrderUnitMove,
    ReplenishHandMove,
    ConfirmOrdersMove,
    EndMovementsMove,
    EndBattlesMove,
    Move
} from "../../../src/domain/moves/Move";
import {OrderUnitsPhase} from "../../../src/domain/phases/OrderUnitsPhase";
import {Section, isHexInSection} from "../../../src/domain/Section";
import {SituatedUnit} from "../../../src/domain/SituatedUnit";
import {clearTerrain, hillTerrain, woodsTerrain} from "../../../src/domain/terrain/Terrain";
import {Phase, PhaseType} from "../../../src/domain/phases/Phase";
import {MoveUnitMove} from "../../../src/domain/moves/MoveUnitMove";

describe("GameState", () => {
    describe("setCurrentCard", () => {
        it("should set the current card when none is selected", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            // Get a real card from the deck
            const cards = deck.getCardsInLocation(CardLocation.DECK);
            const card = cards[0];

            gameState.setCurrentCard(card.id);

            expect(gameState.activeCard).toBe(card);
        });

        it("should throw error when a card is already selected", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            // Get real cards from the deck
            const cards = deck.getCardsInLocation(CardLocation.DECK);
            const cardId1 = cards[0].id;
            const cardId2 = cards[1].id;

            gameState.setCurrentCard(cardId1);

            expect(() => gameState.setCurrentCard(cardId2)).toThrow(
                `Cannot select card: a card is already selected (${cardId1}). Clear the current card first.`
            );
        });

        it("should include the existing card ID in the error message", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            // Get real cards from the deck
            const cards = deck.getCardsInLocation(CardLocation.DECK);
            const cardId1 = cards[0].id;
            const cardId2 = cards[1].id;

            gameState.setCurrentCard(cardId1);

            expect(() => gameState.setCurrentCard(cardId2)).toThrow(cardId1);
        });
    });

    describe("getCurrentCard", () => {
        it("should return null when no card is selected", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            expect(gameState.activeCard).toBeNull();
        });

        it("should return the current card when one is selected", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            // Get a real card from the deck
            const cards = deck.getCardsInLocation(CardLocation.DECK);
            const card = cards[0];

            gameState.setCurrentCard(card.id);

            expect(gameState.activeCard).toBe(card);
        });
    });

    describe("placeUnit", () => {
        it("should place a unit at an empty coordinate", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const unit = new Infantry(Side.ALLIES);
            const coord = hexOf(5, 3);

            gameState.placeUnit(coord, unit);

            expect(gameState.getUnitAt(coord)).toBe(unit);
        });

        it("should throw error when coordinate is already occupied", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const unit1 = new Infantry(Side.ALLIES);
            const unit2 = new Infantry(Side.AXIS);
            const coord = hexOf(5, 3);

            gameState.placeUnit(coord, unit1);

            expect(() => gameState.placeUnit(coord, unit2)).toThrow(
                "Cannot place unit at (5, 3): coordinate already occupied"
            );
        });
    });

    describe("getUnitAt", () => {
        it("should return undefined for empty coordinate", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const coord = hexOf(5, 3);

            expect(gameState.getUnitAt(coord)).toBeUndefined();
        });

        it("should return the unit at the specified coordinate", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const unit = new Infantry(Side.ALLIES);
            const coord = hexOf(5, 3);

            gameState.placeUnit(coord, unit);

            expect(gameState.getUnitAt(coord)).toBe(unit);
        });

        it("should distinguish between different coordinates", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const unit1 = new Infantry(Side.ALLIES);
            const unit2 = new Infantry(Side.AXIS);
            const coord1 = hexOf(5, 3);
            const coord2 = hexOf(6, 4);

            gameState.placeUnit(coord1, unit1);
            gameState.placeUnit(coord2, unit2);

            expect(gameState.getUnitAt(coord1)).toBe(unit1);
            expect(gameState.getUnitAt(coord2)).toBe(unit2);
        });
    });

    describe("moveUnit", () => {
        it("should move a unit from one coordinate to another", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const unit = new Infantry(Side.ALLIES);
            const from = hexOf(5, 3);
            const to = hexOf(6, 3);

            gameState.placeUnit(from, unit);
            gameState.moveUnit(from, to);

            expect(gameState.getUnitAt(from)).toBeUndefined();
            expect(gameState.getUnitAt(to)).toBe(unit);
        });

        it("should throw error when moving from empty coordinate", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const from = hexOf(5, 3);
            const to = hexOf(6, 3);

            expect(() => gameState.moveUnit(from, to)).toThrow(
                "No unit at (5, 3) to move"
            );
        });

        it("should throw error when destination is occupied", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const unit1 = new Infantry(Side.ALLIES);
            const unit2 = new Infantry(Side.AXIS);
            const from = hexOf(5, 3);
            const to = hexOf(6, 3);

            gameState.placeUnit(from, unit1);
            gameState.placeUnit(to, unit2);

            expect(() => gameState.moveUnit(from, to)).toThrow(
                "Cannot move unit to (6, 3): coordinate already occupied"
            );
        });
    });

    describe("removeUnit", () => {
        it("should remove a unit from the board", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const unit = new Infantry(Side.ALLIES);
            const coord = hexOf(5, 3);

            gameState.placeUnit(coord, unit);
            gameState.removeUnit(coord);

            expect(gameState.getUnitAt(coord)).toBeUndefined();
        });

        it("should do nothing when removing from empty coordinate", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const coord = hexOf(5, 3);

            gameState.removeUnit(coord);

            expect(gameState.getUnitAt(coord)).toBeUndefined();
        });
    });

    describe("getAllUnitsWithPositions", () => {
        it("should return empty array when no units are on the board", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            expect(gameState.getAllUnitsWithPositions()).toHaveLength(0);
        });

        it("should return all units with their coordinates", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const unit1 = new Infantry(Side.ALLIES);
            const unit2 = new Infantry(Side.AXIS);
            const coord1 = hexOf(5, 3);
            const coord2 = hexOf(6, 4);

            gameState.placeUnit(coord1, unit1);
            gameState.placeUnit(coord2, unit2);

            const unitsWithPositions = gameState.getAllUnitsWithPositions();

            expect(unitsWithPositions).toHaveLength(2);
            expect(unitsWithPositions).toContainEqual({coord: coord1, unit: unit1});
            expect(unitsWithPositions).toContainEqual({coord: coord2, unit: unit2});
        });

        it("should reflect changes after removing a unit", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const unit1 = new Infantry(Side.ALLIES);
            const unit2 = new Infantry(Side.AXIS);
            const coord1 = hexOf(5, 3);
            const coord2 = hexOf(6, 4);

            gameState.placeUnit(coord1, unit1);
            gameState.placeUnit(coord2, unit2);
            gameState.removeUnit(coord1);

            const unitsWithPositions = gameState.getAllUnitsWithPositions();

            expect(unitsWithPositions).toHaveLength(1);
            expect(unitsWithPositions).toContainEqual({coord: coord2, unit: unit2});
        });
    });

    describe("getAllUnits", () => {
        it("should return empty array when no units are on the board", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            expect(gameState.getAllUnits()).toHaveLength(0);
        });

        it("should return all units with coordinates and terrain", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const unit1 = new Infantry(Side.ALLIES);
            const unit2 = new Infantry(Side.AXIS);
            const coord1 = hexOf(5, 3);
            const coord2 = hexOf(6, 4);

            gameState.placeUnit(coord1, unit1);
            gameState.placeUnit(coord2, unit2);

            // Set terrain for one of the coordinates
            gameState.setTerrain(coord1, hillTerrain);

            const allUnits = gameState.getAllUnits();

            expect(allUnits).toHaveLength(2);

            // Check unit1
            const unit1Result = allUnits.find(u => u.unit === unit1);
            expect(unit1Result).toBeDefined();
            expect(unit1Result!.coord).toEqual(coord1);
            expect(unit1Result!.terrain).toBe(hillTerrain);
            expect(unit1Result!.unitState.strength).toBe(4);
            expect(unit1Result!.unitState.isOrdered).toBe(false);
            expect(unit1Result!.unitState.hasMoved).toBe(false);
            expect(unit1Result!.unitState.skipsBattle).toBe(false);
            expect(unit1Result!.unitState.battlesThisTurn).toBe(0);

            // Check unit2
            const unit2Result = allUnits.find(u => u.unit === unit2);
            expect(unit2Result).toBeDefined();
            expect(unit2Result!.coord).toEqual(coord2);
            expect(unit2Result!.terrain).toBe(clearTerrain);
            expect(unit2Result!.unitState.strength).toBe(4);
            expect(unit2Result!.unitState.isOrdered).toBe(false);
            expect(unit2Result!.unitState.hasMoved).toBe(false);
            expect(unit2Result!.unitState.skipsBattle).toBe(false);
            expect(unit2Result!.unitState.battlesThisTurn).toBe(0);
        });

        it("should reflect changes after removing a unit", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const unit1 = new Infantry(Side.ALLIES);
            const unit2 = new Infantry(Side.AXIS);
            const coord1 = hexOf(5, 3);
            const coord2 = hexOf(6, 4);

            gameState.placeUnit(coord1, unit1);
            gameState.placeUnit(coord2, unit2);
            gameState.setTerrain(coord2, woodsTerrain);
            gameState.removeUnit(coord1);

            const allUnits = gameState.getAllUnits();

            expect(allUnits).toHaveLength(1);
            expect(allUnits[0].unit).toBe(unit2);
            expect(allUnits[0].coord).toEqual(coord2);
            expect(allUnits[0].terrain).toBe(woodsTerrain);
            expect(allUnits[0].unitState.strength).toBe(4);
            expect(allUnits[0].unitState.isOrdered).toBe(false);
            expect(allUnits[0].unitState.hasMoved).toBe(false);
            expect(allUnits[0].unitState.skipsBattle).toBe(false);
            expect(allUnits[0].unitState.battlesThisTurn).toBe(0);
        });

        it("should reflect mutable state changes in unitState", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const unit = new Infantry(Side.ALLIES);
            const coord = hexOf(5, 3);

            gameState.placeUnit(coord, unit);

            // Modify unit state
            gameState.orderUnit(unit);
            gameState.markUnitMoved(unit);
            gameState.setUnitCurrentStrength(unit, 2);
            gameState.incrementUnitBattlesThisTurn(unit);
            gameState.incrementUnitBattlesThisTurn(unit);

            const allUnits = gameState.getAllUnits();

            expect(allUnits).toHaveLength(1);
            expect(allUnits[0].unitState.strength).toBe(2);
            expect(allUnits[0].unitState.isOrdered).toBe(true);
            expect(allUnits[0].unitState.hasMoved).toBe(true);
            expect(allUnits[0].unitState.skipsBattle).toBe(false);
            expect(allUnits[0].unitState.battlesThisTurn).toBe(2);
        });
    });

    describe("legalMoves", () => {
        it("should return an array", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const moves = gameState.legalMoves();

            expect(Array.isArray(moves)).toBe(true);
        });

        it("should currently return empty array (placeholder implementation)", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            expect(gameState.legalMoves()).toHaveLength(0);
        });
    });

    describe("integration: current card workflow", () => {
        it("should support full card selection lifecycle", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            // Get real cards from the deck
            const cards = deck.getCardsInLocation(CardLocation.DECK);
            const card1 = cards[0];
            const card2 = cards[1];

            // Initially no card selected
            expect(gameState.activeCard).toBeNull();

            // Select a card
            gameState.setCurrentCard(card1.id);
            expect(gameState.activeCard).toBe(card1);

            // Cannot select another card
            expect(() => gameState.setCurrentCard(card2.id)).toThrow();
        });
    });

    describe("integration: unit placement and movement", () => {
        it("should support placing multiple units and moving them", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const unit1 = new Infantry(Side.ALLIES, 4);
            const unit2 = new Infantry(Side.ALLIES, 3);
            const unit3 = new Infantry(Side.AXIS, 4);

            // Place units
            gameState.placeUnit(hexOf(0, 0), unit1);
            gameState.placeUnit(hexOf(1, 0), unit2);
            gameState.placeUnit(hexOf(8, 8), unit3);

            expect(gameState.getAllUnitsWithPositions()).toHaveLength(3);

            // Move unit1
            gameState.moveUnit(hexOf(0, 0), hexOf(0, 1));

            expect(gameState.getUnitAt(hexOf(0, 0))).toBeUndefined();
            expect(gameState.getUnitAt(hexOf(0, 1))).toBe(unit1);

            // Remove unit2
            gameState.removeUnit(hexOf(1, 0));

            expect(gameState.getAllUnitsWithPositions()).toHaveLength(2);
        });
    });

    describe("Available actions at the beginning of the game", () => {
        it("should allow playing the cards in the hand", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
            let [card1, card2, card3] = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)

            let moves = gameState.legalMoves();

            expect(moves).toEqual([new PlayCardMove(card1), new PlayCardMove(card2), new PlayCardMove(card3)]);
        });

        it("should allow playing the cards in the hand for other player", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            gameState.switchActivePlayer();
            gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);
            let [card1, card2, card3] = gameState.getCardsInLocation(CardLocation.TOP_PLAYER_HAND)

            let moves = gameState.legalMoves();

            expect(moves).toEqual([new PlayCardMove(card1), new PlayCardMove(card2), new PlayCardMove(card3)]);
        });
    });

    describe('native side of the board', () => {
        test('default sides', () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            let axisUnit = new Infantry(Side.AXIS);
            let alliesUnit = new Infantry(Side.ALLIES);
            gameState.placeUnit(hexOf(0, 0), axisUnit);

            expect(gameState.positionOf(axisUnit)).toBe(Position.TOP);
            expect(gameState.positionOf(alliesUnit)).toBe(Position.BOTTOM);
        });

        test('when board is reversed', () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            gameState.reverseBoard();
            let axisUnit = new Infantry(Side.AXIS);
            let alliesUnit = new Infantry(Side.ALLIES);
            gameState.placeUnit(hexOf(0, 0), axisUnit);

            expect(gameState.positionOf(axisUnit)).toBe(Position.BOTTOM);
            expect(gameState.positionOf(alliesUnit)).toBe(Position.TOP);
        });
    });

    describe("popPhase", () => {
        it("should not trigger turn completion when phases remain on the stack", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
            const [card] = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);

            // Set up a card and push extra phases
            gameState.setCurrentCard(card.id);
            const playerPosition = gameState.activePlayer.position;
            const slots = [Section.CENTER].map(section => ({
                predicate: (su: SituatedUnit) => isHexInSection(su.coord, section, playerPosition),
                maxCount: 1
            }));
            gameState.replacePhase(new OrderUnitsPhase(slots));
            gameState.pushPhase(new OrderUnitsPhase(slots));

            const initialPlayer = gameState.activePlayer.position;

            // Pop one phase - should NOT complete turn
            gameState.popPhase();

            // Card should still be current, player should not switch
            expect(gameState.activeCard?.id).toBe(card.id);
            expect(gameState.activePlayer.position).toBe(initialPlayer);
            expect(gameState.getCardsInLocation(CardLocation.DISCARD_PILE)).toHaveLength(0);
        });

        it("should move current card to discard pile when turn completes", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
            const [card] = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);

            // Play a card through PlayCardMove to set up proper phase structure
            gameState.executeMove(new PlayCardMove(card));

            // Complete all phases to finish the turn
            gameState.executeMove(new ConfirmOrdersMove());
            gameState.executeMove(new EndMovementsMove());
            gameState.executeMove(new EndBattlesMove());

            // Now execute the ReplenishHandMove to complete the turn
            const moves = gameState.legalMoves();
            const replenishMove = moves.find(m => m instanceof ReplenishHandMove);
            expect(replenishMove).toBeDefined();
            gameState.executeMove(replenishMove!);

            // Card should be in discard pile
            expect(gameState.getCardsInLocation(CardLocation.DISCARD_PILE)).toEqual([card]);
            expect(gameState.activeCard).toBeNull();
        });

        it("should draw a replacement card for bottom player when turn completes", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
            const [card] = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);

            expect(gameState.activePlayer.position).toBe(Position.BOTTOM);

            // Play a card and complete the turn
            gameState.executeMove(new PlayCardMove(card));
            gameState.executeMove(new ConfirmOrdersMove());
            gameState.executeMove(new EndMovementsMove());
            gameState.executeMove(new EndBattlesMove());

            const replenishMove = gameState.legalMoves().find(m => m instanceof ReplenishHandMove);
            gameState.executeMove(replenishMove!);

            // Bottom player should have 3 cards again (2 remaining + 1 drawn)
            expect(gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toHaveLength(3);
        });

        it("should draw a replacement card for top player when turn completes", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
            gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

            // Complete bottom player's turn to switch to top player
            const bottomCard = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
            gameState.executeMove(new PlayCardMove(bottomCard));
            gameState.executeMove(new ConfirmOrdersMove());
            gameState.executeMove(new EndMovementsMove());
            gameState.executeMove(new EndBattlesMove());

            const bottomReplenishMove = gameState.legalMoves().find(m => m instanceof ReplenishHandMove);
            gameState.executeMove(bottomReplenishMove!);

            expect(gameState.activePlayer.position).toBe(Position.TOP);

            // Play a card and complete the turn
            const [card] = gameState.getCardsInLocation(CardLocation.TOP_PLAYER_HAND);
            gameState.executeMove(new PlayCardMove(card));
            gameState.executeMove(new ConfirmOrdersMove());
            gameState.executeMove(new EndMovementsMove());
            gameState.executeMove(new EndBattlesMove());

            const replenishMove = gameState.legalMoves().find(m => m instanceof ReplenishHandMove);
            gameState.executeMove(replenishMove!);

            // Top player should have 3 cards again
            expect(gameState.getCardsInLocation(CardLocation.TOP_PLAYER_HAND)).toHaveLength(3);
        });

        it("should clear ordered units when turn completes", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
            const [card] = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);

            // Set up: place a unit
            const unit = new Infantry(Side.ALLIES);
            const coord = hexOf(5, 3);
            gameState.placeUnit(coord, unit);

            // Play a card and order a unit
            gameState.executeMove(new PlayCardMove(card));
            gameState.executeMove(new OrderUnitMove(unit));
            expect(gameState.isUnitOrdered(unit)).toBe(true);

            // Complete turn
            gameState.executeMove(new ConfirmOrdersMove());
            gameState.executeMove(new EndMovementsMove());
            gameState.executeMove(new EndBattlesMove());

            const replenishMove = gameState.legalMoves().find(m => m instanceof ReplenishHandMove);
            gameState.executeMove(replenishMove!);

            // Ordered units should be cleared
            expect(gameState.isUnitOrdered(unit)).toBe(false);
        });

        it("should switch active player when turn completes", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
            const [card] = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);

            expect(gameState.activePlayer.position).toBe(Position.BOTTOM);

            // Play a card and complete turn
            gameState.executeMove(new PlayCardMove(card));
            gameState.executeMove(new ConfirmOrdersMove());
            gameState.executeMove(new EndMovementsMove());
            gameState.executeMove(new EndBattlesMove());

            const replenishMove = gameState.legalMoves().find(m => m instanceof ReplenishHandMove);
            gameState.executeMove(replenishMove!);

            // Player should have switched
            expect(gameState.activePlayer.position).toBe(Position.TOP);
        });

        it("should push PlayCardPhase for next player when turn completes", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
            const [card] = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);

            // Play a card and complete turn
            gameState.executeMove(new PlayCardMove(card));
            gameState.executeMove(new ConfirmOrdersMove());
            gameState.executeMove(new EndMovementsMove());
            gameState.executeMove(new EndBattlesMove());

            const replenishMove = gameState.legalMoves().find(m => m instanceof ReplenishHandMove);
            gameState.executeMove(replenishMove!);

            // Should have PlayCardPhase on stack
            expect(gameState.activePhase.name).toBe("Play Card");
        });
    });

    describe("MoveUnitMove integration", () => {
        it("should move unit from one coordinate to another when executed", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            const unit = new Infantry(Side.ALLIES);
            const from = hexOf(5, 3);
            const to = hexOf(6, 3);

            gameState.placeUnit(from, unit);
            const move = new MoveUnitMove(from, to);

            gameState.executeMove(move);

            expect(gameState.getUnitAt(from)).toBeUndefined();
            expect(gameState.getUnitAt(to)).toBe(unit);
        });

        it("should mark unit as moved when MoveUnitMove is executed", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            const unit = new Infantry(Side.ALLIES);
            const from = hexOf(5, 3);
            const to = hexOf(6, 3);

            gameState.placeUnit(from, unit);
            expect(gameState.isUnitMoved(unit)).toBe(false);

            const move = new MoveUnitMove(from, to);
            gameState.executeMove(move);

            expect(gameState.isUnitMoved(unit)).toBe(true);
        });

        it("should throw error when trying to move unit that is not at from coordinate", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            const from = hexOf(5, 3);
            const to = hexOf(6, 3);

            const move = new MoveUnitMove(from, to);

            expect(() => gameState.executeMove(move)).toThrow();
        });
    });

    describe("finishSetup", () => {
        it("should freeze terrain map", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            gameState.setTerrain(hexOf(5, 5), woodsTerrain);

            gameState.finishSetup();

            // Attempting to modify terrain after finishSetup should throw
            expect(() => {
                gameState.setTerrain(hexOf(6, 6), hillTerrain);
            }).toThrow();
        });

        it("should allow cloned GameState to share frozen terrain map with original", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);
            gameState.setTerrain(hexOf(5, 5), woodsTerrain);
            gameState.finishSetup();

            const cloned = gameState.clone();

            // Both should have the same terrain
            expect(cloned.getTerrain(hexOf(5, 5))).toBe(woodsTerrain);

            // Both should reference the same terrain instance (shared, not cloned)
            expect(cloned.getTerrain(hexOf(5, 5))).toBe(gameState.getTerrain(hexOf(5, 5)));
        });
    });

    describe("activePlayer with temporary player switch", () => {
        // Mock phase that implements temporary player switch
        class MockPhaseWithSwitch implements Phase {
            readonly name = "Mock Phase with Switch";
            readonly type = PhaseType.BATTLE;
            readonly temporaryPlayerSwitch = true;

            legalMoves(_gameState: GameState): Array<Move> {
                return [];
            }
        }

        // Mock phase without temporary player switch
        class MockPhaseWithoutSwitch implements Phase {
            readonly name = "Mock Phase without Switch";
            readonly type = PhaseType.BATTLE;

            // temporaryPlayerSwitch is undefined (defaults to false)

            legalMoves(_gameState: GameState): Array<Move> {
                return [];
            }
        }

        interface ActivePlayerTestCase {
            name: string;
            initialPlayerIndex: 0 | 1;
            phaseHasSwitch: boolean;
            expectedPlayerPosition: Position;
        }

        describe("temporary player switch behavior", () => {
            const cases: ActivePlayerTestCase[] = [
                {
                    name: "bottom player without switch returns bottom player",
                    initialPlayerIndex: 0,
                    phaseHasSwitch: false,
                    expectedPlayerPosition: Position.BOTTOM,
                },
                {
                    name: "bottom player with switch returns top player",
                    initialPlayerIndex: 0,
                    phaseHasSwitch: true,
                    expectedPlayerPosition: Position.TOP,
                },
                {
                    name: "top player without switch returns top player",
                    initialPlayerIndex: 1,
                    phaseHasSwitch: false,
                    expectedPlayerPosition: Position.TOP,
                },
                {
                    name: "top player with switch returns bottom player",
                    initialPlayerIndex: 1,
                    phaseHasSwitch: true,
                    expectedPlayerPosition: Position.BOTTOM,
                },
            ];

            it.each(cases)("$name", ({initialPlayerIndex, phaseHasSwitch, expectedPlayerPosition}) => {
                const deck = Deck.createStandardDeck();
                const gameState = new GameState(deck);

                // Set initial player
                if (initialPlayerIndex === 1) {
                    gameState.switchActivePlayer();
                }

                // Replace the active phase with our mock phase
                const phase = phaseHasSwitch ? new MockPhaseWithSwitch() : new MockPhaseWithoutSwitch();
                gameState.replacePhase(phase);

                // Check active player
                expect(gameState.activePlayer.position).toBe(expectedPlayerPosition);
            });
        });
    });
});
