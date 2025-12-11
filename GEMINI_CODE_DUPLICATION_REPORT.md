1. Exact Code Duplication (High Priority)
Location: src/utils/hex.ts
Findings:
 - The file contains two identical functions: axialRound (exported) and
   hexRound (internal).
 - Both implement the exact same cube-coordinate rounding algorithm.
 - hasLineOfSight uses the internal hexRound, while the rest of the
   application uses axialRound.

Action: Remove hexRound and update hasLineOfSight to use axialRound.

2. Functional Duplication & Legacy Code
Location: src/utils/hex.ts vs. doc/hexlib.js
Findings:
 - src/utils/hex.ts is a TypeScript port of the logic in doc/hexlib.js.
 - doc/hexlib.js is not used by the application bundle but exists in the
   codebase with its own tests.
 - This creates a maintenance risk where fixes might be applied to one but
   not the other.

Action: Delete doc/hexlib.js and doc/hexlib.test.js once you are confident
the TypeScript implementation is fully robust.

3. Scenario Setup Boilerplate
Location: src/scenarios/ (e.g., ST02.ts, TestAIAggression.ts)
Findings:
 - Scenarios share significant boilerplate code in their createGameState
   methods:
   - Calling createStandardGameState(rng).
   - Drawing specific numbers of cards for each player.
   - calling parseAndSetupUnits.
 - While not strict "copy-paste" duplication, the pattern is repetitive.

Action: Consider refactoring this into a ScenarioBuilder or a configurable
factory function to reduce the setup code in individual scenario files (e.g.,
ScenarioBuilder.withUnits(layout).withHandSize(5, 4).build()).

4. Move Logic
Location: src/domain/moves/
Findings:
 - MoveUnitMove and BattleMove share the structure of command pattern
   execution (execute, undo, toString) via the Move base class.
 - No problematic logic duplication was found between these two specific
   files; they handle distinct game phases (Movement vs. Combat) with
   different rules.