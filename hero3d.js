import * as THREE from 'three';

const stage = document.getElementById('stage');
const canvas = document.getElementById('wave');
const tags = [...document.querySelectorAll('[data-tag]')];
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = window.matchMedia('(max-width: 899px)').matches;

const N = small ? 56 : 92;
const ROWS = small ? 2 : 3;
const SPAN = 11;               // world width of the wave
const MARKS = [               // [index, width in bars, kind]
  [Math.round(N * .26), 3, 'r'],
  [Math.round(N * .52), 3, 'r'],
  [Math.round(N * .77), 3, 'y']
];

// speech-like envelope: bursts and pauses
const env = i => {
  const x = i / N;
  const burst = Math.abs(Math.sin(x * 41 + 0.6)) * (0.55 + 0.45 * Math.abs(Math.sin(x * 9.3 + 1.1)));
  const gate = Math.sin(x * 6.1 + 0.3) > -0.55 ? 1 : 0.14;
  return 0.12 + burst * gate * 1.9;
};

function fallback() {
  document.documentElement.classList.add('no-gl');
  const svg = document.getElementById('waveFallback');
  if (!svg) return;
  let s = '';
  const w = 600 / N;
  for (let i = 0; i < N; i++) {
    const h = env(i) * 90;
    const m = MARKS.find(m => i >= m[0] && i < m[0] + m[1]);
    s += `<rect class="${m ? m[2] : ''}" x="${i * w + 1}" y="${190 - h / 2}" width="${w - 3}" height="${h}"/>`;
  }
  svg.innerHTML = s;
  const pos = [[.26, .3], [.5, .22], [.7, .62]];
  tags.forEach((t, i) => { t.style.left = pos[i][0] * 100 + '%'; t.style.top = pos[i][1] * 100 + '%'; setTimeout(() => t.classList.add('is-on'), 1400 + i * 300); });
}

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { fallback(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 80);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c6cb, 1.15));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-3, 7, 6);
  scene.add(sun);

  const group = new THREE.Group();
  scene.add(group);

  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ roughness: .78, metalness: 0 });
  const count = N * ROWS;
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  group.add(mesh);

  const bw = SPAN / N * 0.62;
  const cBase = [new THREE.Color('#AEBCC2'), new THREE.Color('#C3CFD3'), new THREE.Color('#D3DCDF')];
  const cRed = new THREE.Color('#D3321A'), cHl = new THREE.Color('#E6F25A'), cInk = new THREE.Color('#111A22');
  const kind = new Array(count).fill('');
  for (let r = 0; r < ROWS; r++) for (let i = 0; i < N; i++) {
    const id = r * N + i;
    const m = MARKS.find(m => i >= m[0] && i < m[0] + m[1]);
    if (r === 0 && m) { kind[id] = m[2]; mesh.setColorAt(id, m[2] === 'r' ? cRed : cHl); }
    else mesh.setColorAt(id, cBase[Math.min(r, 2)]);
  }
  mesh.instanceColor.needsUpdate = true;

  // playhead
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.4, ROWS * 0.9 + 0.4), new THREE.MeshBasicMaterial({ color: cHl, transparent: true, opacity: 0.75, depthWrite: false }));
  head.position.z = -(ROWS - 1) * 0.45; head.position.y = 1.7;
  group.add(head);

  const dummy = new THREE.Object3D();
  const mouse = { x: 0, y: 0, cx: 0, cy: 0 };
  let scroll = 0, t0 = performance.now(), visible = true, W = 1, H = 1;

  const layout = () => {
    W = stage.clientWidth; H = stage.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const dist = SPAN / (0.98 * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    camera.position.set(0, dist * 0.34, dist);
    camera.lookAt(0, 0.5, -0.6);
    camera.updateProjectionMatrix();
  };

  const wp = new THREE.Vector3();
  function frame(now) {
    const t = reduce ? 3.2 : (now - t0) / 1000;
    mouse.cx += (mouse.x - mouse.cx) * 0.06; mouse.cy += (mouse.y - mouse.cy) * 0.06;
    const headX = reduce ? 0.3 * SPAN : (((t * 0.7) % 1) - .5) * SPAN;
    for (let r = 0; r < ROWS; r++) for (let i = 0; i < N; i++) {
      const id = r * N + i;
      const x = (i / (N - 1) - .5) * SPAN;
      let h = 1.7 * env(i + r * 3) * (1 - r * .3) * (0.9 + 0.1 * Math.sin(t * 1.6 + i * .35 + r));
      if (kind[id]) h *= 1.25;
      const d = Math.abs(x - headX);
      h *= 1 + Math.max(0, 1 - d / 0.9) * 0.55;
      dummy.position.set(x, h / 2, -r * 0.9);
      dummy.scale.set(bw, Math.max(h, 0.06), 0.7);
      dummy.updateMatrix();
      mesh.setMatrixAt(id, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    head.position.x = headX;
    group.rotation.y = -0.2 + mouse.cx * 0.12 + scroll * 0.25;
    group.rotation.x = 0.05 + mouse.cy * 0.05;
    renderer.render(scene, camera);

    // pin tags to marked bars
    tags.forEach((el, i) => {
      const m = MARKS[i];
      const x = ((m[0] + 1) / (N - 1) - .5) * SPAN;
      wp.set(x, 1.7 * env(m[0] + 1) * 1.25 + 0.55, 0);
      group.localToWorld(wp);
      wp.project(camera);
      const px = (wp.x * .5 + .5) * W, py = (-wp.y * .5 + .5) * H;
      const tw = el.offsetWidth;
      const tx = Math.max(8, Math.min(px - tw / 2, W - tw - 8));
      el.style.transform = `translate(${tx}px, ${Math.max(8, py - 44 - (small ? i * 30 : 0))}px)`;
    });
  }

  let raf = 0;
  const loop = now => { raf = 0; if (visible && !document.hidden) { frame(now); raf = requestAnimationFrame(loop); } };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  layout(); frame(performance.now());
  tags.forEach((t, i) => setTimeout(() => t.classList.add('is-on'), 1500 + i * 350));
  window.addEventListener('resize', () => { layout(); frame(performance.now()); });
  if (!reduce) {
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width - .5) * 2; mouse.y = ((e.clientY - r.top) / r.height - .5) * 2;
    });
    window.addEventListener('scroll', () => { scroll = Math.min(1, window.scrollY / window.innerHeight); }, { passive: true });
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(stage);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
    kick();
  }
}

try { init(); } catch (e) { console.error(e); fallback(); }
