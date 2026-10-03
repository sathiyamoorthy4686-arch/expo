# 🗺️ AI TREASURE ESCAPE - Computer Vision Game

An interactive, real-time **Computer-Vision-Controlled Escape & Treasure Adventure Game** built for **Science Expos**, school students, and interactive college demos.

Controlled purely via **Webcam Hand/Finger Tracking** using **MediaPipe** and **OpenCV**, with **Pygame** rendering the labyrinth game world.

---

## 🎮 Game Concept & Features

* **Visual Map**: Built using the authentic **Blue & White Treasure Labyrinth** layout with crisp walls, corridor collision detection, and glowing Start/Exit portals.
* **Computer Vision Control**:
  * Tracks the player's **Index Fingertip** (Landmark 8) in real-time.
  * Virtual Joystick with a **neutral dead zone** prevents false triggers from slight hand tremors.
  * Directional vectors translate fingertip steering seamlessly into character movement (**LEFT / RIGHT / UP / DOWN**).
  * **Crowd-Robust**: Single-hand tracking (`max_num_hands=1`) with immediate `"Show your hand"` prompt if tracking is lost.
* **AI Treasure Guard / Monster**:
  * Pursues the treasure hunter using dynamic **A\* (A-Star) Pathfinding** through the maze.
  * Features an **Awakening Grace Period (3.5s)** at the start so students can comfortably get oriented.
  * Proximity alarm (**⚠️ ENEMY NEARBY!**) flashes when the monster gets dangerously close.
* **Treasures & Score**:
  * 💎 **Diamond**: +10 pts
  * 🪙 **Gold Coin**: +20 pts
  * 👑 **Royal Crown**: +50 pts
  * 💰 **Treasure Chest**: +100 pts
  * **Time Bonus**: Extra points rewarded for fast escapes!
* **Science Expo Kiosk Features**:
  * **Attract Mode & "How to Play" Screen**: Clear visual instructions for visiting school students.
  * **Hover-To-Click Buttons**: Students can select menu buttons by hovering their fingertip cursor for 1.2 seconds (or clicking).
  * **Dramatic 3... 2... 1... GO!** countdown sequence.
  * **Auto-Reset Timer**: Automatically resets to the title screen 12–15 seconds after victory or game over, ready for the next player.
  * **Keyboard / Mouse Fallback**: Arrow keys / WASD and mouse controls included for emergency backup or quick testing.
  * **Built-in Procedural Audio Synthesizer**: Zero missing audio asset errors — generates 8-bit / 16-bit arcade chimes, danger alarms, and fanfares on the fly!

---

## 🚀 Quick Start Guide

### 1. Requirements & Dependencies
Ensure Python 3.9+ (Python 3.12 supported) is installed:
```bash
pip install -r requirements.txt
```

### 2. Run on Localhost (Web Browser Edition)
Run the local HTTP server and open your browser at **`http://localhost:8000`**:
```bash
python server.py
```
> Or start a standard Python web server: `python -m http.server 8000` and visit [http://localhost:8000](http://localhost:8000).

### 3. Run as Native Desktop Pygame App
```bash
python main.py
```

---

## 🕹️ Controls

| Action | Computer Vision Gesture | Keyboard Fallback |
| :--- | :--- | :--- |
| **Move Up** | Move index finger UP from center | `W` or `Up Arrow` |
| **Move Down** | Move index finger DOWN from center | `S` or `Down Arrow` |
| **Move Left** | Move index finger LEFT from center | `A` or `Left Arrow` |
| **Move Right** | Move index finger RIGHT from center | `D` or `Right Arrow` |
| **Stop Moving** | Return finger to central neutral zone | Release keys |
| **Start / Restart** | Hover index finger over button or click | `SPACE` or `ENTER` |
| **Toggle Fullscreen** | — | `F11` or `F` |
| **Quit** | — | `ESC` |

---

## 📁 Project Architecture

```text
science expo/
├── main.py             # Main game loop, UI state machine, Mission HUD & Kiosk manager
├── cv_controller.py    # Threaded MediaPipe webcam finger tracking & virtual joystick
├── map_data.py         # Blueprint & renderer of the authentic Blue & White maze map
├── entities.py         # Player (Treasure Hunter), Enemy (A* Guard), and Treasures
├── pathfinding.py      # Optimized A* (A-Star) pathfinding engine
├── particles.py        # Sparkles, danger smoke, portal vortex, and victory confetti
├── audio_synth.py      # Procedural sound effect wave synthesizer
└── requirements.txt    # Pinned dependencies (pygame, opencv-python, mediapipe, numpy)
```
