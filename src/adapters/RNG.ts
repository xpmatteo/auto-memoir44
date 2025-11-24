// ABOUTME: Seeded random number generator for reproducible gameplay
// ABOUTME: Provides deterministic randomness when seed is specified, random otherwise

/**
 * Seeded random number generator using a simple LCG (Linear Congruential Generator)
 * Provides reproducible random sequences when initialized with a seed
 */
export class SeededRNG {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 2147483647);
  }

  /**
   * Generate next random number in [0, 1)
   * Uses LCG algorithm with parameters from Numerical Recipes
   */
  random(): number {
    // LCG formula: seed = (a * seed + c) mod m
    const a = 1664525;
    const c = 1013904223;
    const m = 2147483648; // 2^31

    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }

  /**
   * Get the current seed value
   */
  getSeed(): number {
    return this.seed;
  }
}
