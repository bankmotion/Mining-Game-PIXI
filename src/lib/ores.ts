import { OreData } from "@/constants/Ore";
import { Ore, OreType } from "@/interfaces/OreTypes";
import { MapLayerType } from "./mapUtils";
import { LayerName } from "@/constants/Sprites";
import { MineTypes } from "@/constants/Mine";

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

// Function to generate ores at valid positions
export const generateOresAtPositions = (
  positions: Array<{ x: number; y: number }>,
  count: number,
  rareOreChance: number = 1
): Ore[] => {
  const ores: Ore[] = [];
  const availablePositions = [...positions];

  // Shuffle positions
  for (let i = availablePositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availablePositions[i], availablePositions[j]] = [
      availablePositions[j],
      availablePositions[i],
    ];
  }

  // Take only the number of positions we need
  const selectedPositions = availablePositions.slice(0, count);

  // Generate ores at selected positions
  for (const position of selectedPositions) {
    const type = generateRandomOreType(rareOreChance);
    ores.push(createOre(type, position));
  }

  return ores;
};

// Function to find valid positions for ores on the map
export const findValidOrePositions = (
  tileCountX: number,
  tileCountY: number,
  activeMine: string
): Array<{ x: number; y: number }> => {
  const validPositions: Array<{ x: number; y: number }> = [];
  
  // Get the active mine
  const mine = MineTypes.find((m) => m.id === activeMine);
  if (!mine) {
    console.error("Active mine not found");
    return validPositions;
  }

  // Get the available area dimensions
  const availableWidth = mine.availableArea.width;
  const availableHeight = mine.availableArea.height;

  // Calculate the center position of the map
  const centerX = Math.floor(tileCountX / 2);
  const centerY = Math.floor(tileCountY / 2);

  // Calculate the starting position of the available area (centered)
  const startX = centerX - Math.floor(availableWidth / 2);
  const startY = centerY - Math.floor(availableHeight / 2);

  // Find valid positions within the available area
  for (let y = startY; y < startY + availableHeight; y++) {
    for (let x = startX; x < startX + availableWidth; x++) {
      // Skip if out of bounds
      if (x < 0 || x >= tileCountX || y < 0 || y >= tileCountY) continue;
      
      // Check if the position is valid (has floor and no wall)
      if (
        MapLayerType[y] &&
        MapLayerType[y][x] === LayerName.Floor
      ) {
        validPositions.push({
          x: x,
          y: y,
        });
      }
    }
  }

  return validPositions;
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
