export type OreType = 
  'coal' | 'iron' | 'copper' | 'gold' | 'crystal' | 'gem' | 'legendary' |
  'tin' | 'silver' | 'mithril' | 'thorium' | 'platinum' | 'orichalcum' | 'uranium';

export interface Ore {
  id: string;
  type: OreType;
  position: { x: number; y: number };
  baseYield: number;
  hardness: number;
  value: number;
  depleted: boolean;
  regenerationTime: number;
  maxRegenerationTime: number;
}

export const oreData: Record<OreType, {
  baseYield: number;
  hardness: number;
  value: number;
  rarity: number;
  regenerationTime: number;
}> = {
  // Original ores
  coal: {
    baseYield: 1,
    hardness: 1,
    value: 1,
    rarity: 0.25,
    regenerationTime: 3,
  },
  iron: {
    baseYield: 1,
    hardness: 1.5,
    value: 2,
    rarity: 0.18,
    regenerationTime: 5,
  },
  copper: {
    baseYield: 1,
    hardness: 1.5,
    value: 2,
    rarity: 0.18,
    regenerationTime: 4,
  },
  gold: {
    baseYield: 1,
    hardness: 2.5,
    value: 5,
    rarity: 0.08,
    regenerationTime: 10,
  },
  crystal: {
    baseYield: 1,
    hardness: 3,
    value: 10,
    rarity: 0.05,
    regenerationTime: 15,
  },
  gem: {
    baseYield: 1,
    hardness: 3.5,
    value: 25,
    rarity: 0.015,
    regenerationTime: 30,
  },
  legendary: {
    baseYield: 1,
    hardness: 5,
    value: 100,
    rarity: 0.005,
    regenerationTime: 60,
  },
  
  // New ore types
  tin: {
    baseYield: 1,
    hardness: 1,
    value: 1,
    rarity: 0.22,
    regenerationTime: 3,
  },
  silver: {
    baseYield: 1,
    hardness: 2,
    value: 4,
    rarity: 0.1,
    regenerationTime: 8,
  },
  mithril: {
    baseYield: 1,
    hardness: 3,
    value: 15,
    rarity: 0.03,
    regenerationTime: 20,
  },
  thorium: {
    baseYield: 1,
    hardness: 3.5,
    value: 20,
    rarity: 0.02,
    regenerationTime: 25,
  },
  platinum: {
    baseYield: 1,
    hardness: 4,
    value: 30,
    rarity: 0.01,
    regenerationTime: 35,
  },
  orichalcum: {
    baseYield: 1,
    hardness: 4.5,
    value: 50,
    rarity: 0.008,
    regenerationTime: 45,
  },
  uranium: {
    baseYield: 1,
    hardness: 5,
    value: 75,
    rarity: 0.006,
    regenerationTime: 55,
  },
};

export const createOre = (type: OreType, position: { x: number; y: number }): Ore => {
  const data = oreData[type];
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
  
  const adjustedOreData = { ...oreData };
  
  if (rareOreChance > 1) {
    for (const [type, data] of Object.entries(adjustedOreData)) {
      if (data.value > 5) {
        adjustedOreData[type as OreType].rarity *= rareOreChance;
      }
    }
    
    const totalRarity = Object.values(adjustedOreData).reduce((sum, data) => sum + data.rarity, 0);
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
  
  return 'coal';
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

export const updateOreRegeneration = (ores: Ore[], deltaTime: number): Ore[] => {
  return ores.map(ore => {
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
