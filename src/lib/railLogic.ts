import { MapPosition } from "@/interfaces/MapTypes";
import { Rail } from "@/interfaces/RailType";
import { MapLayerType } from "./mapLogic";
import { LayerName, MineCartsData } from "@/constants/Sprites";
import { MineType } from "@/interfaces/MineType";

// Helper function to check if a position is valid for rail placement
const isValidRailPosition = (
  x: number,
  y: number,
  tileCountX: number,
  tileCountY: number
): boolean => {
  // Check if position is within bounds
  if (x < 0 || x >= tileCountX || y < 0 || y >= tileCountY) return false;

  // Check if position has floor and no wall
  return MapLayerType[y] && MapLayerType[y][x] === LayerName.Floor;
};

// Helper function to get valid adjacent positions
const getValidAdjacentPositions = (
  pos: MapPosition,
  tileCountX: number,
  tileCountY: number
): MapPosition[] => {
  const adjacentPositions: MapPosition[] = [];
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 1, y: 0 }, // right
    { x: 0, y: 1 }, // down
    { x: -1, y: 0 }, // left
  ];

  for (const dir of directions) {
    const newX = pos.x + dir.x;
    const newY = pos.y + dir.y;

    if (isValidRailPosition(newX, newY, tileCountX, tileCountY)) {
      adjacentPositions.push({ x: newX, y: newY });
    }
  }

  return adjacentPositions;
};

// Helper function to determine rail type based on connections
const determineRailType = (
  pos: MapPosition,
  rails: MapPosition[],
  tileCountX: number,
  tileCountY: number
): number => {
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 1, y: 0 }, // right
    { x: 0, y: 1 }, // down
    { x: -1, y: 0 }, // left
  ];

  const connections = directions.map((dir) => {
    const checkPos = { x: pos.x + dir.x, y: pos.y + dir.y };
    return rails.some((rail) => rail.x === checkPos.x && rail.y === checkPos.y);
  });

  // Count connections
  const connectionCount = connections.filter(Boolean).length;

  // Determine rail type based on connections
  if (connectionCount === 1) {
    // End rail
    if (connections[0]) return 1; // Up
    if (connections[1]) return 2; // Right
    if (connections[2]) return 3; // Down
    if (connections[3]) return 4; // Left
  } else if (connectionCount === 2) {
    // Straight or corner rail
    if (
      (connections[0] && connections[2]) ||
      (connections[1] && connections[3])
    ) {
      // Straight rail
      if (connections[0] && connections[2]) return 5; // Vertical
      if (connections[1] && connections[3]) return 6; // Horizontal
    } else {
      // Corner rail
      if (connections[0] && connections[1]) return 7; // Up-Right
      if (connections[1] && connections[2]) return 8; // Right-Down
      if (connections[2] && connections[3]) return 9; // Down-Left
      if (connections[3] && connections[0]) return 10; // Left-Up
    }
  } else if (connectionCount === 3) {
    // T-junction
    if (!connections[0]) return 11; // Missing Up
    if (!connections[1]) return 12; // Missing Right
    if (!connections[2]) return 13; // Missing Down
    if (!connections[3]) return 14; // Missing Left
  } else if (connectionCount === 4) {
    // Cross junction
    return 15;
  }

  // Default to straight horizontal
  return 6;
};

export const findValidRailPositions = (
  tileCountX: number,
  tileCountY: number
): MapPosition[] => {
  const validPositions: MapPosition[] = [];

  // Find valid positions within the available area
  for (let y = 0; y < tileCountY; y++) {
    for (let x = 0; x < tileCountX; x++) {
      // Skip if out of bounds
      if (x < 0 || x >= tileCountX || y < 0 || y >= tileCountY) continue;

      // Check if the position is valid (has floor and no wall)
      if (MapLayerType[y] && MapLayerType[y][x] === LayerName.Floor) {
        validPositions.push({
          x,
          y,
        });
      }
    }
  }

  // Shuffle the positions
  for (let i = validPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [validPositions[i], validPositions[j]] = [
      validPositions[j],
      validPositions[i],
    ];
  }

  return validPositions;
};

export const updateRailPositions = (
  activeMine: MineType,
  doorPosition: MapPosition
): Rail[] => {
  // Calculate the dimensions of the T-shape
  const verticalLength = Math.floor((activeMine.availableArea.height / 3) * 2); // 2/3 of the available height
  const horizontalLength = activeMine.availableArea.width; // Full width

  // Create the vertical part of the T (from door downward)
  const verticalRails: MapPosition[] = [];
  for (let y = doorPosition.y; y < doorPosition.y + verticalLength; y++) {
    verticalRails.push({ x: doorPosition.x, y });
  }

  // Create the horizontal part of the T
  const horizontalRails: MapPosition[] = [];
  const horizontalStartX = doorPosition.x - Math.floor(horizontalLength / 2);
  const horizontalY = doorPosition.y + verticalLength - 1; // Connect to the bottom of the vertical part

  for (let x = horizontalStartX; x < horizontalStartX + horizontalLength; x++) {
    // Skip the center position as it's already covered by the vertical rail
    if (x !== doorPosition.x) {
      horizontalRails.push({ x, y: horizontalY });
    }
  }

  // Select a random point on the horizontal rail to extend downward
  const branchPointIndex = Math.floor(Math.random() * horizontalRails.length);
  const branchPoint = horizontalRails[branchPointIndex];
  
  // Create the additional vertical rail extending downward
  const additionalVerticalLength = Math.floor(activeMine.availableArea.height / 3); // 1/3 of the available height
  const additionalVerticalRails: MapPosition[] = [];
  
  for (let y = horizontalY + 1; y < horizontalY + 1 + additionalVerticalLength; y++) {
    additionalVerticalRails.push({ x: branchPoint.x, y });
  }

  // Create Rail objects with appropriate types
  const railObjects: Rail[] = [];

  // Add the vertical rails
  for (let i = 1; i < verticalRails.length - 1; i++) {
    railObjects.push({
      id: `rail-vertical-${i}`,
      position: verticalRails[i],
      type: MineCartsData.Vertical,
    });
  }

  // Add the T-junction
  railObjects.push({
    id: `rail-t-junction`,
    position: { x: doorPosition.x, y: horizontalY },
    type: MineCartsData.T_Bottom,
  });

  // Add the horizontal rails
  for (let i = 0; i < horizontalRails.length; i++) {
    const pos = horizontalRails[i];
    const isEnd = i === 0 || i === horizontalRails.length - 1;
    const isBranchPoint = i === branchPointIndex;

    railObjects.push({
      id: `rail-horizontal-${i}`,
      position: pos,
      type: isEnd ? MineCartsData.End : (isBranchPoint ? MineCartsData.T_Right : MineCartsData.Horizontal),
    });
  }

  // Add the additional vertical rails
  for (let i = 0; i < additionalVerticalRails.length; i++) {
    const pos = additionalVerticalRails[i];
    const isEnd = i === additionalVerticalRails.length - 1;

    railObjects.push({
      id: `rail-additional-vertical-${i}`,
      position: pos,
      type: isEnd ? MineCartsData.End : MineCartsData.Vertical,
    });
  }

  // Update maplayer type
  for (const rail of railObjects) {
    MapLayerType[rail.position.y][rail.position.x] = LayerName.Rails;
  }

  return railObjects;
};
