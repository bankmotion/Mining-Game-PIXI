export type EnergySource = "solar" | "wind" | "geothermal" | "nuclear";

export interface EnergySourceType {
  id: string;
  type: EnergySource;
  level: number;
  efficiency: number;
  cost: number;
  energyOutput: number;
  maintenanceCost: number;
}

export interface EnergyState {
  currentEnergy: number;
  maxEnergy: number;
  energyRegenRate: number;
  energyConsumption: number;
  energySources: EnergySourceType[];
  isBlackout: boolean;
}
