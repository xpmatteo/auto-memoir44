// ABOUTME: Data-driven acceptance tests loaded from YAML fixture files in testdata/
// ABOUTME: Validates unit placement from compact map notation with coordinate headers

import { describe, test, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'yaml'
import { createTestGameState } from '../helpers/testHelpers'
import { parseFixtureMap } from '../helpers/fixtureMapParser'
import { resetUnitIdCounter } from '../../src/domain/Unit'
import { GameState } from '../../src/domain/GameState'
import { BattleMove } from '../../src/domain/moves/BattleMove'
import { BattlePhase } from '../../src/domain/phases/BattlePhase'
import { Side } from '../../src/domain/Player'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TESTDATA_DIR = join(__dirname, 'testdata')

interface FixtureTestCase {
    name: string
    map: string
    turn?: string
    phase?: string
    assert_units?: string[]
    assert_available_moves?: string[]
}

interface FixtureFile {
    topic: string
    tests: FixtureTestCase[]
}

function coordToString(q: number, r: number): string {
    const qStr = q < 0
        ? `-${Math.abs(q).toString().padStart(1, '0')}`
        : q.toString().padStart(2, '0')
    const rStr = r.toString().padStart(2, '0')
    return qStr + rStr
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

function actualUnits(gameState: GameState): string[] {
    return gameState.getAllUnits().map(su => {
        const typeStr = capitalize(su.unit.type)
        const coordStr = coordToString(su.coord.q, su.coord.r)
        return `${su.unit.side} ${typeStr} Str ${su.unitState.strength} @ ${coordStr}`
    }).sort()
}

function setupPhase(testCase: FixtureTestCase, gameState: GameState): void {
    if (testCase.turn === 'Axis') {
        gameState.switchActivePlayer()
    }
    if (testCase.phase === 'Battle') {
        const activeSide = testCase.turn === 'Axis' ? Side.AXIS : Side.ALLIES
        gameState.getAllUnits()
            .filter(su => su.unit.side === activeSide)
            .forEach(su => gameState.orderUnit(su.unit))
        gameState.pushPhase(new BattlePhase())
    }
}

function actualAvailableMoves(gameState: GameState): string[] {
    const allUnits = gameState.getAllUnits()
    return gameState.legalMoves()
        .filter(m => m instanceof BattleMove)
        .map(m => {
            const bm = m as BattleMove
            const fromSu = allUnits.find(su => su.unit.id === bm.fromUnit.id)!
            const toSu = allUnits.find(su => su.unit.id === bm.toUnit.id)!
            const from = coordToString(fromSu.coord.q, fromSu.coord.r)
            const to = coordToString(toSu.coord.q, toSu.coord.r)
            return `Battle ${from}->${to} ${bm.dice} dice`
        })
        .sort()
}

for (const filename of readdirSync(TESTDATA_DIR).filter((f: string) => f.endsWith('.yaml'))) {
    const filepath = join(TESTDATA_DIR, filename)
    let fixtureFile: FixtureFile
    try {
        fixtureFile = parse(readFileSync(filepath, 'utf-8')) as FixtureFile
    } catch (e) {
        describe(filename, () => {
            test('parse YAML', () => { throw e })
        })
        continue
    }

    const unitTests = fixtureFile.tests.filter((t: FixtureTestCase) => t.assert_units)
    const moveTests = fixtureFile.tests.filter((t: FixtureTestCase) => t.assert_available_moves)
    if (unitTests.length === 0 && moveTests.length === 0) continue

    describe(fixtureFile.topic, () => {
        for (const testCase of unitTests) {
            test(testCase.name, () => {
                resetUnitIdCounter()
                const gameState = createTestGameState()
                parseFixtureMap(testCase.map, gameState)
                expect(actualUnits(gameState)).toEqual([...testCase.assert_units!].sort())
            })
        }
        for (const testCase of moveTests) {
            test(testCase.name, () => {
                resetUnitIdCounter()
                const gameState = createTestGameState()
                parseFixtureMap(testCase.map, gameState)
                setupPhase(testCase, gameState)
                expect(actualAvailableMoves(gameState)).toEqual([...testCase.assert_available_moves!].sort())
            })
        }
    })
}
