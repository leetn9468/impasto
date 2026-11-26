/**
 * What Claude is up to on the backdrop. `at` is when the devil's prank last began (0 at
 * rest) and `plays` how many times it has. `lit` is how many clicks are counted on the
 * halo so far, 1 or 2, and `litAt` when the last of them came (0 when none is counted).
 */
export type Prank = { plays: number; at: number; lit: number; litAt: number }

declare module 'claude-code' {
  interface PluginState {
    impasto: { prank: Shaped<Prank> }
  }
}
