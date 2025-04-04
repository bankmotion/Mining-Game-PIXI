import { EnergyState } from "./EnergyTypes";
import { MapDimensions, MapPosition } from "./MapTypes";
import { Miner } from "./MinerTypes";
import { MineType } from "./MineType";
import { Ore, OreType } from "./OreTypes";

export interface GameState {
  miners: Miner[]; // Array of miners
  rails: Rail[]; // Array of rails
  ores: Ore[]; // Array of ores
  resources: Record<OreType, number>; // Record of resources
  resourceRate: Record<OreType, number>; // Record of resource rates
  money: number; // Total amount of money
  moneyRate: number; // Rate at which money is earned
  upgrades: Record<string, number>; // Record of upgrades
  tick: number; // Current tick number
  lastUpdateTime: number; // Timestamp of the last update
  activeMine: string; // ID of the active mine
  mines: Record<string, MineType>; // Record of mines
  basePosition: MapPosition; // Position of the base
  energy: EnergyState; // Current energy state
  mapDimensions: MapDimensions; // Dimensions of the map
}
