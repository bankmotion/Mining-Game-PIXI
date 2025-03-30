import { EnergySource, EnergyState } from "@/interfaces/EnergyTypes";

export const EnergySourceData: Record<
  EnergySource,
  {
    baseCost: number;
    baseOutput: number;
    baseMaintenance: number;
    efficiencyMultiplier: number;
    maxLevel: number;
  }
> = {
  solar: {
    baseCost: 100,
    baseOutput: 1,
    baseMaintenance: 1,
    efficiencyMultiplier: 1.2,
    maxLevel: 5,
  },
  wind: {
    baseCost: 250,
    baseOutput: 2,
    baseMaintenance: 2,
    efficiencyMultiplier: 1.3,
    maxLevel: 5,
  },
  geothermal: {
    baseCost: 1000,
    baseOutput: 5,
    baseMaintenance: 5,
    efficiencyMultiplier: 1.5,
    maxLevel: 3,
  },
  nuclear: {
    baseCost: 5000,
    baseOutput: 20,
    baseMaintenance: 15,
    efficiencyMultiplier: 2,
    maxLevel: 2,
  },
};

export const MiningEnergyConsumption = 20;
export const MovementEnergyConsumption = 4;
export const BlackoutThreshold = 0; // 10% energy remaining triggers blackout
export const BlackoutUnlockedThreshold = 0.1; // 10% energy remaining triggers blackout
export const InitialEnergyRegenRate = 1; // Initial regeneration rate of 10 energy per second

export const InitialEnergyState: EnergyState = {
  currentEnergy: 1000,
  maxEnergy: 1000,
  energyRegenRate: InitialEnergyRegenRate, // Initial regeneration rate of 10 energy per second
  energyConsumption: 0,
  energySources: [],
  isBlackout: false,
};
