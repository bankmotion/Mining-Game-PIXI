import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { MineMap } from "@/constants/Map";
import { preloadSprites } from "@/utils/spriteLoader";
import { useGameState } from "./useGameState";

interface UsePixiAppProps {
  containerRef: React.RefObject<HTMLDivElement>;
  onLoadingProgress?: (progress: number) => void;
  onLoadingComplete?: () => void;
  onLoadingError?: (error: string) => void;
}

export const usePixiApp = ({
  containerRef,
  onLoadingProgress,
  onLoadingComplete,
  onLoadingError,
}: UsePixiAppProps) => {
  const appRef = useRef<PIXI.Application | null>(null);
  const initAttemptedRef = useRef(false);
  const initCompletedRef = useRef(false);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      if (!containerRef.current || initAttemptedRef.current) {
        return;
      }

      initAttemptedRef.current = true;
      console.log("Starting PixiJS initialization...");

      // Create PixiJS application
      const app = new PIXI.Application({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        backgroundColor: 0x1a1a1a,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: containerRef.current,
      });

      // Add the canvas to the container
      containerRef.current.appendChild(app.view as HTMLCanvasElement);

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
            onLoadingProgress?.(Math.min(90, 5 + progress * 0.85));
          });

          // Mark initialization as complete
          console.log("Initialization complete!");
          initCompletedRef.current = true;
          onLoadingProgress?.(100);
          onLoadingComplete?.();
        } catch (error) {
          console.error("Failed to initialize game:", error);
          onLoadingError?.(
            "Failed to initialize game. Using fallback renderer."
          );
          onLoadingProgress?.(100);
          onLoadingComplete?.();
        }
      };

      initializeGame();

      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current) return;
        app.renderer.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
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
  }, [containerRef, onLoadingProgress, onLoadingComplete, onLoadingError]);

  return {
    appRef,
    initCompletedRef,
  };
};
