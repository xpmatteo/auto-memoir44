# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser-based Memoir '44 board game implementation using TypeScript + Vite. No server, canvas-based UI, state persists to browser storage. See `doc/BRIEF.md` for high-level context and `doc/SPEC.md` for detailed requirements.

## Commands

```bash
# Development server with hot reload (runs on port 5173)
npm run dev

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

```
memoir/
├── src/
│   ├── main.ts                      # Entry point, bootstraps the game
│   ├── style.css                    # Global styles
│   │
│   ├── domain/                      # Game domain models & core logic
│   │   ├── GameState.ts            # Main state with legalMoves/executeMove
│   │   ├── Move.ts                 # Move types and definitions
│   │   ├── Unit.ts                 # Unit class (type, strength, location)
│   │   ├── Terrain.ts              # Terrain types and effects
│   │   ├── CommandCard.ts          # Command card model
│   │   ├── Section.ts              # Board section logic (left/center/right)
│   │   └── Player.ts               # Player model (hand, units, etc)
│   │
│   ├── adapters/                    # External system adapters
│   │   ├── RNG.ts                  # Seeded random number generator
│   │   └── storage.ts              # Browser storage persistence
│   │
│   ├── scenarios/                   # Scenario definitions
│   │   ├── Scenario.ts             # Scenario interface/type
│   │   ├── ST02.ts                 # Sainte-Mère-Église scenario
│   │   └── index.ts                # Scenario registry
│   │
│   ├── ai/                          # AI player implementation
│   │   ├── AIPlayer.ts             # Main AI interface
│   │   └── strategies/             # AI strategy implementations
│   │       └── basic.ts            # Basic AI strategy
│   │
│   ├── ui/                          # UI components and rendering
│   │   ├── canvas/                 # Canvas-based rendering
│   │   │   ├── CanvasRenderer.ts   # Main rendering coordinator
│   │   │   ├── BoardRenderer.ts    # Board and terrain rendering
│   │   │   ├── UnitRenderer.ts     # Unit sprite rendering
│   │   │   ├── HexGrid.ts          # Hex grid overlay
│   │   │   └── coordinates.ts      # Coordinate conversions
│   │   │
│   │   ├── components/             # Non-canvas UI components
│   │   │   ├── HandDisplay.ts      # Command card hand display
│   │   │   ├── Controls.ts         # Game controls (undo, reset, etc)
│   │   │   └── StatusDisplay.ts    # Turn/phase status
│   │   │
│   │   └── input/                  # Input handling
│   │       ├── MouseHandler.ts     # Mouse events
│   │       └── KeyboardHandler.ts  # Keyboard shortcuts
│   │
│   ├── rules/                       # Game rules engine
│   │   ├── movement.ts             # Movement rules
│   │   ├── combat.ts               # Combat resolution
│   │   ├── cards.ts                # Card effect rules
│   │   └── validation.ts           # Move validation logic
│   │
│   └── utils/                       # Shared utilities
│       ├── hex.ts                  # Hex math utilities
│       ├── geometry.ts             # Canvas geometry helpers
│       └── assets.ts               # Asset loading utilities
│
├── tests/                           # Test suite (ATDD workflow)
│   ├── acceptance/                 # Acceptance tests
│   ├── integration/                # Integration tests
│   └── unit/                       # Unit tests
│
├── public/images/                   # Static assets
└── [config files]
```

**Key principles:**
- `domain/` contains pure game logic (GameState, Move, Unit, etc.)
- `adapters/` contains external system integrations (RNG, storage)
- `ui/` handles all rendering and user interaction
- `rules/` implements game mechanics used by GameState
- Build incrementally as features are added

## Key Architectural Constraints

- Scenarios are selected via query parameter: `?scenario=ST02`
- Optional `seed` query parameter for reproducible RNG (dice rolls and deck shuffling)
- Auto-resume on page load with full turn context

## Notes
- Important: never restart the vite server.  It is always running and it hot-reloads changes
- Always use named constants for enumerations
- Check out the vite server log in `vite.log`
- ALWAYS prefer to throw an error instead of silently doing nothing