(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const root = document.documentElement;
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const $ = (id) => document.getElementById(id);

  $('year').textContent = new Date().getFullYear();

  /* ---------- Boot sequence ---------- */
  const boot = $('boot');
  const alreadyBooted = root.classList.contains('booted');
  const startTyping = () => typeLoop();
  if (alreadyBooted || reduceMotion) {
    boot.classList.add('done');
    startTyping();
  } else {
    const msgs = ['mounting kernel modules', 'loading llm weights', 'tuning cello strings', 'warming up the whistle', 'ready'];
    let pct = 0;
    const step = () => {
      pct = Math.min(100, pct + Math.random() * 9 + 3);
      const idx = Math.min(msgs.length - 1, Math.floor(pct / 20));
      $('bootPct').textContent = Math.floor(pct) + '%';
      $('bootBar').style.width = pct + '%';
      $('bootStep').textContent = String(idx + 1).padStart(2, '0');
      $('bootMsg').textContent = msgs[idx];
      if (pct < 100) setTimeout(step, 55);
      else setTimeout(() => {
        boot.classList.add('done');
        try { sessionStorage.setItem('booted', '1'); } catch (e) {}
        startTyping();
      }, 350);
    };
    step();
  }

  /* ---------- Theme ---------- */
  $('themeToggle').addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Nav, breadcrumb, mobile terminal menu ---------- */
  const nav = $('nav');
  const termMenu = $('termMenu');
  const burger = $('burger');
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('hidden', y > lastY && y > 400);
    lastY = y;
  }, { passive: true });

  const setMenu = (open) => {
    termMenu.classList.toggle('open', open);
    termMenu.setAttribute('aria-hidden', !open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(true));
  $('closeMenu').addEventListener('click', () => setMenu(false));
  termMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  const navLinks = [...document.querySelectorAll('#menu a[href^="#"]')];
  const crumb = $('crumbPath');
  const names = { top: '~', about: '~/about-me', research: '~/research', experience: '~/experience', projects: '~/projects', music: '~/music', contact: '~/contact-me' };
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      crumb.textContent = names[id] || '~';
      navLinks.forEach((a) => a.classList.toggle('current', a.getAttribute('href') === '#' + id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('section[id]').forEach((s) => sectionObs.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => revealObs.observe(el));

  /* ---------- Typing role ---------- */
  function typeLoop() {
    const typed = $('typed');
    const phrases = ['PhD Researcher · Human–AI Interaction', 'Building LLM agents that collaborate', 'Cellist first · also guitar, flute & whistle', 'Classical, Celtic, Spanish, South American & Bossa Nova'];
    if (reduceMotion) { typed.textContent = phrases[0]; return; }
    let p = 0, c = 0, deleting = false;
    const tick = () => {
      const word = phrases[p];
      c += deleting ? -1 : 1;
      typed.textContent = word.slice(0, c);
      let delay = deleting ? 28 : 60;
      if (!deleting && c === word.length) { deleting = true; delay = 1900; }
      else if (deleting && c === 0) { deleting = false; p = (p + 1) % phrases.length; delay = 300; }
      setTimeout(tick, delay);
    };
    tick();
  }

  /* ---------- Hero: fly-through on scroll + floating pill parallax ---------- */
  const hero = document.querySelector('.hero');
  const heroInner = $('heroInner');
  const pills = [...document.querySelectorAll('.floaters .float-pill')];
  let mouse = { x: 0, y: 0 };
  if (finePointer) {
    window.addEventListener('pointermove', (e) => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }
  const updateHero = () => {
    if (reduceMotion) return;
    const p = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * 0.75)));
    heroInner.style.transform = `translateY(${p * -60}px) scale(${1 + p * 0.35})`;
    heroInner.style.opacity = String(Math.max(0, 1 - p * 1.4));
    pills.forEach((el, i) => {
      const dx = parseFloat(el.dataset.dx), dy = parseFloat(el.dataset.dy);
      const depth = 14 + (i % 3) * 10;
      const fx = dx * p * 420 + mouse.x * depth * dx * -1;
      const fy = dy * p * 260 + mouse.y * depth;
      el.style.transform = `translate(${fx}px, ${fy}px) scale(${1 + p * 0.5})`;
      el.style.opacity = String(Math.max(0, 1 - p * 1.3));
    });
  };

  /* ---------- Card tilt ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.tilt').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg) translateY(-4px)`;
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

  const nowPlaying = $('nowPlaying');
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
    nowPlaying.textContent = btn.dataset.label;
    playTimer = setTimeout(() => { btn.classList.remove('playing'); nowPlaying.textContent = '—'; }, (total + 0.8) * 1000);
  }));

  const soundBtn = $('soundToggle');
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.setAttribute('aria-pressed', soundOn);
    if (soundOn && ensureAudio()) pluck(48, ctx.currentTime + 0.02, 1.5, 0.4);
  });

  /* ---------- Hero: a playable cello ---------- */
  // Four strings tuned C2 G2 D3 A3. The cursor acts as the finger: where it crosses
  // a string sets the stopped length (and pitch), like a real fretless fingerboard.
  const canvas = $('strings');
  const g2d = canvas.getContext('2d');
  const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const noteName = (m) => NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  const MAX_SEMIS = 36;                        // three octaves: the board runs almost to the bridge
  const BOARD_END = 1 - Math.pow(2, -MAX_SEMIS / 12); // fraction of string length (0.875)
  const strings = [
    { open: 57, name: 'A', width: 1.3 },
    { open: 50, name: 'D', width: 1.8 },
    { open: 43, name: 'G', width: 2.4 },
    { open: 36, name: 'C', width: 3.1 },
  ].map((s, i) => ({ ...s, i, y: 0, amp: 0, t: 0, phase: 0, omega: 0.3, stopX: 0, cool: 0, bowing: false }));
  let W = 0, H = 0, dpr = 1, nutX = 0, bridgeX = 0, gap = 0;
  const labels = [];

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    g2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    nutX = Math.max(30, W * 0.03); bridgeX = W - Math.max(14, W * 0.015);
    const top = H * 0.2, bottom = H * 0.84;
    gap = (bottom - top) / (strings.length - 1);
    strings.forEach((s, i) => { s.y = top + gap * i; s.stopX = nutX; });
  };
  resize();
  window.addEventListener('resize', resize);

  const xAt = (semis) => nutX + (bridgeX - nutX) * (1 - Math.pow(2, -semis / 12));
  // Continuous semitones above the open string for a finger at x (0 past the fingerboard = open string).
  const semisAt = (x) => {
    const f = (x - nutX) / (bridgeX - nutX);
    if (f <= 0) return 0;
    return Math.min(MAX_SEMIS, -12 * Math.log2(1 - Math.min(f, BOARD_END)));
  };
  const visOmega = (hz) => Math.min(1.6, 0.16 * Math.sqrt(hz / 20));

  const addLabel = (x, y, text) => {
    labels.push({ x, y, text, t: 0 });
    if (labels.length > 12) labels.shift();
  };

  // Pizzicato: Karplus–Strong with a darker, longer cello decay
  const pizz = (hz, vol = 0.5) => {
    const sr = ctx.sampleRate, len = Math.floor(sr * 2.2), period = Math.max(2, Math.round(sr / hz));
    const buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    for (let i = 0; i < period; i++) d[i] = Math.random() * 2 - 1;
    for (let i = period; i < len; i++) d[i] = 0.9975 * 0.5 * (d[i - period] + d[i - period + 1]);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800 + hz * 2;
    const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 220; body.gain.value = 6; body.Q.value = 1;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(lp); lp.connect(body); body.connect(g); g.connect(master);
    src.start();
  };

  const pluckString = (s, x, strength) => {
    const semis = Math.round(semisAt(x));
    const midi = s.open + semis;
    s.stopX = semis === 0 ? nutX : xAt(semis);
    s.amp = Math.min(22, 5 + strength) * (Math.random() < 0.5 ? -1 : 1);
    s.t = 0; s.cool = 5;
    s.omega = visOmega(freq(midi));
    addLabel(semis === 0 ? (nutX + bridgeX) / 2 : s.stopX, s.y, semis === 0 ? noteName(midi) + ' · open' : noteName(midi));
    if (soundOn && ensureAudio()) pizz(freq(midi));
  };

  // Bowing: a sustained voice whose pitch glides with the finger
  let bow = null;
  const startBow = (s, x) => {
    if (!ensureAudio()) return;
    const hz = freq(s.open + semisAt(x));
    const now = ctx.currentTime;
    const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = hz;
    const osc2 = ctx.createOscillator(); osc2.type = 'sawtooth'; osc2.frequency.value = hz; osc2.detune.value = 6;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.3;
    const lfoG = ctx.createGain(); lfoG.gain.setValueAtTime(0, now); lfoG.gain.linearRampToValueAtTime(hz * 0.006, now + 0.5);
    lfo.connect(lfoG); lfoG.connect(osc.frequency); lfoG.connect(osc2.frequency);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300; lp.Q.value = 0.8;
    const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 250; body.gain.value = 5;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.2, now + 0.12);
    osc.connect(lp); osc2.connect(lp); lp.connect(body); body.connect(g); g.connect(master);
    osc.start(now); osc2.start(now); lfo.start(now);
    bow = { s, osc, osc2, lfo, lfoG, g, lastNote: null };
    s.bowing = true;
    moveBow(x);
  };
  const moveBow = (x) => {
    if (!bow) return;
    const s = bow.s, semis = semisAt(x), hz = freq(s.open + semis), now = ctx.currentTime;
    bow.osc.frequency.setTargetAtTime(hz, now, 0.025);
    bow.osc2.frequency.setTargetAtTime(hz, now, 0.025);
    bow.lfoG.gain.setTargetAtTime(hz * 0.006, now, 0.2);
    s.stopX = semis === 0 ? nutX : Math.min(x, xAt(MAX_SEMIS));
    s.omega = visOmega(hz);
    const nearest = s.open + Math.round(semis);
    if (nearest !== bow.lastNote) {
      bow.lastNote = nearest;
      addLabel(semis === 0 ? (nutX + bridgeX) / 2 : s.stopX, s.y, noteName(nearest));
    }
  };
  const stopBow = () => {
    if (!bow) return;
    const now = ctx.currentTime, b = bow;
    b.g.gain.setTargetAtTime(0.0001, now, 0.09);
    [b.osc, b.osc2, b.lfo].forEach((o) => o.stop(now + 0.6));
    b.s.bowing = false; b.s.t = 0; b.s.amp = 3;
    bow = null;
  };

  const localPos = (e) => { const r = hero.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const stringNear = (x, y) => {
    if (x < nutX || x > bridgeX) return null;
    let best = null, bd = Math.min(18, gap / 2);
    strings.forEach((s) => { const d = Math.abs(y - s.y); if (d < bd) { bd = d; best = s; } });
    return best;
  };

  let prev = null;
  hero.addEventListener('pointermove', (e) => {
    const { x, y } = localPos(e);
    if (bow) { moveBow(x); prev = { x, y }; return; }
    if (e.pointerType === 'mouse') hero.style.cursor = stringNear(x, y) ? 'pointer' : '';
    if (prev && x >= nutX && x <= bridgeX) {
      const speed = Math.hypot(x - prev.x, y - prev.y);
      strings.forEach((s) => {
        if ((prev.y - s.y) * (y - s.y) <= 0 && prev.y !== y && s.cool <= 0 && !s.bowing) pluckString(s, x, speed * 0.5);
      });
    }
    prev = { x, y };
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { prev = null; if (!bow) hero.style.cursor = ''; });
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    const { x, y } = localPos(e);
    const s = stringNear(x, y);
    if (!s) return;
    if (!soundOn) { soundOn = true; soundBtn.setAttribute('aria-pressed', 'true'); }
    if (e.pointerType === 'touch') { ensureAudio(); pluckString(s, x, 10); return; }
    e.preventDefault();
    hero.setPointerCapture(e.pointerId);
    hero.style.cursor = 'grabbing';
    startBow(s, x);
  });
  const endBow = () => { stopBow(); hero.style.cursor = ''; };
  hero.addEventListener('pointerup', endBow);
  hero.addEventListener('pointercancel', endBow);
  window.addEventListener('blur', endBow);
  hero.addEventListener('touchmove', (e) => {
    const r = hero.getBoundingClientRect(), tt = e.touches[0];
    const x = tt.clientX - r.left, y = tt.clientY - r.top;
    if (prev && x >= nutX && x <= bridgeX) {
      strings.forEach((s) => { if ((prev.y - s.y) * (y - s.y) <= 0 && prev.y !== y && s.cool <= 0) pluckString(s, x, 8); });
    }
    prev = { x, y };
  }, { passive: true });
  hero.addEventListener('touchend', () => { prev = null; });

  let heroVisible = true;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);

  let idle = 0;
  const frame = () => {
    requestAnimationFrame(frame);
    if (!heroVisible) return;
    updateHero();
    idle += 0.016;
    g2d.clearRect(0, 0, W, H);
    const dark = root.dataset.theme === 'dark';
    const sky = css('--sky'), skyLight = css('--sky-light');
    const steel = dark ? 'rgba(186,214,235,.55)' : 'rgba(62,92,118,.5)';
    const shine = dark ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.9)';
    const top = strings[0].y - gap * 0.55, bot = strings[strings.length - 1].y + gap * 0.55;
    const boardEndX = xAt(MAX_SEMIS);

    // Fingerboard: fills the whole hero, nut to bridge
    const fb = g2d.createLinearGradient(nutX, 0, bridgeX, 0);
    fb.addColorStop(0, dark ? 'rgba(125,211,252,.08)' : 'rgba(3,105,161,.075)');
    fb.addColorStop(0.7, dark ? 'rgba(125,211,252,.045)' : 'rgba(3,105,161,.04)');
    fb.addColorStop(1, dark ? 'rgba(125,211,252,.02)' : 'rgba(3,105,161,.02)');
    g2d.fillStyle = fb;
    g2d.fillRect(nutX, 0, boardEndX - nutX, H);
    g2d.fillStyle = dark ? 'rgba(125,211,252,.12)' : 'rgba(3,105,161,.1)';
    g2d.fillRect(boardEndX - 1, 0, 2, H);

    // Position markers: faint semitone lines, dots at the 4th, 5th, octave…
    const activeSemis = new Set();
    strings.forEach((s) => { if (s.bowing || Math.abs(s.amp) * Math.exp(-s.t / 60) > 0.6) activeSemis.add(Math.round(semisAt(s.stopX + 0.5))); });
    for (let n = 1; n <= MAX_SEMIS; n++) {
      const x = xAt(n);
      g2d.strokeStyle = activeSemis.has(n) ? (dark ? 'rgba(56,189,248,.45)' : 'rgba(14,165,233,.4)') : (dark ? 'rgba(186,214,235,.07)' : 'rgba(3,105,161,.07)');
      g2d.lineWidth = activeSemis.has(n) ? 1.5 : 1;
      g2d.beginPath(); g2d.moveTo(x, 0); g2d.lineTo(x, H); g2d.stroke();
      if ([5, 7, 12, 17, 19, 24, 29, 31, 36].includes(n)) {
        g2d.fillStyle = dark ? 'rgba(125,211,252,.28)' : 'rgba(3,105,161,.22)';
        const ys = n % 12 === 0 ? [strings[0].y + gap * 0.5, strings[2].y + gap * 0.5] : [strings[1].y + gap * 0.5];
        ys.forEach((yy) => { g2d.beginPath(); g2d.arc(x, yy, 2.6, 0, Math.PI * 2); g2d.fill(); });
      }
    }

    // Nut and bridge
    g2d.fillStyle = dark ? 'rgba(230,242,251,.5)' : 'rgba(11,27,43,.35)';
    g2d.fillRect(nutX - 3, top + gap * 0.1, 5, bot - top - gap * 0.2);
    g2d.fillStyle = dark ? 'rgba(125,211,252,.35)' : 'rgba(3,105,161,.3)';
    g2d.beginPath();
    g2d.moveTo(bridgeX - 5, bot - 2); g2d.lineTo(bridgeX - 3, top + 2);
    g2d.quadraticCurveTo(bridgeX, top - 6, bridgeX + 3, top + 2); g2d.lineTo(bridgeX + 5, bot - 2); g2d.closePath(); g2d.fill();

    // Open-string names at the nut
    g2d.font = '500 11px "Geist Mono", monospace';
    g2d.textAlign = 'right'; g2d.textBaseline = 'middle';
    strings.forEach((s) => { g2d.fillStyle = s.bowing ? sky : (dark ? 'rgba(186,214,235,.6)' : 'rgba(62,92,118,.7)'); g2d.fillText(s.name, nutX - 12, s.y); });

    // Strings
    strings.forEach((s) => {
      s.t += 1; s.cool -= 1; s.phase += s.omega;
      const decay = s.bowing ? 1 : Math.exp(-s.t / 60);
      const amp = s.bowing ? 2.2 + Math.sin(idle * 9) * 0.6 : s.amp * decay;
      const active = s.bowing || Math.abs(amp) > 0.6;
      if (!active && s.t > 200) s.stopX = nutX;
      const breathe = reduceMotion ? 0 : Math.sin(idle * 0.8 + s.i) * 0.6;
      const x0 = s.stopX, span = bridgeX - x0;

      const wave = () => {
        g2d.beginPath();
        const steps = 90;
        for (let k = 0; k <= steps; k++) {
          const u = k / steps, x = x0 + span * u;
          const y = s.y + Math.sin(Math.PI * u) * (amp * Math.cos(s.phase) + breathe);
          k === 0 ? g2d.moveTo(x, y) : g2d.lineTo(x, y);
        }
      };
      const grad = g2d.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.05, steel);
      grad.addColorStop(0.95, steel);
      grad.addColorStop(1, 'transparent');
      // stopped part (scroll → finger) and tail (bridge → end) stay still, in steel
      g2d.strokeStyle = grad; g2d.lineWidth = s.width;
      g2d.beginPath(); g2d.moveTo(0, s.y); g2d.lineTo(x0, s.y); g2d.moveTo(bridgeX, s.y); g2d.lineTo(W, s.y); g2d.stroke();
      // vibrating length (finger → bridge)
      wave();
      g2d.strokeStyle = active ? sky : grad;
      g2d.lineWidth = s.width + (active ? 0.4 : 0);
      g2d.shadowColor = active ? sky : 'transparent';
      g2d.shadowBlur = active ? 6 * Math.min(1, Math.abs(amp) / 8 + 0.3) : 0;
      g2d.stroke();
      g2d.shadowBlur = 0;
      // metallic highlight / winding on the thicker strings
      g2d.beginPath(); g2d.moveTo(0, s.y); g2d.lineTo(x0, s.y); wave();
      g2d.strokeStyle = shine; g2d.lineWidth = Math.max(0.5, s.width * 0.3);
      if (s.width > 2) g2d.setLineDash([1.2, 1.6]);
      g2d.stroke(); g2d.setLineDash([]);
      g2d.beginPath(); g2d.moveTo(0, s.y); g2d.lineTo(x0, s.y); g2d.moveTo(bridgeX, s.y); g2d.lineTo(W, s.y);
      g2d.strokeStyle = shine; if (s.width > 2) g2d.setLineDash([1.2, 1.6]); g2d.stroke(); g2d.setLineDash([]);

      // fingertip
      if (active && x0 > nutX + 1) {
        g2d.fillStyle = sky;
        g2d.globalAlpha = s.bowing ? 0.9 : Math.min(0.9, decay + 0.1);
        g2d.beginPath(); g2d.arc(x0, s.y, 5.5, 0, Math.PI * 2); g2d.fill();
        g2d.globalAlpha = 0.25;
        g2d.beginPath(); g2d.arc(x0, s.y, 11, 0, Math.PI * 2); g2d.fill();
        g2d.globalAlpha = 1;
      }
    });

    // Floating note names
    g2d.textAlign = 'center'; g2d.textBaseline = 'alphabetic';
    g2d.font = '600 13px "Geist Mono", monospace';
    for (let i = labels.length - 1; i >= 0; i--) {
      const l = labels[i]; l.t += 1;
      const a = 1 - l.t / 70;
      if (a <= 0) { labels.splice(i, 1); continue; }
      g2d.globalAlpha = a;
      g2d.fillStyle = skyLight && dark ? skyLight : css('--sky-deep');
      g2d.fillText(l.text, l.x, l.y - 14 - l.t * 0.4);
    }
    g2d.globalAlpha = 1;
  };
  frame();

  /* ---------- Music visualizer ---------- */
  const vis = $('visualizer');
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
  new IntersectionObserver(([e]) => { visVisible = e.isIntersecting; if (visVisible) resizeVis(); }).observe(vis);
  const freqData = new Uint8Array(128);
  let vt = 0;
  const drawVis = () => {
    requestAnimationFrame(drawVis);
    if (!visVisible) return;
    vt += 0.02;
    v2d.clearRect(0, 0, VW, VH);
    const bars = Math.max(24, Math.floor(VW / 12));
    if (analyser) analyser.getByteFrequencyData(freqData);
    const grad = v2d.createLinearGradient(0, VH, 0, 0);
    grad.addColorStop(0, css('--sky-deep')); grad.addColorStop(1, css('--sky-light'));
    v2d.fillStyle = grad;
    const bw = VW / bars;
    for (let i = 0; i < bars; i++) {
      const live = analyser ? freqData[Math.floor((i / bars) * 90)] / 255 : 0;
      const idleH = reduceMotion ? 0.06 : 0.05 + 0.04 * (1 + Math.sin(vt * 2 + i * 0.35));
      const h = Math.max(idleH, live) * (VH - 4);
      const x = i * bw + bw * 0.2, w = bw * 0.6;
      v2d.globalAlpha = 0.35 + 0.65 * Math.min(1, live * 1.5 + 0.2);
      v2d.beginPath();
      if (v2d.roundRect) v2d.roundRect(x, VH - h, w, h, 3); else v2d.rect(x, VH - h, w, h);
      v2d.fill();
    }
    v2d.globalAlpha = 1;
  };
  drawVis();
})();
