import {describe, test, expect} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {Phase, PhaseType} from "../../../src/domain/phases/Phase";
import {Move} from "../../../src/domain/moves/Move";

let poppedUp = false;

class TestPhase extends Phase {
    readonly name = "Test Phase";
    readonly type = PhaseType.PLAY_CARD;

    legalMoves(_gameState: GameState): Array<Move> {
        return [];
    }

    onBeingPoppedUp() {
        poppedUp = true;
    }
}


class NoopPhase extends Phase {
    readonly name = "Noop";
    readonly type = PhaseType.PLAY_CARD;

    legalMoves(_gameState: GameState): Array<Move> {
        return [];
    }
}

describe('Phase', () => {
    test('can be instantiated', () => {
        const game = new GameState(Deck.createStandardDeck());
        game.pushPhase(new TestPhase());
        game.pushPhase(new NoopPhase());
        game.popPhase();

        expect(poppedUp, 'onBeingPoppedUp handler was called').toBe(true)
    });
});
