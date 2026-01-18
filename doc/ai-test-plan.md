# AI Test Plan: Readable Tests That Explain AI Reasoning

## Goal

Create tests that serve as **executable documentation** of the AI's decision-making logic. A reader should understand:
- What decision the AI faces in each phase
- What criteria the AI uses to choose
- Why option X is better than option Y

## Phases to Test

| Phase | AI Reasoning | Current Test Coverage |
|-------|-------------|----------------------|
| ORDER | Simulate full turns for each unit combination, pick highest-scoring | None |
| MOVE | Evaluate all unit orderings, then pick best destination per unit | Incomplete |
| BATTLE | Prioritize constrained attackers → weak targets → coordinated fire | None |

*Note: PLAY_CARD phase excluded - will be reimplemented*

---

## Plan

### 1. ORDER Phase: Best Unit Combination Selection

**AI Reasoning:**
- The AI has N orderable units but can only order M (where M < N)
- It generates all possible M-sized combinations
- For each combination, it simulates: order units → confirm → move all → evaluate final position
- It picks the combination yielding the highest score

**Test Strategy:**
- Create scenarios where one combination is clearly superior
- Example: 2 units near enemies (high score) vs 1 unit far away (low score)
- Card allows ordering 2 units → AI should pick the 2 near enemies

---

### 2. MOVE Phase: Unit Ordering Optimization

**AI Reasoning:**
- When multiple units can move, the ORDER of movement matters
- Unit A moving first might block Unit B's path (or vice versa)
- AI generates all permutations of unit order
- Simulates each permutation with greedy best-move selection
- Picks the ordering that yields the best final position

**Test Strategy:**
- Create a "traffic jam" scenario where order clearly matters
- Example: Two units in a line, one optimal hex ahead
- Moving the front unit first leaves space; moving back unit first causes blocking

---

### 3. MOVE Phase: Best Destination Selection

**AI Reasoning:**
- For each unit, evaluate all legal destinations
- Score = weighted combination of battleDiceScorer + closeTheGapScorer
- Pick destination with highest score (closer to enemies, better battle potential)

**Test Strategy:**
- Unit with multiple move options
- One option moves toward enemy (high score), one moves away (low score)
- AI should pick the toward-enemy option

---

### 4. BATTLE Phase: Attacker Prioritization

**AI Reasoning (3-tier priority):**
1. **Constrained attackers first**: Units with fewer target options attack first
   - Rationale: A unit that can only hit one enemy should attack before units with choices
2. **Target weaker enemies**: Prefer targets closer to elimination
   - Rationale: Finishing off a damaged unit removes it from the board
3. **Coordinate fire**: Prefer targets threatened by multiple attackers
   - Rationale: Concentrated attacks are more likely to eliminate

**Test Strategy:**
- Separate tests for each tier
- Clear scenarios where one criterion dominates

---

## Prompts for Future Execution

### Prompt 1: ORDER Phase Unit Combination Tests

```
Read src/ai/AIPlayer.ts, focusing on computeBestOrderSet and simulateOrderCombination methods.

Create file: tests/unit/ai/AIOrderPhaseReasoning.test.ts

Write tests that explain and verify the AI's ORDER phase reasoning:

1. **Test: "AI orders units that yield best position after full turn simulation"**
   - Setup: 3 infantry units available, card allows ordering 2
     - Unit A at position near enemy (will score ~500 after moving)
     - Unit B at position near enemy (will score ~500 after moving)
     - Unit C at position far from enemies (will score ~100 after moving)
   - Execute: Let AI complete ORDER phase
   - Assert: AI ordered units A and B (not C)
   - Comment explaining: "The AI simulates full turns for each combination: {A,B}=1000, {A,C}=600, {B,C}=600. It picks {A,B}."

2. **Test: "AI evaluates all combinations, not just first"**
   - Setup: 4 units, card orders 2 (= 6 combinations)
   - Use vi.spyOn on simulateOrderCombination
   - Assert: spy called 6 times

3. **Test: "AI handles single valid combination"**
   - Setup: 2 units available, card orders 2
   - Assert: AI orders both without errors

Use table-driven test style where appropriate. Each test should have a comment block explaining the AI's reasoning.
```

---

### Prompt 2: MOVE Phase Unit Ordering Tests

```
Read src/ai/AIPlayer.ts, focusing on computeOptimalUnitOrdering and simulateUnitOrdering methods.

Create file: tests/unit/ai/AIMoveOrderingReasoning.test.ts

Write tests that explain and verify the AI's unit ordering reasoning:

1. **Test: "AI picks unit ordering that avoids blocking"**
   - Setup: Create a "hallway" scenario
     - Unit A (rear) at hex (4, 4)
     - Unit B (front) at hex (5, 4)
     - Enemy at hex (7, 4)
     - Terrain/board creates a single-file path
   - Key insight: If A moves first, it blocks B. If B moves first, both can advance.
   - Execute: Let AI complete MOVE phase
   - Assert: Unit B moved before Unit A
   - Comment: "Moving B first: both reach good positions. Moving A first: B gets blocked. AI evaluates both orderings and picks [B, A]."

2. **Test: "AI evaluates all permutations"**
   - Setup: 3 ordered units (= 6 permutations)
   - Spy on simulateUnitOrdering
   - Assert: called 6 times

3. **Test: "single unit needs no ordering optimization"**
   - Setup: 1 ordered unit
   - Assert: AI moves it without permutation overhead

Include hexDistance guard assertions to verify test setup correctness.
```

---

### Prompt 3: MOVE Phase Destination Selection Tests

```
Read src/ai/AIPlayer.ts, focusing on selectBestMove method.
Read src/ai/scoring.ts to understand battleDiceScorer and closeTheGapScorer.

Create file: tests/unit/ai/AIMoveDestinationReasoning.test.ts

Write tests that explain and verify the AI's destination selection reasoning:

1. **Test: "AI moves toward enemies to maximize battle potential"**
   - Setup:
     - Friendly infantry at (5, 5)
     - Enemy infantry at (8, 5)
     - Unit can move to: (6, 5) [closer], (4, 5) [farther], (5, 4) [lateral]
   - Assert: AI picks (6, 5) - the destination closest to enemy
   - Comment: "closeTheGapScorer rewards positions nearer to enemies. Moving to (6,5) scores highest."

2. **Test: "AI considers battle dice potential"**
   - Setup:
     - Friendly infantry at (5, 5)
     - Enemy at (6, 5) - adjacent
     - Moving to (6, 4) keeps adjacency; moving to (4, 5) breaks it
   - Assert: AI stays adjacent (maintains battle dice potential)
   - Comment: "battleDiceScorer rewards positions where we can attack. Staying adjacent = 3 dice potential."

3. **Test: "AI balances multiple scoring factors"**
   - Setup scenario where closing gap vs battle dice creates a tradeoff
   - Assert AI makes reasonable choice based on weights

Use hexOf() and direction methods (northeast(), east(), etc.) for clarity.
```

---

### Prompt 4: BATTLE Phase Attacker Prioritization Tests

```
Read src/ai/AIPlayer.ts, focusing on selectBestBattle method (lines 235-291).

Create file: tests/unit/ai/AIBattleReasoning.test.ts

Write tests that explain and verify the AI's battle prioritization reasoning:

**Tier 1: Constrained Attackers First**

1. **Test: "AI attacks with constrained units before flexible units"**
   - Setup:
     - Unit A can attack Enemy1 OR Enemy2 (2 options)
     - Unit B can ONLY attack Enemy1 (1 option)
   - Assert: AI selects Unit B to attack first
   - Comment: "Unit B has only 1 target option. If we use Unit A on Enemy1 first, Unit B might lose its only valid target. Constrained units attack first."

**Tier 2: Target Weaker Enemies**

2. **Test: "AI targets weaker enemies over stronger ones"**
   - Setup:
     - Attacker can hit Enemy1 (4 strength) or Enemy2 (1 strength)
     - Both enemies have same threat level
   - Assert: AI targets Enemy2 (1 strength)
   - Comment: "Enemy2 has 1 figure remaining. One good roll eliminates it entirely. A half-dead enemy still attacks at full strength, so finishing it off is valuable."

**Tier 3: Coordinate Fire**

3. **Test: "AI coordinates attacks on mutually threatened targets"**
   - Setup:
     - Unit A can attack Enemy1 or Enemy2
     - Unit B can attack Enemy1 or Enemy3
     - All enemies at equal strength
   - Assert: Both units attack Enemy1
   - Comment: "Enemy1 is threatened by both attackers (6 total dice). Concentrating fire increases kill probability vs spreading attacks."

**Edge Cases**

4. **Test: "AI handles single attacker single target"**
   - Trivial case, should work without errors

5. **Test: "tie-breaking is deterministic with seeded RNG"**
   - Setup: Two equally-scored battle options
   - Assert: Same seed → same choice

Use table-driven tests where multiple scenarios test the same criterion.
```

---

## Execution Order

1. **Prompt 4 (BATTLE)** - Zero coverage, highest risk
2. **Prompt 1 (ORDER combination)** - Core optimization untested
3. **Prompt 2 (MOVE ordering)** - Existing tests incomplete
4. **Prompt 3 (MOVE destination)** - Partially covered by acceptance tests

## Notes for Implementation

- Each test file should have a header comment explaining the phase and AI strategy
- Use descriptive test names that read like documentation
- Include "Reasoning:" comments in complex tests
- Guard assertions to verify test setup (e.g., `expect(hexDistance(a, b)).toBe(1)`)
- Follow the project's table-driven test style from CLAUDE.md
