/**
 * Calculate XP required for next level - ENHANCED VERSION
 * This creates a smoother, more challenging progression curve
 */
export const getXPForNextLevel = (currentLevel: number): number => {
  // Levels 1-5: Tutorial phase (easy progression to hook players)
  if (currentLevel <= 5) {
    return 80 + (currentLevel - 1) * 20; // 80, 100, 120, 140, 160
  }

  // Levels 6-10: Early game (moderate increase)
  else if (currentLevel <= 10) {
    return 160 + (currentLevel - 5) * 40; // 200, 240, 280, 320, 360
  }

  // Levels 11-15: Mid game (noticeable grind starts)
  else if (currentLevel <= 15) {
    return 360 + (currentLevel - 10) * 80; // 440, 520, 600, 680, 760
  }

  // Levels 16-20: Late mid-game (significant commitment required)
  else if (currentLevel <= 20) {
    return 760 + (currentLevel - 15) * 120; // 880, 1000, 1120, 1240, 1360
  }

  // Levels 21-25: End game (only dedicated users reach here)
  else if (currentLevel <= 25) {
    return 1360 + (currentLevel - 20) * 200; // 1560, 1760, 1960, 2160, 2360
  }

  // Levels 26-30: Prestige levels (true mastery)
  else if (currentLevel <= 30) {
    return 2360 + (currentLevel - 25) * 300; // 2660, 2960, 3260, 3560, 3860
  }

  // Levels 31-35: Celestial Ascension (legendary achievement)
  else if (currentLevel <= 35) {
    return 3860 + (currentLevel - 30) * 400; // 4260, 4660, 5060, 5460, 5860
  }

  // Levels 36-40: Infernal Dominion (ultimate mastery)
  else {
    return 5860 + (currentLevel - 35) * 500; // 6360, 6860, 7360, 7860, 8360
  }
};

/**
 * Calculate total XP needed to reach a specific level
 * Useful for progress calculations
 */
export const getTotalXPForLevel = (targetLevel: number): number => {
  let total = 0;
  for (let i = 1; i < targetLevel; i++) {
    total += getXPForNextLevel(i);
  }
  return total;
};
