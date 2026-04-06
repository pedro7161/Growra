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
