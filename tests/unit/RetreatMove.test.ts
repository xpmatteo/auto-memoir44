// ABOUTME: Tests for retreat mechanics after flag battle results

import {describe, expect, it} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {Infantry} from "../../src/domain/Unit";
import {HexCoord} from "../../src/utils/hex";
import {Side, Position} from "../../src/domain/Player";
import {RetreatMove} from "../../src/domain/moves/Move";
import {diceReturning} from "../../src/domain/Dice";
import {RESULT_FLAG, RESULT_INFANTRY} from "../../src/domain/Dice";
import {RetreatPhase} from "../../src/domain/phases/RetreatPhase";
import {BattleMove} from "../../src/domain/moves/BattleMove";

describe("Retreat mechanics", () => {
    describe("Flag results force retreat", () => {
        it("should automatically retreat when only one path available for top player", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturning([RESULT_FLAG]); // One flag result
            const gameState = new GameState(deck, dice);

            // Place attacker (bottom player) and target (top player at 5,3)
            // Top player retreats NW or NE
            const attacker = new Infantry(Side.ALLIES);
            const target = new Infantry(Side.AXIS, 3);
            gameState.placeUnit(new HexCoord(5, 4), attacker);
            gameState.placeUnit(new HexCoord(5, 3), target);

            // Block one retreat path (NE is blocked at 6,2)
            const blocker = new Infantry(Side.AXIS);
            gameState.placeUnit(new HexCoord(6, 2), blocker);

            // Execute battle - should result in automatic retreat to NW (5,2)
            const battleMove = new BattleMove(attacker, target, 1);
            battleMove.execute(gameState);

            // Target should have retreated to NW (5, 2)
            expect(gameState.getUnitAt(new HexCoord(5, 2))).toBe(target);
            expect(gameState.getUnitAt(new HexCoord(5, 3))).toBeUndefined();
        });

        it("should automatically retreat when only one path available for bottom player", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturning([RESULT_FLAG]);
            const gameState = new GameState(deck, dice);

            // Place attacker (top player) and target (bottom player at 5,5)
            // Bottom player retreats SW or SE
            const attacker = new Infantry(Side.AXIS);
            const target = new Infantry(Side.ALLIES, 3);
            gameState.placeUnit(new HexCoord(5, 4), attacker);
            gameState.placeUnit(new HexCoord(5, 5), target);

            // Block one retreat path (SW is blocked at 4,6)
            const blocker = new Infantry(Side.ALLIES);
            gameState.placeUnit(new HexCoord(4, 6), blocker);

            // Execute battle - should result in automatic retreat to SE (5,6)
            const battleMove = new BattleMove(attacker, target, 1);
            battleMove.execute(gameState);

            // Target should have retreated to SE (5, 6)
            expect(gameState.getUnitAt(new HexCoord(5, 6))).toBe(target);
            expect(gameState.getUnitAt(new HexCoord(5, 5))).toBeUndefined();
        });

        it("should push RetreatPhase when multiple retreat paths available", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturning([RESULT_FLAG]);
            const gameState = new GameState(deck, dice);

            // Place attacker and target
            const attacker = new Infantry(Side.ALLIES);
            const target = new Infantry(Side.AXIS, 3);
            gameState.placeUnit(new HexCoord(5, 4), attacker);
            gameState.placeUnit(new HexCoord(5, 3), target);

            // Execute battle - should push RetreatPhase
            const battleMove = new BattleMove(attacker, target, 1);
            battleMove.execute(gameState);

            // Should have RetreatPhase active
            expect(gameState.activePhase.name).toBe("Retreat");
            expect(gameState.activePhase.type).toBe("retreat");

            // Target should still be at original position
            expect(gameState.getUnitAt(new HexCoord(5, 3))).toBe(target);
        });

        it("should apply hit when no retreat paths available", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturning([RESULT_FLAG]);
            const gameState = new GameState(deck, dice);

            // Place attacker and target
            const attacker = new Infantry(Side.ALLIES);
            const target = new Infantry(Side.AXIS, 2); // 2 strength
            gameState.placeUnit(new HexCoord(5, 4), attacker);
            gameState.placeUnit(new HexCoord(5, 3), target);

            // Block both retreat paths
            const blocker1 = new Infantry(Side.AXIS);
            const blocker2 = new Infantry(Side.AXIS);
            gameState.placeUnit(new HexCoord(5, 2), blocker1); // Blocks NW
            gameState.placeUnit(new HexCoord(6, 2), blocker2); // Blocks NE

            // Execute battle
            const battleMove = new BattleMove(attacker, target, 1);
            battleMove.execute(gameState);

            // Target should take a hit (2 -> 1)
            expect(gameState.getUnitCurrentStrength(target)).toBe(1);
            expect(gameState.getUnitAt(new HexCoord(5, 3))).toBe(target);
        });

        it("should eliminate unit when no retreat paths available and at 1 strength", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturning([RESULT_FLAG]);
            const gameState = new GameState(deck, dice);

            // Place attacker and target
            const attacker = new Infantry(Side.ALLIES);
            const target = new Infantry(Side.AXIS, 1); // 1 strength
            gameState.placeUnit(new HexCoord(5, 4), attacker);
            gameState.placeUnit(new HexCoord(5, 3), target);

            // Block both retreat paths
            const blocker1 = new Infantry(Side.AXIS);
            const blocker2 = new Infantry(Side.AXIS);
            gameState.placeUnit(new HexCoord(5, 2), blocker1);
            gameState.placeUnit(new HexCoord(6, 2), blocker2);

            // Execute battle
            const battleMove = new BattleMove(attacker, target, 1);
            battleMove.execute(gameState);

            // Target should be eliminated
            expect(gameState.getUnitAt(new HexCoord(5, 3))).toBeUndefined();
            expect(gameState.getMedalTable(0)).toContain(target);
        });

        it("should not trigger retreat when eliminated by hits", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturning([RESULT_INFANTRY, RESULT_INFANTRY, RESULT_FLAG]);
            const gameState = new GameState(deck, dice);

            // Place attacker and target
            const attacker = new Infantry(Side.ALLIES);
            const target = new Infantry(Side.AXIS, 2); // 2 strength, will be killed by 2 hits
            gameState.placeUnit(new HexCoord(5, 4), attacker);
            gameState.placeUnit(new HexCoord(5, 3), target);

            // Execute battle
            const battleMove = new BattleMove(attacker, target, 3);
            battleMove.execute(gameState);

            // Target should be eliminated, no retreat phase
            expect(gameState.getUnitAt(new HexCoord(5, 3))).toBeUndefined();
            expect(gameState.activePhase.name).not.toBe("Retreat");
        });
    });

    describe("RetreatPhase with temporary player switch", () => {
        it("should have temporaryPlayerSwitch enabled", () => {
            const target = new Infantry(Side.AXIS);
            const phase = new RetreatPhase(
                target,
                new HexCoord(5, 3),
                [new HexCoord(5, 2), new HexCoord(6, 2)]
            );

            expect(phase.temporaryPlayerSwitch).toBe(true);
        });

        it("should return RetreatMove for each available hex", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const target = new Infantry(Side.AXIS);
            const currentPos = new HexCoord(5, 3);
            const availableHexes = [new HexCoord(5, 2), new HexCoord(6, 2)];

            const phase = new RetreatPhase(target, currentPos, availableHexes);
            const moves = phase.legalMoves(gameState);

            expect(moves).toHaveLength(2);
            expect(moves[0]).toBeInstanceOf(RetreatMove);
            expect(moves[1]).toBeInstanceOf(RetreatMove);

            const move0 = moves[0] as RetreatMove;
            const move1 = moves[1] as RetreatMove;

            expect(move0.unit).toBe(target);
            expect(move0.from).toEqual(currentPos);
            expect(move0.to).toEqual(availableHexes[0]);

            expect(move1.unit).toBe(target);
            expect(move1.from).toEqual(currentPos);
            expect(move1.to).toEqual(availableHexes[1]);
        });

        it("should switch active player during retreat phase", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturning([RESULT_FLAG]);
            const gameState = new GameState(deck, dice);

            // Bottom player (ALLIES) attacks top player (AXIS)
            const attacker = new Infantry(Side.ALLIES);
            const target = new Infantry(Side.AXIS, 3);
            gameState.placeUnit(new HexCoord(5, 4), attacker);
            gameState.placeUnit(new HexCoord(5, 3), target);

            // Active player should be BOTTOM
            expect(gameState.activePlayer.position).toBe(Position.BOTTOM);

            // Execute battle - pushes RetreatPhase
            const battleMove = new BattleMove(attacker, target, 1);
            battleMove.execute(gameState);

            // Active player should now be TOP (owner of retreating unit)
            expect(gameState.activePlayer.position).toBe(Position.TOP);
        });

        it("should restore active player after retreat move", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturning([RESULT_FLAG]);
            const gameState = new GameState(deck, dice);

            // Bottom player attacks top player
            const attacker = new Infantry(Side.ALLIES);
            const target = new Infantry(Side.AXIS, 3);
            gameState.placeUnit(new HexCoord(5, 4), attacker);
            gameState.placeUnit(new HexCoord(5, 3), target);

            // Execute battle
            const battleMove = new BattleMove(attacker, target, 1);
            battleMove.execute(gameState);

            // Now execute a retreat move
            const retreatMoves = gameState.legalMoves();
            expect(retreatMoves.length).toBeGreaterThan(0);
            gameState.executeMove(retreatMoves[0]);

            // Active player should be back to BOTTOM
            expect(gameState.activePlayer.position).toBe(Position.BOTTOM);
        });
    });

    describe("RetreatMove", () => {
        it("should move unit and pop phase", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturning([RESULT_FLAG]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES);
            const target = new Infantry(Side.AXIS, 3);
            gameState.placeUnit(new HexCoord(5, 4), attacker);
            gameState.placeUnit(new HexCoord(5, 3), target);

            // Execute battle to push RetreatPhase
            const battleMove = new BattleMove(attacker, target, 1);
            battleMove.execute(gameState);

            expect(gameState.activePhase.name).toBe("Retreat");

            // Execute retreat move
            const retreatMove = new RetreatMove(target, new HexCoord(5, 3), new HexCoord(5, 2));
            retreatMove.execute(gameState);

            // Unit should be moved
            expect(gameState.getUnitAt(new HexCoord(5, 2))).toBe(target);
            expect(gameState.getUnitAt(new HexCoord(5, 3))).toBeUndefined();

            // Phase should be popped
            expect(gameState.activePhase.name).not.toBe("Retreat");
        });

        it("should call moveUnit and popPhase when retreating to a different hex", () => {
            const target = new Infantry(Side.AXIS, 3);
            const from = new HexCoord(5, 3);
            const to = new HexCoord(5, 2);

            // Create simple mock UnitRetreater
            let moveUnitCalledWith: { from: HexCoord; to: HexCoord } | undefined = undefined;
            let popPhaseCalled = false;
            const mockRetreater = {
                moveUnit: (fromArg: HexCoord, toArg: HexCoord) => {
                    moveUnitCalledWith = { from: fromArg, to: toArg };
                },
                popPhase: () => {
                    popPhaseCalled = true;
                }
            };

            // Execute retreat move where from != to (unit retreats)
            const retreatMove = new RetreatMove(target, from, to);
            retreatMove.executeRetreat(mockRetreater);

            // moveUnit should be called with correct coordinates
            expect(moveUnitCalledWith).toBeDefined();
            expect(moveUnitCalledWith!.from).toEqual(from);
            expect(moveUnitCalledWith!.to).toEqual(to);

            // popPhase should be called
            expect(popPhaseCalled).toBe(true);
        });

        it("should allow unit to stay in place when from and to are the same (ignoring flag)", () => {
            const target = new Infantry(Side.AXIS, 3);
            const targetCoord = new HexCoord(5, 3);

            // Create simple mock UnitRetreater
            let moveUnitCalled = false;
            let popPhaseCalled = false;
            const mockRetreater = {
                moveUnit: (_from: HexCoord, _to: HexCoord) => {
                    moveUnitCalled = true;
                },
                popPhase: () => {
                    popPhaseCalled = true;
                }
            };

            // Execute retreat move where from == to (unit stays in place)
            const retreatMove = new RetreatMove(target, targetCoord, targetCoord);
            retreatMove.executeRetreat(mockRetreater);

            // moveUnit should NOT be called (unit stays in place)
            expect(moveUnitCalled).toBe(false);

            // popPhase should be called
            expect(popPhaseCalled).toBe(true);
        });
    });
});
