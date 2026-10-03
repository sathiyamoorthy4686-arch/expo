"""
Particle System and Floating Texts for rich visual effects.
"""

import math
import random
import pygame

class Particle:
    def __init__(self, x, y, vx, vy, color, radius, lifetime, shape='circle', gravity=0.0):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.color = color
        self.radius = radius
        self.max_life = lifetime
        self.life = lifetime
        self.shape = shape
        self.gravity = gravity

    def update(self, dt):
        self.life -= dt
        self.x += self.vx * dt * 60
        self.y += self.vy * dt * 60
        self.vy += self.gravity * dt * 60

    @property
    def is_alive(self):
        return self.life > 0

    def draw(self, surface):
        if self.life <= 0:
            return
        alpha_ratio = max(0.0, self.life / self.max_life)
        cur_radius = max(1, int(self.radius * alpha_ratio))
        
        # Color fade with alpha
        c = self.color
        if len(c) == 3:
            r, g, b = c
        else:
            r, g, b, _ = c

        alpha = int(255 * alpha_ratio)
        temp_surf = pygame.Surface((cur_radius * 2 + 2, cur_radius * 2 + 2), pygame.SRCALPHA)
        
        if self.shape == 'circle':
            pygame.draw.circle(temp_surf, (r, g, b, alpha), (cur_radius + 1, cur_radius + 1), cur_radius)
        elif self.shape == 'star':
            # 4-point sparkle star
            cx, cy = cur_radius + 1, cur_radius + 1
            pts = [
                (cx, cy - cur_radius),
                (cx + cur_radius // 3, cy - cur_radius // 3),
                (cx + cur_radius, cy),
                (cx + cur_radius // 3, cy + cur_radius // 3),
                (cx, cy + cur_radius),
                (cx - cur_radius // 3, cy + cur_radius // 3),
                (cx - cur_radius, cy),
                (cx - cur_radius // 3, cy - cur_radius // 3),
            ]
            pygame.draw.polygon(temp_surf, (r, g, b, alpha), pts)
        elif self.shape == 'square':
            rect = pygame.Rect(1, 1, cur_radius * 2, cur_radius * 2)
            pygame.draw.rect(temp_surf, (r, g, b, alpha), rect)
            
        surface.blit(temp_surf, (int(self.x - cur_radius - 1), int(self.y - cur_radius - 1)))


class FloatingText:
    def __init__(self, x, y, text, color=(255, 220, 50), font_size=24, lifetime=1.2):
        self.x = x
        self.y = y
        self.text = text
        self.color = color
        self.font = pygame.font.SysFont('Arial', font_size, bold=True)
        self.lifetime = lifetime
        self.life = lifetime
        self.vy = -35.0

    def update(self, dt):
        self.life -= dt
        self.y += self.vy * dt

    @property
    def is_alive(self):
        return self.life > 0

    def draw(self, surface):
        if self.life <= 0:
            return
        alpha = int(255 * max(0.0, self.life / self.lifetime))
        text_surf = self.font.render(self.text, True, self.color)
        text_surf.set_alpha(alpha)
        
        # Shadow
        shadow_surf = self.font.render(self.text, True, (0, 0, 0))
        shadow_surf.set_alpha(int(alpha * 0.7))
        surface.blit(shadow_surf, (int(self.x + 2), int(self.y + 2)))
        surface.blit(text_surf, (int(self.x), int(self.y)))


class ParticleSystem:
    def __init__(self):
        self.particles = []
        self.floating_texts = []

    def update(self, dt):
        for p in self.particles:
            p.update(dt)
        self.particles = [p for p in self.particles if p.is_alive]

        for ft in self.floating_texts:
            ft.update(dt)
        self.floating_texts = [ft for ft in self.floating_texts if ft.is_alive]

    def draw(self, surface):
        for p in self.particles:
            p.draw(surface)
        for ft in self.floating_texts:
            ft.draw(surface)

    def spawn_treasure_sparkles(self, x, y, color):
        for _ in range(16):
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(1.2, 4.5)
            vx = math.cos(angle) * speed
            vy = math.sin(angle) * speed
            radius = random.randint(3, 7)
            life = random.uniform(0.4, 0.9)
            shape = random.choice(['star', 'circle'])
            self.particles.append(Particle(x, y, vx, vy, color, radius, life, shape=shape, gravity=0.05))

    def spawn_player_trail(self, x, y):
        vx = random.uniform(-0.5, 0.5)
        vy = random.uniform(-0.5, 0.5)
        color = (180, 230, 255)
        radius = random.randint(2, 4)
        life = random.uniform(0.2, 0.4)
        self.particles.append(Particle(x, y, vx, vy, color, radius, life, shape='circle'))

    def spawn_enemy_aura(self, x, y):
        vx = random.uniform(-0.8, 0.8)
        vy = random.uniform(-1.5, -0.2)
        color = random.choice([(255, 40, 80), (180, 0, 90), (255, 100, 30)])
        radius = random.randint(3, 6)
        life = random.uniform(0.3, 0.6)
        self.particles.append(Particle(x, y, vx, vy, color, radius, life, shape='circle', gravity=-0.02))

    def spawn_portal_ring(self, x, y):
        angle = random.uniform(0, 2 * math.pi)
        dist = random.uniform(12, 22)
        px = x + math.cos(angle) * dist
        py = y + math.sin(angle) * dist
        # Tangential spiral velocity towards center
        vx = -math.sin(angle) * 1.5 - math.cos(angle) * 1.0
        vy = math.cos(angle) * 1.5 - math.sin(angle) * 1.0
        color = random.choice([(0, 255, 200), (50, 220, 255), (255, 255, 255)])
        radius = random.randint(2, 5)
        life = random.uniform(0.4, 0.8)
        self.particles.append(Particle(px, py, vx, vy, color, radius, life, shape='star'))

    def spawn_confetti_firework(self, x, y):
        colors = [
            (255, 215, 0), (255, 60, 100), (0, 230, 255),
            (100, 255, 100), (255, 150, 0), (220, 80, 255)
        ]
        for _ in range(40):
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(2.0, 7.0)
            vx = math.cos(angle) * speed
            vy = math.sin(angle) * speed
            color = random.choice(colors)
            radius = random.randint(3, 7)
            life = random.uniform(0.8, 1.8)
            shape = random.choice(['square', 'circle', 'star'])
            self.particles.append(Particle(x, y, vx, vy, color, radius, life, shape=shape, gravity=0.12))

    def add_floating_text(self, x, y, text, color=(255, 230, 60), font_size=24):
        self.floating_texts.append(FloatingText(x, y, text, color=color, font_size=font_size))
