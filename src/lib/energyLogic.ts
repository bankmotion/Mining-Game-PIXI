import {
  BlackoutThreshold,
  BlackoutUnlockedThreshold,
  EnergySourceData,
  InitialEnergyRegenRate,
  MiningEnergyConsumption,
  MovementEnergyConsumption,
} from "@/constants/Energy";
import {
  EnergySource,
  EnergySourceType,
  EnergyState,
} from "@/interfaces/EnergyTypes";
import { GameState } from "@/interfaces/GameType";
import { Miner } from "@/interfaces/MinerTypes";

export const calculateEnergyConsumption = (miners: Miner[]): number => {
  return miners.reduce((total, miner) => {
    let consumption = 0;

    // mining consumption
    if (miner.state === "mining") {
      consumption += MiningEnergyConsumption;
    }

    // movement consumption
    if (miner.state === "moving" || miner.state === "returning") {
      consumption += MovementEnergyConsumption;
    }

    return total + consumption;
  }, 0);
};

export const calculateEnergyGeneration = (
  energySources: EnergySourceType[]
): number => {
  return (
    InitialEnergyRegenRate +
    energySources.reduce((total, source) => {
      const sourceData = EnergySourceData[source.type];
      const lvlMultiplier = Math.pow(
        sourceData.efficiencyMultiplier,
        source.level - 1
      );
      return total + sourceData.baseOutput * lvlMultiplier;
    }, 0)
  );
};

export const updateEnergyState = (
  energyState: EnergyState,
  miners: Miner[],
  deltaTime: number
): EnergyState => {
  const consumption = energyState.isBlackout
    ? 0
    : calculateEnergyConsumption(miners);
  const sourceGeneration = calculateEnergyGeneration(energyState.energySources);

  // calculate net energy change
  const netEnergyChange = (sourceGeneration - consumption) * deltaTime;

  // update current energy
  const newEnergy = Math.min(
    energyState.maxEnergy,
    Math.max(0, energyState.currentEnergy + netEnergyChange)
  );

  const isBlackout = energyState.isBlackout
    ? newEnergy <= energyState.maxEnergy * BlackoutUnlockedThreshold
    : newEnergy <= energyState.maxEnergy * BlackoutThreshold;

  return {
    ...energyState,
    currentEnergy: newEnergy,
    energyConsumption: consumption,
    energyRegenRate: sourceGeneration,
    isBlackout,
  };
};

export const buildEnergySource = (
  state: GameState,
  type: EnergySource
): GameState => {
  const sourceData = EnergySourceData[type];

  // Check if we can afford it
  if (state.money < sourceData.baseCost) {
    return state;
  }

  // Create new energy source
  const newSource: EnergySourceType = {
    id: `energy-${Date.now()}`,
    type,
    level: 1,
    efficiency: 1,
    cost: sourceData.baseCost,
    energyOutput: sourceData.baseOutput,
    maintenanceCost: sourceData.baseMaintenance,
  };

  return {
    ...state,
    money: state.money - sourceData.baseCost,
    energy: {
      ...state.energy,
      energySources: [...state.energy.energySources, newSource],
    },
  };
};

export const upgradeEnergySource = (
  state: GameState,
  sourceId: string
): GameState => {
  const source = state.energy.energySources.find((s) => s.id === sourceId);
  if (!source) return state;

  const sourceData = EnergySourceData[source.type];

  // check if we have reached max level
  if (source.level >= sourceData.maxLevel) return state;

  // calculate upgrade cost
  const upgradeCost = Math.floor(source.cost * 1.5);

  // check if we can afford it
  if (state.money < upgradeCost) return state;

  // update the source
  const updatedSources = state.energy.energySources.map((s) =>
    s.id === sourceId
      ? {
          ...s,
          level: s.level + 1,
          efficiency: Math.pow(sourceData.efficiencyMultiplier, s.level),
          cost: upgradeCost,
          energyOutput:
            sourceData.baseOutput *
            Math.pow(sourceData.efficiencyMultiplier, s.level),
          maintenanceCost:
            sourceData.baseMaintenance *
            Math.pow(sourceData.efficiencyMultiplier, s.level),
        }
      : s
  );

  return {
    ...state,
    money: state.money - upgradeCost,
    energy: {
      ...state.energy,
      energySources: updatedSources,
    },
  };
};
