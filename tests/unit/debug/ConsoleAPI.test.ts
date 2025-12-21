// ABOUTME: Unit tests for ConsoleAPI - testing console commands for game testing
// ABOUTME: Tests clickHex(), playCard(), pressButton() methods

import {describe, test, expect, vi, beforeEach} from 'vitest';
import {ConsoleAPI} from '../../../src/debug/ConsoleAPI';
import {GameState} from '../../../src/domain/GameState';
import {UIState} from '../../../src/ui/UIState';
import {Deck} from '../../../src/domain/Deck';
import {hexOf} from '../../../src/utils/hex';
import {Infantry} from '../../../src/domain/Unit';
import {Side} from '../../../src/domain/Player';
import {PlayCardPhase} from '../../../src/domain/phases/PlayCardPhase';
import {OrderUnitsPhase} from '../../../src/domain/phases/OrderUnitsPhase';
import {MovePhase} from '../../../src/domain/phases/MovePhase';
import {Section, isHexInSection} from '../../../src/domain/Section';
import {SituatedUnit} from '../../../src/domain/SituatedUnit';

describe('ConsoleAPI', () => {
    let gameState: GameState;
    let uiState: UIState;
    let consoleAPI: ConsoleAPI;
    let renderCallback: () => Promise<void>;
    let renderCallCount: number;

    beforeEach(() => {
        // Create a fresh game state for each test
        const deck = Deck.createStandardDeck();
        gameState = new GameState(deck);
        uiState = new UIState();
        renderCallCount = 0;
        renderCallback = vi.fn(async () => {
            renderCallCount++;
        });
        consoleAPI = new ConsoleAPI(gameState, uiState, renderCallback);
    });

    describe('clickHex', () => {
        interface ClickHexCase {
            name: string;
            q: number;
            r: number;
            wantSuccess: boolean;
            wantMessageContains: string;
        }

        describe('validates hex coordinates', () => {
            const cases: ClickHexCase[] = [
                {
                    name: 'valid hex on board',
                    q: 5,
                    r: 3,
                    wantSuccess: false, // No unit there, but hex is valid
                    wantMessageContains: 'No unit'
                },
                {
                    name: 'invalid hex - off board',
                    q: 100,
                    r: 100,
                    wantSuccess: false,
                    wantMessageContains: 'Invalid hex'
                },
                {
                    name: 'invalid hex - negative out of bounds',
                    q: -10,
                    r: 0,
                    wantSuccess: false,
                    wantMessageContains: 'Invalid hex'
                }
            ];

            test.each(cases)('$name', async ({q, r, wantSuccess, wantMessageContains}) => {
                // Set up ORDER phase for this test
                gameState.replacePhase(
                    new OrderUnitsPhase(
                    [Section.LEFT, Section.CENTER, Section.RIGHT].map(section => ({
                        predicate: (su: SituatedUnit) => isHexInSection(su.coord, section, gameState.activePlayer.position),
                        maxCount: 10
                    }))
                )
                );

                const result = await consoleAPI.clickHex(q, r);
                expect(result.success).toBe(wantSuccess);
                expect(result.message).toContain(wantMessageContains);
            });
        });

        test('orders a unit during ORDER phase', async () => {
            // Setup: Place a unit and set up ORDER phase
            const unit = new Infantry(Side.ALLIES, 4);
            const coord = hexOf(5, 3);
            gameState.placeUnit(coord, unit);
            gameState.replacePhase(
                new OrderUnitsPhase(
                    [Section.LEFT, Section.CENTER, Section.RIGHT].map(section => ({
                        predicate: (su: SituatedUnit) => isHexInSection(su.coord, section, gameState.activePlayer.position),
                        maxCount: 10
                    }))
                )
            );

            const result = await consoleAPI.clickHex(5, 3);

            expect(result.success).toBe(true);
            expect(result.message).toContain('Ordered unit');
            expect(gameState.isUnitOrdered(unit)).toBe(true);
            expect(renderCallCount).toBe(1);
        });

        test('selects unit for movement during MOVE phase', async () => {
            // Setup: Place and order a unit, then enter MOVE phase
            const unit = new Infantry(Side.ALLIES, 4);
            const coord = hexOf(5, 3);
            gameState.placeUnit(coord, unit);
            gameState.orderUnit(unit);
            gameState.replacePhase(new MovePhase());

            const result = await consoleAPI.clickHex(5, 3);

            expect(result.success).toBe(true);
            expect(result.message).toContain('Selected unit');
            expect(uiState.selectedUnit).toBe(unit);
            expect(uiState.selectedUnitLocation).toEqual(coord);
            expect(renderCallCount).toBe(1);
        });

        test('deselects unit when clicking on it again during MOVE phase', async () => {
            // Setup: Place and order a unit, enter MOVE phase, select it
            const unit = new Infantry(Side.ALLIES, 4);
            const coord = hexOf(5, 3);
            gameState.placeUnit(coord, unit);
            gameState.orderUnit(unit);
            gameState.replacePhase(new MovePhase());

            // Select the unit first
            await consoleAPI.clickHex(5, 3);
            expect(uiState.selectedUnit).toBe(unit);

            // Click again to deselect
            const result = await consoleAPI.clickHex(5, 3);

            expect(result.success).toBe(true);
            expect(result.message).toContain('Deselected');
            expect(uiState.selectedUnit).toBeNull();
            expect(renderCallCount).toBe(2);
        });
    });

    describe('playCard', () => {
        beforeEach(() => {
            // Draw cards for the active player and start in PlayCardPhase
            gameState.drawCards(4, gameState.activePlayerHand);
            gameState.replacePhase(new PlayCardPhase());
        });

        test('plays a valid card', async () => {
            // Get a card from the active player's hand
            const hand = gameState.getCardsInLocation(gameState.activePlayerHand);
            const card = hand[0];

            const result = await consoleAPI.playCard(card.id);

            expect(result.success).toBe(true);
            expect(result.message).toContain('Played card');
            expect(renderCallCount).toBe(1);
        });

        test('returns error for invalid card ID', async () => {
            const result = await consoleAPI.playCard('invalid-card-id');

            expect(result.success).toBe(false);
            expect(result.message).toContain('not found');
            expect(renderCallCount).toBe(0);
        });

        test('returns error when not in PlayCard phase', async () => {
            // Change to a different phase
            gameState.replacePhase(
                new OrderUnitsPhase(
                    [Section.LEFT, Section.CENTER, Section.RIGHT].map(section => ({
                        predicate: (su: SituatedUnit) => isHexInSection(su.coord, section, gameState.activePlayer.position),
                        maxCount: 10
                    }))
                )
            );

            const result = await consoleAPI.playCard('any-card-id');

            expect(result.success).toBe(false);
            expect(result.message).toContain('No cards available');
            expect(renderCallCount).toBe(0);
        });
    });

    describe('pressButton', () => {
        test('presses Confirm Orders button', async () => {
            // Setup: Enter ORDER phase
            gameState.replacePhase(
                new OrderUnitsPhase(
                    [Section.LEFT, Section.CENTER, Section.RIGHT].map(section => ({
                        predicate: (su: SituatedUnit) => isHexInSection(su.coord, section, gameState.activePlayer.position),
                        maxCount: 10
                    }))
                )
            );

            const result = await consoleAPI.pressButton('Confirm Orders');

            expect(result.success).toBe(true);
            expect(result.message).toContain('Pressed button');
            expect(renderCallCount).toBe(1);
        });

        test('presses End Movements button', async () => {
            // Setup: Enter MOVE phase
            gameState.replacePhase(new MovePhase());

            const result = await consoleAPI.pressButton('End Movements');

            expect(result.success).toBe(true);
            expect(result.message).toContain('Pressed button');
            expect(renderCallCount).toBe(1);
        });

        test('returns error for non-existent button', async () => {
            gameState.replacePhase(new MovePhase());

            const result = await consoleAPI.pressButton('Nonexistent Button');

            expect(result.success).toBe(false);
            expect(result.message).toContain('not found');
            expect(renderCallCount).toBe(0);
        });

        test('returns error when no buttons available', async () => {
            // PlayCardPhase typically has no buttons (moves have callbacks instead)
            gameState.replacePhase(new PlayCardPhase());

            const result = await consoleAPI.pressButton('Any Button');

            expect(result.success).toBe(false);
            expect(result.message).toContain('No buttons available');
            expect(renderCallCount).toBe(0);
        });

        test('button press is case insensitive', async () => {
            gameState.replacePhase(
                new OrderUnitsPhase(
                    [Section.LEFT, Section.CENTER, Section.RIGHT].map(section => ({
                        predicate: (su: SituatedUnit) => isHexInSection(su.coord, section, gameState.activePlayer.position),
                        maxCount: 10
                    }))
                )
            );

            const result = await consoleAPI.pressButton('confirm orders');

            expect(result.success).toBe(true);
            expect(result.message).toContain('Pressed button');
        });
    });

    describe('render callback integration', () => {
        test('all action methods trigger render callback', async () => {
            // Test playCard
            gameState.drawCards(4, gameState.activePlayerHand);
            gameState.replacePhase(new PlayCardPhase());
            const hand = gameState.getCardsInLocation(gameState.activePlayerHand);
            await consoleAPI.playCard(hand[0].id);
            const renderCountAfterCard = renderCallCount;
            expect(renderCountAfterCard).toBeGreaterThan(0);

            // Test clickHex (ordering a unit)
            const unit = new Infantry(Side.ALLIES, 4);
            gameState.placeUnit(hexOf(5, 3), unit);
            gameState.replacePhase(
                new OrderUnitsPhase(
                    [Section.LEFT, Section.CENTER, Section.RIGHT].map(section => ({
                        predicate: (su: SituatedUnit) => isHexInSection(su.coord, section, gameState.activePlayer.position),
                        maxCount: 10
                    }))
                )
            );
            await consoleAPI.clickHex(5, 3);
            expect(renderCallCount).toBeGreaterThan(renderCountAfterCard);

            // Test pressButton
            const renderCountBeforeButton = renderCallCount;
            await consoleAPI.pressButton('Confirm Orders');
            expect(renderCallCount).toBeGreaterThan(renderCountBeforeButton);
        });
    });
});
