(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const root = document.documentElement;
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Theme ---------- */
  document.getElementById('themeToggle').addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Nav: hide on scroll down, mobile menu, current section ---------- */
  const nav = document.getElementById('nav');
  const menu = document.getElementById('menu');
  const burger = document.getElementById('burger');
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 20);
    nav.classList.toggle('hidden', y > lastY && y > 300 && !menu.classList.contains('open'));
    lastY = y;
  }, { passive: true });
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    burger.textContent = open ? '✕' : '☰';
  });
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    menu.classList.remove('open'); burger.textContent = '☰'; burger.setAttribute('aria-expanded', false);
  }));
  const navLinks = [...menu.querySelectorAll('a')];
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('current', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach((s) => sectionObs.observe(s));

  /* ---------- Spotlight ---------- */
  if (finePointer) {
    window.addEventListener('pointermove', (e) => {
      root.style.setProperty('--mx', e.clientX + 'px');
      root.style.setProperty('--my', e.clientY + 'px');
    }, { passive: true });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el, i) => {
    if (el.closest('.hero')) el.style.transitionDelay = (i * 0.1) + 's';
    revealObs.observe(el);
  });

  /* ---------- Typing effect ---------- */
  const typed = document.getElementById('typed');
  const phrases = ['LLM agents that collaborate.', 'polite, context-aware AI teammates.', 'human–AI studies.', 'full-stack systems.', 'Celtic tunes on a tin whistle.', 'Bach on the cello.'];
  if (reduceMotion) {
    typed.textContent = phrases[0];
  } else {
    let p = 0, c = 0, deleting = false;
    const tick = () => {
      const word = phrases[p];
      c += deleting ? -1 : 1;
      typed.textContent = word.slice(0, c);
      let delay = deleting ? 35 : 70;
      if (!deleting && c === word.length) { deleting = true; delay = 1800; }
      else if (deleting && c === 0) { deleting = false; p = (p + 1) % phrases.length; delay = 350; }
      setTimeout(tick, delay);
    };
    tick();
  }

  /* ---------- Card tilt ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.tilt').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) translateY(-4px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Tabs ---------- */
  const tabs = [...document.querySelectorAll('.tab')];
  const indicator = document.querySelector('.tab-indicator');
  const moveIndicator = (tab) => {
    const vertical = getComputedStyle(tab.parentElement).flexDirection === 'column';
    indicator.style.width = vertical ? '2px' : tab.offsetWidth + 'px';
    indicator.style.transform = vertical ? `translateY(${tab.offsetTop}px)` : `translateX(${tab.offsetLeft}px)`;
  };
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab); });
    document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === tab.dataset.tab));
    moveIndicator(tab);
  }));
  window.addEventListener('resize', () => moveIndicator(document.querySelector('.tab.active')));
  moveIndicator(tabs[0]);

  /* ---------- Audio engine ---------- */
  let ctx = null, master = null, analyser = null;
  let soundOn = false;
  const ensureAudio = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.5;
      const comp = ctx.createDynamicsCompressor();
      analyser = ctx.createAnalyser(); analyser.fftSize = 256;
      master.connect(comp); comp.connect(analyser); analyser.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  // Karplus–Strong plucked string
  const pluck = (midi, t, dur = 1.6, vol = 0.6) => {
    const f = freq(midi), sr = ctx.sampleRate;
    const len = Math.floor(sr * dur), period = Math.round(sr / f);
    const buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    for (let i = 0; i < period; i++) d[i] = Math.random() * 2 - 1;
    for (let i = period; i < len; i++) d[i] = 0.996 * 0.5 * (d[i - period] + d[i - period + 1]);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = vol;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3500;
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start(t);
  };

  // Sustained voice (bowed / blown) with vibrato
  const voice = (midi, t, dur, { type = 'sawtooth', cutoff = 1500, attack = 0.08, vib = 5, vibDepth = 3, vol = 0.25, breath = 0 } = {}) => {
    const osc = ctx.createOscillator(); osc.type = type; osc.frequency.value = freq(midi);
    const lfo = ctx.createOscillator(); lfo.frequency.value = vib;
    const lfoG = ctx.createGain(); lfoG.gain.setValueAtTime(0, t); lfoG.gain.linearRampToValueAtTime(vibDepth, t + Math.min(0.25, dur));
    lfo.connect(lfoG); lfoG.connect(osc.frequency);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cutoff; lp.Q.value = 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.setValueAtTime(vol, t + Math.max(attack, dur - 0.08));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    osc.connect(lp); lp.connect(g); g.connect(master);
    osc.start(t); lfo.start(t); osc.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1);
    if (breath > 0) {
      const n = ctx.createBufferSource(), nb = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
      const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
      n.buffer = nb;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq(midi) * 2; bp.Q.value = 2;
      const ng = ctx.createGain(); ng.gain.value = breath;
      n.connect(bp); bp.connect(ng); ng.connect(master); n.start(t);
    }
  };

  // Phrases: [midi, beats]
  const TUNES = {
    // Bach Cello Suite No. 1 Prelude, opening bar
    cello: { bpm: 150, notes: [[43,1],[50,1],[59,1],[57,1],[59,1],[50,1],[59,1],[50,1],[43,1],[50,1],[59,1],[57,1],[59,1],[50,1],[59,1],[50,3]],
      play: (m, t, d) => voice(m, t, d * 0.98, { type: 'sawtooth', cutoff: 1100, attack: 0.06, vib: 5.2, vibDepth: 2.5, vol: 0.28 }) },
    // Andalusian / Phrygian flavor
    guitar: { bpm: 200, notes: [[40,1],[47,1],[52,1],[55,1],[59,1],[64,1],[65,2],[64,1],[62,1],[60,1],[59,1],[57,1],[52,1],[53,2],[52,4]],
      play: (m, t) => pluck(m, t, 1.8, 0.55) },
    // Andean-style pentatonic air
    flute: { bpm: 110, notes: [[76,1],[79,1],[81,2],[79,1],[76,1],[74,2],[72,1],[74,1],[76,2],[69,3]],
      play: (m, t, d) => voice(m, t, d * 0.95, { type: 'sine', cutoff: 4000, attack: 0.07, vib: 5.5, vibDepth: 4, vol: 0.32, breath: 0.12 }) },
    // Celtic jig in D (6/8)
    whistle: { bpm: 330, notes: [[74,1],[78,1],[81,1],[81,2],[78,1],[81,1],[83,1],[81,1],[78,2],[76,1],[74,1],[76,1],[78,1],[76,1],[74,1],[71,1],[74,3]],
      play: (m, t, d) => voice(m, t, d * 0.9, { type: 'triangle', cutoff: 6000, attack: 0.02, vib: 6, vibDepth: 5, vol: 0.3, breath: 0.08 }) },
  };

  let playingBtn = null, playTimer = null;
  document.querySelectorAll('.inst').forEach((btn) => btn.addEventListener('click', () => {
    if (!ensureAudio()) return;
    const tune = TUNES[btn.dataset.inst];
    const beat = 60 / tune.bpm;
    let t = ctx.currentTime + 0.05, total = 0;
    tune.notes.forEach(([m, b]) => { tune.play(m, t, b * beat); t += b * beat; total += b * beat; });
    if (playingBtn) playingBtn.classList.remove('playing');
    clearTimeout(playTimer);
    btn.classList.add('playing'); playingBtn = btn;
    playTimer = setTimeout(() => btn.classList.remove('playing'), (total + 0.8) * 1000);
  }));

  const soundBtn = document.getElementById('soundToggle');
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.setAttribute('aria-pressed', soundOn);
    if (soundOn && ensureAudio()) pluck(64, ctx.currentTime + 0.02, 1.5, 0.4);
  });

  /* ---------- Hero: pluckable strings ---------- */
  const canvas = document.getElementById('strings');
  const g2d = canvas.getContext('2d');
  const hero = document.querySelector('.hero');
  const STRING_NOTES = [64, 59, 55, 50, 45, 40]; // guitar standard tuning, high → low
  let W = 0, H = 0, dpr = 1;
  const strings = STRING_NOTES.map((note, i) => ({ note, i, y: 0, amp: 0, x0: 0.5, t: 0, cool: 0 }));

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    g2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    const top = H * 0.16, span = H * 0.74;
    strings.forEach((s, i) => { s.y = top + span * (i / (strings.length - 1)); });
  };
  resize();
  window.addEventListener('resize', resize);

  let prev = null;
  const onMove = (x, y) => {
    if (prev) {
      const dy = y - prev.y, speed = Math.hypot(x - prev.x, dy);
      strings.forEach((s) => {
        if ((prev.y - s.y) * (y - s.y) <= 0 && prev.y !== y && s.cool <= 0) {
          s.amp = Math.min(28, 6 + speed * 0.6) * Math.sign(dy || 1);
          s.x0 = Math.min(0.95, Math.max(0.05, x / W));
          s.t = 0; s.cool = 6;
          if (soundOn && ctx) pluck(s.note, ctx.currentTime + 0.005, 2, 0.35);
        }
      });
    }
    prev = { x, y };
  };
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    onMove(e.clientX - r.left, e.clientY - r.top);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { prev = null; });
  hero.addEventListener('touchmove', (e) => {
    const r = hero.getBoundingClientRect(), tt = e.touches[0];
    onMove(tt.clientX - r.left, tt.clientY - r.top);
  }, { passive: true });
  hero.addEventListener('touchend', () => { prev = null; });

  let heroVisible = true;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);

  let idle = 0;
  const drawStrings = () => {
    requestAnimationFrame(drawStrings);
    if (!heroVisible) return;
    idle += 0.016;
    g2d.clearRect(0, 0, W, H);
    const accent = css('--accent'), accent2 = css('--accent-2'), line = css('--line');
    strings.forEach((s) => {
      s.t += 1; s.cool -= 1;
      const decay = Math.exp(-s.t / 55);
      const osc = Math.cos(s.t * (0.55 + s.i * 0.05));
      const a = s.amp * decay * osc;
      const active = Math.abs(s.amp * decay) > 0.6;
      const breathe = reduceMotion ? 0 : Math.sin(idle * 0.8 + s.i) * 1.2;

      g2d.beginPath();
      const steps = 80, x0 = s.x0 * W;
      for (let k = 0; k <= steps; k++) {
        const x = (k / steps) * W;
        const shape = x < x0 ? x / x0 : (W - x) / (W - x0);
        const y = s.y + a * shape + breathe * Math.sin((k / steps) * Math.PI);
        k === 0 ? g2d.moveTo(x, y) : g2d.lineTo(x, y);
      }
      const grad = g2d.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.2, active ? accent : line);
      grad.addColorStop(0.8, active ? accent2 : line);
      grad.addColorStop(1, 'transparent');
      g2d.strokeStyle = grad;
      g2d.lineWidth = 1 + (5 - s.i) * 0.15 + (active ? 0.8 : 0);
      g2d.shadowColor = active ? accent : 'transparent';
      g2d.shadowBlur = active ? 14 * decay : 0;
      g2d.stroke();
    });
    g2d.shadowBlur = 0;
  };
  drawStrings();

  /* ---------- Music visualizer ---------- */
  const vis = document.getElementById('visualizer');
  const v2d = vis.getContext('2d');
  let VW = 0, VH = 0;
  const resizeVis = () => {
    const r = vis.getBoundingClientRect();
    VW = r.width; VH = r.height;
    vis.width = VW * dpr; vis.height = VH * dpr;
    v2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resizeVis();
  window.addEventListener('resize', resizeVis);
  let visVisible = false;
  new IntersectionObserver(([e]) => { visVisible = e.isIntersecting; }).observe(vis);
  let freqData = new Uint8Array(128), vt = 0;
  const drawVis = () => {
    requestAnimationFrame(drawVis);
    if (!visVisible) return;
    vt += 0.02;
    v2d.clearRect(0, 0, VW, VH);
    const bars = Math.max(24, Math.floor(VW / 14));
    if (analyser) analyser.getByteFrequencyData(freqData);
    const grad = v2d.createLinearGradient(0, VH, 0, 0);
    grad.addColorStop(0, css('--accent')); grad.addColorStop(1, css('--accent-2'));
    v2d.fillStyle = grad;
    const bw = VW / bars;
    for (let i = 0; i < bars; i++) {
      const live = analyser ? freqData[Math.floor((i / bars) * 90)] / 255 : 0;
      const idleH = reduceMotion ? 0.06 : 0.05 + 0.04 * (1 + Math.sin(vt * 2 + i * 0.35));
      const h = Math.max(idleH, live) * (VH - 16);
      const x = i * bw + bw * 0.2, w = bw * 0.6;
      v2d.globalAlpha = 0.35 + 0.65 * Math.min(1, live * 1.5 + 0.2);
      v2d.beginPath();
      if (v2d.roundRect) v2d.roundRect(x, VH - 8 - h, w, h, 3); else v2d.rect(x, VH - 8 - h, w, h);
      v2d.fill();
    }
    v2d.globalAlpha = 1;
  };
  drawVis();
})();
