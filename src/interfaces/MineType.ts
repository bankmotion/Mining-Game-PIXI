export interface MineType {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
  resourceMultiplier: number;
  rareOreChance: number;
  oreCount: number;
  basePosition: { x: number; y: number };
  availableArea: { width: number; height: number };
}
