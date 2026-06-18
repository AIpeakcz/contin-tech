/* ============================================================
   CONTIN TECH — 3D síť (Three.js)
   Uzly + spoje + proudící datové pulzy. Reaguje na myš.
   ============================================================ */

(function () {
  const canvas = document.getElementById('net-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // Respektuj reduced-motion: postav statickou scénu bez animace
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 90;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // --- Generování uzlů ---
  const NODE_COUNT = 90;
  const SPREAD = 120;
  const nodes = [];
  const nodePositions = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    const x = (Math.random() - 0.5) * SPREAD;
    const y = (Math.random() - 0.5) * SPREAD * 0.6;
    const z = (Math.random() - 0.5) * SPREAD * 0.6;
    nodes.push({ base: new THREE.Vector3(x, y, z), phase: Math.random() * Math.PI * 2 });
    nodePositions.push(x, y, z);
  }

  // Body (uzly) jako stříbrné tečky
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodePositions, 3));
  const nodeMat = new THREE.PointsMaterial({
    color: 0xc7ccd6,
    size: 1.4,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true
  });
  const points = new THREE.Points(nodeGeo, nodeMat);
  scene.add(points);

  // --- Spoje mezi blízkými uzly ---
  const MAX_DIST = 34;
  const linePairs = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      if (nodes[i].base.distanceTo(nodes[j].base) < MAX_DIST) {
        linePairs.push([i, j]);
      }
    }
  }

  const lineVerts = new Float32Array(linePairs.length * 6);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(lineVerts, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x6b7280,
    transparent: true,
    opacity: 0.18
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lines);

  // --- Datové pulzy proudící po spojích ---
  const PULSE_COUNT = Math.min(24, linePairs.length);
  const pulses = [];
  const pulseGeo = new THREE.BufferGeometry();
  const pulsePos = new Float32Array(PULSE_COUNT * 3);
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
  const pulseMat = new THREE.PointsMaterial({
    color: 0xe8edf5,
    size: 2.6,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true
  });
  const pulsePoints = new THREE.Points(pulseGeo, pulseMat);
  scene.add(pulsePoints);

  for (let i = 0; i < PULSE_COUNT; i++) {
    pulses.push({
      pair: linePairs[Math.floor(Math.random() * linePairs.length)],
      t: Math.random(),
      speed: 0.002 + Math.random() * 0.004
    });
  }

  // --- Interakce myší ---
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // --- Update spojů ---
  function updateLines() {
    const posAttr = nodeGeo.attributes.position.array;
    let k = 0;
    for (const [i, j] of linePairs) {
      lineVerts[k++] = posAttr[i * 3];
      lineVerts[k++] = posAttr[i * 3 + 1];
      lineVerts[k++] = posAttr[i * 3 + 2];
      lineVerts[k++] = posAttr[j * 3];
      lineVerts[k++] = posAttr[j * 3 + 1];
      lineVerts[k++] = posAttr[j * 3 + 2];
    }
    lineGeo.attributes.position.needsUpdate = true;
  }

  // --- Animační smyčka ---
  let frame = 0;
  function animate() {
    frame += 0.01;

    // jemné dýchání uzlů
    const posAttr = nodeGeo.attributes.position.array;
    for (let i = 0; i < NODE_COUNT; i++) {
      const n = nodes[i];
      posAttr[i * 3]     = n.base.x + Math.sin(frame + n.phase) * 1.6;
      posAttr[i * 3 + 1] = n.base.y + Math.cos(frame + n.phase * 1.3) * 1.6;
      posAttr[i * 3 + 2] = n.base.z + Math.sin(frame * 0.7 + n.phase) * 1.6;
    }
    nodeGeo.attributes.position.needsUpdate = true;
    updateLines();

    // pulzy po spojích
    const pp = pulseGeo.attributes.position.array;
    for (let i = 0; i < PULSE_COUNT; i++) {
      const p = pulses[i];
      p.t += p.speed;
      if (p.t > 1) { p.t = 0; p.pair = linePairs[Math.floor(Math.random() * linePairs.length)]; }
      const [a, b] = p.pair;
      pp[i * 3]     = posAttr[a*3]   + (posAttr[b*3]   - posAttr[a*3])   * p.t;
      pp[i * 3 + 1] = posAttr[a*3+1] + (posAttr[b*3+1] - posAttr[a*3+1]) * p.t;
      pp[i * 3 + 2] = posAttr[a*3+2] + (posAttr[b*3+2] - posAttr[a*3+2]) * p.t;
    }
    pulseGeo.attributes.position.needsUpdate = true;

    // pomalá rotace + parallax na myš
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    scene.rotation.y = frame * 0.04 + mouse.x * 0.3;
    scene.rotation.x = mouse.y * 0.2;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // statická scéna pro reduced-motion
  function renderStatic() {
    updateLines();
    scene.rotation.y = 0.3;
    renderer.render(scene, camera);
  }

  if (reduceMotion) renderStatic();
  else animate();

  // --- Resize ---
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (reduceMotion) renderStatic();
  });
})();
