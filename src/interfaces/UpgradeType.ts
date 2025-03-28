import { GameState } from "./GameType";

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  effect: (state: GameState, level: number) => GameState;
  maxLevel?: number;
}
