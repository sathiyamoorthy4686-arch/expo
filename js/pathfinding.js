/**
 * A* (A-Star) Pathfinding for AI Monster navigation in JavaScript
 */
class PriorityQueue {
  constructor() {
    this.elements = [];
  }
  push(item, priority) {
    this.elements.push({ item, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }
  pop() {
    return this.elements.shift()?.item;
  }
  isEmpty() {
    return this.elements.length === 0;
  }
}

function findPath(grid, startPos, targetPos) {
  const sx = Math.floor(startPos[0]);
  const sy = Math.floor(startPos[1]);
  const tx = Math.floor(targetPos[0]);
  const ty = Math.floor(targetPos[1]);

  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;

  if (sx < 0 || sx >= cols || sy < 0 || sy >= rows) return [];
  if (tx < 0 || tx >= cols || ty < 0 || ty >= rows) return [];
  if (sx === tx && sy === ty) return [[sx, sy]];

  const key = (x, y) => `${x},${y}`;
  const frontier = new PriorityQueue();
  frontier.push({ x: sx, y: sy }, 0);

  const cameFrom = new Map();
  const costSoFar = new Map();

  cameFrom.set(key(sx, sy), null);
  costSoFar.set(key(sx, sy), 0);

  const dirs = [
    [0, -1], [0, 1], [-1, 0], [1, 0]
  ];

  let steps = 0;
  const maxSteps = 1200;

  while (!frontier.isEmpty() && steps < maxSteps) {
    steps++;
    const current = frontier.pop();
    if (!current) break;

    if (current.x === tx && current.y === ty) {
      // Reconstruct path
      const path = [];
      let currKey = key(tx, ty);
      while (currKey) {
        const [cx, cy] = currKey.split(',').map(Number);
        path.push([cx, cy]);
        currKey = cameFrom.get(currKey);
      }
      return path.reverse();
    }

    for (const [dx, dy] of dirs) {
      const nx = current.x + dx;
      const ny = current.y + dy;

      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      if (grid[ny][nx] === 1) continue; // Wall

      const nKey = key(nx, ny);
      const newCost = costSoFar.get(key(current.x, current.y)) + 1;

      if (!costSoFar.has(nKey) || newCost < costSoFar.get(nKey)) {
        costSoFar.set(nKey, newCost);
        const priority = newCost + Math.abs(nx - tx) + Math.abs(ny - ty);
        frontier.push({ x: nx, y: ny }, priority);
        cameFrom.set(nKey, key(current.x, current.y));
      }
    }
  }

  return [];
}

window.findPath = findPath;
