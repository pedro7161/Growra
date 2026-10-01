import { ImageSourcePropType } from "react-native";
import { PetImages } from "../types";

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
};

export function getPetImage(
  templateId: string,
  evolutionStage: number,
  variantId: string
): ImageSourcePropType {
  const petImages = PET_IMAGES[templateId];

  if (variantId !== "default") {
    return petImages.variants[variantId];
  }

  if (evolutionStage === 2) {
    return petImages.evo2;
  }

  if (evolutionStage === 1) {
    return petImages.evo1;
  }

  return petImages.base;
}

type StageImages = Pick<PetImages<ImageSourcePropType>, "base" | "evo1" | "evo2">;

/** Sleepy-mood art (P4); companions without it fall back to their normal image. */
const SLEEPY_PET_IMAGES: Partial<Record<string, StageImages>> = {
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
