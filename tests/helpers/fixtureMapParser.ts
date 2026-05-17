// ABOUTME: Parser for the compact fixture map format used in acceptance test YAML files
// ABOUTME: Places units on game state based on visual hex grid with coordinate headers

import { GameState } from '../../src/domain/GameState'
import { hexOf } from '../../src/utils/hex'
import { Infantry, Armor, Artillery } from '../../src/domain/Unit'
import { Side } from '../../src/domain/Player'

function parseCoord(s: string): [number, number] {
    const r = parseInt(s.slice(-2), 10)
    const q = parseInt(s.slice(0, -2), 10)
    return [q, r]
}

function parseCells(contentLine: string): string[] {
    const cells: string[] = []
    const regex = /\|([^|]{8})/g
    let match
    while ((match = regex.exec(contentLine)) !== null) {
        cells.push(match[1])
    }
    return cells
}

function placeUnit(gameState: GameState, q: number, r: number, cellContent: string): void {
    const code = cellContent.trim()
    if (!code) return
    const coord = hexOf(q, r)
    switch (code) {
        case 'inf': gameState.placeUnit(coord, new Infantry(Side.AXIS)); break
        case 'INF': gameState.placeUnit(coord, new Infantry(Side.ALLIES)); break
        case 'arm': gameState.placeUnit(coord, new Armor(Side.AXIS)); break
        case 'ARM': gameState.placeUnit(coord, new Armor(Side.ALLIES)); break
        case 'art': gameState.placeUnit(coord, new Artillery(Side.AXIS)); break
        case 'ART': gameState.placeUnit(coord, new Artillery(Side.ALLIES)); break
        default: throw new Error(`Unknown unit code: "${code}"`)
    }
}

export function parseFixtureMap(mapString: string, gameState: GameState): void {
    const lines = mapString.split('\n').filter(l => l.trim().length > 0)

    for (let i = 0; i + 1 < lines.length; i += 2) {
        const coordLine = lines[i]
        const contentLine = lines[i + 1]

        if (coordLine.includes('|')) {
            throw new Error(`Expected coordinate line but found pipe: "${coordLine}"`)
        }

        const coordMatches = Array.from(coordLine.matchAll(/-\d{3}|\d{4}/g))
        const cells = parseCells(contentLine)

        if (coordMatches.length !== cells.length) {
            throw new Error(
                `Coord count (${coordMatches.length}) != cell count (${cells.length}) on line: "${coordLine}"`
            )
        }

        for (let j = 0; j < coordMatches.length; j++) {
            const [q, r] = parseCoord(coordMatches[j][0])
            placeUnit(gameState, q, r, cells[j])
        }
    }
}
