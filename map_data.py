"""
LevelLoader & Dynamic Map Registry for AI Treasure Escape.
Supports multi-level grid layouts, customizable themes, and game balance parameters.
"""

import math
import pygame
from entities import Treasure

class LevelLoader:
    def __init__(self):
        self.levels = {}

    def register_level(self, level_idx, level_def):
        grid = [row[:] for row in level_def["grid"]]
        cols = len(grid[0])
        rows = len(grid)
        self.levels[level_idx] = {
            "id": level_idx,
            "name": level_def.get("name", f"Level {level_idx}"),
            "subtitle": level_def.get("subtitle", "Labyrinth Adventure"),
            "cols": cols,
            "rows": rows,
            "grid": grid,
            "start_grid": level_def.get("start_grid", (1, 0)),
            "exit_grid": level_def.get("exit_grid", (cols - 2, rows - 1)),
            "enemy_spawn_grid": level_def.get("enemy_spawn_grid", (cols - 2, 1)),
            "enemy_speed": level_def.get("enemy_speed", 55.0),
            "enemy_grace_period": level_def.get("enemy_grace_period", 3.5),
            "par_time": level_def.get("par_time", 60),
            "target_treasures": level_def.get("target_treasures", 8),
            "difficulty": level_def.get("difficulty", "Normal"),
            "theme": level_def.get("theme", {
                "bg": (88, 180, 231),
                "corridor": (105, 195, 245),
                "wall": (255, 255, 255),
                "border": (255, 255, 255),
                "accent": (0, 240, 255)
            })
        }

    def get_level(self, level_idx):
        if level_idx in self.levels:
            return self.levels[level_idx]
        return self.levels.get(1, next(iter(self.levels.values())) if self.levels else None)

    def get_all_levels(self):
        return list(self.levels.values())

    def get_level_count(self):
        return len(self.levels)

level_loader = LevelLoader()

# Level 1: Easy Explorer (15x15) - Spacious beginner-friendly layout with gentle turns
level_loader.register_level(1, {
    "name": "Easy Explorer",
    "subtitle": "Stage 1: Sunlit Corridors",
    "difficulty": "Easy",
    "enemy_speed": 45.0,
    "enemy_grace_period": 4.0,
    "par_time": 45,
    "target_treasures": 6,
    "start_grid": (2, 0),
    "exit_grid": (12, 14),
    "enemy_spawn_grid": (13, 1),
    "grid": [
        [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], # 0: Start at (2,0)
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1], # 1
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1], # 2
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], # 3
        [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1], # 4
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], # 5
        [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1], # 6
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1], # 7
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1], # 8
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], # 9
        [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1], # 10
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], # 11
        [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1], # 12
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], # 13
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1]  # 14: Exit at (12,14)
    ]
})

# Level 2: Classic Expo Labyrinth (17x17) - Authentic Science Expo layout with balanced loops
level_loader.register_level(2, {
    "name": "Classic Expo",
    "subtitle": "Stage 2: The Original Labyrinth",
    "difficulty": "Medium",
    "enemy_speed": 55.0,
    "enemy_grace_period": 3.5,
    "par_time": 60,
    "target_treasures": 10,
    "start_grid": (4, 0),
    "exit_grid": (12, 16),
    "enemy_spawn_grid": (15, 1),
    "grid": [
        [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], # 0: Start at (4,0)
        [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1], # 1
        [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1], # 2
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1], # 3
        [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1], # 4
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], # 5
        [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1], # 6
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1], # 7
        [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1], # 8
        [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1], # 9
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1], # 10
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], # 11
        [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1], # 12
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], # 13
        [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1], # 14
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1], # 15
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1]  # 16: Exit at (12,16)
    ]
})

# Level 3: Adventurer Multi-Path (19x19) - Dynamic branching corridors with tactical shortcuts
level_loader.register_level(3, {
    "name": "Adventurer Pass",
    "subtitle": "Stage 3: Multi-Path Chambers",
    "difficulty": "Hard",
    "enemy_speed": 65.0,
    "enemy_grace_period": 3.0,
    "par_time": 75,
    "target_treasures": 14,
    "start_grid": (2, 0),
    "exit_grid": (16, 18),
    "enemy_spawn_grid": (17, 1),
    "grid": [
        [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], # 0: Start at (2,0)
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1], # 1
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1], # 2
        [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], # 3
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1], # 4
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], # 5
        [1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1], # 6
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], # 7
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1], # 8
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], # 9: Center Chamber
        [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1], # 10
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], # 11
        [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1], # 12
        [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], # 13
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1], # 14
        [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], # 15
        [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1], # 16
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1], # 17
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1]  # 18: Exit at (16,18)
    ]
})




class GameMap:
    def __init__(self, rect_bounds, level=1):
        """
        rect_bounds: pygame.Rect defining the game map area on screen
        """
        self.bounds = rect_bounds
        self.level = level
        self.cols = 17
        self.rows = 17
        self.grid = [row[:] for row in ORIGINAL_MAZE]
        self.cell_w = self.bounds.width / self.cols
        self.cell_h = self.bounds.height / self.rows

        # Start & Exit positions
        self.start_grid = (4, 0)
        self.exit_grid = (12, 16)

        # Pre-calculate world positions
        self.start_world = self.grid_to_world(4, 0.4)
        self.exit_world = self.grid_to_world(12, 15.6)

        # Enemy spawn location (far corner for fairness)
        if level == 1:
            self.enemy_spawn_grid = (15, 1)
        elif level == 2:
            self.enemy_spawn_grid = (1, 15)
        else:
            self.enemy_spawn_grid = (15, 7)

        self.enemy_spawn_world = self.grid_to_world(*self.enemy_spawn_grid)

        # Pre-render static background map surface for ultra-fast 60 FPS rendering
        self.map_surface = pygame.Surface((self.bounds.width, self.bounds.height))
        self._render_base_map()

        # Generate treasures for this level
        self.treasures = []
        self._spawn_treasures()

    def grid_to_world(self, gx, gy):
        wx = self.bounds.left + (gx + 0.5) * self.cell_w
        wy = self.bounds.top + (gy + 0.5) * self.cell_h
        return wx, wy

    def world_to_grid(self, wx, wy):
        gx = int((wx - self.bounds.left) / self.cell_w)
        gy = int((wy - self.bounds.top) / self.cell_h)
        gx = max(0, min(self.cols - 1, gx))
        gy = max(0, min(self.rows - 1, gy))
        return gx, gy

    def check_collision(self, wx, wy, radius):
        """Check circle vs map walls collision."""
        # Convert circle bounding box to grid coordinates
        min_gx = int((wx - radius - self.bounds.left) / self.cell_w)
        max_gx = int((wx + radius - self.bounds.left) / self.cell_w)
        min_gy = int((wy - radius - self.bounds.top) / self.cell_h)
        max_gy = int((wy + radius - self.bounds.top) / self.cell_h)

        # Check against outer bounds
        if wx - radius < self.bounds.left or wx + radius > self.bounds.right:
            return True
        if wy - radius < self.bounds.top and not (min_gx <= self.start_grid[0] <= max_gx):
            return True
        if wy + radius > self.bounds.bottom and not (min_gx <= self.exit_grid[0] <= max_gx):
            return True

        for gy in range(max(0, min_gy), min(self.rows, max_gy + 1)):
            for gx in range(max(0, min_gx), min(self.cols, max_gx + 1)):
                if self.grid[gy][gx] == 1:
                    # Wall rectangle in world coordinates
                    rx = self.bounds.left + gx * self.cell_w
                    ry = self.bounds.top + gy * self.cell_h
                    rw = self.cell_w
                    rh = self.cell_h

                    # Closest point on rectangle to circle
                    cx = max(rx, min(wx, rx + rw))
                    cy = max(ry, min(wy, ry + rh))

                    dist_sq = (wx - cx) ** 2 + (wy - cy) ** 2
                    if dist_sq < (radius * 0.92) ** 2:
                        return True
        return False

    def _render_base_map(self):
        """Renders the crisp vibrant blue & white maze artwork."""
        # Exact vibrant ocean/sky blue background from user's image: #58b4e7
        bg_color = (88, 180, 231)
        wall_color = (255, 255, 255)
        path_glow = (105, 195, 245)

        self.map_surface.fill(bg_color)

        # Draw subtle grid path textures
        for gy in range(self.rows):
            for gx in range(self.cols):
                if self.grid[gy][gx] == 0:
                    rx = int(gx * self.cell_w)
                    ry = int(gy * self.cell_h)
                    rw = int(self.cell_w)
                    rh = int(self.cell_h)
                    pygame.draw.rect(self.map_surface, path_glow, (rx + 2, ry + 2, rw - 4, rh - 4), border_radius=4)

        # Draw solid white maze walls
        for gy in range(self.rows):
            for gx in range(self.cols):
                if self.grid[gy][gx] == 1:
                    rx = int(gx * self.cell_w)
                    ry = int(gy * self.cell_h)
                    rw = int(math.ceil(self.cell_w))
                    rh = int(math.ceil(self.cell_h))
                    
                    # Draw connected wall block with crisp clean edges
                    pygame.draw.rect(self.map_surface, wall_color, (rx, ry, rw, rh))

        # Soft border overlay for arcade cabinet feel
        pygame.draw.rect(self.map_surface, (255, 255, 255), (0, 0, self.bounds.width, self.bounds.height), width=4)

    def _spawn_treasures(self):
        """Places well-balanced treasures across reachable passages."""
        self.treasures.clear()
        
        # Candidate positions on walkable tiles
        treasure_placements = [
            # (gx, gy, type)
            (1, 1, 'diamond'),
            (3, 3, 'coin'),
            (9, 1, 'coin'),
            (15, 3, 'diamond'),
            (7, 5, 'chest'),
            (13, 5, 'coin'),
            (3, 7, 'crown'),
            (11, 7, 'diamond'),
            (1, 9, 'coin'),
            (7, 9, 'chest'),
            (15, 9, 'diamond'),
            (3, 11, 'crown'),
            (9, 11, 'coin'),
            (13, 11, 'diamond'),
            (1, 13, 'coin'),
            (7, 13, 'crown'),
            (15, 13, 'chest'),
            (3, 15, 'diamond'),
            (9, 15, 'coin')
        ]

        if self.level == 1:
            # Explorer level: 8 rich treasures
            selected = [treasure_placements[i] for i in [0, 2, 4, 6, 8, 11, 14, 16]]
        elif self.level == 2:
            # Adventurer level: 12 treasures
            selected = [treasure_placements[i] for i in [0, 1, 2, 4, 5, 6, 8, 10, 11, 14, 15, 16]]
        else:
            # Treasure Master: 16 treasures
            selected = treasure_placements[:16]

        for gx, gy, t_type in selected:
            wx, wy = self.grid_to_world(gx, gy)
            self.treasures.append(Treasure(gx, gy, t_type, wx, wy))

    def draw(self, surface, anim_time=0.0):
        # 1. Blit pre-rendered base maze
        surface.blit(self.map_surface, (self.bounds.left, self.bounds.top))

        # 2. Draw START Point Marker (Glowing white circle & badge)
        sx, sy = self.start_world
        start_glow = int(180 + 75 * math.sin(anim_time * 5.0))
        glow_surf = pygame.Surface((44, 44), pygame.SRCALPHA)
        pygame.draw.circle(glow_surf, (255, 255, 255, start_glow), (22, 22), 16)
        pygame.draw.circle(glow_surf, (0, 230, 180, 220), (22, 22), 11)
        surface.blit(glow_surf, (int(sx - 22), int(sy - 22)))
        
        # START Label
        font = pygame.font.SysFont('Arial', 12, bold=True)
        s_lbl = font.render("START", True, (255, 255, 255))
        surface.blit(s_lbl, (int(sx - s_lbl.get_width() // 2), int(sy - 28)))

        # 3. Draw EXIT Point Marker (Checkered radiant portal & badge)
        ex, ey = self.exit_world
        exit_pulse = int(180 + 75 * math.cos(anim_time * 5.0))
        exit_surf = pygame.Surface((48, 48), pygame.SRCALPHA)
        pygame.draw.circle(exit_surf, (255, 215, 0, exit_pulse), (24, 24), 18)
        pygame.draw.circle(exit_surf, (255, 255, 255, 240), (24, 24), 13)
        # Gold checkered pattern in center
        pygame.draw.rect(exit_surf, (255, 170, 0), (18, 18, 6, 6))
        pygame.draw.rect(exit_surf, (255, 170, 0), (24, 24, 6, 6))
        surface.blit(exit_surf, (int(ex - 24), int(ey - 24)))

        # EXIT Label
        e_lbl = font.render("🏁 EXIT", True, (255, 230, 80))
        surface.blit(e_lbl, (int(ex - e_lbl.get_width() // 2), int(ey + 16)))

        # 4. Draw all uncollected treasures
        for tr in self.treasures:
            tr.draw(surface)
