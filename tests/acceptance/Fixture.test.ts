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

const __dirname = dirname(fileURLToPath(import.meta.url))
const TESTDATA_DIR = join(__dirname, 'testdata')

interface FixtureTestCase {
    name: string
    map: string
    assert_units?: string[]
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

    const relevantTests = fixtureFile.tests.filter((t: FixtureTestCase) => t.assert_units)
    if (relevantTests.length === 0) continue

    describe(fixtureFile.topic, () => {
        for (const testCase of relevantTests) {
            test(testCase.name, () => {
                resetUnitIdCounter()
                const gameState = createTestGameState()
                parseFixtureMap(testCase.map, gameState)
                expect(actualUnits(gameState)).toEqual([...testCase.assert_units!].sort())
            })
        }
    })
}
