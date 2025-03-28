import { useEffect, useRef, useState } from "react";
import { Miner } from "@/lib/miners";
import { Ore, OreType, oreData } from "@/lib/ores";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { mineTypes } from "@/lib/gameLogic";

interface SimpleMiningAreaProps {
  miners: Miner[];
  ores: Ore[];
  activeMine: string;
  onOreClick?: (ore: Ore) => void;
  onBaseClick?: () => void;
}

// Resource particle component (rendered outside canvas for text)
const ResourceParticle = ({
  type,
  amount,
  value,
  position,
}: {
  type: OreType;
  amount: number;
  value: number;
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
        animation: "float-up 1s forwards",
      }}
    >
      +${value}
    </div>
  );
};

// Base component with drop-off zone
const BaseStation = ({ position }: { position: { x: number; y: number } }) => {
  return (
    <div
      className="absolute w-14 h-14 rounded-xl bg-slate-700 border-2 border-slate-500 flex items-center justify-center"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
        boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
      }}
    >
      <div className="text-center">
        <div className="text-white text-[10px] font-bold">BASE</div>
        <div className="text-white/70 text-[8px]">Drop-off Zone</div>
      </div>
    </div>
  );
};

export const SimpleMiningArea = ({
  miners,
  ores,
  activeMine = "starter",
  onOreClick,
  onBaseClick,
}: SimpleMiningAreaProps) => {
  const [particles, setParticles] = useState<
    Array<{
      id: string;
      type: OreType;
      amount: number;
      value: number;
      position: { x: number; y: number };
    }>
  >([]);

  // Get base position from game logic
  const getBasePosition = () => {
    const mine = mineTypes.find((m) => m.id === activeMine);
    return mine ? mine.basePosition : { x: 15, y: 15 };
  };

  const basePosition = getBasePosition();

  // Keep track of previous miners to detect mining completion
  const prevMinersRef = useRef<Miner[]>([]);

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
          // Calculate actual value based on miner's efficiency and ore type
          const miningAmount = 1; // Base amount - always 1 per mining operation
          // The value of the mined ore without any efficiency multipliers
          const baseValue = oreData[ore.type].value;

          // Create a new resource particle showing the base value (unmodified by efficiency)
          const particle = {
            id: `particle-${Date.now()}-${Math.random()}`,
            type: ore.type,
            amount: miningAmount,
            value: baseValue, // Show the base value in the popup, not modified by efficiency
            position: { ...ore.position },
          };

          setParticles((prev) => [...prev, particle]);

          // Remove the particle after animation completes
          setTimeout(() => {
            setParticles((prev) => prev.filter((p) => p.id !== particle.id));
          }, 1000);
        }
      }

      // If miner just completed resting, show money earned
      if (
        prevMiner &&
        prevMiner.state === "resting" &&
        miner.state === "seeking" &&
        prevMiner.lastDroppedValue
      ) {
        // Create a money particle showing the total value
        const particle = {
          id: `particle-${Date.now()}-${Math.random()}`,
          type: "legendary" as OreType,
          amount: 1,
          value: prevMiner.lastDroppedValue,
          position: { ...basePosition },
        };

        setParticles((prev) => [...prev, particle]);

        // Remove the particle after animation completes
        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => p.id !== particle.id));
        }, 1500);
      }
    });

    prevMinersRef.current = miners;
  }, [miners, ores, basePosition]);

  // Function to get color based on ore type
  const getOreColor = (type: OreType) => {
    switch (type) {
      case "coal":
        return "#1f2937";
      case "iron":
        return "#6b7280";
      case "copper":
        return "#d97706";
      case "gold":
        return "#fbbf24";
      case "crystal":
        return "#0ea5e9";
      case "gem":
        return "#8b5cf6";
      case "legendary":
        return "#ef4444";
      case "tin":
        return "#94a3b8";
      case "silver":
        return "#cbd5e1";
      case "mithril":
        return "#6366f1";
      case "thorium":
        return "#10b981";
      case "platinum":
        return "#e2e8f0";
      case "orichalcum":
        return "#f97316";
      case "uranium":
        return "#84cc16";
      default:
        return "#6b7280";
    }
  };

  // Function to get color based on miner type
  const getMinerColor = (type: string) => {
    switch (type) {
      case "basic":
        return "#60a5fa"; // blue
      case "expert":
        return "#f59e0b"; // amber
      case "hauler":
        return "#10b981"; // emerald
      case "prospector":
        return "#8b5cf6"; // violet
      case "engineer":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  // Function to get miner status badge
  const getMinerStatusBadge = (miner: Miner) => {
    // Import the isInventoryFull function directly
    const isInventoryFull = (miner: Miner): boolean => {
      const totalItems = Object.values(miner.inventory).reduce(
        (sum, count) => sum + count,
        0
      );
      return totalItems >= miner.capacity;
    };

    if (miner.state === "mining") {
      return <Badge variant="default">Mining</Badge>;
    } else if (miner.state === "seeking") {
      if (isInventoryFull(miner)) {
        return <Badge variant="alert">Full Inventory!</Badge>;
      }
      return <Badge variant="secondary">Seeking</Badge>;
    } else if (miner.state === "moving") {
      return <Badge variant="secondary">Moving</Badge>;
    } else if (miner.state === "returning") {
      return <Badge variant="alert">Returning to Base</Badge>;
    } else if (miner.state === "resting") {
      return (
        <Badge variant="resting">
          Dropping off (
          {Math.ceil(miner.restDuration || 5) -
            Math.floor(miner.restProgress || 0)}
          s)
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="relative w-full h-full bg-emerald-700 rounded-lg overflow-hidden border border-emerald-900">
      {/* Grid layout for mining area */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-1">
        {/* Create grid sections that look like the map in the example */}
        {[...Array(9)].map((_, index) => (
          <div
            key={index}
            className="relative bg-emerald-600/50 rounded border border-emerald-800/30 flex items-center justify-center"
          >
            {index === 4 && (
              <span className="text-xs text-emerald-100 opacity-70">
                Mining Area
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Base station */}
      <div onClick={onBaseClick} className="cursor-pointer">
        <BaseStation position={basePosition} />
      </div>

      {/* Render ores with click handlers */}
      {ores.map((ore) => (
        <div
          key={ore.id}
          className="absolute w-4 h-4 rounded-full border border-white/20 transition-all cursor-pointer"
          style={{
            left: `${ore.position.x}%`,
            top: `${ore.position.y}%`,
            backgroundColor: getOreColor(ore.type),
            opacity: ore.depleted ? 0.4 : 1,
            transform: "translate(-50%, -50%)",
            boxShadow: `0 0 ${oreData[ore.type].value / 5}px ${getOreColor(
              ore.type
            )}`,
          }}
          onClick={() => onOreClick?.(ore)}
        >
          {/* Show ore value when hovered */}
          <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 px-1 py-0.5 rounded text-[8px] white bg-black/70 opacity-0 hover:opacity-100 pointer-events-none whitespace-nowrap">
            {ore.type} (Value: ${oreData[ore.type].value})
          </div>

          {ore.depleted && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
              {Math.ceil(ore.regenerationTime)}
            </div>
          )}
        </div>
      ))}

      {/* Render miners as different colored circles */}
      {miners.map((miner) => {
        const isFullInventory =
          Object.values(miner.inventory).reduce(
            (sum, count) => sum + count,
            0
          ) >= miner.capacity;

        return (
          <div
            key={miner.id}
            className={`absolute w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-bold border-2 ${
              isFullInventory && miner.state !== "resting"
                ? "border-red-500 animate-pulse"
                : "border-white"
            }`}
            style={{
              left: `${miner.position.x}%`,
              top: `${miner.position.y}%`,
              backgroundColor: getMinerColor(miner.type),
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Display first letter of miner type */}
            {miner.type[0].toUpperCase()}

            {/* Mining progress bar - fixed to show proper progress */}
            {miner.state === "mining" && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-black/30 rounded overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${miner.miningProgress * 100}%` }}
                />
              </div>
            )}

            {/* Resting progress bar */}
            {miner.state === "resting" && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-black/30 rounded overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{
                    width: `${
                      ((miner.restProgress || 0) / (miner.restDuration || 5)) *
                      100
                    }%`,
                  }}
                />
              </div>
            )}

            {/* Miner state label */}
            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 w-24 flex justify-center">
              {getMinerStatusBadge(miner)}
            </div>
          </div>
        );
      })}

      {/* Resource particles with value display */}
      {particles.map((particle) => (
        <ResourceParticle
          key={particle.id}
          type={particle.type}
          amount={particle.amount}
          value={particle.value}
          position={particle.position}
        />
      ))}

      {/* Legend in corner */}
      <div className="absolute bottom-2 right-2 bg-black/50 p-1 rounded text-xs text-white">
        <div className="flex items-center gap-1 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span>Miners: {miners.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <span>Resources: {ores.length}</span>
        </div>
      </div>

      {/* Ore type legend - Updated to show value and moved to top-right corner */}
      <div className="absolute top-2 right-2 bg-black/50 p-1 rounded text-[8px] text-white grid grid-cols-2 gap-x-2 gap-y-1 max-w-[120px]">
        {Object.entries(oreData)
          .slice(0, 6)
          .map(([type, data]) => (
            <div key={type} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getOreColor(type as OreType) }}
              ></div>
              <span>
                {type} (${data.value})
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};
