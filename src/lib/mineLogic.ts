import { GameState } from "@/interfaces/GameType";

export const unlockMine = (state: GameState, mineId: string): GameState => {
  const mine = state.mines[mineId];

  if (!mine || mine.unlocked) {
    return state;
  }

  if (state.money < mine.cost) {
    return state;
  }

  return {
    ...state,
    money: state.money - mine.cost,
    mines: {
      ...state.mines,
      [mineId]: {
        ...mine,
        unlocked: true,
      },
    },
  };
};

export const setActiveMine = (state: GameState, mineId: string): GameState => {
  const mine = state.mines[mineId];

  if (!mine || !mine.unlocked) {
    return state;
  }

  if (state.activeMine !== mineId) {
    return {
      ...state,
      activeMine: mineId,
      miners: state.miners.map((miner) => ({
        ...miner,
        state: "seeking",
        targetOreId: undefined,
        targetPosition: { x: 50, y: 50 },
      })),
    };
  }

  return state;
};
