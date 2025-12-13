Play the Memoir '44 boardgame from Days Of Wonder against a human opponent

Work in progress.  Don't hold your breath!


REFACTOR

- BattleMove should receive SituatedUnits.  Once we have this
  - BattleMove can implement isCloseCombat with no need to refer to GameState
  - we can remove the cast as GameState in BattlePhase
- refactor to use interface segregation: 
    - tests/unit/ReplenishHandMove.test.ts (lines 1-20)
    - tests/unit/GameVictoryMove.test.ts (lines 44-63)
- the array of players has redundant information; player 0 should always be the one at the bottom?
- use HexCoord.key() everywhere 
- use Fliweight with HexCoord
- rename Bottom = South, Top = North for consistency


RULES
- terrain
    - battle out for armor
    - hills: LOS
    - impassable terrain: must extend retreatPaths logic
    - cannot take ground to/out of hedgerows in some cases
    - MoveOut: if you don't command any infantry unit...

- other fortifications
- line-of-sight across hex edges for artillery

TODO
- tactics cards
- auto advance phases
- game log

- AI
  - deploy inactive units
  - protect weak units
  - take cover
  - keep own retreat paths open 
  - close enemy retreat paths

TODO Pegasus bridge
- onReplenishHand() in scenario
- save the scenario in the game
- wire
- impassable terrain
- river terrain
- bridge terrain
- temporary medal objectives


Later
- persistency
- export game state
- scenario chooser
