import { OreData } from "@/constants/Ore";
import { Ore, OreType } from "@/interfaces/OreTypes";

export const createOre = (
  type: OreType,
  position: { x: number; y: number }
): Ore => {
  const data = OreData[type];
  return {
    id: `ore-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    position,
    baseYield: data.baseYield,
    hardness: data.hardness,
    value: data.value,
    depleted: false,
    regenerationTime: 0,
    maxRegenerationTime: data.regenerationTime,
  };
};

export const generateRandomOreType = (rareOreChance: number = 1): OreType => {
  const random = Math.random();
  let cumulativeProbability = 0;

  const adjustedOreData = { ...OreData };

  if (rareOreChance > 1) {
    for (const [type, data] of Object.entries(adjustedOreData)) {
      if (data.value > 5) {
        adjustedOreData[type as OreType].rarity *= rareOreChance;
      }
    }

    const totalRarity = Object.values(adjustedOreData).reduce(
      (sum, data) => sum + data.rarity,
      0
    );
    for (const type of Object.keys(adjustedOreData)) {
      adjustedOreData[type as OreType].rarity /= totalRarity;
    }
  }

  for (const [type, data] of Object.entries(adjustedOreData)) {
    cumulativeProbability += data.rarity;
    if (random <= cumulativeProbability) {
      return type as OreType;
    }
  }

  return "coal";
};

export const generateRandomPosition = (width: number, height: number) => {
  return {
    x: Math.floor(Math.random() * width),
    y: Math.floor(Math.random() * height),
  };
};

export const generateInitialOres = (
  count: number,
  width: number,
  height: number,
  rareOreChance: number = 1
): Ore[] => {
  const ores: Ore[] = [];

  for (let i = 0; i < count; i++) {
    const type = generateRandomOreType(rareOreChance);
    const position = {
      x: 10 + Math.floor(Math.random() * (width - 20)),
      y: 10 + Math.floor(Math.random() * (height - 20)),
    };
    ores.push(createOre(type, position));
  }

  return ores;
};

export const depleteOreVein = (ore: Ore): Ore => {
  return {
    ...ore,
    depleted: true,
    regenerationTime: ore.maxRegenerationTime,
  };
};

export const regenerateOreVein = (ore: Ore): Ore => {
  return {
    ...ore,
    depleted: false,
    regenerationTime: 0,
  };
};

export const updateOreRegeneration = (
  ores: Ore[],
  deltaTime: number
): Ore[] => {
  return ores.map((ore) => {
    if (ore.depleted) {
      const newRegenerationTime = Math.max(0, ore.regenerationTime - deltaTime);
      if (newRegenerationTime <= 0) {
        return regenerateOreVein(ore);
      }
      return { ...ore, regenerationTime: newRegenerationTime };
    }
    return ore;
  });
};
