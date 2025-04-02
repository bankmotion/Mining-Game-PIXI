import { OreType } from "./OreTypes";

export type MinerState =
  | "seeking"
  | "moving"
  | "mining"
  | "returning"
  | "resting";
  
export type MinerType =
  | "basic"
  | "expert"
  | "hauler"
  | "prospector"
  | "engineer";

export interface Miner {
  id: string;
  name: string;
  type: MinerType;
  efficiency: number;
  speed: number;
  capacity: number;
  specialization?: OreType;
  position: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  state: MinerState;
  inventory: Record<OreType, number>;
  inventoryValue: number;
  lastDroppedValue?: number;
  targetOreId?: string;
  miningProgress: number;
  restProgress?: number;
  restDuration?: number;
  cost: number;
}
