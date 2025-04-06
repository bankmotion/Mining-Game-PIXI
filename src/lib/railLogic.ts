import { MapPosition } from "@/interfaces/MapTypes";
import { Rail } from "@/interfaces/RailType";
import { MapLayerType } from "./mapLogic";
import { LayerName, MineCartsData } from "@/constants/Sprites";
import { MineType } from "@/interfaces/MineType";
import { getRandomNumber } from "@/utils/utils";

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
  const branchPointIndex =
    Math.floor(horizontalRails.length / 2) - 2 + getRandomNumber(0, 4);
  const branchPoint = horizontalRails[branchPointIndex];

  // Create the additional vertical rail extending downward
  const additionalVerticalLength = Math.floor(
    activeMine.availableArea.height / 3
  ); // 1/3 of the available height
  const additionalVerticalRails: MapPosition[] = [];

  for (
    let y = horizontalY + 1;
    y < horizontalY + 1 + additionalVerticalLength;
    y++
  ) {
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
    // const isEnd = i === 0 || i === horizontalRails.length - 1;
    const isBranchPoint = i === branchPointIndex;

    railObjects.push({
      id: `rail-horizontal-${i}`,
      position: pos,
      type: isBranchPoint ? MineCartsData.T_Right : MineCartsData.Horizontal,
    });
  }

  // Add the additional vertical rails
  for (let i = 0; i < additionalVerticalRails.length; i++) {
    const pos = additionalVerticalRails[i];
    // const isEnd = i === additionalVerticalRails.length - 1;

    railObjects.push({
      id: `rail-additional-vertical-${i}`,
      position: pos,
      type: MineCartsData.Vertical,
    });
  }

  // Update maplayer type
  for (const rail of railObjects) {
    MapLayerType[rail.position.y][rail.position.x] = LayerName.Rails;
  }

  return railObjects;
};
