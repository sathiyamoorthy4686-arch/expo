"""
Dynamic Audio Synthesizer for AI Treasure Escape
Generates arcade-grade sound effects without external audio files.
"""

import math
import numpy as np
import pygame

class SoundManager:
    def __init__(self):
        self.enabled = False
        self.sounds = {}
        try:
            pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)
            self.enabled = True
            self._generate_all_sounds()
        except Exception as e:
            print(f"[SoundManager] Audio initialization failed or disabled: {e}")
            self.enabled = False

    def _generate_tone(self, freq_fn, duration_sec, volume=0.3):
        """Generate a pygame Sound object using a frequency function f(t)."""
        sample_rate = 44100
        n_samples = int(sample_rate * duration_sec)
        t = np.linspace(0, duration_sec, n_samples, endpoint=False)
        
        # Calculate instantaneous frequency and phase
        freqs = freq_fn(t)
        phase = 2 * np.pi * np.cumsum(freqs) / sample_rate
        
        # Waveform: mix sine + soft triangle for warmth
        wave = 0.7 * np.sin(phase) + 0.3 * np.sign(np.sin(phase)) * np.abs(np.sin(phase))
        
        # Apply ADSR envelope
        attack = int(n_samples * 0.05)
        decay = int(n_samples * 0.15)
        release = int(n_samples * 0.3)
        envelope = np.ones(n_samples, dtype=np.float32)
        
        if attack > 0:
            envelope[:attack] = np.linspace(0, 1, attack)
        if release > 0:
            envelope[-release:] = np.linspace(1, 0, release)
            
        wave = wave * envelope * volume
        
        # Convert to 16-bit stereo PCM
        audio_16 = np.int16(wave * 32767)
        stereo = np.column_stack((audio_16, audio_16))
        return pygame.sndarray.make_sound(stereo)

    def _generate_all_sounds(self):
        try:
            # 1. Collect Diamond (Bright high chime)
            self.sounds['collect_diamond'] = self._generate_tone(
                lambda t: 1200 + 400 * t, 0.12, volume=0.25
            )
            # 2. Collect Coin (Classic arcade coin ping-pong)
            self.sounds['collect_coin'] = self._generate_tone(
                lambda t: 987 + 330 * (t > 0.05), 0.15, volume=0.25
            )
            # 3. Collect Crown (Heroic royal trill)
            self.sounds['collect_crown'] = self._generate_tone(
                lambda t: 880 + 440 * np.sin(40 * np.pi * t), 0.3, volume=0.3
            )
            # 4. Collect Chest (Rich deep chord sweep)
            self.sounds['collect_chest'] = self._generate_tone(
                lambda t: 520 + 300 * np.sin(20 * np.pi * t), 0.35, volume=0.35
            )
            # 5. Step / Move Whoosh (soft pop)
            self.sounds['step'] = self._generate_tone(
                lambda t: 220 * np.exp(-15 * t), 0.05, volume=0.1
            )
            # 6. Countdown Beep (Short mid ping)
            self.sounds['countdown_tick'] = self._generate_tone(
                lambda t: np.full_like(t, 660), 0.08, volume=0.25
            )
            # 7. Countdown GO! (High energetic sweep)
            self.sounds['countdown_go'] = self._generate_tone(
                lambda t: 880 + 880 * t, 0.25, volume=0.35
            )
            # 8. Danger Warning (Pulsing low alarm)
            self.sounds['danger'] = self._generate_tone(
                lambda t: 180 + 40 * np.sin(16 * np.pi * t), 0.22, volume=0.25
            )
            # 9. Victory Fanfare
            self.sounds['victory'] = self._generate_tone(
                lambda t: 523 + 261 * (t > 0.1) + 261 * (t > 0.2) + 523 * (t > 0.35), 0.6, volume=0.35
            )
            # 10. Game Over (Low thud / descending drone)
            self.sounds['game_over'] = self._generate_tone(
                lambda t: np.maximum(50, 300 - 450 * t), 0.5, volume=0.35
            )
            # 11. Button Hover / Select
            self.sounds['ui_hover'] = self._generate_tone(
                lambda t: np.full_like(t, 750), 0.04, volume=0.15
            )
            self.sounds['ui_click'] = self._generate_tone(
                lambda t: 400 + 600 * t, 0.08, volume=0.25
            )
        except Exception as e:
            print(f"[SoundManager] Error generating sound wave: {e}")

    def play(self, sound_name):
        if not self.enabled:
            return
        snd = self.sounds.get(sound_name)
        if snd:
            try:
                snd.play()
            except Exception:
                pass
