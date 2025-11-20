# Memoir '44 Computerized MVP – Functional Spec

## Scope
- Goal: browser-only Memoir '44 implementation with canvas UI, autoplayable Sainte-Mère-Église (ST02) plus additional demo scenarios for specific rules.
- Platform: desktop/tablet, mouse input. No server. Auto-save/resume via browser storage.
- Players: BottomPlayer (typically human) vs TopPlayer (typically AI). Either player may be Axis or Allies.

## Board & Coordinates
- Standard Memoir hex grid (13x9). Divide into left/center/right sections per active player perspective:
  - BottomPlayer: left is screen-left; TopPlayer: left is screen-right.
- Scenario setup uses a polymorphic `Setup` method to place terrain/units algorithmically.

## Units & Terrain (MVP set)
- Units: infantry, armor. Figures, movement, battle dice, retreats/flags per official Memoir '44 values.
- Terrain: clear, forest, city, hedgerows, hill, sandbags with official movement/battle/LOS effects and sandbag behavior.

## Command Cards
- Use Section cards only for MVP; deck composition TBD (pending confirmation).
- Hand size: Allies 5, Axis 4 (per Sainte-Mère-Église).
- Turn flow: play one card from hand, issue orders to eligible units per card, move, battle (player-chosen order), draw replacement.
- Undo allowed before dice are rolled.

## Turn Sequence & Rules
- Full Memoir rules for movement/battle/retreats/flags/grenades/armor retreats, terrain modifiers at range, sandbag effects.
- Battles may be reordered by the player within the same turn.
- Command sections determined by player perspective (see Board & Coordinates).

## AI
- AI plays TopPlayer by default; random legal Command card choice and random legal orders/moves/battles. Should respect seed for reproducibility.

## Seeding
- Optional query parameter `seed` drives RNG for dice and AI to enable replayable sessions.

## Scenario Selection
- No selection screen. Query parameter `scenario` selects scenario (e.g., `?scenario=ST02` for Sainte-Mère-Église). Defaults may be defined later.

## Victory Conditions
- Sainte-Mère-Église: first to 4 medals; no objective hexes. Demo scenarios define their own medal targets; none use objective hexes yet.

## Game State
- Central `GameState`:
  - `legalMoves()` returns all legal moves for active player.
  - `executeMove(move)` applies a move returned by `legalMoves`.
  - Must capture full turn phase context (card played, units ordered, movement status, battle status, dice/resolution, draw).
- Auto-save after each state change to browser storage; auto-resume on load. Resume must restore full turn context.

## Rendering & UI
- Canvas is primary surface; redraw on every state change.
- Non-canvas elements permitted if needed (e.g., hand display, controls).
- Requirements:
  - Show board with terrain, units, sandbags, sections.
  - Show current hand, active Command card, and whose turn it is.
  - Allow selecting units to order, moving them, selecting targets, rolling dice, and confirming results.
  - Display dice roll results and medal counts.
  - Indicate legal moves/selections and errors if an action is illegal.

## Acceptance Tests (Black Box)
- Describe user-observable inputs/outputs (no internal details). Examples:
  - **Load & Resume**: Input: start `?scenario=ST02`, play a turn, reload page. Expected: state resumes at start of next player’s turn with the same board, hand, and medal counts.
  - **Section Enforcement**: Input: play a Probe Left as BottomPlayer; attempt to order a center unit. Expected: center unit cannot be ordered; left-section units can be ordered/moved/battled per rules.
  - **Sandbag Defense**: Input: unit with sandbags is attacked; attacker rolls flags. Expected: defender may ignore one flag per rules; sandbags removed if defender retreats.
  - **Terrain Combat Modifiers**: Input: attack into forest/city/hedgerow at various ranges. Expected: dice and LOS restrictions match official rules; hits/retreats resolve accordingly.
  - **Victory Check**: Input: eliminate enough enemy figures to reach 4 medals in ST02. Expected: victory declared immediately, no further actions allowed.

## Open Items
- Confirm Section deck composition (card names/counts).
- Define demo scenarios and their spotlighted rules/edge cases.
