import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Ore, OreType } from "@/interfaces/OreTypes";
import { Miner } from "@/interfaces/MinerTypes";

interface PixiMiningAreaProps {
  miners: Miner[];
  ores: Ore[];
}

// Resource particle component (rendered outside canvas for text)
const ResourceParticle = ({
  type,
  amount,
  position,
}: {
  type: OreType;
  amount: number;
  position: { x: number; y: number };
}) => {
  const oreColors: Record<OreType, string> = {
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

  return (
    <div
      className={`absolute px-1 py-0.5 rounded-full ${
        oreColors[type] || "bg-gray-800 text-white"
      } text-xs resource-particle font-bold`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
    >
      +{amount}
    </div>
  );
};

export const PixiMiningArea = ({ miners, ores }: PixiMiningAreaProps) => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(5);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [particles, setParticles] = useState<
    Array<{
      id: string;
      type: OreType;
      amount: number;
      position: { x: number; y: number };
    }>
  >([]);

  // Keep track of previous miners to detect mining completion
  const prevMinersRef = useRef<Miner[]>([]);

  // Theme for colored tiles
  const [tileTheme, setTileTheme] = useState<
    "blue" | "brown" | "green" | "gray"
  >("blue");

  // Flag to track if initialization has been attempted and completed
  const initAttemptedRef = useRef(false);
  const initCompletedRef = useRef(false);

  // Progress simulation with timeout
  useEffect(() => {
    if (loading && !initCompletedRef.current) {
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev < 90) return prev + 5;
          return prev;
        });
      }, 200);

      // Timeout for initialization - if it doesn't complete within 10 seconds, show error
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

  // Initialize PixiJS app with error handling
  useEffect(() => {
    // Do nothing if already attempted or no container
    if (!pixiContainerRef.current || initAttemptedRef.current) return;

    // Mark initialization as attempted to prevent multiple attempts
    initAttemptedRef.current = true;
    console.log("Attempting to initialize PixiJS...");

    const initializePixi = async () => {
      try {
        // Create PIXI Application with safety checks
        const app = new PIXI.Application({
          width: 320,
          height: 320,
          backgroundColor: 0x2a4858,
          antialias: false,
          resolution: window.devicePixelRatio || 1,
        });

        // Set pixel art mode (no smoothing)
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

        setLoadingProgress(70);
        console.log("PixiJS application created");

        // Add the canvas to the DOM safely
        if (pixiContainerRef.current && !pixiContainerRef.current.firstChild) {
          pixiContainerRef.current.appendChild(app.view as unknown as Node);
          appRef.current = app;

          // Create main containers
          const worldContainer = new PIXI.Container();
          worldContainer.name = "world";
          app.stage.addChild(worldContainer);

          // Create floor, walls, miners, and ores containers
          const floorContainer = new PIXI.Container();
          floorContainer.name = "floor";

          const wallsContainer = new PIXI.Container();
          wallsContainer.name = "walls";

          const oresContainer = new PIXI.Container();
          oresContainer.name = "ores";

          const minersContainer = new PIXI.Container();
          minersContainer.name = "miners";

          worldContainer.addChild(floorContainer);
          worldContainer.addChild(wallsContainer);
          worldContainer.addChild(oresContainer);
          worldContainer.addChild(minersContainer);

          setLoadingProgress(85);
          console.log("PixiJS containers created");

          // Start with initial rendering - with a small delay to let the DOM update
          setTimeout(() => {
            try {
              renderFloorTiles(tileTheme);
              renderWalls(tileTheme);
              console.log("Initial rendering complete");
              setLoadingProgress(100);
              initCompletedRef.current = true;
              setTimeout(() => setLoading(false), 500);
            } catch (error) {
              console.error("Error during initial rendering:", error);
              handleInitError("Failed during initial rendering");
            }
          }, 100);
        } else {
          handleInitError("Container not available or already has content");
        }
      } catch (error) {
        console.error("Error initializing PixiJS:", error);
        handleInitError("Failed to initialize graphics engine");
      }
    };

    const handleInitError = (message: string) => {
      setLoadingError(message);
      setLoadingProgress(100);
      setTimeout(() => setLoading(false), 500);
      toast.error(
        "Using simplified mining view due to graphics initialization error"
      );
    };

    // Start initialization with a small delay to ensure DOM is ready
    setTimeout(initializePixi, 100);

    // Cleanup on unmount
    return () => {
      if (appRef.current) {
        try {
          appRef.current.destroy(true, true);
        } catch (error) {
          console.error("Error destroying PixiJS app:", error);
        }
        appRef.current = null;
      }
    };
  }, [tileTheme]);

  // Render floor tiles
  const renderFloorTiles = (theme: "blue" | "brown" | "green" | "gray") => {
    if (!appRef.current) return;

    try {
      // Get the floor container
      const worldContainer = appRef.current.stage.getChildByName(
        "world"
      ) as PIXI.Container;
      if (!worldContainer) {
        console.error("World container not found");
        return;
      }

      const floorContainer = worldContainer.getChildByName(
        "floor"
      ) as PIXI.Container;
      if (!floorContainer) {
        console.error("Floor container not found");
        return;
      }

      // Clear existing floor
      floorContainer.removeChildren();

      // Define theme colors
      const themeColors = {
        blue: { main: 0x2a4858, alt: 0x3e6378 },
        brown: { main: 0x4a3728, alt: 0x624a35 },
        green: { main: 0x2a4a2a, alt: 0x3a633a },
        gray: { main: 0x3a3a3a, alt: 0x4a4a4a },
      };

      const colors = themeColors[theme];

      // Create a grid of floor tiles
      const tileSize = 32;
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          // Alternate colors for a checkerboard pattern
          const isDark = (x + y) % 2 === 0;
          const color = isDark ? colors.main : colors.alt;

          const tile = new PIXI.Graphics();
          tile.beginFill(color);
          tile.drawRect(0, 0, tileSize, tileSize);
          tile.endFill();

          // Add some texture/noise to each tile
          tile.beginFill(0xffffff, 0.05);
          for (let i = 0; i < 5; i++) {
            const dotX = Math.random() * tileSize;
            const dotY = Math.random() * tileSize;
            const dotSize = Math.random() * 3 + 1;
            tile.drawCircle(dotX, dotY, dotSize);
          }
          tile.endFill();

          // Position the tile
          tile.x = x * tileSize;
          tile.y = y * tileSize;

          floorContainer.addChild(tile);
        }
      }
    } catch (error) {
      console.error("Error rendering floor tiles:", error);
    }
  };

  // Render walls
  const renderWalls = (theme: "blue" | "brown" | "green" | "gray") => {
    if (!appRef.current) return;

    try {
      // Get the walls container
      const worldContainer = appRef.current.stage.getChildByName(
        "world"
      ) as PIXI.Container;
      if (!worldContainer) return;

      const wallsContainer = worldContainer.getChildByName(
        "walls"
      ) as PIXI.Container;
      if (!wallsContainer) return;

      // Clear existing walls
      wallsContainer.removeChildren();

      // Define theme colors for walls
      const themeColors = {
        blue: 0x1a2e3a,
        brown: 0x2e1f1a,
        green: 0x1a2e1a,
        gray: 0x2a2a2a,
      };

      const wallColor = themeColors[theme];
      const tileSize = 32;

      // Create walls
      // Top wall
      for (let x = 0; x < 10; x++) {
        const wall = new PIXI.Graphics();
        wall.beginFill(wallColor);
        wall.drawRect(0, 0, tileSize, tileSize);
        wall.endFill();
        wall.x = x * tileSize;
        wall.y = 0;
        wallsContainer.addChild(wall);
      }

      // Bottom wall
      for (let x = 0; x < 10; x++) {
        const wall = new PIXI.Graphics();
        wall.beginFill(wallColor);
        wall.drawRect(0, 0, tileSize, tileSize);
        wall.endFill();
        wall.x = x * tileSize;
        wall.y = 9 * tileSize;
        wallsContainer.addChild(wall);
      }

      // Left wall
      for (let y = 1; y < 9; y++) {
        const wall = new PIXI.Graphics();
        wall.beginFill(wallColor);
        wall.drawRect(0, 0, tileSize, tileSize);
        wall.endFill();
        wall.x = 0;
        wall.y = y * tileSize;
        wallsContainer.addChild(wall);
      }

      // Right wall
      for (let y = 1; y < 9; y++) {
        const wall = new PIXI.Graphics();
        wall.beginFill(wallColor);
        wall.drawRect(0, 0, tileSize, tileSize);
        wall.endFill();
        wall.x = 9 * tileSize;
        wall.y = y * tileSize;
        wallsContainer.addChild(wall);
      }

      // Add some random walls inside
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(Math.random() * 8 + 1);
        const y = Math.floor(Math.random() * 8 + 1);

        // Only place if not already a wall
        const existingWall = wallsContainer.children.find(
          (child) => child.x === x * tileSize && child.y === y * tileSize
        );

        if (!existingWall) {
          const wall = new PIXI.Graphics();
          wall.beginFill(wallColor);
          wall.drawRect(0, 0, tileSize, tileSize);
          wall.endFill();
          wall.x = x * tileSize;
          wall.y = y * tileSize;
          wallsContainer.addChild(wall);
        }
      }
    } catch (error) {
      console.error("Error rendering walls:", error);
    }
  };

  // Update miners when they change
  useEffect(() => {
    if (!appRef.current || loading) return;

    try {
      // Get the miners container
      const worldContainer = appRef.current.stage.getChildByName(
        "world"
      ) as PIXI.Container;
      if (!worldContainer) return;

      const minersContainer = worldContainer.getChildByName(
        "miners"
      ) as PIXI.Container;
      if (!minersContainer) return;

      // Clear existing miners
      minersContainer.removeChildren();

      // Create new miners
      miners.forEach((miner) => {
        const x = (miner.position.x / 100) * 320;
        const y = (miner.position.y / 100) * 320;

        // Create miner graphics
        const minerGraphic = new PIXI.Graphics();

        // Color based on miner type
        let color = 0x6b7280; // Default gray
        switch (miner.type) {
          case "basic":
            color = 0x60a5fa;
            break; // blue
          case "expert":
            color = 0xf59e0b;
            break; // amber
          case "hauler":
            color = 0x10b981;
            break; // emerald
          case "prospector":
            color = 0x8b5cf6;
            break; // violet
          case "engineer":
            color = 0xef4444;
            break; // red
        }

        // Draw miner as a colored circle
        minerGraphic.beginFill(color);
        minerGraphic.drawCircle(0, 0, 8);
        minerGraphic.endFill();

        // Add white border
        minerGraphic.lineStyle(2, 0xffffff);
        minerGraphic.drawCircle(0, 0, 8);

        // Draw mining progress bar if mining
        if (miner.state === "mining") {
          const progressWidth = (miner.miningProgress / 5) * 20;

          // Progress bar background
          minerGraphic.beginFill(0x000000, 0.5);
          minerGraphic.drawRect(-10, -15, 20, 4);
          minerGraphic.endFill();

          // Progress bar fill
          minerGraphic.beginFill(0x8b5cf6);
          minerGraphic.drawRect(-10, -15, progressWidth, 4);
          minerGraphic.endFill();
        }

        // Position the miner
        minerGraphic.x = x;
        minerGraphic.y = y;

        minersContainer.addChild(minerGraphic);
      });
    } catch (error) {
      console.error("Error updating miners:", error);
    }
  }, [miners, loading]);

  // Update ores when they change
  useEffect(() => {
    if (!appRef.current || loading) return;

    try {
      // Get the ores container
      const worldContainer = appRef.current.stage.getChildByName(
        "world"
      ) as PIXI.Container;
      if (!worldContainer) return;

      const oresContainer = worldContainer.getChildByName(
        "ores"
      ) as PIXI.Container;
      if (!oresContainer) return;

      // Clear existing ores
      oresContainer.removeChildren();

      // Create new ores
      ores.forEach((ore) => {
        const x = (ore.position.x / 100) * 320 - 8;
        const y = (ore.position.y / 100) * 320 - 8;

        // Create ore graphics
        const oreGraphic = new PIXI.Graphics();

        // Color based on ore type
        let color = 0x6b7280; // Default gray
        switch (ore.type) {
          case "coal":
            color = 0x1f2937;
            break;
          case "iron":
            color = 0x6b7280;
            break;
          case "copper":
            color = 0xd97706;
            break;
          case "gold":
            color = 0xfbbf24;
            break;
          case "crystal":
            color = 0x0ea5e9;
            break;
          case "gem":
            color = 0x8b5cf6;
            break;
          case "legendary":
            color = 0xef4444;
            break;
          case "tin":
            color = 0x94a3b8;
            break;
          case "silver":
            color = 0xcbd5e1;
            break;
          case "mithril":
            color = 0x6366f1;
            break;
          case "thorium":
            color = 0x10b981;
            break;
          case "platinum":
            color = 0xe2e8f0;
            break;
          case "orichalcum":
            color = 0xf97316;
            break;
          case "uranium":
            color = 0x84cc16;
            break;
        }

        if (ore.depleted) {
          // Draw depleted ore with reduced opacity
          oreGraphic.beginFill(color, 0.4);
          oreGraphic.drawRect(0, 0, 16, 16);
          oreGraphic.endFill();

          // Add regeneration timer text
          const text = new PIXI.Text(`${Math.ceil(ore.regenerationTime)}`, {
            fontFamily: "monospace",
            fontSize: 12,
            fill: 0xffffff,
            align: "center",
          });
          text.anchor.set(0.5);
          text.position.set(8, 8);
          oreGraphic.addChild(text);
        } else {
          // Draw active ore
          oreGraphic.beginFill(color);
          oreGraphic.drawRect(0, 0, 16, 16);
          oreGraphic.endFill();

          // Add shine effect (small white circle in corner)
          oreGraphic.beginFill(0xffffff, 0.7);
          oreGraphic.drawCircle(4, 4, 2);
          oreGraphic.endFill();
        }

        // Position the ore
        oreGraphic.x = x;
        oreGraphic.y = y;

        oresContainer.addChild(oreGraphic);
      });
    } catch (error) {
      console.error("Error updating ores:", error);
    }
  }, [ores, loading]);

  // Detect when mining is completed to show resource particles
  useEffect(() => {
    if (loading) return;

    const prevMiners = prevMinersRef.current;

    miners.forEach((miner) => {
      const prevMiner = prevMiners.find((m) => m.id === miner.id);

      // If miner just changed from mining to seeking, they completed mining
      if (
        prevMiner &&
        prevMiner.state === "mining" &&
        miner.state === "seeking" &&
        prevMiner.targetOreId
      ) {
        const ore = ores.find((o) => o.id === prevMiner.targetOreId);
        if (ore) {
          // Create a new resource particle
          const particle = {
            id: `particle-${Date.now()}-${Math.random()}`,
            type: ore.type,
            amount: 1, // Simplified
            position: { ...ore.position },
          };

          setParticles((prev) => [...prev, particle]);

          // Remove the particle after animation completes
          setTimeout(() => {
            setParticles((prev) => prev.filter((p) => p.id !== particle.id));
          }, 1000);
        }
      }
    });

    prevMinersRef.current = miners;
  }, [miners, ores, loading]);

  // Change theme periodically
  useEffect(() => {
    if (loading) return;

    const themes: Array<"blue" | "brown" | "green" | "gray"> = [
      "blue",
      "brown",
      "green",
      "gray",
    ];
    const themeInterval = setInterval(() => {
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      setTileTheme(randomTheme);

      // Update tiles with new theme
      try {
        renderFloorTiles(randomTheme);
        renderWalls(randomTheme);
      } catch (error) {
        console.error("Error changing theme:", error);
      }
    }, 30000); // Change theme every 30 seconds

    return () => clearInterval(themeInterval);
  }, [loading]);

  // Fallback component for when PixiJS fails to initialize
  const renderFallback = () => {
    return (
      <div className="w-full h-full bg-slate-800 rounded-lg flex items-center justify-center">
        <div className="text-center max-w-xs p-4 bg-slate-900/50 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-2">Mining Area</h3>
          <p className="text-gray-300 mb-4">
            {miners.length} miners working on {ores.length} resource nodes
          </p>
          <div className="grid grid-cols-4 gap-2">
            {miners.map((miner, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background:
                    miner.type === "basic"
                      ? "#60a5fa"
                      : miner.type === "expert"
                      ? "#f59e0b"
                      : miner.type === "hauler"
                      ? "#10b981"
                      : miner.type === "prospector"
                      ? "#8b5cf6"
                      : "#ef4444",
                }}
              >
                <span className="text-xs text-white font-bold">
                  {miner.type[0].toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="pixel-container glass-panel relative w-full h-full rounded-lg overflow-hidden animate-fade-in shadow-xl border border-white/10 flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-white mb-2">
            Initializing pixel world... {Math.round(loadingProgress)}%
          </p>
          <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
            <Progress value={loadingProgress} className="h-full" />
          </div>
        </div>
        <p className="text-xs text-gray-400 max-w-xs text-center">
          {loadingError || "Creating pixelated mining simulation..."}
        </p>
      </div>
    );
  }

  // If PixiJS failed to initialize properly, show fallback
  if (!appRef.current) {
    return renderFallback();
  }

  return (
    <div className="pixel-container glass-panel relative w-full h-full rounded-lg overflow-hidden animate-fade-in shadow-xl border border-white/10">
      {/* PixiJS container */}
      <div
        ref={pixiContainerRef}
        className="absolute inset-0"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Resource particles (rendered as DOM elements for better text) */}
      {particles.map((particle) => (
        <ResourceParticle
          key={particle.id}
          type={particle.type}
          amount={particle.amount}
          position={particle.position}
        />
      ))}
    </div>
  );
};
