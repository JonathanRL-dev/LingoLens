import { computeXp, PRACTICE_XP, SCAN_XP, SPEAK_XP } from '@shared';

export interface XpComponentsInput {
  scanXp: number;
  practiceXp: number;
  speakXp: number;
  alreadyCollected: boolean;
}

/** Wrap shared XP rounding/factor rules while allowing per-mission base amounts. */
export function computeXpComponents(input: XpComponentsInput) {
  const adjusted = computeXp({
    practiceAccuracy: 100,
    speakPassed: true,
    alreadyCollected: input.alreadyCollected,
  });
  const practice = computeXp({
    practiceAccuracy: (input.practiceXp / PRACTICE_XP) * 100,
    speakPassed: false,
    alreadyCollected: input.alreadyCollected,
  });
  return {
    scanXp: Math.round(input.scanXp * (adjusted.scanXp / SCAN_XP)),
    practiceXp: practice.practiceXp,
    speakXp: Math.round(input.speakXp * (adjusted.speakXp / SPEAK_XP)),
  };
}
