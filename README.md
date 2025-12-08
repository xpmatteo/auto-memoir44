Play the Memoir '44 boardgame from Days Of Wonder against a human opponent

Work in progress.  Don't hold your breath!


REFACTOR


Asked CC to find opportunities to use intf segregation

The methods used by BattleMove could be reduced
- a single eliminateUnit method could be used instead of two
- many info methods could be all replaced by getAllUnits


 several opportunities to
   use interface segregation like the RetreatMove tests. Here's what I found:

  Tests That Could Benefit from Interface Segregation

  1. tests/unit/moves/BattleMove.test.ts (lines 1-315)

  Currently creates a full GameState with Deck and Dice for each test. While the ABOUTME
   says "Integration tests", the BattleMove class only needs these methods:
  - rollDice()
  - incrementUnitBattlesThisTurn()
  - getUnitCurrentStrength() / setUnitCurrentStrength()
  - getFortification()
  - moveUnit()
  - pushPhase()
  - getAllUnitsWithPositions()
  - removeUnit()
  - addToMedalTable()

  Could create a UnitBattler interface similar to UnitRetreater.

  2. tests/unit/moves/MoveUnitMove.test.ts (lines 1-213)

  Creates full GameState for each test. MoveUnitMove only needs:
  - getUnitAt()
  - moveUnit()
  - markUnitMoved() / unMarkUnitMoved()
  - markUnitSkipsBattle() / unMarkUnitSkipsBattle()
  - getTerrain()
  - getOrderedUnits()
  - isUnitMoved()
  - popPhase()

  Could create a MovementExecutor interface.

  3. tests/unit/ReplenishHandMove.test.ts (lines 1-20)

  Creates full GameState and Deck. ReplenishHandMove only needs:
  - discardActiveCard()
  - drawSpecificCard()
  - popPhase()

  Could create a HandReplenisher interface with just these 3 methods.

  4. tests/unit/GameVictoryMove.test.ts (lines 44-63)

  The execute() test creates a full GameState, but GameVictoryMove.execute() is
  literally a no-op - it doesn't call any methods! The test could just pass an empty
  object: move.execute({} as any).

  Already Using Interface Segregation Well ✓

  These tests are already following the pattern:
  - tests/unit/RetreatMove.test.ts - Uses UnitRetreater interface
  - tests/unit/phases/BattlePhase.test.ts - Uses FakeUnitBattler
  - tests/unit/phases/MovePhase.test.ts - Uses FakeUnitMover
  - tests/unit/phases/OrderUnitsPhase.test.ts - Uses fakeUnitsorder

  The main opportunities are in the Move classes. Would you like me to refactor any of
  these tests to use interface segregation?
  



the array of players has redundant information; player 0 should always be the one at the bottom?
use hex.key() everywhere 

TODO
- hexOf, put key method in HexCoord
- tactics cards
- take ground
- armor overrun
- auto advance phases
- game log

- UI
  - make the number of cards remaining in the deck permanent 

- AI
  - deploy inactive units
  - protect weak units
  - take cover
  - keep own retreat paths open 
  - close enemy retreat paths

- terrain
  - battle out for armor
  - hills: LOS
  - impassable terrain: must extend retreatPaths logic

- other fortifications
- line-of-sight across hex edges for artillery
- persistency
- export game state
- scenario chooser
