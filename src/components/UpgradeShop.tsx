import { Button } from "@/components/ui/button";
import { CalculateUpgradeCost, Upgrades } from "@/constants/Upgrades";
import { cn, formatNumber } from "@/lib/utils";
import { Pickaxe, Bot, Package, FileScan } from "lucide-react";

interface UpgradeShopProps {
  money: number;
  upgradeLevels: Record<string, number>;
  onUpgrade: (upgradeId: string) => void;
}

// Map upgrade IDs to icons
const UpgradeIcon = ({ id }: { id: string }) => {
  switch (id) {
    case "pickaxe":
      return <Pickaxe className="w-4 h-4" />;
    case "boots":
      return <Bot className="w-4 h-4" />;
    case "backpack":
      return <Package className="w-4 h-4" />;
    case "scanner":
      return <FileScan className="w-4 h-4" />;
    default:
      return null;
  }
};

// Add upgrade effect descriptions to make benefits clearer
const getUpgradeEffectDescription = (id: string, level: number): string => {
  switch (id) {
    case "pickaxe":
      return `+${level * 30}% mining efficiency`;
    case "boots":
      return `+${level * 25}% movement speed`;
    case "backpack":
      return `+${level * 40}% carrying capacity`;
    case "scanner":
      return `+${level * 20}% rare ore chance`;
    default:
      return "";
  }
};

export const UpgradeShop = ({
  money,
  upgradeLevels,
  onUpgrade,
}: UpgradeShopProps) => {
  return (
    <div className="p-4 animate-fade-in">
      <h2 className="text-xl font-bold mb-5 pixel-font text-center">
        Upgrade Shop
      </h2>

      <div className="space-y-3">
        {Upgrades.map((upgrade, index) => {
          const level = upgradeLevels[upgrade.id] || 0;
          const cost = CalculateUpgradeCost(upgrade, level);
          const canAfford = money >= cost;
          const maxLevelReached = upgrade.maxLevel && level >= upgrade.maxLevel;
          const effectDescription = getUpgradeEffectDescription(
            upgrade.id,
            level
          );

          return (
            <div
              key={upgrade.id}
              className={cn(
                "p-3 rounded border-2 transition-all pixel-container",
                canAfford
                  ? "border-primary/50 bg-secondary/40"
                  : "border-gray-700/50 bg-secondary/20 opacity-70"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-primary/20">
                    <UpgradeIcon id={upgrade.id} />
                  </div>
                  <span className="font-medium pixel-font">{upgrade.name}</span>
                </div>
                <span className="text-xs bg-secondary/70 px-2 py-0.5 rounded">
                  Level {level}
                  {upgrade.maxLevel ? `/${upgrade.maxLevel}` : ""}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mb-2">
                {upgrade.description}
              </p>

              {level > 0 && (
                <p className="text-xs text-green-500 mb-2 font-semibold">
                  Current: {effectDescription}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-mono">${formatNumber(cost)}</span>

                <Button
                  size="sm"
                  variant={canAfford ? "secondary" : "outline"}
                  onClick={() => onUpgrade(upgrade.id)}
                  disabled={!canAfford || maxLevelReached}
                  className={cn(
                    "h-7 text-xs pixel-font",
                    canAfford &&
                      !maxLevelReached &&
                      "border border-primary/50 hover:bg-primary/20"
                  )}
                >
                  {maxLevelReached ? "Maxed" : "Upgrade"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
