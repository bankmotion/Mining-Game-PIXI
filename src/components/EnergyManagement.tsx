import { Button } from "@/components/ui/button";
import { EnergySourceData } from "@/constants/Energy";
import { EnergySource, EnergySourceType } from "@/interfaces/EnergyTypes";
import { cn, formatNumber } from "@/lib/utils";
import { Sun, Wind, Flame, Atom, Zap } from "lucide-react";

interface EnergyManagementProps {
  money: number;
  energySources: EnergySourceType[];
  onBuildEnergySource: (type: EnergySource) => void;
  onUpgradeEnergySource: (sourceId: string) => void;
}

// Energy source icons
const EnergySourceIcon = ({ type }: { type: EnergySource }) => {
  switch (type) {
    case "solar":
      return <Sun className="w-4 h-4 text-yellow-400" />;
    case "wind":
      return <Wind className="w-4 h-4 text-blue-400" />;
    case "geothermal":
      return <Flame className="w-4 h-4 text-orange-400" />;
    case "nuclear":
      return <Atom className="w-4 h-4 text-green-400" />;
    default:
      return <Zap className="w-4 h4" />;
  }
};

export const EnergyManagement = ({
  money,
  energySources,
  onBuildEnergySource,
  onUpgradeEnergySource,
}: EnergyManagementProps) => {
  return (
    <div className="p-4 animate-fade-in">
      <h2 className="text-xl font-bold mb-5 pixel-font text-center">
        Energy Management
      </h2>

      {/* Energy Sources Section */}
      <div className="space-y-3">
        {Object.entries(EnergySourceData).map(([type, data]) => {
          const source = energySources.find((s) => s.type === type);
          const canAfford =
            money >= (source ? source.cost * 1.5 : data.baseCost);
          const maxLevelReached = source && source.level >= data.maxLevel;

          return (
            <div
              key={type}
              className={cn(
                "p-3 rounded border-2 transition-all pixel-container",
                canAfford
                  ? "border-primary/50 bg-secondary/40"
                  : "border-gray-700/50 bg-secondary/20 opacity-70"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-primary/20">
                    <EnergySourceIcon type={type as EnergySource} />
                  </div>
                  <span className="font-medium pixel-font capitalize">
                    {type}
                  </span>
                </div>
                {source && (
                  <span className="text-xs bg-secondary/70 px-2 py-0.5 rounded">
                    Level {source.level}/{data.maxLevel}
                  </span>
                )}
              </div>

              <div className="text-xs text-muted-foreground mb-2">
                <div>
                  Output: {source ? source.energyOutput : data.baseOutput}{" "}
                  energy/s
                </div>
                <div>
                  Maintenance: $
                  {source ? source.maintenanceCost : data.baseMaintenance}/s
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-mono">
                  ${formatNumber(source ? source.cost * 1.5 : data.baseCost)}
                </span>

                <Button
                  size="sm"
                  variant={canAfford ? "secondary" : "outline"}
                  onClick={() =>
                    source
                      ? onUpgradeEnergySource(source.id)
                      : onBuildEnergySource(type as EnergySource)
                  }
                  disabled={!canAfford || maxLevelReached}
                  className={cn(
                    "h-7 text-xs pixel-font",
                    canAfford &&
                      !maxLevelReached &&
                      "border border-primary/50 hover:bg-primary/20"
                  )}
                >
                  {maxLevelReached ? "Maxed" : source ? "Upgrade" : "Build"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 