import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './LauncherScreen.css';

/* ═══════════════════════════════════════════════════════════════════
   UI UX PRO MAX — CINEMATIC RICE MILL LAUNCHER
   Light Mode | Parallax Storytelling + Hero-Centric Design Pattern
   3D Industrial Complex | Golden Husk Particles | Animated Scene
   ═══════════════════════════════════════════════════════════════════ */

/* ─── Helper: Draw a 3D extruded box (isometric cabinet projection) ─── */
function draw3DBox(ctx, x, y, w, h, depth, frontColor, topColor, sideColor, shadowColor) {
  // Front face
  const frontGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  frontGrad.addColorStop(0, frontColor[0]);
  frontGrad.addColorStop(1, frontColor[1] || frontColor[0]);
  ctx.fillStyle = frontGrad;
  ctx.fillRect(x, y, w, h);

  // Top face (lit by sun from upper-right)
  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + depth, y - depth * 0.45);
  ctx.lineTo(x + w + depth, y - depth * 0.45);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();

  // Right side face (slight shadow)
  ctx.fillStyle = sideColor;
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + depth, y - depth * 0.45);
  ctx.lineTo(x + w + depth, y + h - depth * 0.45);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();

  // Bottom ground shadow
  if (shadowColor) {
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h, w * 0.48, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ─── Cylindrical Silo ─────────────────────────────────────────── */
function drawSilo(ctx, cx, topY, radius, height, t) {
  // Cylinder body with metallic gradient (light from upper-right)
  const grad = ctx.createLinearGradient(cx - radius, topY, cx + radius, topY);
  grad.addColorStop(0.0, '#8A9088');  // shadow left
  grad.addColorStop(0.3, '#BCC0B8');
  grad.addColorStop(0.55, '#E8EDE5'); // specular highlight
  grad.addColorStop(0.75, '#C8CEC8');
  grad.addColorStop(1.0, '#96A094');  // shadow right
  ctx.fillStyle = grad;
  ctx.fillRect(cx - radius, topY, radius * 2, height);

  // Horizontal reinforcement rings
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.2;
  for (let i = 1; i <= 5; i++) {
    const ry = topY + (i / 6) * height;
    ctx.beginPath();
    ctx.ellipse(cx, ry, radius, radius * 0.14, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Dome cap (top ellipse)
  const domeGrad = ctx.createRadialGradient(cx - radius * 0.25, topY - radius * 0.1, 0, cx, topY, radius * 1.1);
  domeGrad.addColorStop(0, '#F0F4EE');
  domeGrad.addColorStop(0.6, '#B8C0B5');
  domeGrad.addColorStop(1, '#7A8880');
  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.ellipse(cx, topY, radius, radius * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rim highlight
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, topY, radius, radius * 0.38, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Bottom shadow
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.ellipse(cx, topY + height, radius * 0.9, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ─── Smoke Particle ──────────────────────────────────────────── */
class SmokeParticle {
  constructor(ox, oy) {
    this.ox = ox; this.oy = oy;
    this.reset();
  }
  reset() {
    this.x = this.ox + (Math.random() - 0.5) * 5;
    this.y = this.oy;
    this.vx = (Math.random() - 0.42) * 0.3;
    this.vy = -(0.35 + Math.random() * 0.5);
    this.life = 0;
    this.maxLife = 140 + Math.random() * 80;
    this.r = 5 + Math.random() * 6;
    this.gr = 0.12 + Math.random() * 0.09;
  }
  update(wind) {
    this.life++;
    this.x += this.vx + wind * 0.5;
    this.y += this.vy;
    this.r += this.gr;
    if (this.life >= this.maxLife) this.reset();
  }
  draw(ctx) {
    const t = this.life / this.maxLife;
    const a = t < 0.18 ? (t / 0.18) * 0.4 : (1 - t) * 0.4;
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
    g.addColorStop(0, `rgba(200,195,188,${a})`);
    g.addColorStop(1, `rgba(200,195,188,0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ─── Golden Rice Husk Particle ────────────────────────────────── */
class GoldenHusk {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset();
  }
  reset() {
    const c = this.canvas;
    this.x = Math.random() * c.width;
    this.y = c.height * (0.45 + Math.random() * 0.50);
    this.vx = (Math.random() - 0.35) * 0.45;
    this.vy = -(Math.random() * 0.65 + 0.25);
    this.life = 0;
    this.maxLife = 210 + Math.random() * 180;
    this.size = Math.random() * 2.4 + 1.4;
    this.angle = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 0.028;
    const hue = 38 + Math.random() * 10;
    const sat = 72 + Math.random() * 20;
    const lit = 52 + Math.random() * 12;
    this.baseColor = `${hue},${sat}%,${lit}%`;
  }
  update(wind) {
    this.life++;
    this.x += this.vx + wind * 0.28;
    this.y += this.vy;
    this.angle += this.spin;
    this.x += Math.sin(this.life * 0.038) * 0.22;
    if (this.life >= this.maxLife || this.y < -20 || this.x < -20 || this.x > this.canvas.width + 20)
      this.reset();
  }
  draw(ctx) {
    const progress = this.life / this.maxLife;
    const alpha = progress < 0.15
      ? progress / 0.15
      : progress > 0.80
      ? (1 - progress) / 0.20
      : 1;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.globalAlpha = alpha * 0.8;

    // Main body — golden ellipse (rice husk shape)
    ctx.fillStyle = `hsla(${this.baseColor},1)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 2.8, this.size * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();

    // Center ridge line (realistic husk detail)
    ctx.strokeStyle = `hsla(${this.baseColor},0.5)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-this.size * 2.5, 0);
    ctx.lineTo(this.size * 2.5, 0);
    ctx.stroke();

    // Specular highlight
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(-this.size * 0.6, -this.size * 0.25, this.size * 1.2, this.size * 0.38, 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/* ─── Swaying Rice Stalk ─────────────────────────────────────── */
class RiceStalk {
  constructor(x, baseY, height, phase, amplitude) {
    this.x = x; this.baseY = baseY; this.height = height;
    this.phase = phase; this.amplitude = amplitude;
    const hue = 38 + Math.random() * 14;
    const hs  = 95 + Math.random() * 18;
    const hl  = 27 + Math.random() * 10;
    this.grainColor = `hsl(${hue}, ${70 + Math.random()*18}%, ${48 + Math.random()*12}%)`;
    this.stemColor  = `hsl(${hs}, ${42 + Math.random()*15}%, ${hl}%)`;
  }
  draw(ctx, t, wind) {
    const sway    = Math.sin(t * 0.85 + this.phase) * this.amplitude * (1 + wind * 0.4);
    const swayTip = sway * 1.55;
    ctx.save();

    // Stem bezier
    ctx.beginPath();
    ctx.moveTo(this.x, this.baseY);
    ctx.bezierCurveTo(
      this.x + sway * 0.25, this.baseY - this.height * 0.35,
      this.x + sway * 0.65, this.baseY - this.height * 0.70,
      this.x + swayTip,     this.baseY - this.height
    );
    ctx.strokeStyle = this.stemColor;
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Drooping grain head
    const tx = this.x + swayTip, ty = this.baseY - this.height;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(sway * 0.022 + 0.16);
    ctx.fillStyle = this.grainColor;
    ctx.beginPath();
    ctx.ellipse(0, 6, 2.6, 6.8, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      ctx.beginPath();
      ctx.ellipse(i * 2.2, 3.5 + Math.abs(i) * 1.4, 1.4, 4.0, i * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  }
}

/* ─── Drifting Cloud ─────────────────────────────────────────── */
class Cloud {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset(true);
  }
  reset(init = false) {
    this.x = init ? Math.random() * this.canvas.width : -250;
    this.y = 28 + Math.random() * 95;
    this.speed = 0.06 + Math.random() * 0.10;
    this.scale = 0.5 + Math.random() * 0.7;
    this.alpha = 0.35 + Math.random() * 0.28;
    this.puffs = Array.from({ length: 4 + Math.random() * 3 | 0 }, () => ({
      dx: (Math.random() - 0.5) * 85,
      dy: (Math.random() - 0.5) * 16,
      r: 18 + Math.random() * 26,
    }));
  }
  update() {
    this.x += this.speed;
    if (this.x > this.canvas.width + 250) this.reset();
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale * 0.55);
    this.puffs.forEach(p => {
      const g = ctx.createRadialGradient(p.dx, p.dy - p.r * 0.22, p.r * 0.1, p.dx, p.dy, p.r);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.65, 'rgba(248,252,255,0.88)');
      g.addColorStop(1, 'rgba(220,232,245,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.dx, p.dy, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}

/* ─── Water Ripple ───────────────────────────────────────────── */
class WaterRipple {
  constructor(x, y) {
    this.ox = x; this.oy = y;
    this.reset();
  }
  reset() {
    this.x = this.ox + (Math.random() - 0.5) * 60;
    this.y = this.oy + (Math.random() - 0.5) * 4;
    this.rx = 8 + Math.random() * 20;
    this.ry = 1.5;
    this.life = 0;
    this.maxLife = 80 + Math.random() * 80;
    this.gr = 0.35 + Math.random() * 0.2;
  }
  update() {
    this.life++;
    this.rx += this.gr;
    if (this.life >= this.maxLife) this.reset();
  }
  draw(ctx) {
    const t = this.life / this.maxLife;
    const a = t < 0.2 ? t / 0.2 : (1 - t);
    ctx.save();
    ctx.globalAlpha = a * 0.18;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.rx, this.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE CANVAS RENDERER
   ═══════════════════════════════════════════════════════════════════ */
function SceneCanvas({ mouseX, mouseY }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Scene objects ──
    const husks   = Array.from({ length: 38 }, () => {
      const h = new GoldenHusk(canvas);
      h.life = Math.random() * h.maxLife;
      return h;
    });
    const stalks = Array.from({ length: 88 }, (_, i) => {
      const row  = i < 88 * 0.55 ? 0 : 1;
      const xPos = (i % (88 * 0.55)) / (88 * 0.55) * canvas.width + (Math.random() - 0.5) * 20;
      const yBase = row === 0
        ? canvas.height * 0.73 + Math.random() * 10
        : canvas.height * 0.85 + Math.random() * 10;
      const ht = row === 0 ? 52 + Math.random() * 22 : 68 + Math.random() * 25;
      return new RiceStalk(xPos, yBase, ht, Math.random() * Math.PI * 2, 3.5 + Math.random() * 4);
    });
    const clouds = Array.from({ length: 5 }, () => new Cloud(canvas));
    const smokes = Array.from({ length: 14 }, (_, i) => {
      const s = new SmokeParticle(0, 0);
      s.life = Math.random() * s.maxLife;
      return s;
    });
    const ripples = Array.from({ length: 10 }, (_, i) => {
      const r = new WaterRipple(canvas.width * (0.1 + i * 0.08), canvas.height * 0.72);
      r.life = Math.random() * r.maxLife;
      return r;
    });

    let frame = 0;
    let rafId;
    let wind = 0.18;
    let windTarget = 0.18;
    let windTimer = 0;

    const render = () => {
      rafId = requestAnimationFrame(render);
      frame++;
      const t = frame / 60;

      // Natural wind gusts
      windTimer++;
      if (windTimer > 200) {
        windTarget = (Math.random() - 0.28) * 1.1;
        windTimer = 0;
      }
      wind += (windTarget - wind) * 0.004;

      const W = canvas.width, H = canvas.height;
      const mx = mouseX.current || 0;
      const my = mouseY.current || 0;

      ctx.clearRect(0, 0, W, H);

      /* ══════ LAYER 0 — SKY (warm daylight / light mode) ══════ */
      const skyG = ctx.createLinearGradient(0, 0, 0, H * 0.65);
      skyG.addColorStop(0.00, '#5EB8F2');  // deep clear blue sky
      skyG.addColorStop(0.18, '#82CBFA');
      skyG.addColorStop(0.38, '#B6E3FC');  // pale horizon sky
      skyG.addColorStop(0.55, '#E8F4C0');  // horizon glow (green-gold)
      skyG.addColorStop(0.75, '#F5E898');  // warm golden horizon
      skyG.addColorStop(1.00, '#D4B040');  // ripe harvest
      ctx.fillStyle = skyG;
      ctx.fillRect(0, 0, W, H * 0.65);

      /* ══════ LAYER 1 — SUN ══════ */
      const sunX = W * 0.78 + mx * -16;
      const sunY = H * 0.11 + my * -5;
      const pulse = 1 + Math.sin(t * 0.55) * 0.013;

      // Corona glow
      const corona = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 220 * pulse);
      corona.addColorStop(0.00, 'rgba(255,248,180,0.28)');
      corona.addColorStop(0.45, 'rgba(255,225,100,0.12)');
      corona.addColorStop(1.00, 'rgba(255,185,50,0)');
      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 220 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Sun disc
      const sunD = ctx.createRadialGradient(sunX - 6, sunY - 6, 0, sunX, sunY, 50 * pulse);
      sunD.addColorStop(0.0, '#FFFBE8');
      sunD.addColorStop(0.4, '#FFE878');
      sunD.addColorStop(1.0, '#F5C030');
      ctx.fillStyle = sunD;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 50 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Volumetric light rays
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 8; i++) {
        const angle  = (i / 8) * Math.PI * 2 + t * 0.03;
        const length = 400 + Math.sin(t * 0.55 + i) * 40;
        const shaft  = ctx.createLinearGradient(
          sunX, sunY,
          sunX + Math.cos(angle) * length,
          sunY + Math.sin(angle) * length
        );
        shaft.addColorStop(0, 'rgba(255,245,180,0.07)');
        shaft.addColorStop(0.6, 'rgba(255,220,100,0.025)');
        shaft.addColorStop(1, 'rgba(255,180,50,0)');
        ctx.fillStyle = shaft;
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        const sp = 0.055 + Math.sin(t * 0.4 + i) * 0.008;
        ctx.arc(sunX, sunY, length, angle - sp, angle + sp);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      /* ══════ LAYER 2 — CLOUDS ══════ */
      clouds.forEach(c => { c.update(); c.draw(ctx); });

      /* ══════ LAYER 3 — DISTANT MOUNTAINS ══════ */
      const mOX = mx * -18, mOY = my * -5;

      // Far range (blurred, desaturated)
      ctx.save();
      ctx.filter = 'blur(2px)';
      const mFar = ctx.createLinearGradient(0, H * 0.33 + mOY, 0, H * 0.56 + mOY);
      mFar.addColorStop(0, 'rgba(100,145,75,0.5)');
      mFar.addColorStop(1, 'rgba(65,100,45,0.3)');
      ctx.fillStyle = mFar;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.56 + mOY);
      [[0,0.43],[0.10,0.32],[0.22,0.40],[0.35,0.27],[0.50,0.37],[0.62,0.24],[0.75,0.35],[0.88,0.29],[1,0.37]].forEach(([px,py]) => ctx.lineTo(px*W+mOX, py*H+mOY));
      ctx.lineTo(W, H * 0.56 + mOY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Near range
      const mNear = ctx.createLinearGradient(0, H * 0.36 + mOY, 0, H * 0.58 + mOY);
      mNear.addColorStop(0, '#4A8228');
      mNear.addColorStop(1, '#285010');
      ctx.fillStyle = mNear;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.58 + mOY);
      [[0,0.46],[0.07,0.38],[0.17,0.45],[0.28,0.33],[0.42,0.43],[0.55,0.30],[0.68,0.42],[0.80,0.32],[0.92,0.44],[1,0.37]].forEach(([px,py]) => ctx.lineTo(px*W+mOX, py*H+mOY));
      ctx.lineTo(W, H * 0.58 + mOY);
      ctx.closePath();
      ctx.fill();

      /* ══════ LAYER 4 — TREELINE ══════ */
      const tOX = mx * -22, tOY = my * -4;
      const tBaseY = H * 0.57 + tOY;
      [
        [0.04,0.19,0.08],[0.10,0.23,0.10],[0.17,0.16,0.07],[0.24,0.21,0.09],
        [0.31,0.18,0.08],[0.40,0.25,0.11],[0.47,0.17,0.08],[0.53,0.22,0.10],
        [0.60,0.20,0.09],[0.67,0.24,0.11],[0.74,0.18,0.08],[0.82,0.22,0.10],
        [0.89,0.20,0.09],[0.95,0.23,0.10],
      ].forEach(([px, hF, wF]) => {
        const tx = px * W + tOX, th = hF * H, tw = wF * W;
        ctx.fillStyle = '#2A1D0E';
        ctx.fillRect(tx - tw * 0.05, tBaseY - th * 0.18, tw * 0.10, th * 0.20);
        [
          { yO: -0.52, rx: 0.36, ry: 0.40, c: '#1A3A08', a: 0.96 },
          { yO: -0.66, rx: 0.27, ry: 0.33, c: '#2B5A14', a: 0.90 },
          { yO: -0.77, rx: 0.19, ry: 0.25, c: '#407820', a: 0.85 },
          { yO: -0.85, rx: 0.12, ry: 0.16, c: '#5A9232', a: 0.75 },
        ].forEach(l => {
          ctx.globalAlpha = l.a;
          ctx.fillStyle = l.c;
          ctx.beginPath();
          ctx.ellipse(tx + tw * 0.05, tBaseY + l.yO * th, tw * l.rx, th * l.ry, 0, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      });

      /* ══════ MIST BAND ══════ */
      const mist = ctx.createLinearGradient(0, H * 0.50, 0, H * 0.62);
      mist.addColorStop(0, 'rgba(240,250,220,0)');
      mist.addColorStop(0.45, 'rgba(240,250,220,0.22)');
      mist.addColorStop(1, 'rgba(240,250,220,0)');
      ctx.fillStyle = mist;
      ctx.fillRect(0, H * 0.50, W, H * 0.14);

      /* ══════ LAYER 5 — 3D RICE MILL COMPLEX (HERO ELEMENT) ══════ */
      ctx.save();
      const millOX = mx * -30, millOY = my * -3;

      // Mill positioned center-left so it's fully visible with bottom card
      const bX = W * 0.08 + millOX;
      const bY = H * 0.44 + millOY;
      const bW = W * 0.36;
      const bH = H * 0.25;
      const DEPTH = bH * 0.18; // 3D extrusion depth

      // ── Water Tower (far left of complex) ──
      const wtX = bX - bW * 0.14, wtY = bY + bH * 0.05;
      const wtW = bW * 0.06, wtH = bH * 0.88;
      draw3DBox(ctx, wtX, wtY, wtW, wtH, DEPTH * 0.5,
        ['#B0A890', '#8A8270'],
        'rgba(240,235,220,0.85)',
        '#A09880',
        'rgba(0,0,0,0.18)'
      );
      // Tank bulge on top
      const tankGrad = ctx.createRadialGradient(wtX + wtW * 0.3, wtY - 6, 0, wtX + wtW * 0.5, wtY - 6, wtW * 0.7);
      tankGrad.addColorStop(0, '#E8DEC8');
      tankGrad.addColorStop(1, '#A09070');
      ctx.fillStyle = tankGrad;
      ctx.beginPath();
      ctx.ellipse(wtX + wtW * 0.5, wtY - 6, wtW * 0.7, wtH * 0.10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tank legs
      ctx.strokeStyle = '#7A6040';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wtX + wtW * 0.2, wtY - 6); ctx.lineTo(wtX + wtW * 0.2, wtY + wtH * 0.4);
      ctx.moveTo(wtX + wtW * 0.8, wtY - 6); ctx.lineTo(wtX + wtW * 0.8, wtY + wtH * 0.4);
      ctx.stroke();

      // ── MAIN PROCESSING BUILDING (3D) ──
      // Foundation slab
      ctx.fillStyle = 'rgba(160,130,80,0.35)';
      ctx.fillRect(bX - 6, bY + bH - 4, bW + 12, 10);

      // FRONT FACE with industrial wall texture
      const wallG = ctx.createLinearGradient(bX, bY, bX + bW, bY + bH);
      wallG.addColorStop(0.0, '#F0E8D0'); // sunlit (left, warm)
      wallG.addColorStop(0.3, '#E4D8BC');
      wallG.addColorStop(0.7, '#CEC0A0'); // slightly shadowed
      wallG.addColorStop(1.0, '#B8A888');
      ctx.fillStyle = wallG;
      ctx.fillRect(bX, bY, bW, bH);

      // Horizontal concrete panel lines
      ctx.strokeStyle = 'rgba(100,80,40,0.15)';
      ctx.lineWidth = 1;
      for (let row = 1; row <= 5; row++) {
        ctx.beginPath();
        ctx.moveTo(bX, bY + row * bH / 6);
        ctx.lineTo(bX + bW, bY + row * bH / 6);
        ctx.stroke();
      }

      // TOP FACE — roof (lit by sun, bright)
      ctx.fillStyle = '#E0D8C0';
      ctx.beginPath();
      ctx.moveTo(bX, bY);
      ctx.lineTo(bX + DEPTH, bY - DEPTH * 0.45);
      ctx.lineTo(bX + bW + DEPTH, bY - DEPTH * 0.45);
      ctx.lineTo(bX + bW, bY);
      ctx.closePath();
      ctx.fill();
      // Roof edge highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bX + DEPTH, bY - DEPTH * 0.45);
      ctx.lineTo(bX + bW + DEPTH, bY - DEPTH * 0.45);
      ctx.stroke();

      // RIGHT SIDE FACE (slight shadow from sun)
      ctx.fillStyle = '#B8A870';
      ctx.beginPath();
      ctx.moveTo(bX + bW, bY);
      ctx.lineTo(bX + bW + DEPTH, bY - DEPTH * 0.45);
      ctx.lineTo(bX + bW + DEPTH, bY + bH - DEPTH * 0.45);
      ctx.lineTo(bX + bW, bY + bH);
      ctx.closePath();
      ctx.fill();

      // Company name signage on facade
      ctx.save();
      const signY = bY + bH * 0.08;
      const signH = bH * 0.14;
      // Sign board
      const signG = ctx.createLinearGradient(bX + bW*0.08, signY, bX+bW*0.92, signY+signH);
      signG.addColorStop(0, '#1A3208');
      signG.addColorStop(1, '#0D1E04');
      ctx.fillStyle = signG;
      ctx.fillRect(bX + bW * 0.08, signY, bW * 0.84, signH);
      // Gold border
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bX + bW * 0.08, signY, bW * 0.84, signH);
      // Sign text
      ctx.fillStyle = '#D4AF37';
      ctx.textAlign = 'center';
      ctx.font = `bold ${Math.max(8, bH * 0.055)}px 'Playfair Display', serif`;
      ctx.fillText('AJMERI INDUSTRIES', bX + bW * 0.5, signY + signH * 0.55);
      ctx.font = `${Math.max(6, bH * 0.036)}px 'Inter', sans-serif`;
      ctx.fillStyle = 'rgba(212,175,55,0.7)';
      ctx.fillText('RICE MILL & PROCESSING', bX + bW * 0.5, signY + signH * 0.84);
      ctx.restore();

      // ── Windows 3×4 grid with warm glowing interiors ──
      const winRows = [0.30, 0.55, 0.78];
      const winCols = [0.10, 0.28, 0.50, 0.68];
      const winW = bW * 0.12, winH = bH * 0.14;
      winRows.forEach((wy, ri) => {
        winCols.forEach((wx, ci) => {
          const wX = bX + wx * bW, wY = bY + wy * bH;
          // Window recess
          ctx.fillStyle = '#0A0704';
          ctx.fillRect(wX, wY, winW, winH);
          // Interior warm glow (machinery lighting)
          const flicker = 0.22 + Math.sin(t * 3.5 + ri * 2.4 + ci * 1.7) * 0.07;
          const glow = ctx.createRadialGradient(wX + winW/2, wY + winH/2, 0, wX + winW/2, wY + winH/2, winW);
          glow.addColorStop(0, `rgba(255,195,80,${flicker + 0.12})`);
          glow.addColorStop(1, `rgba(255,140,30,0)`);
          ctx.fillStyle = glow;
          ctx.fillRect(wX, wY, winW, winH);
          // Window frame
          ctx.strokeStyle = '#7A5428';
          ctx.lineWidth = 1.8;
          ctx.strokeRect(wX, wY, winW, winH);
          // Pane cross
          ctx.strokeStyle = 'rgba(100,70,30,0.5)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(wX + winW/2, wY); ctx.lineTo(wX + winW/2, wY + winH);
          ctx.moveTo(wX, wY + winH/2); ctx.lineTo(wX + winW, wY + winH/2);
          ctx.stroke();
          // Reflection gleam
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.beginPath();
          ctx.moveTo(wX + 2, wY + 2);
          ctx.lineTo(wX + winW * 0.45, wY + 2);
          ctx.lineTo(wX + 2, wY + winH * 0.45);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      });

      // ── Main loading bay shutter door ──
      const gdW = bW * 0.20, gdH = bH * 0.38;
      const gdX = bX + bW * 0.36, gdY = bY + bH - gdH;
      const gdGrad = ctx.createLinearGradient(gdX, gdY, gdX + gdW, gdY);
      gdGrad.addColorStop(0, '#5A6060');
      gdGrad.addColorStop(0.5, '#98A0A0');
      gdGrad.addColorStop(1, '#485050');
      ctx.fillStyle = gdGrad;
      ctx.fillRect(gdX, gdY, gdW, gdH);
      // Shutter ridges
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      for (let r = 1; r < 7; r++) {
        ctx.beginPath();
        ctx.moveTo(gdX, gdY + r * gdH / 7);
        ctx.lineTo(gdX + gdW, gdY + r * gdH / 7);
        ctx.stroke();
      }
      ctx.strokeStyle = '#404848';
      ctx.lineWidth = 2;
      ctx.strokeRect(gdX, gdY, gdW, gdH);

      // ── Small side entrance door ──
      const sdW = bW * 0.065, sdH = bH * 0.26;
      const sdX = bX + bW * 0.15, sdY = bY + bH - sdH;
      ctx.fillStyle = '#3A2810';
      ctx.fillRect(sdX, sdY, sdW, sdH);
      // Door arch
      ctx.fillStyle = '#5A3E18';
      ctx.beginPath();
      ctx.arc(sdX + sdW/2, sdY, sdW/2, Math.PI, 0);
      ctx.fill();
      // Handle
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      ctx.arc(sdX + sdW * 0.72, sdY + sdH * 0.55, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // ── Rooftop details ──
      // HVAC units on roof
      for (let u = 0; u < 3; u++) {
        const ux = bX + DEPTH + bW * (0.1 + u * 0.25);
        const uy = bY - DEPTH * 0.45 - bH * 0.06;
        draw3DBox(ctx, ux, uy, bW * 0.09, bH * 0.06, DEPTH * 0.25,
          ['#88908A', '#707870'],
          '#B0B8B0',
          '#60686A',
          null
        );
        // Fan vent
        ctx.strokeStyle = '#50585A';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ux + bW * 0.045, uy + bH * 0.03, bH * 0.022, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Antenna / lightning rod
      ctx.strokeStyle = '#606858';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bX + DEPTH + bW * 0.5, bY - DEPTH * 0.45);
      ctx.lineTo(bX + DEPTH + bW * 0.5, bY - DEPTH * 0.45 - bH * 0.14);
      ctx.stroke();

      // ── Elevated conveyor truss to silos ──
      const trussSY = bY + bH * 0.22; // start y
      const trussEY = bY + bH * 0.10; // end y (slightly higher = going up)
      const trussSX = bX + bW * 0.88;
      const trussEX = bX + bW * 1.22; // reaches silo area

      ctx.strokeStyle = '#4A5848';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(trussSX, trussSY);
      ctx.lineTo(trussEX, trussEY);
      ctx.stroke();
      // Bottom rail
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(trussSX, trussSY + 7);
      ctx.lineTo(trussEX, trussEY + 7);
      ctx.stroke();
      // Vertical braces
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = '#5A6858';
      const trussLen = 5;
      for (let ti = 0; ti <= trussLen; ti++) {
        const frac = ti / trussLen;
        const bx2 = trussSX + (trussEX - trussSX) * frac;
        const by2 = trussSY + (trussEY - trussSY) * frac;
        ctx.beginPath();
        ctx.moveTo(bx2, by2);
        ctx.lineTo(bx2, by2 + 7);
        ctx.stroke();
      }
      // Moving conveyor belt indicator (animated dashes)
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = '#D4B040';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = -(t * 15) % 10; // animate movement
      ctx.beginPath();
      ctx.moveTo(trussSX, trussSY + 3.5);
      ctx.lineTo(trussEX, trussEY + 3.5);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // ── CHIMNEY ──
      const chW = bW * 0.055;
      const chH = bH * 1.02;
      const chX = bX + bW * 0.68;
      const chY = bY + bH - chH;
      // Chimney body
      const chGrad = ctx.createLinearGradient(chX, chY, chX + chW, chY);
      chGrad.addColorStop(0, '#8A6A3A');
      chGrad.addColorStop(0.5, '#C8A070');
      chGrad.addColorStop(1, '#5A4020');
      ctx.fillStyle = chGrad;
      ctx.fillRect(chX, chY, chW, chH);
      // Chimney top rim
      ctx.fillStyle = '#3A2810';
      ctx.fillRect(chX - 2, chY, chW + 4, chH * 0.04);
      // Brick rings
      ctx.strokeStyle = 'rgba(80,50,20,0.3)';
      ctx.lineWidth = 0.8;
      for (let cr = 1; cr <= 7; cr++) {
        ctx.beginPath();
        ctx.moveTo(chX, chY + cr * chH / 8);
        ctx.lineTo(chX + chW, chY + cr * chH / 8);
        ctx.stroke();
      }
      // Chimney 3D top face
      ctx.fillStyle = '#A07838';
      ctx.beginPath();
      ctx.moveTo(chX, chY);
      ctx.lineTo(chX + DEPTH * 0.4, chY - DEPTH * 0.18);
      ctx.lineTo(chX + chW + DEPTH * 0.4, chY - DEPTH * 0.18);
      ctx.lineTo(chX + chW, chY);
      ctx.closePath();
      ctx.fill();

      // Smoke from chimney
      smokes.forEach(s => {
        s.ox = chX + chW * 0.5;
        s.oy = chY - DEPTH * 0.18 - 2;
        s.update(wind);
        s.draw(ctx);
      });

      // ── SILO COMPLEX (right side of mill) ──
      const siloData = [
        { cx: bX + bW * 1.42, r: bW * 0.075, h: bH * 1.20 },
        { cx: bX + bW * 1.60, r: bW * 0.080, h: bH * 1.35 },
        { cx: bX + bW * 1.79, r: bW * 0.072, h: bH * 1.15 },
      ];
      siloData.forEach(s => {
        const siloTopY = bY + bH - s.h;
        if (siloTopY > 0 && s.cx < W * 1.1) {
          drawSilo(ctx, s.cx, siloTopY, s.r, s.h, t);
        }
      });

      // ── Connecting pipes between silos ──
      ctx.strokeStyle = '#8A9088';
      ctx.lineWidth = 3;
      for (let i = 0; i < siloData.length - 1; i++) {
        const a = siloData[i], b2 = siloData[i + 1];
        if (a.cx < W && b2.cx < W) {
          ctx.beginPath();
          ctx.moveTo(a.cx + a.r, bY + bH - a.h * 0.65);
          ctx.lineTo(b2.cx - b2.r, bY + bH - b2.h * 0.65);
          ctx.stroke();
        }
      }

      // ── Parked truck / loading area ──
      const trX = bX - bW * 0.28, trY = bY + bH * 0.62;
      const trW = bW * 0.24, trH = bH * 0.28;
      if (trX > -bW) {
        // Truck cabin
        const trCabGrad = ctx.createLinearGradient(trX, trY, trX + trW * 0.35, trY + trH);
        trCabGrad.addColorStop(0, '#4A5C3A');
        trCabGrad.addColorStop(1, '#2E3A22');
        ctx.fillStyle = trCabGrad;
        ctx.beginPath();
        ctx.roundRect(trX, trY, trW * 0.35, trH * 0.82, 4);
        ctx.fill();
        // Cabin windshield
        ctx.fillStyle = 'rgba(180,220,240,0.65)';
        ctx.fillRect(trX + trW * 0.04, trY + trH * 0.07, trW * 0.25, trH * 0.30);
        // Truck body (cargo)
        const trBodyGrad = ctx.createLinearGradient(trX + trW*0.35, trY, trX + trW, trY + trH);
        trBodyGrad.addColorStop(0, '#C8B880');
        trBodyGrad.addColorStop(1, '#A09060');
        ctx.fillStyle = trBodyGrad;
        ctx.fillRect(trX + trW * 0.35, trY - trH * 0.04, trW * 0.65, trH * 0.86);
        ctx.strokeStyle = '#808060';
        ctx.lineWidth = 1;
        ctx.strokeRect(trX + trW * 0.35, trY - trH * 0.04, trW * 0.65, trH * 0.86);
        // Wheels
        [trX + trW*0.10, trX + trW*0.42, trX + trW*0.65, trX + trW*0.84].forEach(wx => {
          ctx.fillStyle = '#1A1A1A';
          ctx.beginPath();
          ctx.arc(wx, trY + trH * 0.88, trH * 0.12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#404040';
          ctx.beginPath();
          ctx.arc(wx, trY + trH * 0.88, trH * 0.07, 0, Math.PI * 2);
          ctx.fill();
        });
        // Rice sacks being loaded
        [[bX*0.02+gdX+gdW*0.2, gdY+gdH*0.85, 0], [bX*0.02+gdX+gdW*0.5, gdY+gdH*0.85, 0.1]].forEach(([sx, sy, rot]) => {
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(rot);
          ctx.fillStyle = '#D4B870';
          ctx.beginPath();
          ctx.roundRect(-8, -5, 16, 10, 3);
          ctx.fill();
          ctx.strokeStyle = '#A08840';
          ctx.lineWidth = 0.7;
          ctx.strokeRect(-8, -5, 16, 10);
          ctx.restore();
        });
      }

      // Ground shadow for whole complex
      ctx.save();
      ctx.globalAlpha = 0.2;
      const shadowGrad = ctx.createLinearGradient(bX - bW*0.2, bY + bH, bX + bW*2.0, bY + bH);
      shadowGrad.addColorStop(0, 'transparent');
      shadowGrad.addColorStop(0.1, 'rgba(0,0,0,0.4)');
      shadowGrad.addColorStop(0.9, 'rgba(0,0,0,0.3)');
      shadowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(bX - bW*0.2, bY + bH, bW * 2.2, 16);
      ctx.restore();

      ctx.restore(); // end mill complex

      /* ══════ LAYER 6 — PADDY TERRACES ══════ */
      const terOX = mx * -10, terOY = my * 5;
      [
        { y: H * 0.66, h: H * 0.09, col1: '#8EC036', col2: '#5C8C1C' },
        { y: H * 0.75, h: H * 0.10, col1: '#7AB028', col2: '#4A7A14' },
        { y: H * 0.85, h: H * 0.14, col1: '#62A01A', col2: '#3A620C' },
      ].forEach((ter, ti) => {
        const tG = ctx.createLinearGradient(0, ter.y + terOY, 0, ter.y + ter.h + terOY);
        tG.addColorStop(0, ter.col1);
        tG.addColorStop(1, ter.col2);
        ctx.fillStyle = tG;
        ctx.beginPath();
        ctx.moveTo(0 + terOX, ter.y + terOY);
        ctx.bezierCurveTo(W*0.32+terOX, ter.y-8+terOY, W*0.68+terOX, ter.y+10+terOY, W+terOX, ter.y-6+terOY);
        ctx.lineTo(W + terOX, ter.y + ter.h + terOY);
        ctx.bezierCurveTo(W*0.68+terOX, ter.y+ter.h+8+terOY, W*0.32+terOX, ter.y+ter.h-8+terOY, 0+terOX, ter.y+ter.h+5+terOY);
        ctx.closePath();
        ctx.fill();

        // Flooded paddy water
        if (ti < 2) {
          ctx.save();
          ctx.globalAlpha = 0.3;
          const wG = ctx.createLinearGradient(0, ter.y + terOY, 0, ter.y + 18 + terOY);
          wG.addColorStop(0, '#B0D4E8');
          wG.addColorStop(1, '#80B0C8');
          ctx.fillStyle = wG;
          ctx.beginPath();
          ctx.moveTo(0+terOX, ter.y+terOY);
          ctx.bezierCurveTo(W*0.32+terOX, ter.y-8+terOY, W*0.68+terOX, ter.y+10+terOY, W+terOX, ter.y-6+terOY);
          ctx.lineTo(W+terOX, ter.y+18+terOY);
          ctx.lineTo(0+terOX, ter.y+18+terOY);
          ctx.closePath();
          ctx.fill();

          // Sun reflection shimmer on water
          ctx.globalAlpha = 0.6;
          const shimX = W * 0.72 + Math.sin(t * 0.4) * W * 0.06;
          const shimG = ctx.createRadialGradient(shimX, ter.y + 8 + terOY, 0, shimX, ter.y + 8 + terOY, W * 0.1);
          shimG.addColorStop(0, 'rgba(255,248,180,0.5)');
          shimG.addColorStop(1, 'rgba(255,248,180,0)');
          ctx.fillStyle = shimG;
          ctx.fillRect(0+terOX, ter.y+terOY, W, 18);

          ctx.restore();
          // Ripples on water
          ripples.forEach(r => {
            r.oy = ter.y + 8 + terOY;
            r.update();
            r.draw(ctx);
          });
        }

        // Terrace bund shadow
        ctx.fillStyle = 'rgba(30,20,5,0.28)';
        ctx.beginPath();
        ctx.moveTo(0+terOX, ter.y+ter.h+terOY);
        ctx.bezierCurveTo(W*0.32+terOX, ter.y+ter.h+8+terOY, W*0.68+terOX, ter.y+ter.h-8+terOY, W+terOX, ter.y+ter.h+5+terOY);
        ctx.lineTo(W+terOX, ter.y+ter.h+10+terOY);
        ctx.lineTo(0+terOX, ter.y+ter.h+10+terOY);
        ctx.closePath();
        ctx.fill();
      });

      /* ══════ LAYER 7 — SWAYING RICE STALKS ══════ */
      stalks.forEach(s => s.draw(ctx, t, wind));

      /* ══════ LAYER 8 — FOREGROUND PATH & GRASS ══════ */
      const fgOX = mx * 10, fgOY = my * 6;
      const fgG = ctx.createLinearGradient(0, H * 0.87 + fgOY, 0, H + fgOY);
      fgG.addColorStop(0, '#28520A');
      fgG.addColorStop(0.5, '#1E3E07');
      fgG.addColorStop(1, '#102204');
      ctx.fillStyle = fgG;
      ctx.fillRect(0+fgOX, H * 0.87 + fgOY, W, H * 0.15);

      // Dirt/gravel road
      const roadGrad = ctx.createLinearGradient(W*0.35, H*0.87+fgOY, W*0.65, H*0.87+fgOY);
      roadGrad.addColorStop(0, 'transparent');
      roadGrad.addColorStop(0.5, 'rgba(180,148,90,0.55)');
      roadGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(W*0.35+fgOX, H*0.87+fgOY, W*0.3, H*0.15);

      // Foreground grass blades
      for (let i = 0; i < 75; i++) {
        const gx = (i / 75) * W + Math.sin(i * 2.8) * 14 + fgOX;
        const gy = H * 0.87 + Math.sin(i * 1.8) * 7 + fgOY;
        const gh = 28 + Math.sin(i * 2.2) * 12;
        const gsw = Math.sin(t * 1.2 + i * 0.42) * (6 + wind * 2.5);
        const gCol = `hsl(${96 + Math.sin(i) * 16|0}, ${48 + Math.sin(i*2)*10|0}%, ${16 + Math.sin(i*3)*5|0}%)`;
        ctx.strokeStyle = gCol;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.bezierCurveTo(gx + gsw*0.32, gy - gh*0.4, gx + gsw*0.68, gy - gh*0.76, gx + gsw, gy - gh);
        ctx.stroke();
      }

      /* ══════ LAYER 9 — ATMOSPHERIC OVERLAYS ══════ */
      // Warm sunlight golden tint (light mode)
      const sunHaze = ctx.createRadialGradient(W * 0.78, H * 0.11, 0, W * 0.78, H * 0.11, W * 0.7);
      sunHaze.addColorStop(0, 'rgba(255,235,100,0.06)');
      sunHaze.addColorStop(0.5, 'rgba(255,210,60,0.025)');
      sunHaze.addColorStop(1, 'rgba(255,180,30,0)');
      ctx.fillStyle = sunHaze;
      ctx.fillRect(0, 0, W, H);

      // Soft vignette (cinematic, per parallax storytelling spec)
      const vig = ctx.createRadialGradient(W*0.5, H*0.5, H*0.38, W*0.5, H*0.5, H*0.88);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.28)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      /* ══════ LAYER 10 — GOLDEN RICE HUSK PARTICLES ══════ */
      husks.forEach(h => { h.update(wind); h.draw(ctx); });
    };

    render();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []); // eslint-disable-line

  return <canvas ref={canvasRef} className="lr-scene-canvas" />;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function LauncherScreen() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('splash');
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('exit'),    2800);
    const t2 = setTimeout(() => setPhase('launcher'), 3350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleMouse = useCallback((e) => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    mouseXRef.current = (e.clientX - cx) / cx;
    mouseYRef.current = (e.clientY - cy) / cy;
  }, []);

  useEffect(() => {
    if (phase !== 'launcher') return;
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [phase, handleMouse]);

  return (
    <div className="lr-root">

      {/* ══ SPLASH SCREEN ══════════════════════════════════════════ */}
      {(phase === 'splash' || phase === 'exit') && (
        <div className={`lr-splash${phase === 'exit' ? ' lr-splash--exit' : ''}`}>
          <div className="sp-bg" />

          <div className="sp-orbit">
            <svg className="sp-orbit-svg" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="64" fill="none" stroke="rgba(160,100,8,0.25)" strokeWidth="1.5" strokeDasharray="6 4"/>
              <circle cx="70" cy="70" r="46" fill="none" stroke="rgba(160,100,8,0.14)" strokeWidth="1"/>
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <circle key={i}
                  cx={70 + 64 * Math.cos(deg * Math.PI / 180)}
                  cy={70 + 64 * Math.sin(deg * Math.PI / 180)}
                  r="3.5" fill={`rgba(212,175,55,${0.3 + i * 0.08})`}/>
              ))}
            </svg>
          </div>

          <div className="sp-logo">
            <span>AI</span>
          </div>

          <h1 className="sp-company">Ajmeri Industries</h1>

          <div className="sp-grains">
            <span className="sp-g"/><span className="sp-g"/><span className="sp-g"/>
            <span className="sp-g"/><span className="sp-g"/>
          </div>

          <p className="sp-label">Rice Mill Manager</p>
          <p className="sp-sub">Complete Milling Operations Platform</p>

          <div className="sp-progress">
            <div className="sp-bar"><div className="sp-bar-fill"/></div>
            <p className="sp-bar-label">Loading mill systems…</p>
          </div>
        </div>
      )}

      {/* ══ LAUNCHER SCREEN ════════════════════════════════════════ */}
      {phase === 'launcher' && (
        <div className="lr-launcher">
          {/* Full 3D animated rice mill scene */}
          <SceneCanvas mouseX={mouseXRef} mouseY={mouseYRef} />

          {/* Cinematic 3D header title */}
          <header className="lc-cinematic-header">
            <p className="lc-header-eyebrow">Enterprise Operations Suite</p>
            <h1 className="lc-header-title">Ajmeri Industries</h1>
            <p className="lc-header-subtitle">Rice Mill Management Portal</p>
            <div className="lc-header-deco">
              <span className="lc-header-deco-line" />
              <span className="lc-header-deco-grain" />
              <span className="lc-header-deco-grain" />
              <span className="lc-header-deco-grain" />
              <span className="lc-header-deco-line" />
            </div>
          </header>

          {/* Minimal floating bottom CTA */}
          <div className="lc-wrap">
            <div className="lc-badge">
              <span className="lc-badge-dot"/>
              <span>SYSTEM ACTIVE</span>
            </div>

            <div className="lc-card">
              <div className="lc-mini-logo">
                <span>AI</span>
              </div>

              <div className="lc-card-label">
                <span className="lc-card-name">Ajmeri Industries</span>
                <span className="lc-card-tag">Rice Mill Manager</span>
              </div>

              <button
                className="lc-cta"
                onClick={() => navigate('/dashboard')}
              >
                <span>Enter the Mill</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.8"
                  strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>

            <p className="lc-foot">Authorized Personnel Only · v2.5 Pro</p>
          </div>
        </div>
      )}
    </div>
  );
}
