export type OreType =
  | "coal"
  | "iron"
  | "copper"
  | "gold"
  | "crystal"
  | "gem"
  | "legendary"
  | "tin"
  | "silver"
  | "mithril"
  | "thorium"
  | "platinum"
  | "orichalcum"
  | "uranium";

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
