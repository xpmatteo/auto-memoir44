Play the Memoir '44 boardgame from Days Of Wonder against a human opponent

Work in progress.  Don't hold your breath!


REFACTOR

- BattleMove should receive SituatedUnits.  Once we have this
  - BattleMove can implement isCloseCombat with no need to refer to GameState
  - we can remove the cast as GameState in BattlePhase
  - we can implement better toString in moves, which will lead to more expressive AT
- refactor to use interface segregation: 
    - tests/unit/ReplenishHandMove.test.ts (lines 1-20)
    - tests/unit/GameVictoryMove.test.ts (lines 44-63)
- the array of players has redundant information; player 0 should always be the one at the bottom?
- use Flyweight with HexCoord
- rename Bottom = South, Top = North for consistency

- Their finest hour: +1 dice on overrun too
- should infantry advance and then battle again with bombard?
- 

RULES
- terrain
    - battle out for armor
    - hills: LOS
    - impassable terrain: must extend retreatPaths logic
    - cannot take ground to/out of hedgerows in some cases

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

TODO Operation Cobra
- impassable terrain
- river terrain
- bridge terrain
- temporary medal objectives
- elite armor

TODO Pegasus bridge
- onReplenishHand() in scenario
- save the scenario in the game
- wire
- impassable terrain
- river terrain
- bridge terrain
- temporary medal objectives

TODO Sword Beach
- wire
- hedgehogs
- bunkers (impassable by armor)
- artillery
- elite infantry
- British Commands badge
- sea, shore, beach terrain
- temporary medal objectives

Later
- persistency
- export game state
- scenario chooser
