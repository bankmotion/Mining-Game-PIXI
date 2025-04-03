import { SpriteType } from "@/interfaces/PixiTypes";

export enum AnimationType {
  LampAnimation = "lamp_animation",
  MineCartAnimation = "mine_cart_animation",
  PushRight = "push_right",
  PushLeft = "push_left",
  PushUp = "push_up",
  PushDown = "push_down",
  DrillingRight = "drilling_right",
  DrillingLeft = "drilling_left",
  DrillingUp = "drilling_up",
  DrillingDown = "drilling_down",
  Standing = "standing",
}

export enum SpriteName {
  WallsFloors = "WallsFloors",
  MineBreakingAnimations = "MineBreakingAnimations",
  MineDoors = "MineDoors",
  MiningGems = "MiningGems",
  MiningGemsWithShadows = "MiningGemsWithShadows",
  WallsGems = "WallsGems",
  CartConnectors = "CartConnectors",
  MineCarts = "MineCarts",
  MineLamps = "MineLamps",
  LampAnimation = "LampAnimation",
  MineCartAnimation = "MineCartAnimation",
  Ladders = "Ladders",
  CharacterToolsDrillBodyGreen = "CharacterToolsDrillBodyGreen",
  CharacterPushBodyGreen = "CharacterPushBodyGreen",
  CharacterPushClothesFullBodyOverhallsBlue = "CharacterPushClothesFullBodyOverhallsBlue",
  MineProps = "MineProps",
  ChracterPushHairStylesRadicalCurveBlack = "ChracterPushHairStylesRadicalCurveBlack",
  MiningOres = "MiningOres",
}

export enum LayerName {
  Floor = "Floor",
  Mountains = "Mountains",
  Wall = "Wall",
  Miners = "Miners",
  Ore = "Ore",
}

export const FloorData = [
  {
    id: 60,
    chance: 200,
  },
  {
    id: 63,
    chance: 1,
  },
  {
    id: 64,
    chance: 1,
  },
  {
    id: 65,
    chance: 1,
  },
  {
    id: 66,
    chance: 1,
  },
  {
    id: 67,
    chance: 1,
  },
  {
    id: 104,
    chance: 1,
  },
  {
    id: 105,
    chance: 1,
  },
  {
    id: 106,
    chance: 1,
  },
  {
    id: 107,
    chance: 1,
  },
  {
    id: 108,
    chance: 1,
  },
  {
    id: 109,
    chance: 1,
  },
  {
    id: 146,
    chance: 1,
  },
  {
    id: 147,
    chance: 1,
  },
  {
    id: 148,
    chance: 1,
  },
  {
    id: 149,
    chance: 1,
  },
];

export enum MountainData {
  BottomEnhance = 254,
  LeftWall = 212,
  RightWall = 217,
  GeneralWall = 213,
}

export const InitialTileWidth = 16;

export const Sprites: SpriteType[] = [
  {
    name: SpriteName.WallsFloors,
    path: "/assets/walls_and_floors/walls_floors.png",
    width: 672,
    height: 976,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 2562,
  },
  {
    name: SpriteName.MineBreakingAnimations,
    path: "/assets/walls_and_floors/mine_breaking_animations.png",
    width: 96,
    height: 64,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 24,
  },
  {
    name: SpriteName.MineDoors,
    path: "/assets/doors/mine_doors.png",
    width: 144,
    height: 80,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 45,
  },
  {
    name: SpriteName.MiningGems,
    path: "/assets/mining/gems/mining_gems.png",
    width: 192,
    height: 272,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 204,
  },
  {
    name: SpriteName.MiningGemsWithShadows,
    path: "/assets/mining/gems/mining_gems_with_shadows.png",
    width: 192,
    height: 272,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 204,
  },
  {
    name: SpriteName.WallsGems,
    path: "/assets/mining/gems/walls_gems.png",
    width: 128,
    height: 160,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 80,
  },
  {
    name: SpriteName.CartConnectors,
    path: "/assets/mine_carts/cart_connectors.png",
    width: 80,
    height: 64,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 20,
  },
  {
    name: SpriteName.MineCarts,
    path: "/assets/mine_carts/mine_carts.png",
    width: 256,
    height: 176,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 176,
  },
  {
    name: SpriteName.MineLamps,
    path: "/assets/props/mine_lamps.png",
    width: 96,
    height: 96,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 36,
  },
  {
    name: SpriteName.LampAnimation,
    path: "/assets/props/lamp_animation.png",
    width: 112,
    height: 48,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 21,
    animations: {
      [AnimationType.LampAnimation]: {
        frames: [8, 9, 10, 11, 12],
        speed: 0.3,
      },
    },
  },
  {
    name: SpriteName.MineCartAnimation,
    path: "/assets/mine_carts/mine_cart_animation.png",
    width: 128,
    height: 96,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 12,
    animations: {
      [AnimationType.MineCartAnimation]: {
        frames: [0, 1, 2, 3],
        speed: 0.3,
      },
    },
  },
  {
    name: SpriteName.Ladders,
    path: "/assets/props/ladders.png",
    width: 144,
    height: 64,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 36,
  },
  {
    name: SpriteName.CharacterToolsDrillBodyGreen,
    path: "/assets/character/tools_drill/hairstyles/big_bun/character_tools_drill_hairstyles_big_bun_blue.png",
    width: 192,
    height: 256,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 192,
    animations: {
      [AnimationType.DrillingRight]: {
        frames: [60, 64, 68],
        speed: 0.1,
      },
      [AnimationType.DrillingLeft]: {
        frames: [61, 65, 69],
        speed: 0.1,
      },
      [AnimationType.DrillingUp]: {
        frames: [62, 66, 70],
        speed: 0.1,
      },
      [AnimationType.DrillingDown]: {
        frames: [63, 67, 71],
        speed: 0.1,
      },
    },
  },
  {
    name: SpriteName.CharacterPushBodyGreen,
    path: "/assets/character/push/character_body/character_push_body_green.png",
    width: 384,
    height: 256,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 384,
    animations: {
      [AnimationType.Standing]: {
        frames: [24],
        speed: 0.1,
      },
      [AnimationType.PushRight]: {
        frames: [24, 28, 32, 36, 40, 44],
        speed: 0.1,
      },
      [AnimationType.PushLeft]: {
        frames: [120, 124, 128, 132, 136, 140],
        speed: 0.1,
      },
      [AnimationType.PushUp]: {
        frames: [216, 220, 224, 228, 232, 236],
        speed: 0.1,
      },
      [AnimationType.PushDown]: {
        frames: [312, 316, 320, 324, 328, 332],
        speed: 0.1,
      },
    },
  },
  {
    name: SpriteName.CharacterPushClothesFullBodyOverhallsBlue,
    path: "/assets/character/push/clothes/full_body/overhalls/character_push_clothes_fullbody_overhalls_blue.png",
    width: 384,
    height: 256,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 384,
    animations: {
      [AnimationType.Standing]: {
        frames: [24],
        speed: 0.3,
      },
      [AnimationType.PushRight]: {
        frames: [24, 28, 32, 36, 40, 44],
        speed: 0.3,
      },
      [AnimationType.PushLeft]: {
        frames: [120, 124, 128, 132, 136, 140],
        speed: 0.3,
      },
      [AnimationType.PushUp]: {
        frames: [216, 220, 224, 228, 232, 236],
        speed: 0.3,
      },
      [AnimationType.PushDown]: {
        frames: [312, 316, 320, 324, 328, 332],
        speed: 0.3,
      },
    },
  },
  {
    name: SpriteName.MineProps,
    path: "/assets/props/mine_props.png",
    width: 192,
    height: 128,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 96,
  },
  {
    name: SpriteName.ChracterPushHairStylesRadicalCurveBlack,
    path: "/assets/character/push/hairstyles/radical_curve/character_push_hairstyles_radical_curve_black.png",
    width: 384,
    height: 256,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 384,
    animations: {
      [AnimationType.PushRight]: {
        frames: [24, 28, 32, 36, 40, 44],
        speed: 0.3,
      },
      [AnimationType.PushLeft]: {
        frames: [120, 124, 128, 132, 136, 140],
        speed: 0.3,
      },
      [AnimationType.PushUp]: {
        frames: [216, 220, 224, 228, 232, 236],
        speed: 0.3,
      },
      [AnimationType.PushDown]: {
        frames: [312, 316, 320, 324, 328, 332],
        speed: 0.3,
      },
    },
  },
  {
    name: SpriteName.MiningOres,
    path: "/assets/mining/ores/mining_ores.png",
    width: 288,
    height: 144,
    tileWidth: 16,
    tileHeight: 16,
    tileCount: 80,
  },
];
