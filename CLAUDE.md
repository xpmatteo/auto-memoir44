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
- Canvas dimensions: 2007×1417 (matches board image)
- Current implementation in `src/main.ts` shows hex grid overlay on board image
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

## Key Architectural Constraints

- Scenarios are selected via query parameter: `?scenario=ST02`
- Optional `seed` query parameter for reproducible RNG (dice rolls and AI decisions)
- Game state auto-saves to browser storage after each change
- Auto-resume on page load with full turn context

