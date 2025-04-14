import { Version } from "@/constants/Game";
import { GameState } from "@/interfaces/GameType";

export const saveGame = (gameState: GameState) => {
  localStorage.setItem(`gameState${Version}`, JSON.stringify(gameState));
};

export const importGameState = () => {
  const state = localStorage.getItem(`gameState${Version}`);
  try {
    return JSON.parse(state);
  } catch (err) {
    return null;
  }
};
