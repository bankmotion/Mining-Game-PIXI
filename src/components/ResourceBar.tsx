import { OreType } from "@/interfaces/OreTypes";
import { formatNumber } from "@/lib/utils";
import { Pickaxe, Coins, CircleDollarSign, Gem } from "lucide-react";

interface ResourceBarProps {
  resources: Record<OreType, number>;
  money: number;
  moneyRate: number;
}

// Map ore types to colors
const oreColors: Record<OreType, string> = {
  coal: "bg-ore-coal",
  iron: "bg-ore-iron",
  copper: "bg-ore-copper",
  gold: "bg-ore-gold",
  crystal: "bg-ore-crystal",
  gem: "bg-ore-gem",
  legendary: "bg-ore-legendary",
  // Additional ore types
  tin: "bg-ore-tin",
  silver: "bg-ore-silver",
  mithril: "bg-ore-mithril",
  thorium: "bg-ore-thorium",
  platinum: "bg-ore-platinum",
  orichalcum: "bg-ore-orichalcum",
  uranium: "bg-ore-uranium",
};

// Map ore types to icons
const OreIcon = ({ type }: { type: OreType }) => {
  switch (type) {
    case "coal":
      return <div className={`w-3 h-3 rounded-full ${oreColors[type]}`} />;
    case "legendary":
    case "gem":
      return <Gem className="w-4 h-4" />;
    default:
      return <div className={`w-3 h-3 rounded-full ${oreColors[type]}`} />;
  }
};

export const ResourceBar = ({
  resources,
  money,
  moneyRate,
}: ResourceBarProps) => {
  return (
    <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar px-2">
      <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1 rounded-md">
        <Coins className="w-4 h-4 text-yellow-400" />
        <span className="font-bold">{formatNumber(money)}</span>
        <span className="text-yellow-400 text-xs flex items-center">
          <CircleDollarSign className="w-3 h-3 mr-1" />
          {formatNumber(moneyRate)}/s
        </span>
      </div>

      <div className="h-6 w-px bg-white/10 mx-1"></div>

      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
        {Object.entries(resources).map(([type, amount]) => (
          <div
            key={type}
            className="flex items-center gap-1 bg-secondary/30 px-2 py-1 rounded-md text-xs"
          >
            <OreIcon type={type as OreType} />
            <span className="font-medium">{formatNumber(amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
