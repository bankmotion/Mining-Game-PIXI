import { MapPosition } from "./MapTypes";
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

export interface MinerMovementState {
  currentTilePos: MapPosition;
  targetTilePos: MapPosition;
  path: MapPosition[];
  currentPathIndex: number;
  isMoving: boolean;
  moveProgress: number; // 0 to 1
}

export interface Miner {
  id: string;
  name: string;
  type: MinerType;
  isBot: boolean;
  efficiency: number;
  speed: number;
  capacity: number;
  specialization?: OreType;
  movement: MinerMovementState;
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
