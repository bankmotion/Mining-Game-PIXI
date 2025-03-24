import { useState, useEffect, useRef } from 'react';
import { createMiner } from '@/lib/miners';
import { generateInitialOres } from '@/lib/ores';
import { 
  GameState, 
  calculateUpgradeCost, 
  initializeGameState, 
  updateGameState, 
  upgrades, 
  unlockMine, 
  setActiveMine,
  generateOresForMine,
  mineTypes
} from '@/lib/gameLogic';
import { toast } from 'sonner';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(initializeGameState);
  const [isPaused, setIsPaused] = useState(false);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const moneyHistoryRef = useRef<{ timestamp: number; value: number }[]>([]);
  const lastMoneyRef = useRef<number>(0);
  
  // Initialize game state
  useEffect(() => {
    // Generate initial ores for the starter mine
    const initialOres = generateInitialOres(20, 100, 100);
    
    // Create the first miner
    const initialMiner = createMiner('basic', { x: 50, y: 50 });
    
    setGameState(prevState => {
      const initialState = {
        ...prevState,
        miners: [initialMiner],
        ores: initialOres,
        lastUpdateTime: Date.now(),
      };
      lastMoneyRef.current = initialState.money;
      return initialState;
    });
    
    toast.success('Welcome to DEFI Miners! 🪨⛏️', {
      description: 'Your first miner is ready to work. Watch as they collect resources automatically!',
      duration: 5000,
    });
    
    // Cleanup
    return () => {
      if (gameLoopRef.current !== null) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);
  
  // Game loop
  useEffect(() => {
    if (isPaused) {
      return;
    }
    
    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateTimeRef.current) / 1000; // Convert to seconds
      lastUpdateTimeRef.current = now;
      
      // Limit delta time to prevent large jumps
      const cappedDeltaTime = Math.min(deltaTime, 0.1);
      
      // Update game state
      setGameState(prevState => {
        const newState = updateGameState(prevState, cappedDeltaTime);
        
        // Calculate money rate based on the change in money
        if (newState.money !== lastMoneyRef.current) {
          // Add current money to history with timestamp
          moneyHistoryRef.current.push({
            timestamp: now,
            value: newState.money
          });
          
          // Only keep last 5 seconds of history
          const cutoffTime = now - 5000;
          moneyHistoryRef.current = moneyHistoryRef.current.filter(
            entry => entry.timestamp >= cutoffTime
          );
          
          // Calculate rate based on history when we have at least 2 data points
          if (moneyHistoryRef.current.length >= 2) {
            const oldest = moneyHistoryRef.current[0];
            const newest = moneyHistoryRef.current[moneyHistoryRef.current.length - 1];
            const timeDiff = (newest.timestamp - oldest.timestamp) / 1000; // in seconds
            
            if (timeDiff > 0) {
              const valueDiff = newest.value - oldest.value;
              newState.moneyRate = valueDiff / timeDiff;
            }
          }
          
          // Update last money reference
          lastMoneyRef.current = newState.money;
        }
        
        return newState;
      });
      
      // Continue the loop
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    // Cleanup
    return () => {
      if (gameLoopRef.current !== null) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isPaused]);
  
  // Buy an upgrade
  const buyUpgrade = (upgradeId: string) => {
    setGameState(prevState => {
      const currentLevel = prevState.upgrades[upgradeId] || 0;
      const upgrade = upgrades.find(u => u.id === upgradeId);
      
      if (!upgrade) return prevState;
      
      // Check if max level reached
      if (upgrade.maxLevel && currentLevel >= upgrade.maxLevel) {
        toast.error(`Maximum level reached for ${upgrade.name}`);
        return prevState;
      }
      
      const cost = calculateUpgradeCost(upgrade, currentLevel);
      
      if (prevState.money < cost) {
        toast.error(`Not enough money to purchase ${upgrade.name}`);
        return prevState;
      }
      
      // Apply the upgrade
      const newState = upgrade.effect(prevState, currentLevel + 1);
      
      toast.success(`Purchased ${upgrade.name} (Level ${currentLevel + 1})`);
      
      return {
        ...newState,
        money: newState.money - cost,
        upgrades: {
          ...newState.upgrades,
          [upgradeId]: (newState.upgrades[upgradeId] || 0) + 1,
        },
      };
    });
  };
  
  // Hire a new miner
  const hireMiner = (type: 'basic' | 'expert' | 'hauler' | 'prospector' | 'engineer') => {
    setGameState(prevState => {
      const minerCount = prevState.miners.filter(m => m.type === type).length;
      const baseCost = {
        basic: 10,
        expert: 50,
        hauler: 75,
        prospector: 100,
        engineer: 150,
      }[type];
      
      const cost = Math.floor(baseCost * Math.pow(1.2, minerCount));
      
      if (prevState.money < cost) {
        toast.error(`Not enough money to hire a new ${type} miner`);
        return prevState;
      }
      
      // Find a random position that's not too close to existing miners
      let randomX, randomY;
      let attempts = 0;
      const minDistance = 15; // Increased minimum distance between miners
      
      do {
        // Generate random position within the mining area (20-80% range)
        randomX = Math.floor(20 + Math.random() * 60);
        randomY = Math.floor(20 + Math.random() * 60);
        
        // Check if this position is far enough from other miners
        const isFarEnough = prevState.miners.every(miner => {
          const dx = miner.position.x - randomX;
          const dy = miner.position.y - randomY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance > minDistance;
        });
        
        if (isFarEnough || attempts > 50) break; // Either found a good spot or tried too many times
        attempts++;
      } while (true);
      
      // Create specialized expert miners
      let newMiner;
      if (type === 'expert') {
        const oreTypes = ['gold', 'crystal', 'gem', 'legendary', 'platinum', 'uranium'];
        const randomOreType = oreTypes[Math.floor(Math.random() * oreTypes.length)];
        newMiner = createMiner(type, { x: randomX, y: randomY }, randomOreType as any);
        toast.success(`Hired a new expert miner specialized in ${randomOreType}: ${newMiner.name}`);
      } else {
        newMiner = createMiner(type, { x: randomX, y: randomY });
        toast.success(`Hired a new ${type} miner: ${newMiner.name}`);
      }
      
      return {
        ...prevState,
        miners: [...prevState.miners, newMiner],
        money: prevState.money - cost,
      };
    });
  };
  
  // Toggle pause state
  const togglePause = () => {
    setIsPaused(prev => !prev);
    
    if (isPaused) {
      toast.info('Game resumed');
      lastUpdateTimeRef.current = Date.now(); // Reset timer to avoid large jumps
    } else {
      toast.info('Game paused');
    }
  };
  
  // Unlock a new mine
  const unlockNewMine = (mineId: string) => {
    setGameState(prevState => {
      const mine = prevState.mines[mineId];
      
      if (!mine || mine.unlocked) {
        toast.error(`Mine already unlocked or doesn't exist`);
        return prevState;
      }
      
      if (prevState.money < mine.cost) {
        toast.error(`Not enough money to unlock ${mine.name}`);
        return prevState;
      }
      
      toast.success(`Unlocked ${mine.name}!`, {
        description: `You now have access to better resources. Click on the mine to start mining there.`,
        duration: 5000,
      });
      
      return unlockMine(prevState, mineId);
    });
  };
  
  // Switch to a different mine
  const switchMine = (mineId: string) => {
    setGameState(prevState => {
      const mine = prevState.mines[mineId];
      
      if (!mine || !mine.unlocked) {
        toast.error(`Mine not unlocked or doesn't exist`);
        return prevState;
      }
      
      if (prevState.activeMine === mineId) {
        toast.info(`Already mining at ${mine.name}`);
        return prevState;
      }
      
      toast.success(`Switched to ${mine.name}`, {
        description: `Your miners will now work in this new location.`,
        duration: 3000,
      });
      
      // First update the active mine
      const newState = setActiveMine(prevState, mineId);
      
      // Then generate new ores for this mine
      const newOres = generateOresForMine(mineId, newState);
      
      return {
        ...newState,
        ores: newOres,
      };
    });
  };
  
  return {
    gameState,
    isPaused,
    togglePause,
    buyUpgrade,
    hireMiner,
    unlockNewMine,
    switchMine,
    availableMines: mineTypes,
  };
};
