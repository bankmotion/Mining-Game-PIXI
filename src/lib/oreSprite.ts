import { LayerName, SpriteName } from "@/constants/Sprites";
import { MapContainer } from "@/interfaces/MapTypes";
import { Ore } from "@/interfaces/OreTypes";
import { updateMapType } from "./mapLogic";
import { OreData } from "@/constants/Ore";

export const createOreSprite = (
  containers: MapContainer,
  ore: Ore,
  onOreClick: (ore: Ore) => void,
  isBlackout: boolean
) => {
  const sprite = updateMapType(
    containers.ore,
    ore.position,
    SpriteName.MiningOres,
    25 + Object.keys(OreData).findIndex((or) => or === ore.type),
    LayerName.Ore
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
