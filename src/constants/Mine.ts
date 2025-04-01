import { MineType } from "@/interfaces/MineType";
import { MineMap } from "./Map";

export const MineTypes: MineType[] = [
  {
    id: "starter",
    name: "Starter Quarry",
    description: "A basic mining area with common resources.",
    cost: 0,
    unlocked: true,
    resourceMultiplier: 1,
    rareOreChance: 1,
    oreCount: 20,
    basePosition: { x: 19 * 100 / MineMap.width, y: 2 * 100 / MineMap.height },
  },
  {
    id: "advanced",
    name: "Advanced Excavation",
    description: "A more advanced mining area with better resource yield.",
    cost: 1000,
    unlocked: false,
    resourceMultiplier: 2,
    rareOreChance: 1.5,
    oreCount: 25,
    basePosition: { x: 85, y: 15 },
  },
  {
    id: "premium",
    name: "Premium Deposit",
    description: "A premium mining area with significantly better resources.",
    cost: 10000,
    unlocked: false,
    resourceMultiplier: 4,
    rareOreChance: 2,
    oreCount: 30,
    basePosition: { x: 15, y: 85 },
  },
  {
    id: "legendary",
    name: "Legendary Cavern",
    description:
      "An extraordinary mining location with extremely valuable resources.",
    cost: 50000,
    unlocked: false,
    resourceMultiplier: 8,
    rareOreChance: 3,
    oreCount: 35,
    basePosition: { x: 85, y: 85 },
  },
];
