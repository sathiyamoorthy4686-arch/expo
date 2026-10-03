/**
 * Intuitive Directional Zone & Index Fingertip Tracking Controller
 * Direct Hand/Finger Movement:
 * - Hand moves Left  -> Character moves LEFT
 * - Hand moves Right -> Character moves RIGHT
 * - Hand moves Up    -> Character moves UP
 * - Hand moves Down  -> Character moves DOWN
 * - Hand in Center   -> Character STOPS
 */
class BrowserCVController {
  constructor() {
    this.videoEl = document.getElementById('webcam-video');
    this.overlayCanvas = document.getElementById('camera-overlay');
    this.ctx = this.overlayCanvas.getContext('2d');
    
    this.statusPill = document.getElementById('cam-status');
    this.noHandAlert = document.getElementById('no-hand-alert');
    this.dirDisplay = document.getElementById('dir-display');
    this.cursorEl = document.getElementById('finger-cursor');
    this.camBox = document.getElementById('cam-box');
    this.btnEnableCam = document.getElementById('btn-enable-cam');

    // D-pad indicator cells
    this.dpadCells = {
      UP: document.getElementById('dpad-up'),
      DOWN: document.getElementById('dpad-down'),
      LEFT: document.getElementById('dpad-left'),
      RIGHT: document.getElementById('dpad-right')
    };

    // Tracking state
    this.isCameraActive = false;
    this.handDetected = false;
    
    // Fingertip coordinates (0.0 to 1.0)
    this.fingerX = 0.5;
    this.fingerY = 0.5;
    this.smoothedX = 0.5;
    this.smoothedY = 0.5;

    // Movement Direction & Vector
    this.dirX = 0.0;
    this.dirY = 0.0;
    this.primaryDir = 'STOP';

    // Zone Thresholds
    this.zoneLeft = 0.38;
    this.zoneRight = 0.62;
    this.zoneTop = 0.38;
    this.zoneBottom = 0.62;

    // Keyboard Fallback
    this.kbDirX = 0.0;
    this.kbDirY = 0.0;
    this.setupKeyboard();

    // Mouse Steering Fallback
    this.mouseActive = false;
    this.mouseDirX = 0.0;
    this.mouseDirY = 0.0;
    this.setupMouseSteering();

    // Hover button system
    this.hoverTarget = null;
    this.hoverStartTime = 0;
    this.hoverDuration = 1000;

    // Click handlers to activate webcam
    if (this.btnEnableCam) {
      this.btnEnableCam.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startWebcam();
      });
    }
    if (this.statusPill) {
      this.statusPill.style.cursor = 'pointer';
      this.statusPill.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startWebcam();
      });
    }
    if (this.camBox) {
      this.camBox.addEventListener('click', () => {
        if (!this.isCameraActive) this.startWebcam();
      });
    }

    // Auto-start webcam
    this.startWebcam();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) { this.kbDirY = -1.0; e.preventDefault(); }
      if (['ArrowDown', 'KeyS'].includes(e.code)) { this.kbDirY = 1.0; e.preventDefault(); }
      if (['ArrowLeft', 'KeyA'].includes(e.code)) { this.kbDirX = -1.0; e.preventDefault(); }
      if (['ArrowRight', 'KeyD'].includes(e.code)) { this.kbDirX = 1.0; e.preventDefault(); }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code) && this.kbDirY < 0) this.kbDirY = 0.0;
      if (['ArrowDown', 'KeyS'].includes(e.code) && this.kbDirY > 0) this.kbDirY = 0.0;
      if (['ArrowLeft', 'KeyA'].includes(e.code) && this.kbDirX < 0) this.kbDirX = 0.0;
      if (['ArrowRight', 'KeyD'].includes(e.code) && this.kbDirX > 0) this.kbDirX = 0.0;
    });
  }

  setupMouseSteering() {
    const canvasWrap = document.querySelector('.canvas-wrapper');
    if (!canvasWrap) return;

    const updateMouse = (e) => {
      if (e.buttons === 1 && window.game && window.game.state === 3) {
        const rect = canvasWrap.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        if (window.game.player) {
          const px = window.game.player.x;
          const py = window.game.player.y;
          const dx = mx - px;
          const dy = my - py;
          const dist = Math.hypot(dx, dy);
          if (dist > 15) {
            this.mouseActive = true;
            this.mouseDirX = dx / dist;
            this.mouseDirY = dy / dist;
          } else {
            this.mouseActive = false;
          }
        }
      } else {
        this.mouseActive = false;
        this.mouseDirX = 0;
        this.mouseDirY = 0;
      }
    };

    canvasWrap.addEventListener('mousedown', updateMouse);
    window.addEventListener('mousemove', (e) => { if (this.mouseActive) updateMouse(e); });
    window.addEventListener('mouseup', () => { this.mouseActive = false; });
  }

  async startWebcam() {
    if (this.isCameraActive) return;

    this.statusPill.textContent = 'REQUESTING CAM...';
    this.statusPill.classList.remove('active');

    // Check mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.handleCameraError(new Error('InsecureContext'));
      return;
    }

    let stream = null;

    // Attempt 1: Standard ideal constraints
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
    } catch (err1) {
      console.warn('[CV] Preferred constraints failed, attempting fallback { video: true }...', err1);
      // Attempt 2: Minimal fallback constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      } catch (err2) {
        console.error('[CV] All getUserMedia attempts failed:', err2);
        this.handleCameraError(err2);
        return;
      }
    }

    try {
      this.videoEl.srcObject = stream;
      await this.videoEl.play();

      this.isCameraActive = true;
      this.statusPill.textContent = 'CAMERA LIVE';
      this.statusPill.classList.add('active');

      if (this.noHandAlert) {
        this.noHandAlert.innerHTML = `
          <div class="hand-icon-anim">☝️</div>
          <p style="font-size: 11px; font-weight: bold; margin-top: 4px; color: #00e5ff;">SHOW HAND TO STEER</p>
        `;
        this.noHandAlert.classList.add('show');
      }

      this.initMediaPipeHands();
      this.startContinuousRenderLoop();
    } catch (playErr) {
      console.error('[CV] Video playback error:', playErr);
      this.handleCameraError(playErr);
    }
  }

  handleCameraError(err) {
    this.isCameraActive = false;
    this.statusPill.textContent = 'CLICK TO ENABLE';
    this.statusPill.classList.remove('active');

    let helpMsg = 'Allow camera access in your browser.';
    let icon = '🔒';

    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      helpMsg = 'Camera is BLOCKED. Click the 🔒 lock / camera icon in the Chrome URL bar and select <b>Allow Camera</b>, then click below:';
      icon = '🚫';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      helpMsg = 'No webcam found. Please connect a USB camera and try again.';
      icon = '📷';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      helpMsg = 'Camera is already in use by another app (Zoom, Teams, or another tab). Close other apps and retry.';
      icon = '⚠️';
    } else if (err.message === 'InsecureContext') {
      helpMsg = 'Webcam requires <b>localhost:8000</b> or HTTPS. Please open via <u>http://localhost:8000</u>.';
      icon = '🌐';
    }

    if (this.noHandAlert) {
      this.noHandAlert.innerHTML = `
        <div style="text-align: center; padding: 10px; z-index: 10;">
          <div style="font-size: 24px; margin-bottom: 4px;">${icon}</div>
          <p style="font-size: 11px; line-height: 1.4; color: #ffd21e; margin-bottom: 8px;">${helpMsg}</p>
          <button id="btn-retry-cam" class="cta-btn" style="padding: 8px 16px; font-size: 11px; cursor: pointer;">
            🔄 TRY ENABLE CAMERA AGAIN
          </button>
        </div>
      `;

      const retryBtn = document.getElementById('btn-retry-cam');
      if (retryBtn) {
        retryBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.startWebcam();
        });
      }
      this.noHandAlert.classList.add('show');
    }
  }

  initMediaPipeHands() {
    if (typeof Hands === 'undefined') {
      console.warn('[CV] Waiting for MediaPipe Hands script to load...');
      setTimeout(() => this.initMediaPipeHands(), 500);
      return;
    }

    try {
      this.hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.35,
        minTrackingConfidence: 0.35
      });

      this.hands.onResults((results) => {
        this.latestResults = results;
      });

      let isSending = false;
      const sendFrame = async () => {
        if (this.isCameraActive && this.videoEl.readyState >= 2 && !isSending) {
          isSending = true;
          try {
            await this.hands.send({ image: this.videoEl });
          } catch (e) {
            // Drop frame gracefully
          }
          isSending = false;
        }
        requestAnimationFrame(sendFrame);
      };
      requestAnimationFrame(sendFrame);
      this.statusPill.textContent = 'AI FINGER TRACKING ACTIVE';
    } catch (e) {
      console.warn('[CV] MediaPipe init error:', e);
    }
  }

  startContinuousRenderLoop() {
    const render = () => {
      if (this.isCameraActive && this.videoEl.readyState >= 2) {
        this.renderCameraFeed();
      }
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  renderCameraFeed() {
    const w = this.overlayCanvas.width = 320;
    const h = this.overlayCanvas.height = 240;

    this.ctx.save();
    this.ctx.clearRect(0, 0, w, h);

    // 1. Draw mirrored live video
    this.ctx.translate(w, 0);
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(this.videoEl, 0, 0, w, h);
    this.ctx.restore();

    let detected = false;
    let rawTipX = 0.5;
    let rawTipY = 0.5;

    // 2. Track Strictly Index Fingertip (Landmark 8)
    if (this.latestResults && this.latestResults.multiHandLandmarks && this.latestResults.multiHandLandmarks.length > 0) {
      detected = true;
      const landmarks = this.latestResults.multiHandLandmarks[0];
      
      // Landmark 8: INDEX_FINGER_TIP
      const indexTip = landmarks[8];
      rawTipX = 1.0 - indexTip.x; // Mirrored coordinate (0.0 left to 1.0 right)
      rawTipY = indexTip.y;       // (0.0 top to 1.0 bottom)

      // Draw subtle index finger line from MCP (5) to Tip (8)
      const mcp = landmarks[5];
      this.ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo((1.0 - mcp.x) * w, mcp.y * h);
      this.ctx.lineTo((1.0 - indexTip.x) * w, indexTip.y * h);
      this.ctx.stroke();
    }

    this.handDetected = detected;

    // 3. Draw Clean Interactive Directional Zones Overlay
    this.drawDirectionalZones(w, h);

    if (detected) {
      if (this.noHandAlert) this.noHandAlert.classList.remove('show');

      // Exponential smoothing on fingertip
      const alpha = 0.45;
      this.smoothedX = this.smoothedX * (1 - alpha) + rawTipX * alpha;
      this.smoothedY = this.smoothedY * (1 - alpha) + rawTipY * alpha;
      this.fingerX = this.smoothedX;
      this.fingerY = this.smoothedY;

      const fx = this.fingerX * w;
      const fy = this.fingerY * h;

      // Check which zone the finger is in
      if (this.fingerX < this.zoneLeft) {
        // Hand moved to the LEFT
        this.primaryDir = 'LEFT';
        this.dirX = -1.0;
        this.dirY = 0.0;
      } else if (this.fingerX > this.zoneRight) {
        // Hand moved to the RIGHT
        this.primaryDir = 'RIGHT';
        this.dirX = 1.0;
        this.dirY = 0.0;
      } else if (this.fingerY < this.zoneTop) {
        // Hand moved UP
        this.primaryDir = 'UP';
        this.dirX = 0.0;
        this.dirY = -1.0;
      } else if (this.fingerY > this.zoneBottom) {
        // Hand moved DOWN
        this.primaryDir = 'DOWN';
        this.dirX = 0.0;
        this.dirY = 1.0;
      } else {
        // Hand in CENTER -> STOP
        this.primaryDir = 'STOP';
        this.dirX = 0.0;
        this.dirY = 0.0;
      }

      // 5. Draw ONLY the Glowing Fingertip Dot (No tether line!)
      this.ctx.save();
      this.ctx.strokeStyle = '#00ffff';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(fx, fy, 13, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(fx, fy, 4, 0, Math.PI * 2);
      this.ctx.fill();

      // Fingertip Glow Crosshair
      this.ctx.strokeStyle = '#ffea00';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(fx - 7, fy); this.ctx.lineTo(fx + 7, fy);
      this.ctx.moveTo(fx, fy - 7); this.ctx.lineTo(fx, fy + 7);
      this.ctx.stroke();
      this.ctx.restore();

      // Virtual cursor only on menu buttons
      if (window.game && window.game.state !== 3) {
        this.updateVirtualCursorAndHover();
      } else {
        this.cursorEl.style.display = 'none';
      }

    } else {
      if (this.noHandAlert && !this.noHandAlert.classList.contains('show')) {
        this.noHandAlert.classList.add('show');
      }
      this.dirX = 0;
      this.dirY = 0;
      this.primaryDir = 'NO_HAND';
      this.cursorEl.style.display = 'none';
      this.resetHover();
    }

    this.updateHUDIndicators();
  }

  drawDirectionalZones(w, h) {
    this.ctx.save();
    
    // Zone guide lines
    const x1 = w * this.zoneLeft;
    const x2 = w * this.zoneRight;
    const y1 = h * this.zoneTop;
    const y2 = h * this.zoneBottom;

    // Center Neutral Box
    const isCenter = this.primaryDir === 'STOP' && this.handDetected;
    this.ctx.fillStyle = isCenter ? 'rgba(255, 215, 0, 0.25)' : 'rgba(255, 255, 255, 0.05)';
    this.ctx.strokeStyle = isCenter ? '#ffd700' : 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = isCenter ? 2 : 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x1, y1, x2 - x1, y2 - y1, 6);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = isCenter ? '#ffd700' : 'rgba(255, 255, 255, 0.5)';
    this.ctx.font = 'bold 10px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('STOP', w * 0.5, h * 0.5 + 4);

    // Active Zone Highlight
    if (this.primaryDir === 'LEFT') {
      this.ctx.fillStyle = 'rgba(0, 255, 136, 0.25)';
      this.ctx.fillRect(0, 0, x1, h);
      this.ctx.strokeStyle = '#00ff88';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(2, 2, x1 - 4, h - 4);
    } else if (this.primaryDir === 'RIGHT') {
      this.ctx.fillStyle = 'rgba(0, 255, 136, 0.25)';
      this.ctx.fillRect(x2, 0, w - x2, h);
      this.ctx.strokeStyle = '#00ff88';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x2 + 2, 2, w - x2 - 4, h - 4);
    } else if (this.primaryDir === 'UP') {
      this.ctx.fillStyle = 'rgba(0, 255, 136, 0.25)';
      this.ctx.fillRect(x1, 0, x2 - x1, y1);
      this.ctx.strokeStyle = '#00ff88';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x1 + 2, 2, x2 - x1 - 4, y1 - 4);
    } else if (this.primaryDir === 'DOWN') {
      this.ctx.fillStyle = 'rgba(0, 255, 136, 0.25)';
      this.ctx.fillRect(x1, y2, x2 - x1, h - y2);
      this.ctx.strokeStyle = '#00ff88';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x1 + 2, y2 + 2, x2 - x1 - 4, h - y2 - 4);
    }

    // Directional Labels
    this.ctx.font = 'bold 11px sans-serif';
    this.ctx.fillStyle = this.primaryDir === 'LEFT' ? '#00ff88' : 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText('◀ LEFT', x1 * 0.5, h * 0.5 + 4);

    this.ctx.fillStyle = this.primaryDir === 'RIGHT' ? '#00ff88' : 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText('RIGHT ▶', x2 + (w - x2) * 0.5, h * 0.5 + 4);

    this.ctx.fillStyle = this.primaryDir === 'UP' ? '#00ff88' : 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText('▲ UP', w * 0.5, y1 * 0.5 + 4);

    this.ctx.fillStyle = this.primaryDir === 'DOWN' ? '#00ff88' : 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText('▼ DOWN', w * 0.5, y2 + (h - y2) * 0.5 + 4);

    this.ctx.restore();
  }

  updateVirtualCursorAndHover() {
    const canvasWrap = document.querySelector('.canvas-wrapper');
    if (!canvasWrap) return;
    const rect = canvasWrap.getBoundingClientRect();

    const screenX = rect.left + this.fingerX * rect.width;
    const screenY = rect.top + this.fingerY * rect.height;

    this.cursorEl.style.display = 'block';
    this.cursorEl.style.left = `${this.fingerX * 100}%`;
    this.cursorEl.style.top = `${this.fingerY * 100}%`;

    const hoveredEl = document.elementFromPoint(screenX, screenY);
    const btn = hoveredEl?.closest('.hover-clickable');

    if (btn) {
      if (this.hoverTarget === btn) {
        const elapsed = Date.now() - this.hoverStartTime;
        const progress = Math.min(1.0, elapsed / this.hoverDuration);
        const fillBar = btn.querySelector('.hover-fill');
        if (fillBar) fillBar.style.width = `${progress * 100}%`;

        if (elapsed >= this.hoverDuration) {
          if (window.soundSynth) window.soundSynth.play('ui_click');
          btn.click();
          this.resetHover();
        }
      } else {
        this.resetHover();
        this.hoverTarget = btn;
        this.hoverStartTime = Date.now();
        if (window.soundSynth) window.soundSynth.play('ui_hover');
      }
    } else {
      this.resetHover();
    }
  }

  resetHover() {
    if (this.hoverTarget) {
      const fillBar = this.hoverTarget.querySelector('.hover-fill');
      if (fillBar) fillBar.style.width = '0%';
    }
    this.hoverTarget = null;
    this.hoverStartTime = 0;
  }

  updateHUDIndicators() {
    if (this.dirDisplay) {
      this.dirDisplay.textContent = this.primaryDir;
      if (this.primaryDir === 'NO_HAND') {
        this.dirDisplay.style.color = '#ffaa33';
      } else if (this.primaryDir === 'STOP') {
        this.dirDisplay.style.color = '#ffd700';
      } else {
        this.dirDisplay.style.color = '#00ff88';
      }
    }

    Object.keys(this.dpadCells).forEach(dir => {
      if (this.dpadCells[dir]) {
        if (this.primaryDir === dir) {
          this.dpadCells[dir].classList.add('active');
        } else {
          this.dpadCells[dir].classList.remove('active');
        }
      }
    });
  }

  getMovement() {
    // 1. Direct Zone Movement from Hand
    if (this.handDetected && this.primaryDir !== 'STOP') {
      return {
        x: this.dirX,
        y: this.dirY,
        dir: this.primaryDir,
        isCV: true
      };
    }

    // 2. Keyboard
    if (Math.abs(this.kbDirX) > 0.01 || Math.abs(this.kbDirY) > 0.01) {
      let pDir = 'IDLE';
      if (Math.abs(this.kbDirX) > Math.abs(this.kbDirY)) {
        pDir = this.kbDirX > 0 ? 'RIGHT' : 'LEFT';
      } else {
        pDir = this.kbDirY > 0 ? 'DOWN' : 'UP';
      }
      return {
        x: this.kbDirX,
        y: this.kbDirY,
        dir: pDir,
        isCV: false
      };
    }

    // 3. Mouse Drag
    if (this.mouseActive) {
      let pDir = 'MOUSE';
      return {
        x: this.mouseDirX,
        y: this.mouseDirY,
        dir: pDir,
        isCV: false
      };
    }

    return { x: 0, y: 0, dir: 'STOP', isCV: false };
  }
}

window.BrowserCVController = BrowserCVController;
