/**
 * Build-time feature switches.
 *
 * The blog is deferred (docs/PLAN.md §4) but its components and nav entries
 * already exist, so it is switched off here rather than deleted — flipping
 * this to `true` is all that re-enables the links and the home section.
 */
export const features = {
  blog: false,
} as const;
