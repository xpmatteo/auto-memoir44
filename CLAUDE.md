# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser-based Memoir '44 board game implementation using TypeScript + Vite. No server, canvas-based UI, state persists to browser storage. See `doc/BRIEF.md` for high-level context and `doc/SPEC.md` for detailed requirements.

## Commands

```bash
# Development server with hot reload (runs on port 5173)
npm run dev

# Run tests in watch mode
npm test

# Run tests once (with type checking)
npm run test:run

# Type checking only
npm run typecheck

# Production build
npm run build

# Preview production build
npm run preview
```

## Core Architecture

### The GameState Pattern

All game logic flows through the `GameState` object:
- `legalMoves()` returns all valid moves for the active player
- `executeMove(move)` applies a move and updates state

**Critical**: Never implement game logic that bypasses this pattern. All state changes must go through `executeMove()` with moves from `legalMoves()`.

### Phase-Based Turn Structure

The game uses a phase system to manage turn progression. Each turn consists of phases that execute sequentially. Typically they are:

1. **PlayCardPhase** - Active player selects a command card from their hand
2. **OrderUnitsPhase** - Active player orders units in the section(s) specified by the card
3. **MovePhase** - Active player moves ordered units (with pathfinding and unit blocking)
4. **BattlePhase** - Active player battles with ordered units (within range, respecting close combat rules)

Each phase implements the `Phase` interface:
```typescript
interface Phase {
    readonly name: string;
    legalMoves(gameState: GameState): Array<Move>;
}
```

**Key principles:**
- Phases are managed as a stack in GameState - `activePhase` returns the top of the stack
- `GameState.legalMoves()` delegates to `activePhase.legalMoves(gameState)`
- Executing certain moves (e.g., PlayCardMove) pushes new phases onto the stack
- The card decides the sequence of phases that will make up the turn. Some tactics cards will use non-standard phase sequences.
- End-of-phase moves (e.g., ConfirmOrdersMove, EndMovementsMove, EndBattlesMove) pop phases off the stack
- When the phases stack is empty, the turn is finished; all turn-related state is reset, and the other player becomes the active player
- Phases are stateless
- Phase classes use interface segregation (e.g., `UnitMover`, `UnitBattler`) for easier testing

### Canvas Rendering

- Full canvas redraw on every state change
- Non-canvas UI elements are allowed when needed (hand display, controls, etc.)

### Coordinate System

The game uses a perspective-based system where "left/center/right" sections are always relative to the active player:
- **BottomPlayer** (typically human): left = screen-left
- **TopPlayer** (typically AI): left = screen-right

Board is 13×9 hex grid using offset coordinates (q, r) with pointy-top orientation.

## Development Workflow

1. **ATDD**: Write acceptance tests first that describe user-observable behavior (see `doc/SPEC.md` "Acceptance Tests" section for examples)
2. **Incremental demos**: Each feature increment should be demonstrable through the UI, even if special UI is needed just for the demo
3. **No test skipping**: Follow the global ATDD policy

## Directory Structure

High-level organization:

- **`src/domain/`** - Pure game logic: GameState, Move types, Unit, Player, Deck, Dice, CommandCard, Section, BoardGeometry
  - **`src/domain/phases/`** - Phase implementations (PlayCardPhase, OrderUnitsPhase, MovePhase, BattlePhase)
  - **`src/domain/terrain/`** - Terrain type definitions and terrain effects
- **`src/scenarios/`** - Scenario definitions (currently ST02)
- **`src/adapters/`** - External integrations (RNG for seeded randomness)
- **`src/ai/`** - AI player implementation
- **`src/ui/`** - All UI code: canvas rendering, components, input handlers, UIState
- **`src/rules/`** - Game mechanics (combat resolution, etc.)
- **`src/utils/`** - Shared utilities (hex math, constants)
- **`tests/`** - ATDD test organization: `acceptance/` and `unit/` subdirectories
- **`public/images/`** - Static assets

**Key principles:**
- Domain layer is pure TypeScript with no UI dependencies
- Phases encapsulate turn logic and are easily testable via interface segregation
- UI layer coordinates rendering and translates user actions into moves
- Build incrementally as features are added

## Key Architectural Constraints

- Scenarios are selected via query parameter: `?scenario=ST02`
- Optional `seed` query parameter for reproducible RNG (dice rolls and deck shuffling)
- Auto-resume on page load with full turn context

## IMPORTANT: board geometry

The coordinates of the board are as follow:
1st row from 0,0 to 12,0
2nd row from 0,1 to 11,1
3rd row from -1,2 to 11,2
4th row from -1,3 to 10,3
5th row from -2,4 to 10,4
6th row from -2,5 to 9,5
7th row from -3,6 to 9,6
8th row from -3,7 tp 8,7
9th row from -4,8 to 8,8

## Notes
- Important: never restart the vite server.  It is always running and it hot-reloads changes
- Always use named constants for enumerations
- Check out the vite server log in `vite.log`
- ALWAYS prefer to throw an error instead of silently doing nothing

# Test style

Try as much as possible to write tests in a Golang tabular style like the following example:

```typescript
interface AbsCase {
  name: string
  input: number
  want: number
}

describe('abs', () => {
  const cases: AbsCase[] = [
    { name: 'zero', input: 0, want: 0 },
    { name: 'positive', input: 5, want: 5 },
    { name: 'negative', input: -7, want: 7 },
  ]

  test.each(cases)('$name', ({ input, want }) => {
    const got = abs(input)
    expect(got).toBe(want)
  })
})
```
