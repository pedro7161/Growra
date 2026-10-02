import { ImageSourcePropType } from "react-native";
import type { TileFeature } from "../utils/journey";

interface RegionImages {
  tile: ImageSourcePropType;
  banner: ImageSourcePropType;
  camp: ImageSourcePropType;
}

const REGION_IMAGES: Record<string, RegionImages> = {
  "sunlit-coast": {
    tile: require("../../assets/journey/tiles/sunlit-coast.jpg"),
    banner: require("../../assets/journey/banners/sunlit-coast.jpg"),
    camp: require("../../assets/journey/camps/sunlit-coast.jpg"),
  },
  "mossway-grove": {
    tile: require("../../assets/journey/tiles/mossway-grove.jpg"),
    banner: require("../../assets/journey/banners/mossway-grove.jpg"),
    camp: require("../../assets/journey/camps/mossway-grove.jpg"),
  },
  "amber-dunes": {
    tile: require("../../assets/journey/tiles/amber-dunes.jpg"),
    banner: require("../../assets/journey/banners/amber-dunes.jpg"),
    camp: require("../../assets/journey/camps/amber-dunes.jpg"),
  },
  "cloudbreak-ridge": {
    tile: require("../../assets/journey/tiles/cloudbreak-ridge.jpg"),
    banner: require("../../assets/journey/banners/cloudbreak-ridge.jpg"),
    camp: require("../../assets/journey/camps/cloudbreak-ridge.jpg"),
  },
  "moonpool-marsh": {
    tile: require("../../assets/journey/tiles/moonpool-marsh.jpg"),
    banner: require("../../assets/journey/banners/moonpool-marsh.jpg"),
    camp: require("../../assets/journey/camps/moonpool-marsh.jpg"),
  },
  "glasswind-expanse": {
    tile: require("../../assets/journey/tiles/glasswind-expanse.jpg"),
    banner: require("../../assets/journey/banners/glasswind-expanse.jpg"),
    camp: require("../../assets/journey/camps/glasswind-expanse.jpg"),
  },
  "cinder-hollow": {
    tile: require("../../assets/journey/tiles/cinder-hollow.jpg"),
    banner: require("../../assets/journey/banners/cinder-hollow.jpg"),
    camp: require("../../assets/journey/camps/cinder-hollow.jpg"),
  },
  "skyheart-summit": {
    tile: require("../../assets/journey/tiles/skyheart-summit.jpg"),
    banner: require("../../assets/journey/banners/skyheart-summit.jpg"),
    camp: require("../../assets/journey/camps/skyheart-summit.jpg"),
  },
};

const FEATURE_IMAGES: Record<TileFeature, ImageSourcePropType> = {
  lantern: require("../../assets/journey/features/lantern.png"),
  flowers: require("../../assets/journey/features/flowers.png"),
  crystal: require("../../assets/journey/features/crystal.png"),
  stone: require("../../assets/journey/features/stone.png"),
  flag: require("../../assets/journey/features/flag.png"),
  signpost: require("../../assets/journey/features/signpost.png"),
  tree: require("../../assets/journey/features/tree.png"),
};

const DECORATION_IMAGES: Record<string, ImageSourcePropType> = {
  "cauldron": require("../../assets/journey/decorations/cauldron.png"),
  "spider-web": require("../../assets/journey/decorations/spider-web.png"),
  "candles": require("../../assets/journey/decorations/candles.png"),
  "xmas-tree": require("../../assets/journey/decorations/xmas-tree.png"),
  "presents": require("../../assets/journey/decorations/presents.png"),
  "stockings": require("../../assets/journey/decorations/stockings.png"),
  "paper-lamp": require("../../assets/journey/decorations/paper-lamp.png"),
  "bonsai": require("../../assets/journey/decorations/bonsai.png"),
  "folding-screen": require("../../assets/journey/decorations/folding-screen.png"),
  "zabuton": require("../../assets/journey/decorations/zabuton.png"),
  "pumpkins": require("../../assets/journey/decorations/pumpkins.png"),
  "ghost-lamp": require("../../assets/journey/decorations/ghost-lamp.png"),
  "desk": require("../../assets/journey/decorations/desk.png"),
  "beanbag": require("../../assets/journey/decorations/beanbag.png"),
  "fairy-lights": require("../../assets/journey/decorations/fairy-lights.png"),
  "plant-shelf": require("../../assets/journey/decorations/plant-shelf.png"),
  "low-table": require("../../assets/journey/decorations/low-table.png"),
  "futon": require("../../assets/journey/decorations/futon.png"),
  "round-table": require("../../assets/journey/decorations/round-table.png"),
  "armchair": require("../../assets/journey/decorations/armchair.png"),
  "cushion": require("../../assets/journey/decorations/cushion.png"),
  "painting": require("../../assets/journey/decorations/painting.png"),
  "wall-clock": require("../../assets/journey/decorations/wall-clock.png"),
  "toy-chest": require("../../assets/journey/decorations/toy-chest.png"),
  "bed": require("../../assets/journey/decorations/bed.png"),
  "rug": require("../../assets/journey/decorations/rug.png"),
  "bookshelf": require("../../assets/journey/decorations/bookshelf.png"),
  "window": require("../../assets/journey/decorations/window.png"),
  "floor-lamp": require("../../assets/journey/decorations/floor-lamp.png"),
  "potted-plant": require("../../assets/journey/decorations/potted-plant.png"),
  "flower-pot": require("../../assets/journey/decorations/flower-pot.png"),
  "mushroom-ring": require("../../assets/journey/decorations/mushroom-ring.png"),
  "paper-lantern": require("../../assets/journey/decorations/paper-lantern.png"),
  pennant: require("../../assets/journey/decorations/pennant.png"),
  "wind-chime": require("../../assets/journey/decorations/wind-chime.png"),
  snowman: require("../../assets/journey/decorations/snowman.png"),
  "crystal-cluster": require("../../assets/journey/decorations/crystal-cluster.png"),
  tent: require("../../assets/journey/decorations/tent.png"),
  "star-lamp": require("../../assets/journey/decorations/star-lamp.png"),
  shell: require("../../assets/journey/decorations/shell.png"),
  feather: require("../../assets/journey/decorations/feather.png"),
  clover: require("../../assets/journey/decorations/clover.png"),
  acorn: require("../../assets/journey/decorations/acorn.png"),
  "comet-shard": require("../../assets/journey/decorations/comet-shard.png"),
  moonstone: require("../../assets/journey/decorations/moonstone.png"),
  "rainbow-ribbon": require("../../assets/journey/decorations/rainbow-ribbon.png"),
  "firefly-jar": require("../../assets/journey/decorations/firefly-jar.png"),
};

export const EMPTY_SPOT_IMAGE: ImageSourcePropType = require("../../assets/journey/decorations/empty-spot.png");

export function getRegionImages(regionId: string): RegionImages {
  return REGION_IMAGES[regionId] ?? REGION_IMAGES["sunlit-coast"];
}

export function getFeatureImage(feature: TileFeature): ImageSourcePropType {
  return FEATURE_IMAGES[feature];
}

/** Undefined for an unknown type, so callers can fall back to the emoji icon. */
export function getDecorationImage(typeId: string): ImageSourcePropType | undefined {
  return DECORATION_IMAGES[typeId];
}
