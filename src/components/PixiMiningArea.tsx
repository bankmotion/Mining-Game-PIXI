import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Ore, OreType } from "@/interfaces/OreTypes";
import { Miner } from "@/interfaces/MinerTypes";
import { MineMap } from "@/constants/Map";
import { MineTypes } from "@/constants/Mine";
import { Tileset } from "@/interfaces/MapTypes";
import { OreData } from "@/constants/Ore";
import {
  loadSprite,
  preloadSprites,
  createTilesetTexture,
  textureCache,
  createMinerTilesetTexture,
} from "@/utils/spriteLoader";
import { generateRandomOreType, createOre } from "@/lib/ores";
import { BasePoint } from "@/constants/Miners";

interface AnimatedSprite extends PIXI.Sprite {
  userData: {
    frame: number;
    animationSpeed: number;
    time: number;
    tileset: Tileset;
    baseTexture: PIXI.BaseTexture;
    animation?: { tileid: number; duration: number }[];
  };
}

interface PixiMiningAreaProps {
  miners: Miner[];
  ores: Ore[];
  activeMine?: string;
  onOreClick?: (ore: Ore) => void;
  onBaseClick?: () => void;
  isBlackout?: boolean;
}

// Function to find valid positions for ores on the map
const findValidOrePositions = (
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
        // Store as tile coordinates instead of percentages
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

export const PixiMiningArea = ({
  miners,
  ores,
  activeMine = "starter",
  onOreClick,
  onBaseClick,
  isBlackout = false,
}: PixiMiningAreaProps) => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(5);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Flag to track if initialization has been attempted and completed
  const initAttemptedRef = useRef(false);
  const initCompletedRef = useRef(false);

  // Get base position from game logic
  const getBasePosition = () => {
    const mine = MineTypes.find((m) => m.id === activeMine);
    return mine ? mine.basePosition : { x: 0, y: 0 };
  };

  const basePosition = getBasePosition();

  // Progress simulation with timeout
  useEffect(() => {
    if (loading && !initCompletedRef.current) {
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev < 90) return prev + 5;
          return prev;
        });
      }, 200);

      const timeoutId = setTimeout(() => {
        if (loading && !initCompletedRef.current) {
          console.error("PixiJS initialization timed out");
          setLoadingError("Initialization timed out. Using fallback renderer.");
          clearInterval(progressInterval);
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
        }
      }, 10000);

      return () => {
        clearInterval(progressInterval);
        clearTimeout(timeoutId);
      };
    }
  }, [loading]);

  // Update miner positions and states
  const updateGame = React.useCallback(
    (deltaTime: number) => {
      if (!appRef.current) return;
      const app = appRef.current;
      const gameContainer = app.stage.getChildAt(0) as PIXI.Container;
      if (!gameContainer) return;

      // Update ore states
      ores.forEach((ore) => {
        const oreSprite = gameContainer.getChildByName(
          `ore-${ore.id}`
        ) as PIXI.Sprite;
        if (!oreSprite) return;

        oreSprite.alpha = ore.depleted ? 0.4 : 1;

        // Update regeneration progress bar if depleted
        if (ore.depleted) {
          let progressBar = oreSprite.getChildByName(
            "progress-bar"
          ) as PIXI.Graphics;

          // Create progress bar if it doesn't exist
          if (!progressBar) {
            progressBar = new PIXI.Graphics();
            progressBar.name = "progress-bar";
            progressBar.y = -8; // Position above the ore
            oreSprite.addChild(progressBar);
          }

          // Calculate progress (0 to 1)
          const progress =
            1 - ore.regenerationTime / OreData[ore.type].regenerationTime; // 5 seconds regeneration time

          // Clear previous drawing
          progressBar.clear();

          // Draw background (green bar)
          progressBar.beginFill(0x10b981, 0.3); // Emerald color with transparency
          progressBar.drawRect(0, MineMap.tilewidth / 2, MineMap.tilewidth, 2);
          progressBar.endFill();

          // Draw progress (yellow bar)
          progressBar.beginFill(0xf39c12, 0.8); // Amber color with transparency
          progressBar.drawRect(
            0,
            MineMap.tilewidth / 2,
            MineMap.tilewidth * progress,
            2
          );
          progressBar.endFill();
        } else {
          // Remove progress bar if ore is not depleted
          const progressBar = oreSprite.getChildByName("progress-bar");
          if (progressBar) {
            oreSprite.removeChild(progressBar);
          }
        }
      });
    },
    [ores]
  );

  // Separate effect for game state updates
  useEffect(() => {
    if (!appRef.current) return;

    const app = appRef.current;
    const gameContainer = app.stage.getChildAt(0) as PIXI.Container;
    if (!gameContainer) return;

    // Add game state update ticker
    const tickerCallback = () => {
      updateGame(app.ticker.deltaMS);
    };
    app.ticker.add(tickerCallback);

    // Cleanup
    return () => {
      app.ticker.remove(tickerCallback);
    };
  }, [updateGame]);

  // Update miner animations
  const updateMinerAnimations = React.useCallback(
    (deltaTime: number) => {
      if (!appRef.current) return;
      const app = appRef.current;
      const gameContainer = app.stage.getChildAt(0) as PIXI.Container;
      if (!gameContainer) return;

      const minersContainer = gameContainer.getChildByName("Miners");
      if (minersContainer) {
        minersContainer.children.forEach((child) => {
          if (child instanceof PIXI.Sprite) {
            // Get miner ID from sprite name
            const minerId = child.name.replace("miner-", "");
            const miner = miners.find((m) => m.id === minerId);

            if (miner) {
              // Convert percentage-based position to tile coordinates
              const tileX = (miner.position.x / 100) * MineMap.width;
              const tileY = (miner.position.y / 100) * MineMap.height;

              // Update sprite position
              child.x = tileX * MineMap.tilewidth;
              child.y = tileY * MineMap.tileheight;
            }

            // Handle animations if sprite has animation data
            if ((child as AnimatedSprite).userData?.animation) {
              const sprite = child as AnimatedSprite;
              sprite.userData.time += deltaTime / 1000;

              if (sprite.userData.time >= sprite.userData.animationSpeed) {
                sprite.userData.time = 0;
                sprite.userData.frame =
                  (sprite.userData.frame + 1) %
                  sprite.userData.animation.length;

                // Update texture to next frame
                const frameData =
                  sprite.userData.animation[sprite.userData.frame];
                const tileTexture = createMinerTilesetTexture(
                  sprite.userData.baseTexture,
                  sprite.userData.tileset.firstgid + frameData.tileid + 1,
                  sprite.userData.tileset
                );
                sprite.texture = tileTexture;
              }
            }
          }
        });
      }
    },
    [miners]
  );

  // Separate effect for miner animations
  useEffect(() => {
    if (!appRef.current) return;

    const app = appRef.current;
    const gameContainer = app.stage.getChildAt(0) as PIXI.Container;
    if (!gameContainer) return;

    // Add animation ticker
    const tickerCallback = () => {
      updateMinerAnimations(app.ticker.deltaMS);
    };
    app.ticker.add(tickerCallback);

    // Cleanup
    return () => {
      app.ticker.remove(tickerCallback);
    };
  }, [updateMinerAnimations]);

  // Setup interactivity for ores and base
  const setupInteractivity = React.useCallback(
    (app: PIXI.Application, container: PIXI.Container) => {
      // Add base station
      const baseSprite = new PIXI.Container();
      baseSprite.x = (basePosition.x / 100) * app.screen.width;
      baseSprite.y = (basePosition.y / 100) * app.screen.height;
      baseSprite.width = 56; // 14 * 4
      baseSprite.height = 56;
      baseSprite.eventMode = "static";
      baseSprite.cursor = "pointer";

      // Add background rectangle
      const baseBackground = new PIXI.Graphics();
      baseBackground.beginFill(0x4a5568, 0.8); // Slate gray with transparency
      baseBackground.drawRoundedRect(-28, -28, 56, 56, 8);
      baseBackground.endFill();
      baseSprite.addChild(baseBackground);

      // Add border
      const baseBorder = new PIXI.Graphics();
      baseBorder.lineStyle(2, 0x718096); // Slate gray border
      baseBorder.drawRoundedRect(-28, -28, 56, 56, 8);
      baseSprite.addChild(baseBorder);

      // Add text
      const baseText = new PIXI.Text("BASE", {
        fontFamily: "Arial",
        fontSize: 12,
        fill: 0xffffff,
        align: "center",
        fontWeight: "bold",
      });
      baseText.anchor.set(0.5, 0.5);
      baseSprite.addChild(baseText);

      // Add glow effect
      const glow = new PIXI.Graphics();
      glow.beginFill(0x4a5568, 0.3);
      glow.drawCircle(0, 0, 40);
      glow.endFill();
      baseSprite.addChildAt(glow, 0);

      baseSprite.on("pointerdown", () => {
        if (!isBlackout && onBaseClick) {
          onBaseClick();
        }
      });
      container.addChild(baseSprite);

      // Add ore nodes
      ores.forEach((ore) => {
        const oreTileset = MineMap.tilesets.find(
          (ts) => ts.name === "mining_ores"
        );

        if (oreTileset) {
          // Create a texture for the ore
          const tileTexture = createTilesetTexture(
            textureCache["mining_ores"].baseTexture,
            oreTileset.firstgid +
              24 +
              Object.keys(OreData).findIndex((or) => or === ore.type),
            oreTileset
          );

          const oreSprite = new PIXI.Sprite(tileTexture);
          oreSprite.name = `ore-${ore.id}`;
          // Convert tile coordinates to pixel coordinates
          oreSprite.x = ore.position.x * MineMap.tilewidth;
          oreSprite.y = ore.position.y * MineMap.tileheight;
          oreSprite.width = MineMap.tilewidth; // Make ores slightly larger
          oreSprite.height = MineMap.tileheight;
          // oreSprite.anchor.set(0.5); // Center the sprite
          oreSprite.eventMode = "static";
          oreSprite.cursor = "pointer";
          oreSprite.on("pointerdown", () => {
            if (!isBlackout && onOreClick) {
              onOreClick(ore);
            }
          });

          // Add regeneration timer text
          const timerText = new PIXI.Text("", {
            fontSize: 12,
            fill: 0xffffff,
            align: "center",
          });
          timerText.name = "timer-text";
          timerText.anchor.set(0.5, -1);
          timerText.y = -10;
          oreSprite.addChild(timerText);

          container.addChild(oreSprite);
        }
      });

      // Add a dedicated container for miners
      const minersContainer = new PIXI.Container();
      minersContainer.name = "Miners";
      container.addChild(minersContainer);

      // Render miners in their dedicated container
      miners.forEach((miner) => {
        const characterTileset = MineMap.tilesets.find(
          (ts) => ts.name === "character_push_body_green"
        );

        if (characterTileset) {
          // Create a texture for the first frame of the animation
          const tileTexture = createMinerTilesetTexture(
            textureCache["character_push_body_green"].baseTexture,
            characterTileset.firstgid + characterTileset.columns + 1, // Use the first frame of the push-right animation
            characterTileset
          );

          const minerSprite = new PIXI.Sprite(tileTexture);
          minerSprite.name = `miner-${miner.id}`;

          // Position at (x,y) in tile coordinates
          const tileX = (miner.position.x / 100) * MineMap.width;
          const tileY = (miner.position.y / 100) * MineMap.height;
          minerSprite.x = tileX * MineMap.tilewidth;
          minerSprite.y = tileY * MineMap.tileheight;
          minerSprite.width = MineMap.tilewidth;
          minerSprite.height = MineMap.tileheight;

          // Add animation data
          const animationData = characterTileset.tiles?.find(
            (t) => t.id === 24
          )?.animation;
          if (animationData) {
            (minerSprite as AnimatedSprite).userData = {
              frame: 0,
              animationSpeed: 0.3, // 300ms per frame
              time: 0,
              tileset: characterTileset,
              baseTexture:
                textureCache["character_push_body_green"].baseTexture,
              animation: animationData,
            };
          }

          minersContainer.addChild(minerSprite);
        } else {
          console.log("Character tileset not found");
        }
      });
    },
    [basePosition, isBlackout, onBaseClick, onOreClick, ores, miners]
  );

  // Render map layers with sprites
  const renderMapLayers = React.useCallback(
    async (app: PIXI.Application, container: PIXI.Container) => {
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
    },
    [ores, activeMine]
  );

  // Initialize PixiJS application
  useEffect(() => {
    // Wait for next frame to ensure container is mounted
    const frameId = requestAnimationFrame(() => {
      if (
        !pixiContainerRef.current ||
        initAttemptedRef.current ||
        loadingProgress < 90
      ) {
        return;
      }

      initAttemptedRef.current = true;
      console.log("Starting PixiJS initialization...");

      // Create PixiJS application
      const app = new PIXI.Application({
        width: pixiContainerRef.current.clientWidth,
        height: pixiContainerRef.current.clientHeight,
        backgroundColor: 0x1a1a1a,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: pixiContainerRef.current,
      });

      // Add the canvas to the container
      pixiContainerRef.current.appendChild(app.view as HTMLCanvasElement);

      // Store the application reference
      appRef.current = app;

      // Create game container with scaling
      const gameContainer = new PIXI.Container();
      const scale = Math.min(
        app.screen.width / (MineMap.width * MineMap.tilewidth),
        app.screen.height / (MineMap.height * MineMap.tileheight)
      );
      gameContainer.scale.set(scale);
      gameContainer.x =
        (app.screen.width - MineMap.width * MineMap.tilewidth * scale) / 2;
      gameContainer.y =
        (app.screen.height - MineMap.height * MineMap.tileheight * scale) / 2;
      app.stage.addChild(gameContainer);

      // Load sprites and initialize the game
      const initializeGame = async () => {
        try {
          // Preload sprites with progress tracking
          console.log("Preloading sprites...");
          await preloadSprites(MineMap, (progress) => {
            setLoadingProgress(Math.min(90, 5 + progress * 0.85));
          });

          console.log("Available textures:", Object.keys(textureCache));

          // Render map layers
          console.log("Rendering map layers...");
          await renderMapLayers(app, gameContainer);

          // Add interactive elements
          console.log("Setting up interactivity...");
          setupInteractivity(app, gameContainer);

          // Start the game loop using PIXI's ticker
          app.ticker.add(() => {
            // Update game state
            updateGame(app.ticker.deltaMS);
          });

          // Mark initialization as complete
          console.log("Initialization complete!");
          initCompletedRef.current = true;
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
        } catch (error) {
          console.error("Failed to initialize game:", error);
          setLoadingError(
            "Failed to initialize game. Using fallback renderer."
          );
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
        }
      };

      initializeGame();

      // Handle window resize
      const handleResize = () => {
        if (!pixiContainerRef.current) return;
        app.renderer.resize(
          pixiContainerRef.current.clientWidth,
          pixiContainerRef.current.clientHeight
        );
      };

      window.addEventListener("resize", handleResize);

      // Cleanup function
      return () => {
        window.removeEventListener("resize", handleResize);
        app.destroy(true, { children: true, texture: true, baseTexture: true });
      };
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [setupInteractivity, updateGame, renderMapLayers, loadingProgress]);

  // Render loading screen
  return (
    <div className="relative w-full h-full">
      <div ref={pixiContainerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 pixel-container glass-panel rounded-lg overflow-hidden animate-fade-in shadow-xl border border-white/10 flex flex-col items-center justify-center gap-4">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">
              Loading Mining Area
            </h3>
            <p className="text-white mb-2">
              {loadingProgress < 30
                ? "Initializing PixiJS..."
                : loadingProgress < 60
                ? "Loading game assets..."
                : loadingProgress < 90
                ? "Setting up mining environment..."
                : "Finalizing..."}
            </p>
            <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
              <Progress value={loadingProgress} className="h-full" />
            </div>
          </div>
          <p className="text-xs text-gray-400 max-w-xs text-center">
            {loadingError || "Preparing your mining operation..."}
          </p>
          <div className="flex gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-100"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-200"></div>
          </div>
        </div>
      )}

      {isBlackout && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500 mb-2">
              BLACKOUT!
            </div>
            <div className="text-sm text-white/70 mb-4">
              Energy levels critical
            </div>
            <div className="text-sm text-white/50">All operations frozen</div>
          </div>
        </div>
      )}
    </div>
  );
};
