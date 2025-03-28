import { Miner } from "./MinerTypes";
import { MineType } from "./MineType";
import { Ore, OreType } from "./OreTypes";

export interface GameState {
  miners: Miner[];
  ores: Ore[];
  resources: Record<OreType, number>;
  resourceRate: Record<OreType, number>;
  money: number;
  moneyRate: number;
  upgrades: Record<string, number>;
  tick: number;
  lastUpdateTime: number;
  activeMine: string;
  mines: Record<string, MineType>;
}
