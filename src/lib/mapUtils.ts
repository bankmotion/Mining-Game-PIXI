import * as PIXI from "pixi.js";
import { MineMap } from "@/constants/Map";
import { MineTypes } from "@/constants/Mine";
import { Ore } from "@/interfaces/OreTypes";
import { generateRandomOreType, createOre } from "@/lib/ores";
import { createTilesetTexture, textureCache } from "@/utils/spriteLoader";

// Function to find valid positions for ores on the map
export const findValidOrePositions = (
  map: typeof MineMap
): Array<{ x: number; y: number }> => {
  const validPositions: Array<{ x: number; y: number }> = [];
  const floorLayer = map.layers.find((l) => l.name === "Floor");
  const mountainLayer = map.layers.find((l) => l.name === "Mountains");

  if (!floorLayer || !mountainLayer) return validPositions;

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const index = y * map.width + x;
      const floorTile = floorLayer.data[index];
      const mountainTile = mountainLayer.data[index];

      // Check if the position is valid (has floor and no mountain)
      if (floorTile !== 0 && mountainTile === 0) {
        validPositions.push({
          x: x,
          y: y,
        });
      }
    }
  }

  return validPositions;
};

// Function to generate ores at valid positions
const generateOresAtPositions = (
  positions: Array<{ x: number; y: number }>,
  count: number,
  rareOreChance: number = 1
): Ore[] => {
  const ores: Ore[] = [];
  const availablePositions = [...positions];

  // Shuffle positions
  for (let i = availablePositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availablePositions[i], availablePositions[j]] = [
      availablePositions[j],
      availablePositions[i],
    ];
  }

  // Take only the number of positions we need
  const selectedPositions = availablePositions.slice(0, count);

  // Generate ores at selected positions
  for (const position of selectedPositions) {
    const type = generateRandomOreType(rareOreChance);
    ores.push(createOre(type, position));
  }

  return ores;
};

// Function to render map layers
export const renderMapLayers = async (
  app: PIXI.Application,
  container: PIXI.Container,
  ores: Ore[],
  activeMine: string
) => {
  try {
    // Create containers for each layer
    const layerContainers: { [key: string]: PIXI.Container } = {};
    MineMap.layers.forEach((layer) => {
      const layerContainer = new PIXI.Container();
      layerContainer.name = layer.name;
      container.addChild(layerContainer);
      layerContainers[layer.name] = layerContainer;
    });

    // Render each layer
    for (const layer of MineMap.layers) {
      const layerContainer = layerContainers[layer.name];
      if (!layerContainer) continue;

      layerContainer.removeChildren();

      if (layer.type === "tilelayer") {
        for (let i = 0; i < layer.data.length; i++) {
          const tileId = layer.data[i];
          if (tileId === 0) continue; // skip empty tiles

          const x = (i % layer.width) * MineMap.tilewidth;
          const y = Math.floor(i / layer.width) * MineMap.tileheight;

          // Find the tileset for this tile
          const tileset = MineMap.tilesets.find(
            (ts) =>
              tileId >= ts.firstgid &&
              tileId < ts.firstgid + (ts.tilecount || 0)
          );

          if (tileset && textureCache[tileset.name]) {
            // Create a texture for this specific tile
            const tileTexture = createTilesetTexture(
              textureCache[tileset.name].baseTexture,
              tileId,
              tileset
            );

            // Create and position the sprite
            const tile = new PIXI.Sprite(tileTexture);
            tile.x = x;
            tile.y = y;
            layerContainer.addChild(tile);
          }
        }
      }
    }

    // Find valid positions for ores
    const validPositions = findValidOrePositions(MineMap);

    // Generate ores at valid positions
    const generatedOres = generateOresAtPositions(
      validPositions,
      ores.length,
      MineTypes.find((m) => m.id === activeMine)?.rareOreChance || 1
    );

    // Update ore positions with generated positions
    ores.forEach((ore, index) => {
      if (generatedOres[index]) {
        ore.position = generatedOres[index].position;
      }
    });
  } catch (error) {
    console.error("Error rendering map layers:", error);
  }
};
