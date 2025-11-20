# Overview

We are building a computerized version of the Memoir '44 boardgame, that allows a human player to play against an AI opponent.


# Technology

Web application, coded in Typescript with Vite, that runs without a server.  Game state is saved to browser storage.

The UI is based on an HTML canvas.  Whenever the game state changes, the canvas is drawn again.

# Model


The central object is the `GameState`, that has a `legalMoves` method that returns a list of legal moves for the player.  It also has an `executeMove` method, that takes one of the moves returned by `legalMoves` and executes it in the GameState.

Other important objects in the Model: `Scenario` is an immutable object that is capable of setting up the units for both players, and will eventually implement scenario-specific game rules.


# Development process

We progress with small increments: at the end of each increment, it should be possible to demo the new feature through the game UI. This includes building special UI just for the purpose of showing a specific thing.

The core model of the game is developed with ATDD, with Acceptance Tests proving that each feature works correctly.

# AI

The AI Player initially will perform a random valid move, for MVP sake.  We want to be able to eventually plug in different AI player implementations.