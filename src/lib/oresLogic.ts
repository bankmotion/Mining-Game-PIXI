import { OreData } from "@/constants/Ore";
import { Ore, OreType } from "@/interfaces/OreTypes";
import { MapLayerType } from "./mapLogic";
import { LayerName } from "@/constants/Sprites";
import { MineTypes } from "@/constants/Mine";
import { calculateDistance } from "./minersLogic";
import { Miner } from "@/interfaces/MinerTypes";
import { GameState } from "@/interfaces/GameType";

// Create a new ore
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

// Generate ores for a mine
export const generateOresForMine = (
  mineId: string,
  state: GameState
): Ore[] => {
  const mine = state.mines[mineId];
  if (!mine) return [];

  return generateInitialOres(mine.oreCount, 100, 100, mine.rareOreChance);
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
      if (MapLayerType[y] && MapLayerType[y][x] === LayerName.Floor) {
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

export const findNearestOre = (
  miner: Miner,
  ores: Ore[],
  miners: Miner[]
): Ore | undefined => {
  const availableOres = ores.filter((ore) => {
    if (ore.depleted) return false;

    const isTargeted = miners.some(
      (m) =>
        m.id !== miner.id &&
        m.targetOreId === ore.id &&
        (m.state === "mining" || m.state === "moving")
    );

    return !isTargeted;
  });

  if (availableOres.length === 0) return undefined;

  if (miner.type === "expert" && miner.specialization) {
    const specializedOres = availableOres.filter(
      (ore) => ore.type === miner.specialization
    );
    if (specializedOres.length > 0) {
      let closestOre = specializedOres[0];
      let closestDistance = calculateDistance(
        miner.position,
        closestOre.position
      );

      for (let i = 1; i < specializedOres.length; i++) {
        const ore = specializedOres[i];
        const distance = calculateDistance(miner.position, ore.position);
        if (distance < closestDistance) {
          closestOre = ore;
          closestDistance = distance;
        }
      }

      return closestOre;
    }
  }

  if (miner.type === "prospector") {
    const valuableOres = [...availableOres].sort(
      (a, b) => OreData[b.type].value - OreData[a.type].value
    );
    const topOres = valuableOres.slice(
      0,
      Math.max(1, Math.floor(valuableOres.length * 0.3))
    );

    if (topOres.length > 0) {
      let closestOre = topOres[0];
      let closestDistance = calculateDistance(
        miner.position,
        closestOre.position
      );

      for (let i = 1; i < topOres.length; i++) {
        const ore = topOres[i];
        const distance = calculateDistance(miner.position, ore.position);
        if (distance < closestDistance) {
          closestOre = ore;
          closestDistance = distance;
        }
      }

      return closestOre;
    }
  }

  if (miner.type === "engineer") {
    const hardOres = [...availableOres].sort(
      (a, b) => OreData[b.type].hardness - OreData[a.type].hardness
    );
    const topHardOres = hardOres.slice(
      0,
      Math.max(1, Math.floor(hardOres.length * 0.5))
    );

    if (topHardOres.length > 0) {
      let closestOre = topHardOres[0];
      let closestDistance = calculateDistance(
        miner.position,
        closestOre.position
      );

      for (let i = 1; i < topHardOres.length; i++) {
        const ore = topHardOres[i];
        const distance = calculateDistance(miner.position, ore.position);
        if (distance < closestDistance) {
          closestOre = ore;
          closestDistance = distance;
        }
      }

      return closestOre;
    }
  }

  let closestOre = availableOres[0];
  let closestDistance = calculateDistance(miner.position, closestOre.position);

  for (let i = 1; i < availableOres.length; i++) {
    const ore = availableOres[i];
    const distance = calculateDistance(miner.position, ore.position);
    if (distance < closestDistance) {
      closestOre = ore;
      closestDistance = distance;
    }
  }

  return closestOre;
};

export const calculateResourceYield = (
  miner: Miner,
  ore: Ore,
  upgradeLevel: number = 0,
  mineMultiplier: number = 1
): number => {
  let yield_ = ore.baseYield;

  yield_ *= miner.efficiency;

  yield_ *= 1 + upgradeLevel * 0.3;

  if (miner.type === "expert" && miner.specialization === ore.type) {
    yield_ *= 2.5;
  }

  if (miner.type === "engineer") {
    yield_ *= 1.5;
    yield_ *= 1 + OreData[ore.type].hardness / 10;
  }

  yield_ *= mineMultiplier;

  yield_ *= 0.85 + Math.random() * 0.3;

  return Math.max(1, Math.round(yield_));
};
