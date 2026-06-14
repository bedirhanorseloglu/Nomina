/**
 * dateUtils.ts
 * Utility functions for date manipulations.
 */

/**
 * Returns a "study date" where the day rolls over at 04:00 AM instead of midnight.
 * This ensures that late-night studying (e.g. 02:00 AM) counts towards the previous day.
 */
export const getStudyDate = (date?: Date): Date => {
  const d = date ? new Date(date) : new Date();
  if (d.getHours() < 4) {
    d.setDate(d.getDate() - 1);
  }
  return d;
};
