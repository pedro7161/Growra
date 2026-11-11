import { GameState } from "../types";
import { STARTER_TEMPLATE_IDS } from "./companions";
import { getPetTemplates } from "./gameplay";
import { TutorialStep } from "./tutorial";

// The talking-pet guide: who speaks, and how Back / Next move between the bubbles. The real
// tutorial step is always derived from the saved game (see getTutorialStep); Back / Next only
// change which bubble is *shown*, so they can never break or skip the underlying progress.

export type GuideStep = Exclude<TutorialStep, "done">;

/** Order of the live tutorial's bubbles. */
export const GUIDE_STEPS: GuideStep[] = [
  "open-tasks",
  "tap-add-task",
  "confirm-task-add",
  "complete-task",
  "open-realm",
  "choose-companion",
  "open-journey",
];

/** The replay (Settings) walks the same road without choosing or paying anything. */
export const REPLAY_STEPS: GuideStep[] = ["open-tasks", "tap-add-task", "complete-task", "open-realm", "open-journey"];

export type GuideTarget = "tasks" | "companions" | "journey";

/** Steps whose "Next" is just a screen change the player could also do by tapping the tab bar. */
const NAVIGATION_TARGET: Partial<Record<GuideStep, GuideTarget>> = {
  "open-tasks": "tasks",
  "open-realm": "companions",
  "open-journey": "journey",
};

export interface GuideSpeaker {
  templateId: string;
  name: string;
  evolutionStage: number;
  variantId: string;
  /** False before the player has chosen a starter: the first starter invites the choice. */
  adopted: boolean;
}

/** The adopted companion speaks; before adoption the first starter does, with name from its template. */
export function getGuideSpeaker(gameState: GameState): GuideSpeaker {
  const pet = gameState.pets.find((item) => item.id === gameState.equippedPetId) ?? gameState.pets[0];
  if (pet) {
    return {
      templateId: pet.templateId,
      name: pet.name,
      evolutionStage: pet.evolutionStage,
      variantId: pet.activeImageVariantId || "default",
      adopted: true,
    };
  }
  const templateId = STARTER_TEMPLATE_IDS[0];
  const name = getPetTemplates().find((template) => template.id === templateId)?.name ?? templateId;
  return { templateId, name, evolutionStage: 0, variantId: "default", adopted: false };
}

/** Bubble currently shown: the real step moved by `offset` (negative = earlier, 1 = a peek ahead). */
export function guideStepAt(steps: GuideStep[], real: GuideStep, offset: number): GuideStep {
  const base = Math.max(0, steps.indexOf(real));
  return steps[Math.min(steps.length - 1, Math.max(0, base + offset))];
}

/** Back never goes before the first bubble. */
export function guideBack(steps: GuideStep[], real: GuideStep, offset: number): number {
  const base = Math.max(0, steps.indexOf(real));
  return Math.max(-base, offset - 1);
}

export interface GuideNext {
  offset: number;
  /** Screen to open for navigation-only steps; null when the player must act in the app. */
  navigate: GuideTarget | null;
}

/**
 * Next: from an earlier bubble it walks forward to the current one. On the current bubble a
 * navigation step opens its screen; a step that needs a real action peeks at the next bubble.
 */
export function guideNext(steps: GuideStep[], real: GuideStep, offset: number): GuideNext {
  if (offset < 0) return { offset: offset + 1, navigate: null };
  const target = NAVIGATION_TARGET[real] ?? null;
  if (target) return { offset: 0, navigate: target };
  const base = Math.max(0, steps.indexOf(real));
  const canPeek = offset === 0 && base < steps.length - 1;
  return { offset: canPeek ? 1 : offset, navigate: null };
}

/** True when Next has nothing left to do (replay: it finishes the tour instead). */
export function guideCanAdvance(steps: GuideStep[], real: GuideStep, offset: number): boolean {
  return offset < 0 || Boolean(NAVIGATION_TARGET[real]) || (offset === 0 && steps.indexOf(real) < steps.length - 1);
}
