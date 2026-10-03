"""
A* (A-Star) Pathfinding Algorithm for AI Monster / Treasure Guard navigation.
"""

import heapq
import math

class Node:
    def __init__(self, x, y, parent=None, g=0, h=0):
        self.x = x
        self.y = y
        self.parent = parent
        self.g = g  # Cost from start to current node
        self.h = h  # Heuristic cost to destination
        self.f = g + h

    def __lt__(self, other):
        return self.f < other.f

    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

    def __hash__(self):
        return hash((self.x, self.y))


def find_path(grid, start_pos, target_pos, allow_diagonals=False):
    """
    Find shortest path on binary walkable grid (1 = walkable, 0 = wall)
    start_pos: (gx, gy)
    target_pos: (gx, gy)
    Returns: list of (gx, gy) tuples from start to target.
    """
    sx, sy = int(start_pos[0]), int(start_pos[1])
    tx, ty = int(target_pos[0]), int(target_pos[1])

    rows = len(grid)
    cols = len(grid[0]) if rows > 0 else 0

    # Bounds check
    if not (0 <= sx < cols and 0 <= sy < rows):
        return []
    if not (0 <= tx < cols and 0 <= ty < rows):
        return []

    # If start is target
    if sx == tx and sy == ty:
        return [(sx, sy)]

    start_node = Node(sx, sy, None, 0, abs(sx - tx) + abs(sy - ty))
    
    open_heap = [start_node]
    open_dict = {(sx, sy): start_node}
    closed_set = set()

    # Orthogonal movement directions (Up, Down, Left, Right)
    directions = [(0, -1), (0, 1), (-1, 0), (1, 0)]
    if allow_diagonals:
        directions.extend([(-1, -1), (1, -1), (-1, 1), (1, 1)])

    max_steps = 1500  # Guard against infinite loops
    steps = 0

    while open_heap and steps < max_steps:
        steps += 1
        current = heapq.heappop(open_heap)
        pos = (current.x, current.y)
        
        if pos in open_dict:
            del open_dict[pos]

        if current.x == tx and current.y == ty:
            # Reconstruct path
            path = []
            curr = current
            while curr:
                path.append((curr.x, curr.y))
                curr = curr.parent
            path.reverse()
            return path

        closed_set.add(pos)

        for dx, dy in directions:
            nx, ny = current.x + dx, current.y + dy
            neighbor_pos = (nx, ny)

            if not (0 <= nx < cols and 0 <= ny < rows):
                continue
            if grid[ny][nx] == 1:  # Wall (1 is wall, 0 is walkable path)
                continue
            if neighbor_pos in closed_set:
                continue

            cost = 1.414 if (dx != 0 and dy != 0) else 1.0
            g = current.g + cost
            h = abs(nx - tx) + abs(ny - ty)
            neighbor_node = Node(nx, ny, current, g, h)

            if neighbor_pos in open_dict:
                existing = open_dict[neighbor_pos]
                if g < existing.g:
                    existing.g = g
                    existing.f = g + existing.h
                    existing.parent = current
                    heapq.heapify(open_heap)
            else:
                open_dict[neighbor_pos] = neighbor_node
                heapq.heappush(open_heap, neighbor_node)

    # Fallback to closest available step if exact path wasn't reached
    return []
