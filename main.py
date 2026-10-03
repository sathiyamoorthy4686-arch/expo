"""
AI TREASURE ESCAPE - Main Game Application
Computer-Vision-Controlled Escape & Treasure Adventure for Science Expo.
"""

import sys
import os
import math
import time
import random
import pygame

# Initialize Pygame
pygame.init()
pygame.font.init()

from cv_controller import CVController
from map_data import GameMap
from entities import Player, Enemy
from particles import ParticleSystem
from audio_synth import SoundManager

# Screen Dimensions
SCREEN_WIDTH = 1200
SCREEN_HEIGHT = 780
FPS = 60

# Game States
STATE_MENU = 0
STATE_COUNTDOWN = 1
STATE_PLAYING = 2
STATE_VICTORY = 3
STATE_GAMEOVER = 4

class Button:
    def __init__(self, rect, text, bg_color=(40, 140, 220), hover_color=(70, 180, 255), text_color=(255, 255, 255), font_size=24):
        self.rect = pygame.Rect(rect)
        self.text = text
        self.bg_color = bg_color
        self.hover_color = hover_color
        self.text_color = text_color
        self.font = pygame.font.SysFont('Arial', font_size, bold=True)
        self.is_hovered = False
        self.hover_time = 0.0
        self.hover_trigger_time = 1.2  # 1.2s hover for hands-free click

    def update(self, dt, pointer_pos):
        if pointer_pos and self.rect.collidepoint(pointer_pos):
            self.is_hovered = True
            self.hover_time += dt
        else:
            self.is_hovered = False
            self.hover_time = 0.0

    def is_triggered(self):
        return self.hover_time >= self.hover_trigger_time

    def draw(self, surface):
        col = self.hover_color if self.is_hovered else self.bg_color
        # Glow border
        if self.is_hovered:
            glow_rect = self.rect.inflate(8, 8)
            pygame.draw.rect(surface, (255, 220, 100), glow_rect, border_radius=12)
        
        pygame.draw.rect(surface, col, self.rect, border_radius=8)
        pygame.draw.rect(surface, (255, 255, 255), self.rect, width=2, border_radius=8)

        # Hover progress bar at bottom of button
        if self.is_hovered and self.hover_time > 0:
            prog = min(1.0, self.hover_time / self.hover_trigger_time)
            bar_w = int(self.rect.width * prog)
            bar_rect = pygame.Rect(self.rect.left, self.rect.bottom - 4, bar_w, 4)
            pygame.draw.rect(surface, (255, 255, 50), bar_rect, border_radius=2)

        txt_surf = self.font.render(self.text, True, self.text_color)
        surface.blit(txt_surf, (self.rect.centerx - txt_surf.get_width() // 2, self.rect.centery - txt_surf.get_height() // 2))


class AITreasureEscapeGame:
    def __init__(self):
        # Display setup
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.DOUBLEBUF | pygame.RESIZABLE)
        pygame.display.set_caption("AI TREASURE ESCAPE - Computer Vision Adventure")

        self.clock = pygame.time.Clock()
        self.running = True
        self.fullscreen = False

        # Audio & CV Controllers
        self.sound = SoundManager()
        self.cv = CVController(camera_index=0, preview_size=(250, 188))
        self.particles = ParticleSystem()

        # State Variables
        self.state = STATE_MENU
        self.level = 1  # 1: Explorer, 2: Adventurer, 3: Treasure Master
        self.score = 0
        self.treasures_collected = 0
        self.total_treasures = 0
        self.time_limit = 60.0
        self.time_remaining = 60.0
        self.countdown_timer = 3.99
        self.last_countdown_sec = 4
        self.danger_alert = False
        self.danger_sound_cooldown = 0.0
        self.game_over_reason = ""
        self.auto_reset_timer = 0.0
        self.anim_time = 0.0

        # Game World Layout (700x700 map box on the left)
        self.map_bounds = pygame.Rect(35, 40, 700, 700)
        self.game_map = GameMap(self.map_bounds, level=self.level)
        self.player = None
        self.enemy = None

        # UI Fonts
        self.title_font = pygame.font.SysFont('Arial', 32, bold=True)
        self.header_font = pygame.font.SysFont('Arial', 22, bold=True)
        self.body_font = pygame.font.SysFont('Arial', 16)
        self.big_font = pygame.font.SysFont('Arial', 64, bold=True)

        # Buttons
        self.start_btn = Button((SCREEN_WIDTH // 2 - 130, 600, 260, 56), "START MISSION ▶", bg_color=(20, 160, 100), hover_color=(40, 200, 120), font_size=24)
        self.restart_btn = Button((SCREEN_WIDTH // 2 - 120, 580, 240, 50), "PLAY AGAIN 🔄", bg_color=(200, 120, 20), hover_color=(240, 150, 40), font_size=22)
        self.menu_btn = Button((SCREEN_WIDTH // 2 - 120, 645, 240, 46), "MAIN MENU 🏠", bg_color=(60, 80, 110), hover_color=(80, 100, 140), font_size=20)
        
        # Difficulty selection buttons
        self.lvl1_btn = Button((SCREEN_WIDTH // 2 - 270, 515, 160, 45), "Level 1: Explorer", bg_color=(30, 120, 180), font_size=16)
        self.lvl2_btn = Button((SCREEN_WIDTH // 2 - 80, 515, 160, 45), "Level 2: Adventurer", bg_color=(50, 70, 90), font_size=16)
        self.lvl3_btn = Button((SCREEN_WIDTH // 2 + 110, 515, 160, 45), "Level 3: Master", bg_color=(50, 70, 90), font_size=16)

    def set_difficulty(self, level):
        self.level = level
        self.lvl1_btn.bg_color = (30, 120, 180) if level == 1 else (50, 70, 90)
        self.lvl2_btn.bg_color = (30, 120, 180) if level == 2 else (50, 70, 90)
        self.lvl3_btn.bg_color = (30, 120, 180) if level == 3 else (50, 70, 90)
        self.sound.play('ui_click')

    def start_new_game(self):
        self.game_map = GameMap(self.map_bounds, level=self.level)
        sx, sy = self.game_map.start_world
        self.player = Player(sx, sy, radius=13)

        # Enemy speed based on difficulty
        enemy_speed = 60.0 if self.level == 1 else (80.0 if self.level == 2 else 100.0)
        ex, ey = self.game_map.enemy_spawn_world
        self.enemy = Enemy(ex, ey, speed=enemy_speed)
        
        self.score = 0
        self.treasures_collected = 0
        self.total_treasures = len(self.game_map.treasures)
        self.time_limit = 60.0
        self.time_remaining = 60.0
        self.countdown_timer = 3.99
        self.last_countdown_sec = 4
        self.state = STATE_COUNTDOWN
        self.danger_alert = False

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False

            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if self.state in [STATE_PLAYING, STATE_COUNTDOWN]:
                        self.state = STATE_MENU
                    else:
                        self.running = False
                elif event.key == pygame.K_F11 or event.key == pygame.K_f:
                    self.fullscreen = not self.fullscreen
                    if self.fullscreen:
                        self.screen = pygame.display.set_mode((0, 0), pygame.FULLSCREEN)
                    else:
                        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.RESIZABLE)
                elif event.key == pygame.K_SPACE or event.key == pygame.K_RETURN:
                    if self.state == STATE_MENU:
                        self.start_new_game()
                    elif self.state in [STATE_VICTORY, STATE_GAMEOVER]:
                        self.start_new_game()
                else:
                    self.cv.handle_keydown(event.key)

            elif event.type == pygame.KEYUP:
                self.cv.handle_keyup(event.key)

            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                mpos = event.pos
                if self.state == STATE_MENU:
                    if self.start_btn.rect.collidepoint(mpos):
                        self.sound.play('ui_click')
                        self.start_new_game()
                    elif self.lvl1_btn.rect.collidepoint(mpos):
                        self.set_difficulty(1)
                    elif self.lvl2_btn.rect.collidepoint(mpos):
                        self.set_difficulty(2)
                    elif self.lvl3_btn.rect.collidepoint(mpos):
                        self.set_difficulty(3)
                elif self.state in [STATE_VICTORY, STATE_GAMEOVER]:
                    if self.restart_btn.rect.collidepoint(mpos):
                        self.sound.play('ui_click')
                        self.start_new_game()
                    elif self.menu_btn.rect.collidepoint(mpos):
                        self.sound.play('ui_click')
                        self.state = STATE_MENU

    def update(self, dt):
        # Update button hover positions and mouse drag steering
        mouse_pos = pygame.mouse.get_pos()
        if self.player:
            self.cv.update_mouse_steering(mouse_pos, (self.player.x, self.player.y))

        # Get Computer Vision Hand Tracking Input
        dir_x, dir_y, dir_name, has_hand = self.cv.get_movement()

        if has_hand:
            # Virtual fingertip cursor mapped to screen
            finger_screen_pos = (int(self.cv.finger_x * SCREEN_WIDTH), int(self.cv.finger_y * SCREEN_HEIGHT))
            active_pointer = finger_screen_pos
        else:
            active_pointer = mouse_pos

        if self.state == STATE_MENU:
            self.start_btn.update(dt, active_pointer)
            self.lvl1_btn.update(dt, active_pointer)
            self.lvl2_btn.update(dt, active_pointer)
            self.lvl3_btn.update(dt, active_pointer)

            if self.start_btn.is_triggered():
                self.sound.play('ui_click')
                self.start_new_game()

        elif self.state == STATE_COUNTDOWN:
            self.countdown_timer -= dt
            sec = int(self.countdown_timer)
            if sec != self.last_countdown_sec:
                self.last_countdown_sec = sec
                if sec > 0:
                    self.sound.play('countdown_tick')
                elif sec == 0:
                    self.sound.play('countdown_go')

            if self.countdown_timer <= 0:
                self.state = STATE_PLAYING

        elif self.state == STATE_PLAYING:
            # 1. Update Timer
            self.time_remaining -= dt
            if self.time_remaining <= 0:
                self.time_remaining = 0
                self.game_over_reason = "TIME'S UP! The ancient temple closed!"
                self.state = STATE_GAMEOVER
                self.auto_reset_timer = 12.0
                self.sound.play('game_over')
                return

            # 2. Update Player
            self.player.update_input(dir_x, dir_y)
            self.player.update(dt, self.game_map.check_collision, self.particles)

            # 3. Update Enemy
            self.enemy.update(dt, self.player, self.game_map, self.particles)

            # 4. Check Danger Proximity
            dist_to_enemy = math.hypot(self.player.x - self.enemy.x, self.player.y - self.enemy.y)
            if dist_to_enemy < 140 and self.enemy.is_active:
                self.danger_alert = True
                self.danger_sound_cooldown -= dt
                if self.danger_sound_cooldown <= 0:
                    self.sound.play('danger')
                    self.danger_sound_cooldown = 1.0
            else:
                self.danger_alert = False

            # 5. Check Enemy Collision
            if self.enemy.is_active and dist_to_enemy < (self.player.hit_radius + self.enemy.hit_radius):
                self.game_over_reason = "CAUGHT BY THE TREASURE GUARD!"
                self.state = STATE_GAMEOVER
                self.auto_reset_timer = 12.0
                self.sound.play('game_over')
                return

            # 6. Check Treasure Collection
            for tr in self.game_map.treasures:
                if not tr.collected:
                    tr.update(dt)
                    dist = math.hypot(self.player.x - tr.x, self.player.y - tr.y)
                    if dist < (self.player.radius + 14):
                        tr.collected = True
                        self.treasures_collected += 1
                        self.score += tr.value
                        self.sound.play(tr.sound)
                        self.particles.spawn_treasure_sparkles(tr.x, tr.y, tr.color)
                        self.particles.add_floating_text(tr.x - 15, tr.y - 15, f"+{tr.value}", tr.color)

            # 7. Check EXIT Reached
            ex, ey = self.game_map.exit_world
            dist_to_exit = math.hypot(self.player.x - ex, self.player.y - ey)
            if dist_to_exit < (self.player.radius + 16):
                # Calculate final time bonus
                time_bonus = int(self.time_remaining * 10)
                self.score += time_bonus
                self.particles.add_floating_text(ex - 30, ey - 20, f"TIME BONUS +{time_bonus}!", (255, 255, 100), font_size=28)
                self.state = STATE_VICTORY
                self.auto_reset_timer = 15.0
                self.sound.play('victory')
                for _ in range(5):
                    self.particles.spawn_confetti_firework(
                        random.randint(200, 1000), random.randint(150, 400)
                    )

            # Spawn ambient portal particles
            if random.random() < 0.4:
                self.particles.spawn_portal_ring(ex, ey)

        elif self.state in [STATE_VICTORY, STATE_GAMEOVER]:
            self.restart_btn.update(dt, active_pointer)
            self.menu_btn.update(dt, active_pointer)

            if self.restart_btn.is_triggered():
                self.sound.play('ui_click')
                self.start_new_game()
            elif self.menu_btn.is_triggered():
                self.sound.play('ui_click')
                self.state = STATE_MENU

            # Expo Auto-Reset to Attract/Menu Screen
            self.auto_reset_timer -= dt
            if self.auto_reset_timer <= 0:
                self.state = STATE_MENU

    def draw_hud(self):
        """Draws the Mission Control HUD on the right side of the screen."""
        hud_x = 765
        hud_y = 40
        hud_w = SCREEN_WIDTH - hud_x - 35
        hud_h = 700

        # Background Panel (Glassmorphism Dark Blue)
        panel_surf = pygame.Surface((hud_w, hud_h), pygame.SRCALPHA)
        pygame.draw.rect(panel_surf, (15, 25, 45, 235), (0, 0, hud_w, hud_h), border_radius=16)
        pygame.draw.rect(panel_surf, (60, 120, 200, 180), (0, 0, hud_w, hud_h), width=2, border_radius=16)
        self.screen.blit(panel_surf, (hud_x, hud_y))

        cur_y = hud_y + 18

        # 1. Header Title
        title_txt = self.title_font.render("🧭 MISSION HUD", True, (255, 220, 80))
        self.screen.blit(title_txt, (hud_x + (hud_w - title_txt.get_width()) // 2, cur_y))
        cur_y += 44

        # 2. Score & Stats Card
        card_rect = pygame.Rect(hud_x + 15, cur_y, hud_w - 30, 105)
        pygame.draw.rect(self.screen, (25, 40, 68), card_rect, border_radius=10)
        pygame.draw.rect(self.screen, (50, 90, 150), card_rect, width=1, border_radius=10)

        # Time Remaining with animated bar
        time_col = (255, 60, 60) if self.time_remaining <= 15 else (80, 230, 120)
        time_txt = self.header_font.render(f"⏱ TIME: {int(self.time_remaining)}s", True, time_col)
        self.screen.blit(time_txt, (card_rect.left + 15, card_rect.top + 10))

        # Time bar
        time_bar_rect = pygame.Rect(card_rect.left + 15, card_rect.top + 38, card_rect.width - 30, 8)
        pygame.draw.rect(self.screen, (40, 50, 70), time_bar_rect, border_radius=4)
        fill_w = int((card_rect.width - 30) * (self.time_remaining / self.time_limit))
        if fill_w > 0:
            pygame.draw.rect(self.screen, time_col, (time_bar_rect.left, time_bar_rect.top, fill_w, 8), border_radius=4)

        # Score & Treasures Collected
        score_txt = self.header_font.render(f"🏆 SCORE: {self.score}", True, (255, 215, 0))
        tr_txt = self.body_font.render(f"💎 TREASURES: {self.treasures_collected} / {self.total_treasures}", True, (180, 230, 255))
        self.screen.blit(score_txt, (card_rect.left + 15, card_rect.top + 54))
        self.screen.blit(tr_txt, (card_rect.left + 15, card_rect.top + 80))

        cur_y += 120

        # 3. Live Webcam PIP View Box
        cam_box = pygame.Rect(hud_x + 15, cur_y, hud_w - 30, 215)
        pygame.draw.rect(self.screen, (10, 18, 30), cam_box, border_radius=10)
        pygame.draw.rect(self.screen, (40, 100, 180), cam_box, width=2, border_radius=10)

        # Camera Header
        cam_title = self.header_font.render("📷 WEBCAM VISION", True, (200, 230, 255))
        self.screen.blit(cam_title, (cam_box.left + 12, cam_box.top + 8))

        # Blit Live Camera Feed
        cam_surf = self.cv.get_preview_surface()
        if cam_surf:
            self.screen.blit(cam_surf, (cam_box.centerx - self.cv.preview_w // 2, cam_box.top + 34))
        else:
            no_cam = self.body_font.render("Connecting Camera...", True, (150, 150, 150))
            self.screen.blit(no_cam, (cam_box.centerx - no_cam.get_width() // 2, cam_box.centery - 10))

        # Camera Status Badge
        _, _, p_dir, has_hand = self.cv.get_movement()
        if has_hand:
            status_txt = "● HAND DETECTED ✓"
            status_col = (50, 255, 120)
        else:
            pulse = int(180 + 75 * math.sin(self.anim_time * 8.0))
            status_txt = "● SHOW YOUR HAND"
            status_col = (255, pulse, 50)

        badge_txt = self.body_font.render(status_txt, True, status_col)
        self.screen.blit(badge_txt, (cam_box.left + 12, cam_box.bottom - 22))

        cur_y += 230

        # 4. Gesture Direction Compass
        dir_box = pygame.Rect(hud_x + 15, cur_y, hud_w - 30, 140)
        pygame.draw.rect(self.screen, (25, 40, 68), dir_box, border_radius=10)
        
        comp_title = self.body_font.render("ACTIVE DIRECTION:", True, (200, 220, 240))
        self.screen.blit(comp_title, (dir_box.left + 15, dir_box.top + 10))

        # Draw 4-Way Compass Indicators
        cx, cy = dir_box.centerx, dir_box.top + 78
        btn_dirs = [
            ("UP", (cx, cy - 28), p_dir == "UP"),
            ("DOWN", (cx, cy + 28), p_dir == "DOWN"),
            ("LEFT", (cx - 45, cy), p_dir == "LEFT"),
            ("RIGHT", (cx + 45, cy), p_dir == "RIGHT")
        ]

        for dname, (bx, by), active in btn_dirs:
            col = (0, 255, 150) if active else (50, 75, 110)
            text_col = (0, 0, 0) if active else (180, 200, 220)
            rect = pygame.Rect(bx - 22, by - 12, 44, 24)
            pygame.draw.rect(self.screen, col, rect, border_radius=5)
            if active:
                pygame.draw.rect(self.screen, (255, 255, 255), rect, width=2, border_radius=5)
            d_txt = self.body_font.render(dname[0], True, text_col)
            self.screen.blit(d_txt, (rect.centerx - d_txt.get_width() // 2, rect.centery - d_txt.get_height() // 2))

        # Center indicator
        center_col = (0, 255, 200) if p_dir != "NO_HAND" else (100, 100, 100)
        pygame.draw.circle(self.screen, center_col, (cx, cy), 6)

        cur_y += 155

        # 5. Threat Radar / Danger Banner
        if self.danger_alert:
            danger_rect = pygame.Rect(hud_x + 15, cur_y, hud_w - 30, 48)
            pulse = int(180 + 75 * math.sin(self.anim_time * 12.0))
            pygame.draw.rect(self.screen, (pulse, 20, 40), danger_rect, border_radius=8)
            pygame.draw.rect(self.screen, (255, 255, 255), danger_rect, width=2, border_radius=8)
            d_txt = self.header_font.render("⚠️ ENEMY NEARBY! ESCAPE!", True, (255, 255, 255))
            self.screen.blit(d_txt, (danger_rect.centerx - d_txt.get_width() // 2, danger_rect.centery - d_txt.get_height() // 2))
        else:
            hint_txt = self.body_font.render("Tip: Move finger away from center to steer", True, (140, 180, 220))
            self.screen.blit(hint_txt, (hud_x + (hud_w - hint_txt.get_width()) // 2, cur_y + 12))

    def draw_menu(self):
        """Attract & How-To-Play Menu Screen for Science Expo."""
        # Deep space / Ancient temple background gradient
        self.screen.fill((12, 20, 38))

        # Title Glow Banner
        title_surf = self.big_font.render("AI TREASURE ESCAPE", True, (255, 215, 0))
        sub_surf = self.header_font.render("Computer-Vision-Powered Labyrinth Adventure", True, (100, 220, 255))
        self.screen.blit(title_surf, (SCREEN_WIDTH // 2 - title_surf.get_width() // 2, 45))
        self.screen.blit(sub_surf, (SCREEN_WIDTH // 2 - sub_surf.get_width() // 2, 115))

        # How To Play Instruction Card
        card_w, card_h = 760, 310
        card_rect = pygame.Rect(SCREEN_WIDTH // 2 - card_w // 2, 165, card_w, card_h)
        pygame.draw.rect(self.screen, (20, 32, 58), card_rect, border_radius=16)
        pygame.draw.rect(self.screen, (50, 110, 200), card_rect, width=2, border_radius=16)

        header_txt = self.title_font.render("📜 HOW TO PLAY (SCIENCE EXPO)", True, (255, 230, 90))
        self.screen.blit(header_txt, (card_rect.left + 30, card_rect.top + 20))

        instructions = [
            ("1. Stand in front of the camera.", "Stand ~2-3 feet away with good lighting."),
            ("2. Show your index finger.", "The camera will detect your fingertip marker."),
            ("3. Move finger LEFT / RIGHT / UP / DOWN.", "Your Treasure Hunter navigates through corridors."),
            ("4. Collect Treasures (💎 🪙 👑 💰).", "Gather diamonds, coins & chests for maximum score!"),
            ("5. Escape the Monster & reach 🏁 EXIT!", "Do not let the Treasure Guard catch you before 60s!")
        ]

        step_y = card_rect.top + 68
        for bold_step, desc in instructions:
            st_surf = self.body_font.render(bold_step, True, (255, 255, 255))
            desc_surf = self.body_font.render(desc, True, (160, 200, 240))
            self.screen.blit(st_surf, (card_rect.left + 35, step_y))
            self.screen.blit(desc_surf, (card_rect.left + 370, step_y))
            step_y += 44

        # Difficulty Level Label
        diff_lbl = self.body_font.render("Select Difficulty:", True, (200, 220, 240))
        self.screen.blit(diff_lbl, (SCREEN_WIDTH // 2 - 270, 488))

        # Draw Buttons
        self.lvl1_btn.draw(self.screen)
        self.lvl2_btn.draw(self.screen)
        self.lvl3_btn.draw(self.screen)
        self.start_btn.draw(self.screen)

        # Bottom shortcut info
        footer_txt = self.body_font.render("Press SPACE / ENTER to Start  |  F11: Fullscreen  |  Arrow Keys / WASD Backup", True, (120, 150, 190))
        self.screen.blit(footer_txt, (SCREEN_WIDTH // 2 - footer_txt.get_width() // 2, 720))

        # Mini Live Webcam preview in corner so player knows tracking works
        cam_surf = self.cv.get_preview_surface()
        if cam_surf:
            small_cam = pygame.transform.scale(cam_surf, (160, 120))
            self.screen.blit(small_cam, (SCREEN_WIDTH - 190, SCREEN_HEIGHT - 150))
            pygame.draw.rect(self.screen, (0, 255, 200), (SCREEN_WIDTH - 190, SCREEN_HEIGHT - 150, 160, 120), width=2)
            lbl = self.body_font.render("Camera Preview", True, (0, 255, 200))
            self.screen.blit(lbl, (SCREEN_WIDTH - 190, SCREEN_HEIGHT - 172))

    def draw_countdown(self):
        """Dramatic Countdown Screen before run starts."""
        self.game_map.draw(self.screen, self.anim_time)
        self.player.draw(self.screen)
        self.enemy.draw(self.screen)
        self.draw_hud()

        # Dark overlay
        dim_surf = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        dim_surf.fill((0, 0, 0, 140))
        self.screen.blit(dim_surf, (0, 0))

        sec = int(self.countdown_timer)
        txt = "GO!" if sec == 0 else str(sec)
        col = (50, 255, 120) if sec == 0 else (255, 220, 50)

        zoom_font = pygame.font.SysFont('Arial', 120, bold=True)
        cd_surf = zoom_font.render(txt, True, col)
        self.screen.blit(cd_surf, (SCREEN_WIDTH // 2 - cd_surf.get_width() // 2, SCREEN_HEIGHT // 2 - cd_surf.get_height() // 2 - 30))

        ready_txt = self.header_font.render("RAISE YOUR INDEX FINGER AND GET READY!", True, (255, 255, 255))
        self.screen.blit(ready_txt, (SCREEN_WIDTH // 2 - ready_txt.get_width() // 2, SCREEN_HEIGHT // 2 + 70))

    def draw_victory(self):
        """Escape Successful Victory Screen."""
        self.game_map.draw(self.screen, self.anim_time)
        self.particles.draw(self.screen)
        self.draw_hud()

        # Overlay Modal Card
        card_w, card_h = 620, 500
        card_rect = pygame.Rect(SCREEN_WIDTH // 2 - card_w // 2, 120, card_w, card_h)
        
        modal_surf = pygame.Surface((card_w, card_h), pygame.SRCALPHA)
        pygame.draw.rect(modal_surf, (15, 30, 55, 245), (0, 0, card_w, card_h), border_radius=18)
        pygame.draw.rect(modal_surf, (255, 215, 0), (0, 0, card_w, card_h), width=3, border_radius=18)
        self.screen.blit(modal_surf, (card_rect.left, card_rect.top))

        # Title
        vic_title = self.big_font.render("🎉 ESCAPE SUCCESSFUL!", True, (255, 215, 0))
        self.screen.blit(vic_title, (card_rect.centerx - vic_title.get_width() // 2, card_rect.top + 30))

        # Stars
        stars_txt = self.title_font.render("⭐⭐⭐ MASTER ESCAPIST ⭐⭐⭐", True, (255, 230, 80))
        self.screen.blit(stars_txt, (card_rect.centerx - stars_txt.get_width() // 2, card_rect.top + 105))

        # Summary Stats
        stats = [
            f"🏆 Final Score: {self.score}",
            f"💎 Treasures Collected: {self.treasures_collected} / {self.total_treasures}",
            f"⏱ Time Remaining: {int(self.time_remaining)}s",
            f"🎮 Difficulty: Level {self.level}"
        ]

        sy = card_rect.top + 165
        for st in stats:
            st_surf = self.header_font.render(st, True, (220, 240, 255))
            self.screen.blit(st_surf, (card_rect.centerx - st_surf.get_width() // 2, sy))
            sy += 36

        # Auto-reset info
        rst_info = self.body_font.render(f"Auto-resetting for next student in {int(self.auto_reset_timer)}s...", True, (150, 180, 210))
        self.screen.blit(rst_info, (card_rect.centerx - rst_info.get_width() // 2, card_rect.top + 335))

        # Buttons
        self.restart_btn.rect.centerx = card_rect.centerx
        self.restart_btn.rect.top = card_rect.top + 380
        self.restart_btn.draw(self.screen)

        self.menu_btn.rect.centerx = card_rect.centerx
        self.menu_btn.rect.top = card_rect.top + 440
        self.menu_btn.draw(self.screen)

    def draw_gameover(self):
        """Game Over Screen."""
        self.game_map.draw(self.screen, self.anim_time)
        self.particles.draw(self.screen)
        self.draw_hud()

        # Modal Card
        card_w, card_h = 620, 480
        card_rect = pygame.Rect(SCREEN_WIDTH // 2 - card_w // 2, 130, card_w, card_h)

        modal_surf = pygame.Surface((card_w, card_h), pygame.SRCALPHA)
        pygame.draw.rect(modal_surf, (35, 15, 25, 245), (0, 0, card_w, card_h), border_radius=18)
        pygame.draw.rect(modal_surf, (255, 60, 80), (0, 0, card_w, card_h), width=3, border_radius=18)
        self.screen.blit(modal_surf, (card_rect.left, card_rect.top))

        # Title
        go_title = self.big_font.render("💀 GAME OVER", True, (255, 60, 80))
        self.screen.blit(go_title, (card_rect.centerx - go_title.get_width() // 2, card_rect.top + 30))

        # Reason
        reason_surf = self.header_font.render(self.game_over_reason, True, (255, 200, 100))
        self.screen.blit(reason_surf, (card_rect.centerx - reason_surf.get_width() // 2, card_rect.top + 110))

        # Stats
        score_surf = self.header_font.render(f"Final Score: {self.score}  |  Treasures: {self.treasures_collected}", True, (220, 230, 240))
        self.screen.blit(score_surf, (card_rect.centerx - score_surf.get_width() // 2, card_rect.top + 170))

        # Hint
        hint_surf = self.body_font.render("Tip: Keep your index finger steady to make fast sharp turns around maze corners!", True, (180, 200, 220))
        self.screen.blit(hint_surf, (card_rect.centerx - hint_surf.get_width() // 2, card_rect.top + 230))

        # Auto-reset info
        rst_info = self.body_font.render(f"Auto-resetting for next student in {int(self.auto_reset_timer)}s...", True, (160, 160, 160))
        self.screen.blit(rst_info, (card_rect.centerx - rst_info.get_width() // 2, card_rect.top + 285))

        # Buttons
        self.restart_btn.rect.centerx = card_rect.centerx
        self.restart_btn.rect.top = card_rect.top + 330
        self.restart_btn.draw(self.screen)

        self.menu_btn.rect.centerx = card_rect.centerx
        self.menu_btn.rect.top = card_rect.top + 395
        self.menu_btn.draw(self.screen)

    def run(self):
        while self.running:
            dt = self.clock.tick(FPS) / 1000.0
            dt = min(dt, 0.1)  # Clamp max delta time

            self.handle_events()
            self.update(dt)

            # Render current state
            if self.state == STATE_MENU:
                self.draw_menu()
            elif self.state == STATE_COUNTDOWN:
                self.draw_countdown()
            elif self.state == STATE_PLAYING:
                self.screen.fill((20, 30, 50))
                self.game_map.draw(self.screen, self.anim_time)
                self.particles.draw(self.screen)
                self.player.draw(self.screen)
                self.enemy.draw(self.screen)
                self.draw_hud()
            elif self.state == STATE_VICTORY:
                self.draw_victory()
            elif self.state == STATE_GAMEOVER:
                self.draw_gameover()

            pygame.display.flip()

        # Clean shutdown
        self.cv.stop()
        pygame.quit()
        sys.exit(0)


if __name__ == "__main__":
    game = AITreasureEscapeGame()
    game.run()
