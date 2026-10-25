import { ImageSourcePropType } from "react-native";
import { PetImages } from "../types";
import { Season, currentSeason } from "../utils/seasons";

const PET_IMAGES: Record<string, PetImages<ImageSourcePropType>> = {
  sprout: {
    base: require("../../assets/pets/sprout/base.png"),
    evo1: require("../../assets/pets/sprout/evo1.png"),
    evo2: require("../../assets/pets/sprout/evo2.png"),
    variants: {
      default: require("../../assets/pets/sprout/variants/default.png"),
    },
  },
  pebble: {
    base: require("../../assets/pets/pebble/base.png"),
    evo1: require("../../assets/pets/pebble/evo1.png"),
    evo2: require("../../assets/pets/pebble/evo2.png"),
    variants: {
      default: require("../../assets/pets/pebble/variants/default.png"),
    },
  },
  moss: {
    base: require("../../assets/pets/moss/base.png"),
    evo1: require("../../assets/pets/moss/evo1.png"),
    evo2: require("../../assets/pets/moss/evo2.png"),
    variants: {
      default: require("../../assets/pets/moss/variants/default.png"),
    },
  },
  zephie: {
    base: require("../../assets/pets/zephie/base.png"),
    evo1: require("../../assets/pets/zephie/evo1.png"),
    evo2: require("../../assets/pets/zephie/evo2.png"),
    variants: {
      default: require("../../assets/pets/zephie/variants/default.png"),
    },
  },
  ember: {
    base: require("../../assets/pets/ember/base.png"),
    evo1: require("../../assets/pets/ember/evo1.png"),
    evo2: require("../../assets/pets/ember/evo2.png"),
    variants: {
      default: require("../../assets/pets/ember/variants/default.png"),
    },
  },
  ripple: {
    base: require("../../assets/pets/ripple/base.png"),
    evo1: require("../../assets/pets/ripple/evo1.png"),
    evo2: require("../../assets/pets/ripple/evo2.png"),
    variants: {
      default: require("../../assets/pets/ripple/variants/default.png"),
    },
  },
  tempo: {
    base: require("../../assets/pets/tempo/base.png"),
    evo1: require("../../assets/pets/tempo/evo1.png"),
    evo2: require("../../assets/pets/tempo/evo2.png"),
    variants: {
      default: require("../../assets/pets/tempo/variants/default.png"),
    },
  },
  glint: {
    base: require("../../assets/pets/glint/base.png"),
    evo1: require("../../assets/pets/glint/evo1.png"),
    evo2: require("../../assets/pets/glint/evo2.png"),
    variants: {
      default: require("../../assets/pets/glint/variants/default.png"),
    },
  },
  astra: {
    base: require("../../assets/pets/astra/base.png"),
    evo1: require("../../assets/pets/astra/evo1.png"),
    evo2: require("../../assets/pets/astra/evo2.png"),
    variants: {
      default: require("../../assets/pets/astra/variants/default.png"),
    },
  },
  umbra: {
    base: require("../../assets/pets/umbra/base.png"),
    evo1: require("../../assets/pets/umbra/evo1.png"),
    evo2: require("../../assets/pets/umbra/evo2.png"),
    variants: {
      default: require("../../assets/pets/umbra/variants/default.png"),
    },
  },
  nova: {
    base: require("../../assets/pets/nova/base.png"),
    evo1: require("../../assets/pets/nova/evo1.png"),
    evo2: require("../../assets/pets/nova/evo2.png"),
    variants: {
      default: require("../../assets/pets/nova/variants/default.png"),
    },
  },
  cindra: {
    base: require("../../assets/pets/cindra/base.png"),
    evo1: require("../../assets/pets/cindra/evo1.png"),
    evo2: require("../../assets/pets/cindra/evo2.png"),
    variants: {
      default: require("../../assets/pets/cindra/variants/default.png"),
    },
  },
  lumen: {
    base: require("../../assets/pets/lumen/base.png"),
    evo1: require("../../assets/pets/lumen/evo1.png"),
    evo2: require("../../assets/pets/lumen/evo2.png"),
    variants: {
      default: require("../../assets/pets/lumen/variants/default.png"),
    },
  },
  gloam: {
    base: require("../../assets/pets/gloam/base.png"),
    evo1: require("../../assets/pets/gloam/evo1.png"),
    evo2: require("../../assets/pets/gloam/evo2.png"),
    variants: {
      default: require("../../assets/pets/gloam/variants/default.png"),
    },
  },
  holly: {
    base: require("../../assets/pets/holly/base.png"),
    evo1: require("../../assets/pets/holly/evo1.png"),
    evo2: require("../../assets/pets/holly/evo2.png"),
    variants: {
      default: require("../../assets/pets/holly/variants/default.png"),
    },
  },
};

type StageImages = Pick<PetImages<ImageSourcePropType>, "base" | "evo1" | "evo2">;

/**
 * The companions with the season's hat drawn on, shown during that season. Gloam and Holly have
 * no hatted art (they are the event companions).
 */
const SEASONAL_PET_IMAGES: Record<Season, Partial<Record<string, StageImages>>> = {
  halloween: {
    astra: {
      base: require("../../assets/seasonal/halloween/pets/astra/base.webp"),
      evo1: require("../../assets/seasonal/halloween/pets/astra/evo1.webp"),
      evo2: require("../../assets/seasonal/halloween/pets/astra/evo2.webp"),
    },
    cindra: {
      base: require("../../assets/seasonal/halloween/pets/cindra/base.webp"),
      evo1: require("../../assets/seasonal/halloween/pets/cindra/evo1.webp"),
      evo2: require("../../assets/seasonal/halloween/pets/cindra/evo2.webp"),
    },
    ember: {
      base: require("../../assets/seasonal/halloween/pets/ember/base.webp"),
      evo1: require("../../assets/seasonal/halloween/pets/ember/evo1.webp"),
      evo2: require("../../assets/seasonal/halloween/pets/ember/evo2.webp"),
    },
    glint: {
      base: require("../../assets/seasonal/halloween/pets/glint/base.webp"),
      evo1: require("../../assets/seasonal/halloween/pets/glint/evo1.webp"),
      evo2: require("../../assets/seasonal/halloween/pets/glint/evo2.webp"),
    },
    lumen: {
      base: require("../../assets/seasonal/halloween/pets/lumen/base.webp"),
      evo1: require("../../assets/seasonal/halloween/pets/lumen/evo1.webp"),
      evo2: require("../../assets/seasonal/halloween/pets/lumen/evo2.webp"),
    },
    moss: {
      base: require("../../assets/seasonal/halloween/pets/moss/base.webp"),
      evo1: require("../../assets/seasonal/halloween/pets/moss/evo1.webp"),
      evo2: require("../../assets/seasonal/halloween/pets/moss/evo2.webp"),
    },
    nova: {
      base: require("../../assets/seasonal/halloween/pets/nova/base.webp"),
      evo1: require("../../assets/seasonal/halloween/pets/nova/evo1.webp"),
      evo2: require("../../assets/seasonal/halloween/pets/nova/evo2.webp"),
    },
    pebble: {
      base: require("../../assets/seasonal/halloween/pets/pebble/base.webp"),
      evo1: require("../../assets/seasonal/halloween/pets/pebble/evo1.webp"),
      evo2: require("../../assets/seasonal/halloween/pets/pebble/evo2.webp"),
    },
    ripple: {
      base: require("../../assets/seasonal/halloween/pets/ripple/base.webp"),
      evo1: require("../../assets/seasonal/halloween/pets/ripple/evo1.webp"),
      evo2: require("../../assets/seasonal/halloween/pets/ripple/evo2.webp"),
    },
    sprout: {
      base: require("../../assets/seasonal/halloween/pets/sprout/base.webp"),
      evo1: require("../../assets/seasonal/halloween/pets/sprout/evo1.webp"),
      evo2: require("../../assets/seasonal/halloween/pets/sprout/evo2.webp"),
    },
    tempo: {
      base: require("../../assets/seasonal/halloween/pets/tempo/base.webp"),
      evo1: require("../../assets/seasonal/halloween/pets/tempo/evo1.webp"),
      evo2: require("../../assets/seasonal/halloween/pets/tempo/evo2.webp"),
    },
    umbra: {
      base: require("../../assets/seasonal/halloween/pets/umbra/base.webp"),
      evo1: require("../../assets/seasonal/halloween/pets/umbra/evo1.webp"),
      evo2: require("../../assets/seasonal/halloween/pets/umbra/evo2.webp"),
    },
    zephie: {
      base: require("../../assets/seasonal/halloween/pets/zephie/base.webp"),
      evo1: require("../../assets/seasonal/halloween/pets/zephie/evo1.webp"),
      evo2: require("../../assets/seasonal/halloween/pets/zephie/evo2.webp"),
    },
  },
  christmas: {
    astra: {
      base: require("../../assets/seasonal/christmas/pets/astra/base.webp"),
      evo1: require("../../assets/seasonal/christmas/pets/astra/evo1.webp"),
      evo2: require("../../assets/seasonal/christmas/pets/astra/evo2.webp"),
    },
    cindra: {
      base: require("../../assets/seasonal/christmas/pets/cindra/base.webp"),
      evo1: require("../../assets/seasonal/christmas/pets/cindra/evo1.webp"),
      evo2: require("../../assets/seasonal/christmas/pets/cindra/evo2.webp"),
    },
    ember: {
      base: require("../../assets/seasonal/christmas/pets/ember/base.webp"),
      evo1: require("../../assets/seasonal/christmas/pets/ember/evo1.webp"),
      evo2: require("../../assets/seasonal/christmas/pets/ember/evo2.webp"),
    },
    glint: {
      base: require("../../assets/seasonal/christmas/pets/glint/base.webp"),
      evo1: require("../../assets/seasonal/christmas/pets/glint/evo1.webp"),
      evo2: require("../../assets/seasonal/christmas/pets/glint/evo2.webp"),
    },
    lumen: {
      base: require("../../assets/seasonal/christmas/pets/lumen/base.webp"),
      evo1: require("../../assets/seasonal/christmas/pets/lumen/evo1.webp"),
      evo2: require("../../assets/seasonal/christmas/pets/lumen/evo2.webp"),
    },
    moss: {
      base: require("../../assets/seasonal/christmas/pets/moss/base.webp"),
      evo1: require("../../assets/seasonal/christmas/pets/moss/evo1.webp"),
      evo2: require("../../assets/seasonal/christmas/pets/moss/evo2.webp"),
    },
    nova: {
      base: require("../../assets/seasonal/christmas/pets/nova/base.webp"),
      evo1: require("../../assets/seasonal/christmas/pets/nova/evo1.webp"),
      evo2: require("../../assets/seasonal/christmas/pets/nova/evo2.webp"),
    },
    pebble: {
      base: require("../../assets/seasonal/christmas/pets/pebble/base.webp"),
      evo1: require("../../assets/seasonal/christmas/pets/pebble/evo1.webp"),
      evo2: require("../../assets/seasonal/christmas/pets/pebble/evo2.webp"),
    },
    ripple: {
      base: require("../../assets/seasonal/christmas/pets/ripple/base.webp"),
      evo1: require("../../assets/seasonal/christmas/pets/ripple/evo1.webp"),
      evo2: require("../../assets/seasonal/christmas/pets/ripple/evo2.webp"),
    },
    sprout: {
      base: require("../../assets/seasonal/christmas/pets/sprout/base.webp"),
      evo1: require("../../assets/seasonal/christmas/pets/sprout/evo1.webp"),
      evo2: require("../../assets/seasonal/christmas/pets/sprout/evo2.webp"),
    },
    tempo: {
      base: require("../../assets/seasonal/christmas/pets/tempo/base.webp"),
      evo1: require("../../assets/seasonal/christmas/pets/tempo/evo1.webp"),
      evo2: require("../../assets/seasonal/christmas/pets/tempo/evo2.webp"),
    },
    umbra: {
      base: require("../../assets/seasonal/christmas/pets/umbra/base.webp"),
      evo1: require("../../assets/seasonal/christmas/pets/umbra/evo1.webp"),
      evo2: require("../../assets/seasonal/christmas/pets/umbra/evo2.webp"),
    },
    zephie: {
      base: require("../../assets/seasonal/christmas/pets/zephie/base.webp"),
      evo1: require("../../assets/seasonal/christmas/pets/zephie/evo1.webp"),
      evo2: require("../../assets/seasonal/christmas/pets/zephie/evo2.webp"),
    },
  },
};

export function getPetImage(
  templateId: string,
  evolutionStage: number,
  variantId: string,
  now: number = Date.now()
): ImageSourcePropType {
  const petImages = PET_IMAGES[templateId];

  if (variantId !== "default") {
    return petImages.variants[variantId];
  }

  const season = currentSeason(now);
  const stages = (season && SEASONAL_PET_IMAGES[season][templateId]) || petImages;

  if (evolutionStage === 2) {
    return stages.evo2;
  }

  if (evolutionStage === 1) {
    return stages.evo1;
  }

  return stages.base;
}

/** Sleepy-mood art (P4); companions without it fall back to their normal image. */
const SLEEPY_PET_IMAGES: Partial<Record<string, StageImages>> = {
  zephie: {
    base: require("../../assets/pets/zephie/sleepy/base.png"),
    evo1: require("../../assets/pets/zephie/sleepy/evo1.png"),
    evo2: require("../../assets/pets/zephie/sleepy/evo2.png"),
  },
  cindra: {
    base: require("../../assets/pets/cindra/sleepy/base.png"),
    evo1: require("../../assets/pets/cindra/sleepy/evo1.png"),
    evo2: require("../../assets/pets/cindra/sleepy/evo2.png"),
  },
  tempo: {
    base: require("../../assets/pets/tempo/sleepy/base.png"),
    evo1: require("../../assets/pets/tempo/sleepy/evo1.png"),
    evo2: require("../../assets/pets/tempo/sleepy/evo2.png"),
  },
  umbra: {
    base: require("../../assets/pets/umbra/sleepy/base.png"),
    evo1: require("../../assets/pets/umbra/sleepy/evo1.png"),
    evo2: require("../../assets/pets/umbra/sleepy/evo2.png"),
  },
  nova: {
    base: require("../../assets/pets/nova/sleepy/base.png"),
    evo1: require("../../assets/pets/nova/sleepy/evo1.png"),
    evo2: require("../../assets/pets/nova/sleepy/evo2.png"),
  },
  glint: {
    base: require("../../assets/pets/glint/sleepy/base.png"),
    evo1: require("../../assets/pets/glint/sleepy/evo1.png"),
    evo2: require("../../assets/pets/glint/sleepy/evo2.png"),
  },
  ripple: {
    base: require("../../assets/pets/ripple/sleepy/base.png"),
    evo1: require("../../assets/pets/ripple/sleepy/evo1.png"),
    evo2: require("../../assets/pets/ripple/sleepy/evo2.png"),
  },
  astra: {
    base: require("../../assets/pets/astra/sleepy/base.png"),
    evo1: require("../../assets/pets/astra/sleepy/evo1.png"),
    evo2: require("../../assets/pets/astra/sleepy/evo2.png"),
  },
  sprout: {
    base: require("../../assets/pets/sprout/sleepy/base.png"),
    evo1: require("../../assets/pets/sprout/sleepy/evo1.png"),
    evo2: require("../../assets/pets/sprout/sleepy/evo2.png"),
  },
  pebble: {
    base: require("../../assets/pets/pebble/sleepy/base.png"),
    evo1: require("../../assets/pets/pebble/sleepy/evo1.png"),
    evo2: require("../../assets/pets/pebble/sleepy/evo2.png"),
  },
  moss: {
    base: require("../../assets/pets/moss/sleepy/base.png"),
    evo1: require("../../assets/pets/moss/sleepy/evo1.png"),
    evo2: require("../../assets/pets/moss/sleepy/evo2.png"),
  },
  ember: {
    base: require("../../assets/pets/ember/sleepy/base.png"),
    evo1: require("../../assets/pets/ember/sleepy/evo1.png"),
    evo2: require("../../assets/pets/ember/sleepy/evo2.png"),
  },
};

/** The sleepy art for this companion and stage, or its normal image if it has none. */
export function getSleepyPetImage(
  templateId: string,
  evolutionStage: number,
  variantId: string
): ImageSourcePropType {
  const sleepy = SLEEPY_PET_IMAGES[templateId];
  if (!sleepy) {
    return getPetImage(templateId, evolutionStage, variantId);
  }
  if (evolutionStage === 2) {
    return sleepy.evo2;
  }
  if (evolutionStage === 1) {
    return sleepy.evo1;
  }
  return sleepy.base;
}
