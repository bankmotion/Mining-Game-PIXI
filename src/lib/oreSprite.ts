import { LayerName, SpriteName } from "@/constants/Sprites";
import { MapContainer } from "@/interfaces/MapTypes";
import { Ore } from "@/interfaces/OreTypes";
import { OreData } from "@/constants/Ore";
import { GameState } from "@/interfaces/GameType";
import { updateMapType } from "./mapSprite";

export const createOreSprite = (
  gameState: GameState,
  containers: MapContainer,
  ore: Ore,
  onOreClick: (ore: Ore) => void,
  isBlackout: boolean
) => {
  const sprite = updateMapType(
    containers.ore,
    ore.position,
    SpriteName.MiningOres,
    25 + Object.keys(OreData).findIndex((or) => or === ore.type)
  );

  if (!isBlackout && onOreClick) {
    sprite.eventMode = "static";
    sprite.cursor = "pointer";
    sprite.removeAllListeners();
    sprite.on("pointerdown", () => onOreClick(ore));
  }
  sprite.name = `ore-${ore.id}`;
  sprite.cursor = "pointer";
  sprite.alpha = ore.depleted ? 0.4 : 1;
};
