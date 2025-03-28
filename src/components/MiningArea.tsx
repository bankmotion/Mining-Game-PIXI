import { useEffect, useRef, useState } from "react";
import {
  drawSprite,
  floorSprites,
  getRandomFloorTile,
  getMinerSprite,
  minerSprites,
  oreNodes,
  oreTypeToSprite,
  propSprites,
  trackSprites,
  wallSprites,
} from "@/lib/sprites";
import { Progress } from "@/components/ui/progress";
import { Ore, OreType } from "@/interfaces/OreTypes";
import { Miner } from "@/interfaces/MinerTypes";

interface MiningAreaProps {
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

export const MiningArea = ({ miners, ores }: MiningAreaProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<
    Array<{
      id: string;
      type: OreType;
      amount: number;
      position: { x: number; y: number };
    }>
  >([]);

  // Animation frame counter for sprite animations
  const [frameCount, setFrameCount] = useState(0);

  // Keep track of previous miners to detect mining completion
  const prevMinersRef = useRef<Miner[]>([]);

  // Generate a map grid for floor tiles
  const floorTilesRef = useRef<string[][]>([]);

  // Wall positions - define some walls around the edges
  const wallsRef = useRef<Array<{ x: number; y: number; type: string }>>([]);

  // Current theme for tiles
  const [tileTheme, setTileTheme] = useState<
    "blue" | "brown" | "green" | "gray"
  >("blue");

  // Are sprites loaded?
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Reference to the actual loaded image
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Initialize floor tiles
  const initializeFloorTiles = () => {
    const gridSize = 10; // 10x10 grid
    const tiles: string[][] = [];

    // Pick a random theme
    const themes: Array<"blue" | "brown" | "green" | "gray"> = [
      "blue",
      "brown",
      "green",
      "gray",
    ];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    setTileTheme(randomTheme);

    for (let y = 0; y < gridSize; y++) {
      const row: string[] = [];
      for (let x = 0; x < gridSize; x++) {
        row.push(getRandomFloorTile(randomTheme));
      }
      tiles.push(row);
    }

    floorTilesRef.current = tiles;
  };

  // Initialize walls
  const initializeWalls = () => {
    const walls = [];

    // Top wall
    for (let x = 0; x < 10; x++) {
      walls.push({
        x: x * 32,
        y: 0,
        type: "wall-blue-horizontal",
      });
    }

    // Bottom wall
    for (let x = 0; x < 10; x++) {
      walls.push({
        x: x * 32,
        y: 9 * 32,
        type: "wall-blue-horizontal",
      });
    }

    // Left wall
    for (let y = 1; y < 9; y++) {
      walls.push({
        x: 0,
        y: y * 32,
        type: "wall-blue-vertical",
      });
    }

    // Right wall
    for (let y = 1; y < 9; y++) {
      walls.push({
        x: 9 * 32,
        y: y * 32,
        type: "wall-blue-vertical",
      });
    }

    // Corner pieces
    walls.push({ x: 0, y: 0, type: "wall-blue-corner" });
    walls.push({ x: 9 * 32, y: 0, type: "wall-blue-corner" });
    walls.push({ x: 0, y: 9 * 32, type: "wall-blue-corner" });
    walls.push({ x: 9 * 32, y: 9 * 32, type: "wall-blue-corner" });

    // Add some random walls inside
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * 8 + 1) * 32;
      const y = Math.floor(Math.random() * 8 + 1) * 32;
      walls.push({
        x,
        y,
        type: "wall-blue-center",
      });
    }

    wallsRef.current = walls;
  };

  // Preload the sprite sheet
  useEffect(() => {
    // Initialize floor tiles and walls
    initializeFloorTiles();
    initializeWalls();

    // Function to create a simple fallback pattern
    const createFallbackPattern = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Draw a grid pattern
        const tileSize = 32;
        for (let y = 0; y < 10; y++) {
          for (let x = 0; x < 10; x++) {
            // Alternate colors for a checkerboard pattern
            const isDark = (x + y) % 2 === 0;
            ctx.fillStyle = isDark ? "#2a4858" : "#3e6378";
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

            // Add some texture/noise to each tile
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            for (let i = 0; i < 5; i++) {
              const dotX = x * tileSize + Math.random() * tileSize;
              const dotY = y * tileSize + Math.random() * tileSize;
              const dotSize = Math.random() * 3 + 1;
              ctx.beginPath();
              ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
              ctx.fill();
            }

            // Draw tile borders
            ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
            ctx.lineWidth = 1;
            ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
          }
        }

        // Draw walls
        ctx.fillStyle = "#1a2e3a";
        for (let x = 0; x < 10; x++) {
          ctx.fillRect(x * tileSize, 0, tileSize, tileSize); // Top wall
          ctx.fillRect(x * tileSize, 9 * tileSize, tileSize, tileSize); // Bottom wall
        }
        for (let y = 1; y < 9; y++) {
          ctx.fillRect(0, y * tileSize, tileSize, tileSize); // Left wall
          ctx.fillRect(9 * tileSize, y * tileSize, tileSize, tileSize); // Right wall
        }
      }

      return canvas;
    };

    // Load the sprite sheet with proper error handling
    const loadSpriteSheet = () => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        console.log("Sprite sheet loaded successfully");
        imgRef.current = img;
        setSpritesLoaded(true);
        setLoadingProgress(100);
      };

      img.onerror = (e) => {
        console.error("Failed to load sprite sheet:", e);
        setLoadingError("Failed to load sprites. Using fallback graphics.");

        // Create a fallback image from pattern
        const fallbackCanvas = createFallbackPattern();
        const fallbackImg = new Image();
        fallbackImg.src = fallbackCanvas.toDataURL();
        fallbackImg.onload = () => {
          imgRef.current = fallbackImg;
          setSpritesLoaded(true);
          setLoadingProgress(100);
        };
      };

      // Show progress at 10%
      setLoadingProgress(10);

      // Add cache buster to avoid caching issues
      img.src = `${floorSprites.url}?cb=${Date.now()}`;

      // Increment loading progress every 200ms to show activity
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          const newProgress = Math.min(prev + 5, 90);
          if (newProgress >= 90) clearInterval(progressInterval);
          return newProgress;
        });
      }, 200);

      // Set a timeout to use fallback if loading takes too long
      setTimeout(() => {
        if (!spritesLoaded) {
          clearInterval(progressInterval);
          console.warn("Loading timed out, using fallback graphics");

          if (img.complete) {
            imgRef.current = img;
            setSpritesLoaded(true);
            setLoadingProgress(100);
          } else {
            setLoadingError("Loading timed out. Using fallback graphics.");

            // Create a fallback image
            const fallbackCanvas = createFallbackPattern();
            const fallbackImg = new Image();
            fallbackImg.src = fallbackCanvas.toDataURL();
            fallbackImg.onload = () => {
              imgRef.current = fallbackImg;
              setSpritesLoaded(true);
              setLoadingProgress(100);
            };
          }
        }
      }, 5000);

      return () => {
        clearInterval(progressInterval);
      };
    };

    // Start loading
    loadSpriteSheet();
  }, []);

  // Render the tiles on the canvas
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Set pixel art rendering
    context.imageSmoothingEnabled = false;

    // Draw fallback pattern if using fallback
    if (loadingError) {
      // The fallback pattern is already drawn in the image
      context.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
      return;
    }

    // Draw floor tiles directly from our pattern
    try {
      context.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    } catch (err) {
      console.error("Error drawing main image:", err);
      // Create a simple colored background as fallback
      context.fillStyle = "#2a4858";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Add miners as colored circles
    miners.forEach((miner) => {
      const x = (miner.position.x / 100) * canvas.width;
      const y = (miner.position.y / 100) * canvas.height;

      // Draw miner as a colored circle
      context.beginPath();
      context.arc(x, y, 8, 0, Math.PI * 2);

      // Color based on miner type
      switch (miner.type) {
        case "basic":
          context.fillStyle = "#60a5fa"; // blue
          break;
        case "expert":
          context.fillStyle = "#f59e0b"; // amber
          break;
        case "hauler":
          context.fillStyle = "#10b981"; // emerald
          break;
        case "prospector":
          context.fillStyle = "#8b5cf6"; // violet
          break;
        case "engineer":
          context.fillStyle = "#ef4444"; // red
          break;
        default:
          context.fillStyle = "#6b7280"; // gray
      }

      context.fill();
      context.strokeStyle = "#ffffff";
      context.lineWidth = 2;
      context.stroke();

      // Draw mining progress bar if mining - FIXED to show proper progress
      if (miner.state === "mining") {
        const progressWidth = miner.miningProgress * 20; // Fixes progress bar to fill completely

        // Progress bar background
        context.fillStyle = "rgba(0, 0, 0, 0.5)";
        context.fillRect(x - 10, y - 15, 20, 4);

        // Progress bar fill
        context.fillStyle = "#8b5cf6"; // Primary color
        context.fillRect(x - 10, y - 15, progressWidth, 4);
      }
    });

    // Draw ores as colored squares
    ores.forEach((ore) => {
      const x = (ore.position.x / 100) * canvas.width - 8;
      const y = (ore.position.y / 100) * canvas.height - 8;

      let oreColor = "#6b7280"; // Default gray

      // Set color based on ore type
      switch (ore.type) {
        case "coal":
          oreColor = "#1f2937";
          break;
        case "iron":
          oreColor = "#6b7280";
          break;
        case "copper":
          oreColor = "#d97706";
          break;
        case "gold":
          oreColor = "#fbbf24";
          break;
        case "crystal":
          oreColor = "#0ea5e9";
          break;
        case "gem":
          oreColor = "#8b5cf6";
          break;
        case "legendary":
          oreColor = "#ef4444";
          break;
        case "tin":
          oreColor = "#94a3b8";
          break;
        case "silver":
          oreColor = "#cbd5e1";
          break;
        case "mithril":
          oreColor = "#6366f1";
          break;
        case "thorium":
          oreColor = "#10b981";
          break;
        case "platinum":
          oreColor = "#e2e8f0";
          break;
        case "orichalcum":
          oreColor = "#f97316";
          break;
        case "uranium":
          oreColor = "#84cc16";
          break;
      }

      if (ore.depleted) {
        // Draw depleted ore with reduced opacity
        context.globalAlpha = 0.4;
        context.fillStyle = oreColor;
        context.fillRect(x, y, 16, 16);
        context.globalAlpha = 1.0;

        // Draw regeneration timer
        const text = Math.ceil(ore.regenerationTime).toString();
        context.font = "12px monospace";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText(text, x + 8, y + 12);
      } else {
        // Draw active ore
        context.fillStyle = oreColor;
        context.fillRect(x, y, 16, 16);

        // Add shine effect (small white circle in corner)
        context.beginPath();
        context.arc(x + 4, y + 4, 2, 0, Math.PI * 2);
        context.fillStyle = "rgba(255, 255, 255, 0.7)";
        context.fill();
      }
    });
  };

  // Canvas rendering effect
  useEffect(() => {
    if (spritesLoaded) {
      renderCanvas();
    }
  }, [miners, ores, frameCount, spritesLoaded, loadingError]);

  // Animation loop
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setFrameCount((prevCount) => (prevCount + 1) % 60);
    }, 1000 / 15); // 15 FPS animation

    return () => clearInterval(animationInterval);
  }, []);

  // Detect when mining is completed and show resource particles
  useEffect(() => {
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
  }, [miners, ores]);

  // Change theme periodically
  useEffect(() => {
    const themes: Array<"blue" | "brown" | "green" | "gray"> = [
      "blue",
      "brown",
      "green",
      "gray",
    ];
    const themeInterval = setInterval(() => {
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      setTileTheme(randomTheme);

      // Regenerate floor tiles with new theme
      const gridSize = 10;
      const tiles: string[][] = [];

      for (let y = 0; y < gridSize; y++) {
        const row: string[] = [];
        for (let x = 0; x < gridSize; x++) {
          row.push(getRandomFloorTile(randomTheme));
        }
        tiles.push(row);
      }

      floorTilesRef.current = tiles;

      // Update walls to match theme
      const walls = wallsRef.current;
      wallsRef.current = walls.map((wall) => ({
        ...wall,
        type: wall.type.replace(/blue|brown|green|gray/, randomTheme),
      }));
    }, 30000); // Change theme every 30 seconds

    return () => clearInterval(themeInterval);
  }, []);

  if (!spritesLoaded) {
    return (
      <div className="pixel-container glass-panel relative w-full h-full rounded-lg overflow-hidden animate-fade-in shadow-xl border border-white/10 flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-white mb-2">
            Loading mining graphics... {Math.round(loadingProgress)}%
          </p>
          <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
            <Progress value={loadingProgress} className="h-full" />
          </div>
        </div>
        <p className="text-xs text-gray-400 max-w-xs text-center">
          {loadingError ||
            "Using stylized pixel graphics for mining simulation..."}
        </p>
      </div>
    );
  }

  return (
    <div className="pixel-container glass-panel relative w-full h-full rounded-lg overflow-hidden animate-fade-in shadow-xl border border-white/10">
      {/* Canvas for pixel art rendering */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        width={320}
        height={320}
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
