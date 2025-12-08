Play the Memoir '44 boardgame from Days Of Wonder against a human opponent

Work in progress.  Don't hold your breath!


REFACTOR

- refactor to use interface segregation: 
    - tests/unit/ReplenishHandMove.test.ts (lines 1-20)
    - tests/unit/GameVictoryMove.test.ts (lines 44-63)
- the array of players has redundant information; player 0 should always be the one at the bottom?
- use HexCoord.key() everywhere 
- use Fliweight with HexCoord
- rename Bottom = South, Top = North for consistency

TODO
- tactics cards
- take ground
- armor overrun
- auto advance phases
- game log

- UI
  - make the number of cards remaining in the deck permanent 
  - show dice rolled

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
