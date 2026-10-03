"""
Enhanced Computer Vision Controller with Multi-Pipeline Hand Tracking & Visual HUD.
Supports MediaPipe Tasks (1.0+), Adaptive Skin/Contour Tracking, and Mouse fallback.
"""

import threading
import time
import math
import os
import cv2
import numpy as np
import pygame

# Suppress noisy logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

MP_AVAILABLE = False
detector = None

try:
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision
    
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hand_landmarker.task')
    if os.path.exists(model_path):
        base_options = mp_python.BaseOptions(model_asset_path=model_path)
        options = mp_vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=1,
            min_hand_detection_confidence=0.25,
            min_tracking_confidence=0.25,
            running_mode=mp_vision.RunningMode.IMAGE
        )
        detector = mp_vision.HandLandmarker.create_from_options(options)
        MP_AVAILABLE = True
        print("[CV Controller] MediaPipe HandLandmarker loaded successfully.")
except Exception as e:
    print(f"[CV Controller] MediaPipe load note: {e}")
    MP_AVAILABLE = False


class CVController:
    def __init__(self, camera_index=0, preview_size=(250, 188)):
        self.camera_index = camera_index
        self.preview_w, self.preview_h = preview_size
        self.running = False
        self.thread = None
        self.cap = None

        # Tracking State
        self.hand_detected = False
        self.finger_x = 0.5
        self.finger_y = 0.5
        self.smoothed_x = 0.5
        self.smoothed_y = 0.5
        self.center_anchor_x = 0.5
        self.center_anchor_y = 0.5
        
        # Deadzone & Thresholds
        self.dead_zone_radius = 0.09  # Responsive neutral center zone
        
        # Direction
        self.dir_x = 0.0
        self.dir_y = 0.0
        self.primary_direction = "IDLE"
        self.tracking_mode = "SEARCHING"

        # Frame buffer for Pygame preview
        self.lock = threading.Lock()
        self.preview_surface = None
        self.has_camera = False

        # Keyboard & Mouse fallback state
        self.kb_dir_x = 0.0
        self.kb_dir_y = 0.0
        self.mouse_dir_x = 0.0
        self.mouse_dir_y = 0.0
        self.mouse_active = False

        self.start()

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)
        if self.cap:
            self.cap.release()

    def _adaptive_skin_contour(self, frame):
        """High-contrast YCrCb + HSV adaptive skin segmentation."""
        h, w, _ = frame.shape
        ycrcb = cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb)
        mask = cv2.inRange(ycrcb, np.array([0, 130, 75]), np.array([255, 175, 130]))

        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        mask = cv2.erode(mask, kernel, iterations=1)
        mask = cv2.dilate(mask, kernel, iterations=2)
        mask = cv2.GaussianBlur(mask, (7, 7), 0)

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return False, 0.5, 0.5, None

        c = max(contours, key=cv2.contourArea)
        if cv2.contourArea(c) < 1800:
            return False, 0.5, 0.5, None

        topmost = tuple(c[c[:, :, 1].argmin()][0])
        fx = topmost[0] / float(w)
        fy = topmost[1] / float(h)
        return True, fx, fy, topmost

    def _capture_loop(self):
        try:
            self.cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)
            if not self.cap.isOpened():
                self.cap = cv2.VideoCapture(self.camera_index)
            if not self.cap.isOpened():
                self.cap = cv2.VideoCapture(1)
            
            if self.cap.isOpened():
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                self.cap.set(cv2.CAP_PROP_FPS, 30)
                self.has_camera = True
            else:
                self.has_camera = False
                print("[CV Controller] No camera found. Keyboard/Mouse fallback ready.")
        except Exception as e:
            print(f"[CV Controller] Camera error: {e}")
            self.has_camera = False

        while self.running:
            if not self.has_camera or not self.cap or not self.cap.isOpened():
                time.sleep(0.05)
                continue

            ret, frame = self.cap.read()
            if not ret or frame is None:
                time.sleep(0.02)
                continue

            # Mirror horizontally for natural steering
            frame = cv2.flip(frame, 1)
            h, w, _ = frame.shape

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            detected = False
            raw_fx, raw_fy = 0.5, 0.5
            mode_tag = "SEARCHING"

            # 1. Try MediaPipe Task HandLandmarker
            if detector:
                try:
                    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                    res = detector.detect(mp_img)
                    if res.hand_landmarks and len(res.hand_landmarks) > 0:
                        detected = True
                        lm = res.hand_landmarks[0]
                        index_tip = lm[8]  # INDEX_FINGER_TIP
                        raw_fx = float(index_tip.x)
                        raw_fy = float(index_tip.y)
                        mode_tag = "AI MEDIAPIPE"

                        # Draw all landmarks
                        for pt in lm:
                            px = int(pt.x * w)
                            py = int(pt.y * h)
                            cv2.circle(rgb_frame, (px, py), 3, (0, 255, 200), -1)
                except Exception:
                    pass

            # 2. Fallback to adaptive optical contour
            if not detected:
                det_skin, s_fx, s_fy, pt_top = self._adaptive_skin_contour(frame)
                if det_skin:
                    detected = True
                    raw_fx, raw_fy = s_fx, s_fy
                    mode_tag = "OPTICAL TRACK"
                    if pt_top:
                        cv2.circle(rgb_frame, pt_top, 8, (0, 255, 255), 2)

            with self.lock:
                self.hand_detected = detected
                self.tracking_mode = mode_tag

                if detected:
                    alpha = 0.4
                    self.smoothed_x = self.smoothed_x * (1 - alpha) + raw_fx * alpha
                    self.smoothed_y = self.smoothed_y * (1 - alpha) + raw_fy * alpha
                    self.finger_x = self.smoothed_x
                    self.finger_y = self.smoothed_y

                    dx = self.finger_x - self.center_anchor_x
                    dy = self.finger_y - self.center_anchor_y
                    dist = math.hypot(dx, dy)

                    if dist > self.dead_zone_radius:
                        scale = min(1.0, (dist - self.dead_zone_radius) / (0.32 - self.dead_zone_radius))
                        self.dir_x = (dx / dist) * scale
                        self.dir_y = (dy / dist) * scale

                        if abs(dx) > abs(dy):
                            self.primary_direction = "RIGHT" if dx > 0 else "LEFT"
                        else:
                            self.primary_direction = "DOWN" if dy > 0 else "UP"
                    else:
                        self.dir_x = 0.0
                        self.dir_y = 0.0
                        self.primary_direction = "NEUTRAL"
                else:
                    self.dir_x = 0.0
                    self.dir_y = 0.0
                    self.primary_direction = "NO_HAND"

                # Draw Visual Feedback on Preview Frame
                cx_px, cy_px = int(self.center_anchor_x * w), int(self.center_anchor_y * h)
                dz_px = int(self.dead_zone_radius * min(w, h))

                # Neutral deadzone ring
                cv2.circle(rgb_frame, (cx_px, cy_px), dz_px, (100, 220, 255), 2)
                cv2.circle(rgb_frame, (cx_px, cy_px), 3, (100, 220, 255), -1)

                if detected:
                    fx_px = int(self.finger_x * w)
                    fy_px = int(self.finger_y * h)

                    # Fingertip glowing halo
                    cv2.circle(rgb_frame, (fx_px, fy_px), 14, (0, 255, 255), 3)
                    cv2.circle(rgb_frame, (fx_px, fy_px), 5, (255, 255, 255), -1)

                    # Direction Vector
                    if self.primary_direction in ["UP", "DOWN", "LEFT", "RIGHT"]:
                        cv2.arrowedLine(rgb_frame, (cx_px, cy_px), (fx_px, fy_px), (0, 255, 50), 3, tipLength=0.25)

                    # Status Banner
                    dir_color = (0, 255, 0) if self.primary_direction != "NEUTRAL" else (255, 220, 0)
                    cv2.putText(rgb_frame, f"{self.primary_direction}", (15, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.9, dir_color, 2)
                    cv2.putText(rgb_frame, f"[{mode_tag}]", (15, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 240, 255), 1)
                else:
                    cv2.putText(rgb_frame, "SHOW HAND IN FRAME", (15, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 180, 255), 2)
                    cv2.putText(rgb_frame, "(Keyboard WASD also active)", (15, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180, 180, 180), 1)

                # Resize and convert to Pygame Surface
                small_frame = cv2.resize(rgb_frame, (self.preview_w, self.preview_h))
                surf_data = np.rot90(small_frame)
                self.preview_surface = pygame.surfarray.make_surface(surf_data)

            time.sleep(0.015)

    def get_movement(self):
        """Returns (dir_x, dir_y, direction_name, is_hand_detected)"""
        with self.lock:
            if self.hand_detected:
                return self.dir_x, self.dir_y, self.primary_direction, True
            
            # Check keyboard
            if abs(self.kb_dir_x) > 0.01 or abs(self.kb_dir_y) > 0.01:
                p_dir = "IDLE"
                if abs(self.kb_dir_x) > abs(self.kb_dir_y):
                    p_dir = "RIGHT" if self.kb_dir_x > 0 else "LEFT"
                else:
                    p_dir = "DOWN" if self.kb_dir_y > 0 else "UP"
                return self.kb_dir_x, self.kb_dir_y, p_dir, False

            # Check mouse drag fallback
            if self.mouse_active and (abs(self.mouse_dir_x) > 0.05 or abs(self.mouse_dir_y) > 0.05):
                p_dir = "MOUSE"
                return self.mouse_dir_x, self.mouse_dir_y, p_dir, False
            
            return 0.0, 0.0, "NO_HAND", False

    def update_mouse_steering(self, mouse_pos, player_pos):
        """Allows dragging or aiming mouse towards character as instant fallback."""
        if pygame.mouse.get_pressed()[0] and player_pos:
            self.mouse_active = True
            dx = mouse_pos[0] - player_pos[0]
            dy = mouse_pos[1] - player_pos[1]
            dist = math.hypot(dx, dy)
            if dist > 20:
                self.mouse_dir_x = max(-1.0, min(1.0, dx / dist))
                self.mouse_dir_y = max(-1.0, min(1.0, dy / dist))
            else:
                self.mouse_dir_x = 0.0
                self.mouse_dir_y = 0.0
        else:
            self.mouse_active = False
            self.mouse_dir_x = 0.0
            self.mouse_dir_y = 0.0

    def handle_keydown(self, key):
        if key in (pygame.K_LEFT, pygame.K_a):
            self.kb_dir_x = -1.0
        elif key in (pygame.K_RIGHT, pygame.K_d):
            self.kb_dir_x = 1.0
        elif key in (pygame.K_UP, pygame.K_w):
            self.kb_dir_y = -1.0
        elif key in (pygame.K_DOWN, pygame.K_s):
            self.kb_dir_y = 1.0

    def handle_keyup(self, key):
        if key in (pygame.K_LEFT, pygame.K_a) and self.kb_dir_x < 0:
            self.kb_dir_x = 0.0
        elif key in (pygame.K_RIGHT, pygame.K_d) and self.kb_dir_x > 0:
            self.kb_dir_x = 0.0
        elif key in (pygame.K_UP, pygame.K_w) and self.kb_dir_y < 0:
            self.kb_dir_y = 0.0
        elif key in (pygame.K_DOWN, pygame.K_s) and self.kb_dir_y > 0:
            self.kb_dir_y = 0.0

    def get_preview_surface(self):
        with self.lock:
            return self.preview_surface
