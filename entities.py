"""
Entities for AI Treasure Escape: Player (Treasure Hunter), Enemy (Monster), and Treasures.
"""

import math
import random
import pygame
from pathfinding import find_path

class Player:
    def __init__(self, start_x, start_y, radius=14):
        self.x = float(start_x)
        self.y = float(start_y)
        self.radius = radius
        self.vx = 0.0
        self.vy = 0.0
        self.base_speed = 135.0  # Pixels per second
        self.facing_angle = 0.0
        self.walk_time = 0.0
        self.is_moving = False
        self.active_dir = (0, 0)
        self.hit_radius = 12

    def update_input(self, dir_x, dir_y):
        self.active_dir = (dir_x, dir_y)

    def update(self, dt, collision_fn, particle_sys=None):
        dir_x, dir_y = self.active_dir
        target_vx = dir_x * self.base_speed
        target_vy = dir_y * self.base_speed

        # Smooth acceleration & deceleration
        accel = 12.0
        self.vx += (target_vx - self.vx) * min(1.0, accel * dt)
        self.vy += (target_vy - self.vy) * min(1.0, accel * dt)

        # Update facing angle
        if abs(self.vx) > 5 or abs(self.vy) > 5:
            self.facing_angle = math.atan2(self.vy, self.vx)
            self.walk_time += dt * 10
            self.is_moving = True
            if particle_sys and random.random() < 0.35:
                particle_sys.spawn_player_trail(self.x, self.y + 6)
        else:
            self.is_moving = False

        # Attempt movement with sliding collision
        new_x = self.x + self.vx * dt
        new_y = self.y + self.vy * dt

        # X-axis step
        if not collision_fn(new_x, self.y, self.radius):
            self.x = new_x
        else:
            self.vx = 0.0

        # Y-axis step
        if not collision_fn(self.x, new_y, self.radius):
            self.y = new_y
        else:
            self.vy = 0.0

    def draw(self, surface):
        px, py = int(self.x), int(self.y)
        r = self.radius

        # 1. Soft Shadow
        shadow_surf = pygame.Surface((r * 2 + 8, r + 6), pygame.SRCALPHA)
        pygame.draw.ellipse(shadow_surf, (0, 0, 0, 80), (0, 0, r * 2 + 8, r + 6))
        surface.blit(shadow_surf, (px - r - 4, py + r - 6))

        # 2. Explorer Body (Golden/Teal Adventurer Suit)
        body_surf = pygame.Surface((r * 2 + 10, r * 2 + 10), pygame.SRCALPHA)
        cx, cy = r + 5, r + 5

        # Adventurer Hat & Body
        pygame.draw.circle(body_surf, (40, 110, 160), (cx, cy), r)
        pygame.draw.circle(body_surf, (245, 205, 120), (cx, cy), r - 3) # Face/Torso

        # Explorer Adventurer Hat
        hat_rect = pygame.Rect(cx - r, cy - r - 2, r * 2, int(r * 0.9))
        pygame.draw.ellipse(body_surf, (160, 95, 45), hat_rect) # Hat brim
        pygame.draw.circle(body_surf, (190, 120, 60), (cx, cy - r + 1), int(r * 0.55)) # Hat crown
        pygame.draw.line(body_surf, (220, 50, 50), (cx - int(r*0.5), cy - r + 3), (cx + int(r*0.5), cy - r + 3), 2) # Red ribbon

        # Eyes facing direction
        eye_dist = 4
        ex = cx + int(math.cos(self.facing_angle) * eye_dist)
        ey = cy + int(math.sin(self.facing_angle) * eye_dist)
        pygame.draw.circle(body_surf, (20, 20, 30), (ex - 2, ey), 2)
        pygame.draw.circle(body_surf, (20, 20, 30), (ex + 2, ey), 2)

        # Backpack
        bx = cx - int(math.cos(self.facing_angle) * (r - 2))
        by = cy - int(math.sin(self.facing_angle) * (r - 2))
        pygame.draw.circle(body_surf, (110, 65, 30), (bx, by), 4)

        surface.blit(body_surf, (px - cx, py - cy))

        # Directional navigation arrow / glow
        if self.is_moving:
            ax = px + int(math.cos(self.facing_angle) * (r + 7))
            ay = py + int(math.sin(self.facing_angle) * (r + 7))
            pygame.draw.circle(surface, (255, 255, 255, 200), (ax, ay), 3)


class Enemy:
    def __init__(self, start_x, start_y, speed=65.0):
        self.x = float(start_x)
        self.y = float(start_y)
        self.speed = speed
        self.radius = 15
        self.hit_radius = 16
        self.path = []
        self.path_recalc_timer = 0.0
        self.path_recalc_interval = 0.25  # Recalculate A* every 250ms
        self.anim_time = 0.0
        self.grace_period = 3.5  # 3.5 seconds grace at start
        self.is_active = False

    def update(self, dt, player, grid_map, particle_sys=None):
        self.anim_time += dt
        
        if self.grace_period > 0:
            self.grace_period -= dt
            if particle_sys and random.random() < 0.2:
                particle_sys.spawn_enemy_aura(self.x, self.y)
            return

        self.is_active = True
        self.path_recalc_timer -= dt

        # Recalculate path periodically or if empty
        if self.path_recalc_timer <= 0 or not self.path:
            self.path_recalc_timer = self.path_recalc_interval
            sgx, sgy = grid_map.world_to_grid(self.x, self.y)
            tgx, tgy = grid_map.world_to_grid(player.x, player.y)
            
            # Run A*
            grid_path = find_path(grid_map.grid, (sgx, sgy), (tgx, tgy))
            if grid_path and len(grid_path) > 1:
                # Convert grid waypoints to world coordinates
                self.path = [grid_map.grid_to_world(gx, gy) for gx, gy in grid_path[1:]]
            elif grid_path:
                self.path = [grid_map.grid_to_world(grid_path[0][0], grid_path[0][1])]

        # Move along path
        if self.path:
            target_wx, target_wy = self.path[0]
            dx = target_wx - self.x
            dy = target_wy - self.y
            dist = math.hypot(dx, dy)

            if dist < 6.0:
                self.path.pop(0)
            else:
                step = min(dist, self.speed * dt)
                self.x += (dx / dist) * step
                self.y += (dy / dist) * step

        # Spawn shadow aura
        if particle_sys and random.random() < 0.4:
            particle_sys.spawn_enemy_aura(self.x, self.y)

    def draw(self, surface):
        px, py = int(self.x), int(self.y)
        r = self.radius

        # Pulse effect
        pulse = 1.0 + 0.1 * math.sin(self.anim_time * 6.0)
        cur_r = int(r * pulse)

        # Shadow
        shadow_surf = pygame.Surface((cur_r * 2 + 10, cur_r + 8), pygame.SRCALPHA)
        pygame.draw.ellipse(shadow_surf, (0, 0, 0, 90), (0, 0, cur_r * 2 + 10, cur_r + 8))
        surface.blit(shadow_surf, (px - cur_r - 5, py + cur_r - 6))

        # Monster Aura / Spikes
        aura_surf = pygame.Surface((cur_r * 2 + 20, cur_r * 2 + 20), pygame.SRCALPHA)
        acx, acy = cur_r + 10, cur_r + 10

        if self.grace_period > 0:
            # Sleeping / Waking Shield
            pygame.draw.circle(aura_surf, (120, 120, 200, 100), (acx, acy), cur_r + 4, 2)
            main_color = (130, 40, 160)
        else:
            # Fiery Red-Purple Dark Energy
            glow_alpha = int(120 + 60 * math.sin(self.anim_time * 8.0))
            pygame.draw.circle(aura_surf, (255, 30, 80, glow_alpha), (acx, acy), cur_r + 5, 2)
            main_color = (200, 25, 60)

        # Monster Body
        pygame.draw.circle(aura_surf, (40, 10, 50), (acx, acy), cur_r)
        pygame.draw.circle(aura_surf, main_color, (acx, acy), cur_r - 2)

        # Glowing Eerie Yellow/Red Eyes
        eye_glow = int(200 + 55 * math.sin(self.anim_time * 10.0))
        eye_color = (255, eye_glow, 0)
        pygame.draw.circle(aura_surf, eye_color, (acx - 5, acy - 3), 3)
        pygame.draw.circle(aura_surf, eye_color, (acx + 5, acy - 3), 3)
        pygame.draw.circle(aura_surf, (0, 0, 0), (acx - 5, acy - 3), 1)
        pygame.draw.circle(aura_surf, (0, 0, 0), (acx + 5, acy - 3), 1)

        # Spooky horns
        pts_left = [(acx - 8, acy - cur_r + 4), (acx - 12, acy - cur_r - 4), (acx - 4, acy - cur_r + 2)]
        pts_right = [(acx + 8, acy - cur_r + 4), (acx + 12, acy - cur_r - 4), (acx + 4, acy - cur_r + 2)]
        pygame.draw.polygon(aura_surf, (255, 200, 50), pts_left)
        pygame.draw.polygon(aura_surf, (255, 200, 50), pts_right)

        surface.blit(aura_surf, (px - acx, py - acy))

        # Grace period countdown label above monster
        if self.grace_period > 0:
            font = pygame.font.SysFont('Arial', 14, bold=True)
            txt = font.render(f"AWAKENING... {self.grace_period:.1f}s", True, (255, 240, 100))
            surface.blit(txt, (px - txt.get_width() // 2, py - cur_r - 18))


class Treasure:
    def __init__(self, gx, gy, treasure_type='diamond', world_x=0, world_y=0):
        self.gx = gx
        self.gy = gy
        self.x = float(world_x)
        self.y = float(world_y)
        self.type = treasure_type
        self.collected = False
        self.anim_offset = random.uniform(0, math.pi * 2)

        if treasure_type == 'diamond':
            self.value = 10
            self.name = "Diamond"
            self.color = (0, 220, 255)
            self.sound = 'collect_diamond'
        elif treasure_type == 'coin':
            self.value = 20
            self.name = "Gold Coin"
            self.color = (255, 215, 0)
            self.sound = 'collect_coin'
        elif treasure_type == 'crown':
            self.value = 50
            self.name = "Royal Crown"
            self.color = (255, 80, 200)
            self.sound = 'collect_crown'
        elif treasure_type == 'chest':
            self.value = 100
            self.name = "Treasure Chest"
            self.color = (255, 170, 40)
            self.sound = 'collect_chest'

    def update(self, dt):
        self.anim_offset += dt * 3.0

    def draw(self, surface):
        if self.collected:
            return

        bob = math.sin(self.anim_offset) * 3.5
        px = int(self.x)
        py = int(self.y + bob)

        # Shadow
        shadow_surf = pygame.Surface((20, 10), pygame.SRCALPHA)
        pygame.draw.ellipse(shadow_surf, (0, 0, 0, 70), (0, 0, 20, 10))
        surface.blit(shadow_surf, (px - 10, int(self.y + 10)))

        # Draw Treasure Sprite based on type
        if self.type == 'diamond':
            scale = 1.0 + 0.08 * math.sin(self.anim_offset * 2.0)
            dw = int(9 * scale)
            dh = int(11 * scale)

            # Outer aura
            aura_surf = pygame.Surface((dw * 2 + 12, dh * 2 + 12), pygame.SRCALPHA)
            pygame.draw.circle(aura_surf, (0, 240, 255, 50), (dw + 6, dh + 6), dw + 5)
            surface.blit(aura_surf, (px - dw - 6, py - dh - 6))

            # Diamond lower cone
            cone_pts = [(px - dw, py - 2), (px, py + dh), (px + dw, py - 2)]
            pygame.draw.polygon(surface, (0, 200, 230), cone_pts)

            # Diamond upper crown table
            table_pts = [(px - dw, py - 2), (px - int(dw * 0.5), py - int(dh * 0.7)),
                         (px + int(dw * 0.5), py - int(dh * 0.7)), (px + dw, py - 2)]
            pygame.draw.polygon(surface, (0, 240, 255), table_pts)

            # Front center facet
            front_pts = [(px - int(dw * 0.5), py - int(dh * 0.7)), (px + int(dw * 0.5), py - int(dh * 0.7)),
                         (px + int(dw * 0.3), py - 2), (px, py + int(dh * 0.75)), (px - int(dw * 0.3), py - 2)]
            pygame.draw.polygon(surface, (140, 250, 255), front_pts)

            # Outline
            all_pts = [(px - dw, py - 2), (px - int(dw * 0.5), py - int(dh * 0.7)),
                       (px + int(dw * 0.5), py - int(dh * 0.7)), (px + dw, py - 2), (px, py + dh)]
            pygame.draw.polygon(surface, (255, 255, 255), all_pts, 1)

            # Specular gleam
            gleam_alpha = int(180 + 75 * math.sin(self.anim_offset * 4.0))
            gleam_surf = pygame.Surface((6, 6), pygame.SRCALPHA)
            pygame.draw.circle(gleam_surf, (255, 255, 255, gleam_alpha), (3, 3), 2)
            surface.blit(gleam_surf, (px - int(dw * 0.3) - 3, py - int(dh * 0.3) - 3))

        elif self.type == 'coin':

            # Gold Coin with rim & shine
            pygame.draw.circle(surface, (255, 215, 0), (px, py), 9)
            pygame.draw.circle(surface, (218, 165, 32), (px, py), 9, 2)
            pygame.draw.circle(surface, (255, 245, 150), (px - 2, py - 2), 5)
            # $ symbol
            font = pygame.font.SysFont('Arial', 11, bold=True)
            s_txt = font.render("$", True, (160, 100, 0))
            surface.blit(s_txt, (px - s_txt.get_width() // 2, py - s_txt.get_height() // 2))

        elif self.type == 'crown':
            # Royal Crown
            pts = [
                (px - 10, py + 5), (px - 9, py - 4), (px - 4, py - 1),
                (px, py - 7), (px + 4, py - 1), (px + 9, py - 4),
                (px + 10, py + 5)
            ]
            pygame.draw.polygon(surface, (255, 215, 0), pts)
            pygame.draw.polygon(surface, (200, 140, 0), pts, 2)
            # Ruby & Emerald jewels
            pygame.draw.circle(surface, (255, 40, 40), (px, py - 3), 2)
            pygame.draw.circle(surface, (40, 255, 80), (px - 5, py + 1), 2)
            pygame.draw.circle(surface, (40, 180, 255), (px + 5, py + 1), 2)

        elif self.type == 'chest':
            # Wooden & Gold Trim Chest
            rect = pygame.Rect(px - 10, py - 7, 20, 15)
            pygame.draw.rect(surface, (140, 75, 25), rect, border_radius=3)
            pygame.draw.rect(surface, (255, 215, 0), rect, width=2, border_radius=3)
            # Gold lock in center
            pygame.draw.circle(surface, (255, 220, 0), (px, py), 3)
            pygame.draw.line(surface, (255, 215, 0), (px - 10, py - 1), (px + 10, py - 1), 2)
