import { MineTypes } from "@/constants/Mine";
import {
  FloorData,
  InitialTileWidth,
  LayerName,
  MineCartsData,
  MountainData,
  SpriteName,
  Sprites,
} from "@/constants/Sprites";
import {
  MapContainer,
  MapDimensions,
  MapPosition,
  MinerSpriteData,
} from "@/interfaces/MapTypes";
import { Miner } from "@/interfaces/MinerTypes";
import { Ore } from "@/interfaces/OreTypes";
import { Rail } from "@/interfaces/RailType";
import {
  createMinerTilesetTexture,
  createTilesetTexture,
} from "@/utils/spriteLoader";
import { getRandomTileId } from "@/utils/utils";
import * as PIXI from "pixi.js";
import {
  createMinerAtPositions,
  findValidMinerPositions,
  getMinerAnimationType,
  updateMinerPositions,
} from "./minersLogic";
import { findValidOrePositions, updateOrePositions } from "./oresLogic";
import { OreData } from "@/constants/Ore";
import { GameState } from "@/interfaces/GameType";
import { findValidRailPositions, updateRailPositions } from "./railLogic";

// Constants
export const MapLayerType: LayerName[][] = [];
export const minerSprites = new Map<string, MinerSpriteData>();
export const oreSpriteCache = new Map<string, PIXI.Sprite>();

// Cache for text styles
const textStyles = {
  base: new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: 14,
    fill: 0xffffff,
    align: "left",
    fontWeight: "bold",
  }),
  timer: new PIXI.TextStyle({
    fontSize: 12,
    fill: 0xffffff,
    align: "center",
  }),
};

// Helper Functions
const createMapContainer = (container: PIXI.Container): MapContainer => {
  const floorContainer = new PIXI.Container();
  floorContainer.name = LayerName.Floor;
  container.addChild(floorContainer);

  const wallContainer = new PIXI.Container();
  wallContainer.name = LayerName.Wall;
  container.addChild(wallContainer);

  const railContainer = new PIXI.Container();
  railContainer.name = LayerName.Rails;
  container.addChild(railContainer);

  const minerContainer = new PIXI.Container();
  minerContainer.name = LayerName.Miners;
  container.addChild(minerContainer);

  const oreContainer = new PIXI.Container();
  oreContainer.name = LayerName.Ore;
  container.addChild(oreContainer);

  return {
    floor: floorContainer,
    wall: wallContainer,
    miner: minerContainer,
    ore: oreContainer,
    rail: railContainer,
  };
};

const calculateMapCenter = (dimensions: MapDimensions): MapPosition => ({
  x: Math.floor(dimensions.width / 2),
  y: Math.floor(dimensions.height / 2),
});

// New function to generate a more natural cave shape
const generateCaveShape = (
  width: number,
  height: number,
  roughness: number = 0.3
): boolean[][] => {
  const shape: boolean[][] = Array(height)
    .fill(0)
    .map(() => Array(width).fill(false));

  // Start with a basic ellipse
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = width / 2;
  const radiusY = height / 2;

  // Add some random variation to the shape
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate distance from center
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Add some noise to the distance
      const noise = (Math.random() - 0.5) * roughness;
      const adjustedDistance = distance + noise;

      // If within the adjusted radius, mark as floor
      if (adjustedDistance <= 1) {
        shape[y][x] = true;
      }
    }
  }

  // Smooth the edges
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (shape[y][x]) {
        // Count adjacent floor tiles
        let floorCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (shape[y + dy][x + dx]) floorCount++;
          }
        }
        // If too isolated, convert to wall
        if (floorCount < 4) shape[y][x] = false;
      }
    }
  }

  // Add door at top center
  shape[0][Math.floor(width / 2)] = true;

  return shape;
};

const calculateAvailableAreaBounds = (
  center: MapPosition,
  availableArea: MapDimensions
): { start: MapPosition; end: MapPosition; shape: boolean[][] } => {
  const startX = center.x - Math.floor(availableArea.width / 2);
  const startY = center.y - Math.floor(availableArea.height / 2);
  const endX = startX + availableArea.width;
  const endY = startY + availableArea.height;

  // Generate the cave shape
  const shape = generateCaveShape(
    availableArea.width,
    availableArea.height,
    0.2
  );

  return {
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
    shape,
  };
};

const isPositionInBounds = (
  pos: MapPosition,
  dimensions: MapDimensions
): boolean => {
  return (
    pos.x >= 0 &&
    pos.x < dimensions.width &&
    pos.y >= 0 &&
    pos.y < dimensions.height
  );
};

const isPositionInAvailableArea = (
  pos: MapPosition,
  bounds: { start: MapPosition; end: MapPosition; shape: boolean[][] }
): boolean => {
  const relativeX = pos.x - bounds.start.x;
  const relativeY = pos.y - bounds.start.y;

  // Check if position is within the bounds and part of the cave shape
  return (
    pos.x >= bounds.start.x &&
    pos.x < bounds.end.x &&
    pos.y >= bounds.start.y &&
    pos.y < bounds.end.y &&
    bounds.shape[relativeY]?.[relativeX] === true
  );
};

// Core Functions
export const updateMapType = (
  container: PIXI.Container<PIXI.DisplayObject>,
  position: MapPosition,
  spriteName: SpriteName,
  id: number,
  mapType: LayerName
): PIXI.Sprite => {
  const tileTexture = createTilesetTexture(spriteName, id);
  const tile = new PIXI.Sprite(tileTexture);

  tile.x = position.x * InitialTileWidth;
  tile.y = position.y * InitialTileWidth;
  container.addChild(tile);

  if (!MapLayerType[position.y]) {
    MapLayerType[position.y] = [];
  }
  MapLayerType[position.y][position.x] = mapType;

  return tile;
};

const createFloorTiles = (
  containers: MapContainer,
  bounds: { start: MapPosition; end: MapPosition; shape: boolean[][] },
  dimensions: MapDimensions,
  onBaseClick: () => void,
  updateGameState: (gameState: GameState) => void
): MapPosition => {
  // First, find the top center position for the door
  const doorX = Math.floor((bounds.start.x + bounds.end.x) / 2);
  const doorY = bounds.start.y;
  const doorPosition: MapPosition = { x: doorX, y: doorY };

  // Place the door first
  if (isPositionInBounds(doorPosition, dimensions)) {
    const doorSprite = updateMapType(
      containers.floor,
      doorPosition,
      SpriteName.MineDoors,
      11,
      LayerName.Doors
    );

    // Set the base position
    updateGameState({
      basePosition: {
        x: (100 * doorPosition.x) / dimensions.width,
        y: (100 * doorPosition.y) / dimensions.height,
      },
    } as GameState);

    // Add click event to door sprite
    if (doorSprite) {
      doorSprite.eventMode = "static";
      doorSprite.cursor = "pointer";
      doorSprite.on("pointerdown", () => {
        if (onBaseClick) {
          onBaseClick();
        }
      });
    }
  }

  // Then create the rest of the floor tiles
  for (let y = bounds.start.y; y < bounds.end.y; y++) {
    for (let x = bounds.start.x; x < bounds.end.x; x++) {
      const position = { x, y };
      if (!isPositionInBounds(position, dimensions)) continue;

      const relativeX = x - bounds.start.x;
      const relativeY = y - bounds.start.y;

      // Skip the door position
      if (x === doorX && y === doorY) continue;

      // Only create floor tiles where the shape is true
      if (bounds.shape[relativeY]?.[relativeX]) {
        const id = getRandomTileId(FloorData);
        updateMapType(
          containers.floor,
          position,
          SpriteName.WallsFloors,
          id,
          LayerName.Floor
        );
      }
    }
  }
  return doorPosition;
};

export const createOreSprite = (
  ore: Ore,
  onOreClick: (ore: Ore) => void,
  isBlackout: boolean
): PIXI.Sprite => {
  // Check cache first
  if (oreSpriteCache.has(ore.id)) {
    const cachedSprite = oreSpriteCache.get(ore.id)!;
    cachedSprite.alpha = ore.depleted ? 0.4 : 1;
    if (!isBlackout && onOreClick) {
      cachedSprite.eventMode = "static";
      cachedSprite.cursor = "pointer";
      cachedSprite.removeAllListeners();
      cachedSprite.on("pointerdown", () => onOreClick(ore));
    }
    return cachedSprite;
  }

  const oreTileset = Sprites.find((ts) => ts.name === SpriteName.MiningOres);
  if (!oreTileset) {
    throw new Error("Ore tileset not found");
  }

  const tileTexture = createTilesetTexture(
    SpriteName.MiningOres,
    24 + Object.keys(OreData).findIndex((or) => or === ore.type)
  );

  const oreSprite = new PIXI.Sprite(tileTexture);
  oreSprite.name = `ore-${ore.id}`;
  oreSprite.x = ore.position.x * InitialTileWidth;
  oreSprite.y = ore.position.y * InitialTileWidth;
  oreSprite.width = InitialTileWidth;
  oreSprite.height = InitialTileWidth;
  oreSprite.eventMode = "static";
  oreSprite.cursor = "pointer";
  oreSprite.alpha = ore.depleted ? 0.4 : 1;

  if (!isBlackout && onOreClick) {
    oreSprite.on("pointerdown", () => onOreClick(ore));
  }

  // Add regeneration timer text with cached style
  const timerText = new PIXI.Text("", textStyles.timer);
  timerText.name = "timer-text";
  timerText.anchor.set(0.5, -1);
  timerText.y = -10;
  oreSprite.addChild(timerText);

  // Cache the sprite
  oreSpriteCache.set(ore.id, oreSprite);

  return oreSprite;
};

const createWallTiles = (
  containers: MapContainer,
  bounds: { start: MapPosition; end: MapPosition; shape: boolean[][] },
  dimensions: MapDimensions
): void => {
  for (let y = 0; y < dimensions.height; y++) {
    for (let x = 0; x < dimensions.width; x++) {
      const position = { x, y };
      if (isPositionInAvailableArea(position, bounds)) continue;

      updateMapType(
        containers.wall,
        position,
        SpriteName.WallsFloors,
        MountainData.GeneralWall,
        LayerName.Wall
      );
    }
  }
};

export const createMinerSprite = (miner: Miner): PIXI.Sprite => {
  const animationType = getMinerAnimationType(miner);
  const spriteName = SpriteName.CharacterPushBodyGreen;
  const spriteData = Sprites.find((s) => s.name === spriteName);
  if (!spriteData) return null;

  const animationData = spriteData.animations[animationType];
  if (!animationData) return null;

  const sprite = new PIXI.Sprite();
  sprite.name = `miner-${miner.id}`;

  // Set initial position
  sprite.x = miner.position.x * InitialTileWidth;
  sprite.y = miner.position.y * InitialTileWidth;

  // Set initial texture
  const texture = createMinerTilesetTexture(
    SpriteName.CharacterPushBodyGreen,
    animationData.frames[0]
  );
  sprite.texture = texture;

  // Store animation data
  minerSprites.set(miner.id, {
    sprite,
    animationType,
    frame: 0,
    time: 0,
  });

  return sprite;
};

export const createRailSprite = (rail: Rail): PIXI.Sprite => {
  // Create a rail sprite based on the rail type
  const railTexture = createTilesetTexture(SpriteName.MineCarts, rail.type);
  const railSprite = new PIXI.Sprite(railTexture);

  railSprite.name = `rail-${rail.id}`;
  railSprite.x = rail.position.x * InitialTileWidth;
  railSprite.y = rail.position.y * InitialTileWidth;
  railSprite.width = InitialTileWidth;
  railSprite.height = InitialTileWidth;

  return railSprite;
};

// Main Function
export const renderMapLayers = async (
  app: PIXI.Application,
  container: PIXI.Container,
  gameState: GameState,
  onOreClick: (ore: Ore) => void,
  updateGameState: (gameState: GameState) => void,
  isBlackout: boolean,
  dimensions?: MapDimensions,
  onBaseClick?: () => void
): Promise<void> => {
  try {
    console.log(gameState, dimensions);
    const mine = MineTypes.find((m) => m.id === gameState.activeMine);
    if (!mine) {
      throw new Error("Active mine not found");
    }

    const center = calculateMapCenter(dimensions);
    const bounds = calculateAvailableAreaBounds(center, mine.availableArea);
    const containers = createMapContainer(container);

    // Create floor and door tiles
    const door = createFloorTiles(
      containers,
      bounds,
      dimensions,
      onBaseClick,
      updateGameState
    );
    createWallTiles(containers, bounds, dimensions);

    // Create rail tiles
    const activeMine = gameState.mines[gameState.activeMine];
    if (!activeMine) {
      throw new Error("Active mine not found");
    }

    const rails = updateRailPositions(activeMine, door);
    console.log(rails);

    // Update game state with the new rails
    updateGameState({
      rails: rails,
    } as GameState);

    // Render rail sprites
    rails.forEach((rail) => {
      const railSprite = createRailSprite(rail);
      containers.rail.addChild(railSprite);
    });

    // Create ore tiles
    const validOrePositions = findValidOrePositions(
      dimensions.width,
      dimensions.height
    );
    updateOrePositions(
      gameState.ores,
      validOrePositions,
      mine.rareOreChance || 1
    );
    gameState.ores.forEach((ore) => {
      const oreSprite = createOreSprite(ore, onOreClick, isBlackout);
      containers.miner.addChild(oreSprite);
    });

    // Create miner tiles
    const validMinerPositions = findValidMinerPositions(
      dimensions.width,
      dimensions.height
    );
    updateMinerPositions(
      gameState.miners,
      validMinerPositions,
      gameState.activeMine
    );

    // Create miner sprites
    gameState.miners.forEach((miner) => {
      const minerSprite = createMinerSprite(miner);
      containers.miner.addChild(minerSprite);
    });
  } catch (error) {
    console.error("Error rendering map layers:", error);
    throw error;
  }
};
