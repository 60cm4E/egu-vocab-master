/* ===================================
   Animations - Confetti & Effects
   =================================== */

const Animations = {
  confettiCanvas: null,
  confettiCtx: null,
  particles: [],
  animating: false,

  init() {
    this.confettiCanvas = document.getElementById('confetti-canvas');
    if (this.confettiCanvas) {
      this.confettiCtx = this.confettiCanvas.getContext('2d');
      this._resize();
      window.addEventListener('resize', () => this._resize());
    }
  },

  _resize() {
    if (!this.confettiCanvas) return;
    this.confettiCanvas.width = window.innerWidth;
    this.confettiCanvas.height = window.innerHeight;
  },

  // --- Confetti Effect ---
  confetti(duration = 3000) {
    if (!this.confettiCtx) return;
    
    const colors = ['#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E', '#00B894', '#74B9FF', '#FF6B6B', '#55EFC4'];
    const count = 80;
    
    this.particles = [];
    
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.confettiCanvas.width,
        y: -20 - Math.random() * 200,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    this.animating = true;
    const startTime = Date.now();
    
    const animate = () => {
      if (!this.animating) return;
      
      const elapsed = Date.now() - startTime;
      this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
      
      let alive = 0;
      
      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.rotation += p.rotationSpeed;
        
        if (elapsed > duration * 0.6) {
          p.opacity = Math.max(0, p.opacity - 0.02);
        }
        
        if (p.y < this.confettiCanvas.height + 50 && p.opacity > 0) {
          alive++;
          this.confettiCtx.save();
          this.confettiCtx.translate(p.x, p.y);
          this.confettiCtx.rotate((p.rotation * Math.PI) / 180);
          this.confettiCtx.globalAlpha = p.opacity;
          this.confettiCtx.fillStyle = p.color;
          this.confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          this.confettiCtx.restore();
        }
      }
      
      if (alive > 0 && elapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
        this.animating = false;
      }
    };
    
    requestAnimationFrame(animate);
  },

  // --- Star Burst Effect ---
  starBurst(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 8; i++) {
      const star = document.createElement('div');
      star.textContent = '⭐';
      star.style.cssText = `
        position: fixed;
        left: ${centerX}px;
        top: ${centerY}px;
        font-size: 20px;
        pointer-events: none;
        z-index: 500;
        transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      `;
      document.body.appendChild(star);
      
      const angle = (i / 8) * Math.PI * 2;
      const distance = 60 + Math.random() * 40;
      
      requestAnimationFrame(() => {
        star.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`;
        star.style.opacity = '0';
      });
      
      setTimeout(() => star.remove(), 700);
    }
  },

  // --- Pulse Effect ---
  pulse(element) {
    element.style.animation = 'none';
    element.offsetHeight; // trigger reflow
    element.style.animation = 'correctPop 0.4s ease';
  },

  // --- Number Counter Animation ---
  countUp(element, target, duration = 1000) {
    const start = 0;
    const startTime = Date.now();
    
    const update = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(start + (target - start) * eased);
      
      element.textContent = current;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    
    requestAnimationFrame(update);
  }
};
