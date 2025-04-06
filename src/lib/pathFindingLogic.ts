import { MapPosition } from "@/interfaces/MapTypes";
import { MapLayerType } from "./mapLogic";
import { LayerName } from "@/constants/Sprites";

// A* pathfinding algorithm implementation
export const findPath = (
  start: MapPosition,
  end: MapPosition
): MapPosition[] => {
  // if start and end are the same, return an empty array
  if (start.x === end.x && start.y === end.y) {
    return [];
  }

  const openSet: Node[] = [new Node(start, null, 0, heuristic(start, end))];
  const closedSet: Map<string, boolean> = new Map();

  const nodesByPos: Map<string, Node> = new Map();
  nodesByPos.set(`${start.x}-${start.y}`, openSet[0]);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.totalCost - b.totalCost);
    const current = openSet.shift()!;

    // check if we reached the end.
    if (current.pos.x === end.x && current.pos.y === end.y) {
      return reconstructPath(current);
    }

    // add to closed set
    closedSet.set(`${current.pos.x}-${current.pos.y}`, true);

    // get neighbors (only horizontal and vertical)
    const neighbors = getNeighbors(current.pos, end);

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x}-${neighbor.y}`;

      if (closedSet.has(neighborKey)) {
        continue;
      }

      const tentativeGScore = current.spentCost + 1;

      // check if we've seen this node before
      let neighborNode = nodesByPos.get(neighborKey);

      if (!neighborNode) {
        if (
          neighbor.x === current.pos.x &&
          neighbor.x === end.x &&
          neighbor.y === end.y
        ) {
          continue;
        }
        // create new node
        neighborNode = new Node(
          neighbor,
          current,
          tentativeGScore,
          heuristic(neighbor, end)
        );
        nodesByPos.set(neighborKey, neighborNode);
        openSet.push(neighborNode);
      } else if (tentativeGScore >= neighborNode.spentCost) {
        // not a better path
        continue;
      }

      // this is the best path to this node so far
      neighborNode.parent = current;
      neighborNode.spentCost = tentativeGScore;
      neighborNode.totalCost = tentativeGScore + neighborNode.spendingCost;
    }
  }

  // no path found
  return [];
};

export const heuristic = (a: MapPosition, b: MapPosition): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

const reconstructPath = (endNode: Node): MapPosition[] => {
  const path: MapPosition[] = [];
  let current = endNode;

  while (current) {
    path.unshift(current.pos);
    current = current.parent;
  }

  return path;
};

const getNeighbors = (pos: MapPosition, end: MapPosition): MapPosition[] => {
  const neighbors: MapPosition[] = [];
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
  ];

  for (const dir of directions) {
    const newX = pos.x + dir.dx;
    const newY = pos.y + dir.dy;

    if (
      MapLayerType[newY] &&
      (MapLayerType[newY][newX] === LayerName.Floor ||
        MapLayerType[newY][newX] === LayerName.Rails ||
        MapLayerType[newY][newX] === LayerName.Doors ||
        (newX === end.x &&
          newY === end.y &&
          MapLayerType[newY][newX] === LayerName.Ore)) // allow the miner to move to the ore
    ) {
      neighbors.push({ x: newX, y: newY });
    }
  }

  return neighbors;
};

class Node {
  pos: MapPosition;
  parent: Node | null;
  spentCost: number;
  spendingCost: number;
  totalCost: number;

  constructor(
    pos: MapPosition,
    parent: Node | null,
    spentCost: number,
    spendingCost: number
  ) {
    this.pos = pos;
    this.parent = parent;
    this.spentCost = spentCost;
    this.spendingCost = spendingCost;
    this.totalCost = spentCost + spendingCost;
  }
}
