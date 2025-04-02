import { OreType } from "@/interfaces/OreTypes";

export const OreColors: Record<OreType, string> = {
  coal: "text-gray-100 bg-gray-800",
  iron: "text-white bg-slate-500",
  copper: "text-white bg-amber-600",
  gold: "text-black bg-yellow-400",
  crystal: "text-white bg-cyan-500",
  gem: "text-white bg-purple-600",
  legendary: "text-white bg-rose-600",
  tin: "text-white bg-zinc-400",
  silver: "text-black bg-gray-300",
  mithril: "text-white bg-indigo-500",
  thorium: "text-white bg-emerald-600",
  platinum: "text-black bg-slate-200",
  orichalcum: "text-white bg-orange-500",
  uranium: "text-white bg-green-400",
};

// Function to get color based on ore type
export const getOreColor = (type: OreType) => {
  switch (type) {
    case "coal":
      return "#1f2937";
    case "iron":
      return "#6b7280";
    case "copper":
      return "#d97706";
    case "gold":
      return "#fbbf24";
    case "crystal":
      return "#0ea5e9";
    case "gem":
      return "#8b5cf6";
    case "legendary":
      return "#ef4444";
    case "tin":
      return "#94a3b8";
    case "silver":
      return "#cbd5e1";
    case "mithril":
      return "#6366f1";
    case "thorium":
      return "#10b981";
    case "platinum":
      return "#e2e8f0";
    case "orichalcum":
      return "#f97316";
    case "uranium":
      return "#84cc16";
    default:
      return "#6b7280";
  }
};

export const OreData: Record<
  OreType,
  {
    baseYield: number;
    hardness: number;
    value: number;
    rarity: number;
    regenerationTime: number;
  }
> = {
  // Original ores
  coal: {
    baseYield: 1,
    hardness: 5,
    value: 1,
    rarity: 0.25,
    regenerationTime: 2,
  },
  iron: {
    baseYield: 1,
    hardness: 4,
    value: 2,
    rarity: 0.18,
    regenerationTime: 3,
  },
  copper: {
    baseYield: 1,
    hardness: 6,
    value: 2,
    rarity: 0.18,
    regenerationTime: 4,
  },
  gold: {
    baseYield: 1,
    hardness: 3,
    value: 5,
    rarity: 0.08,
    regenerationTime: 10,
  },
  crystal: {
    baseYield: 1,
    hardness: 3.5,
    value: 10,
    rarity: 0.05,
    regenerationTime: 15,
  },
  gem: {
    baseYield: 1,
    hardness: 4,
    value: 25,
    rarity: 0.015,
    regenerationTime: 30,
  },
  legendary: {
    baseYield: 1,
    hardness: 4.5,
    value: 100,
    rarity: 0.005,
    regenerationTime: 60,
  },

  // New ore types
  tin: {
    baseYield: 1,
    hardness: 2,
    value: 1,
    rarity: 0.22,
    regenerationTime: 2,
  },
  silver: {
    baseYield: 1,
    hardness: 3,
    value: 4,
    rarity: 0.1,
    regenerationTime: 8,
  },
  mithril: {
    baseYield: 1,
    hardness: 4,
    value: 15,
    rarity: 0.03,
    regenerationTime: 20,
  },
  thorium: {
    baseYield: 1,
    hardness: 4.5,
    value: 20,
    rarity: 0.02,
    regenerationTime: 25,
  },
  platinum: {
    baseYield: 1,
    hardness: 6,
    value: 30,
    rarity: 0.01,
    regenerationTime: 35,
  },
  orichalcum: {
    baseYield: 1,
    hardness: 7.5,
    value: 50,
    rarity: 0.008,
    regenerationTime: 45,
  },
  uranium: {
    baseYield: 1,
    hardness: 8,
    value: 75,
    rarity: 0.006,
    regenerationTime: 55,
  },
};
