import { Button } from "@/components/ui/button";
import { MinerTypes } from "@/constants/Miners";
import { cn, formatNumber } from "@/lib/utils";
import { User, UserCog, Truck, Compass, Wrench } from "lucide-react";

interface HiringStationProps {
  money: number;
  miners: Array<{ id: string; type: string }>;
  onHire: (
    type: "basic" | "expert" | "hauler" | "prospector" | "engineer"
  ) => void;
}

// Map miner types to icons
const MinerIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "basic":
      return <User className="w-4 h-4" />;
    case "expert":
      return <UserCog className="w-4 h-4" />;
    case "hauler":
      return <Truck className="w-4 h-4" />;
    case "prospector":
      return <Compass className="w-4 h-4" />;
    case "engineer":
      return <Wrench className="w-4 h-4" />;
    default:
      return null;
  }
};

export const HiringStation = ({
  money,
  miners,
  onHire,
}: HiringStationProps) => {
  // Calculate miner costs based on current counts
  const getMinerCost = (type: string) => {
    const count = miners.filter((m) => m.type === type).length;
    const baseCost = MinerTypes[type as keyof typeof MinerTypes].baseCost;
    return Math.floor(baseCost * Math.pow(1.2, count));
  };

  return (
    <div className="p-4 animate-fade-in">
      <h2 className="text-xl font-bold mb-5 pixel-font text-center">
        Hire Miners
      </h2>

      <div className="space-y-3">
        {Object.entries(MinerTypes).map(([type, data], index) => {
          const count = miners.filter((m) => m.type === type).length;
          const cost = getMinerCost(type);
          const canAfford = money >= cost;

          return (
            <div
              key={type}
              className={cn(
                "p-3 rounded border-2 transition-all pixel-container",
                canAfford
                  ? "border-gray-700/50 bg-secondary/20 hover:bg-secondary/30 hover:border-gray-600/70"
                  : "border-gray-700/30 bg-secondary/10 opacity-70"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded", `bg-miner-${type}/20`)}>
                    <MinerIcon type={type} />
                  </div>
                  <span className="font-medium pixel-font capitalize">
                    {type} Miner
                  </span>
                </div>
                <span className="text-xs bg-secondary/70 px-2 py-0.5 rounded">
                  {count} hired
                </span>
              </div>

              <p className="text-xs text-muted-foreground mb-2">
                {data.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-sm font-mono">${formatNumber(cost)}</span>

                <Button
                  size="sm"
                  variant={canAfford ? "outline" : "secondary"}
                  disabled={!canAfford}
                  onClick={() => onHire(type as any)}
                  className="h-7 text-xs pixel-font"
                >
                  {canAfford ? "Hire" : "Not enough $"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
