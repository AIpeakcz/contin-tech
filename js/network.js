/* ============================================================
   CONTIN TECH — neuronová síť (Three.js)
   Měkké kulaté zářící uzly (vlastní shader → žádné čtverce),
   spoje slábnoucí do hloubky a plynulé datové toky proudící
   po vláknech (hladký náběh i doběh, jako signál v síti).
   Hloubka přes mlhu + depth-fade. Parallax na pohyb myši.
   Respektuje reduced-motion. Barvy z CSS proměnných v :root.
   ============================================================ */

(function () {
  const canvas = document.getElementById('net-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Paleta z :root → THREE.Color ---
  const css = getComputedStyle(document.documentElement);
  const col = (name, fallback) => new THREE.Color((css.getPropertyValue(name).trim() || fallback));
  const C_NODE  = col('--silver',     '#c7ccd6');
  const C_LINE  = col('--ash',        '#6b7280');
  const C_PULSE = col('--accent-hot', '#e8edf5');
  const C_FOG   = col('--ink',        '#0a0b0d');

  const FOG_NEAR = 70, FOG_FAR = 250;

  // --- Scéna / kamera / renderer ---
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(C_FOG, FOG_NEAR, FOG_FAR);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 100;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  const DPR = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(DPR);

  /* --- Vlastní materiál pro kulaté měkké glow body ---
     gl_PointCoord ořízne čtvercový sprite do kruhu se měkkým spádem,
     depth-fade utlumí vzdálené body do mlhy. */
  function glowMaterial(color, blending) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: color },
        uNear:  { value: FOG_NEAR },
        uFar:   { value: FOG_FAR },
        uDpr:   { value: DPR }
      },
      vertexShader: `
        attribute float aSize;
        attribute float aAlpha;
        varying float vAlpha;
        uniform float uNear;
        uniform float uFar;
        uniform float uDpr;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float dist = -mv.z;
          float depthFade = clamp((uFar - dist) / (uFar - uNear), 0.0, 1.0);
          vAlpha = aAlpha * depthFade;
          gl_PointSize = aSize * uDpr * (320.0 / dist);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          float glow = pow(smoothstep(0.5, 0.0, d), 1.8);
          if (glow <= 0.001) discard;
          gl_FragColor = vec4(uColor, glow * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: blending
    });
  }

  // --- Uzly (rozprostřené i do hloubky) ---
  const NODE_COUNT = 95;
  const SPREAD = 150;
  const DEPTH = 150;
  const nodes = [];
  const nodePositions = [];
  const nodeSize = new Float32Array(NODE_COUNT);
  const nodeAlpha = new Float32Array(NODE_COUNT);

  for (let i = 0; i < NODE_COUNT; i++) {
    const x = (Math.random() - 0.5) * SPREAD;
    const y = (Math.random() - 0.5) * SPREAD * 0.62;
    const z = (Math.random() - 0.5) * DEPTH;
    nodes.push({ base: new THREE.Vector3(x, y, z), phase: Math.random() * Math.PI * 2 });
    nodePositions.push(x, y, z);
    nodeSize[i] = 2.2 + Math.random() * 2.6;
    nodeAlpha[i] = 0.85;
  }

  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodePositions, 3));
  nodeGeo.setAttribute('aSize', new THREE.BufferAttribute(nodeSize, 1));
  nodeGeo.setAttribute('aAlpha', new THREE.BufferAttribute(nodeAlpha, 1));
  const points = new THREE.Points(nodeGeo, glowMaterial(C_NODE, THREE.NormalBlending));
  scene.add(points);

  // --- Spoje mezi blízkými uzly (jas podle délky) ---
  const MAX_DIST = 40;
  const linePairs = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      if (nodes[i].base.distanceTo(nodes[j].base) < MAX_DIST) {
        linePairs.push([i, j]);
      }
    }
  }

  const lineVerts  = new Float32Array(linePairs.length * 6);
  const lineColors = new Float32Array(linePairs.length * 6);
  linePairs.forEach((pair, idx) => {
    const d = nodes[pair[0]].base.distanceTo(nodes[pair[1]].base);
    const b = 0.8 - (d / MAX_DIST) * 0.62;     // krátký spoj výraznější, dlouhý utlumený
    const r = C_LINE.r * b, g = C_LINE.g * b, bl = C_LINE.b * b;
    for (let v = 0; v < 6; v += 3) {
      lineColors[idx * 6 + v]     = r;
      lineColors[idx * 6 + v + 1] = g;
      lineColors[idx * 6 + v + 2] = bl;
    }
  });

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(lineVerts, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.5, fog: true
  });
  scene.add(new THREE.LineSegments(lineGeo, lineMat));

  /* --- Datové toky: víc proudících světel po vláknech ---
     alpha = sin(t·π) → na obou koncích spoje plynule mizí a vzniká,
     takže to teče hladce, bez tvrdých skoků. */
  const PULSE_COUNT = Math.min(60, linePairs.length);
  const pulses = [];
  const pulsePos   = new Float32Array(PULSE_COUNT * 3);
  const pulseSize  = new Float32Array(PULSE_COUNT);
  const pulseAlpha = new Float32Array(PULSE_COUNT);
  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
  pulseGeo.setAttribute('aSize', new THREE.BufferAttribute(pulseSize, 1));
  pulseGeo.setAttribute('aAlpha', new THREE.BufferAttribute(pulseAlpha, 1));
  const pulsePoints = new THREE.Points(pulseGeo, glowMaterial(C_PULSE, THREE.AdditiveBlending));
  scene.add(pulsePoints);

  function seedPulse(p) {
    p.pair = linePairs[Math.floor(Math.random() * linePairs.length)];
    p.t = Math.random();
    p.speed = 0.0015 + Math.random() * 0.0035;
    p.size = 3.0 + Math.random() * 2.5;
  }
  for (let i = 0; i < PULSE_COUNT; i++) { const p = {}; seedPulse(p); pulses.push(p); }

  // --- Interakce myší (plynulý parallax) ---
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function updateLines() {
    const posAttr = nodeGeo.attributes.position.array;
    let k = 0;
    for (const [i, j] of linePairs) {
      lineVerts[k++] = posAttr[i * 3];     lineVerts[k++] = posAttr[i * 3 + 1]; lineVerts[k++] = posAttr[i * 3 + 2];
      lineVerts[k++] = posAttr[j * 3];     lineVerts[k++] = posAttr[j * 3 + 1]; lineVerts[k++] = posAttr[j * 3 + 2];
    }
    lineGeo.attributes.position.needsUpdate = true;
  }

  // --- Animační smyčka ---
  let frame = 0;
  function animate() {
    frame += 0.01;

    // jemné „dýchání" uzlů (poloha + lehké pulzování jasu)
    const posAttr = nodeGeo.attributes.position.array;
    for (let i = 0; i < NODE_COUNT; i++) {
      const n = nodes[i];
      posAttr[i * 3]     = n.base.x + Math.sin(frame + n.phase) * 1.8;
      posAttr[i * 3 + 1] = n.base.y + Math.cos(frame + n.phase * 1.3) * 1.8;
      posAttr[i * 3 + 2] = n.base.z + Math.sin(frame * 0.7 + n.phase) * 1.8;
      nodeAlpha[i] = 0.7 + Math.sin(frame * 1.6 + n.phase) * 0.25;
    }
    nodeGeo.attributes.position.needsUpdate = true;
    nodeGeo.attributes.aAlpha.needsUpdate = true;
    updateLines();

    // datové toky po vláknech
    for (let i = 0; i < PULSE_COUNT; i++) {
      const p = pulses[i];
      p.t += p.speed;
      if (p.t >= 1) seedPulse(p);
      const [a, b] = p.pair;
      pulsePos[i * 3]     = posAttr[a * 3]     + (posAttr[b * 3]     - posAttr[a * 3])     * p.t;
      pulsePos[i * 3 + 1] = posAttr[a * 3 + 1] + (posAttr[b * 3 + 1] - posAttr[a * 3 + 1]) * p.t;
      pulsePos[i * 3 + 2] = posAttr[a * 3 + 2] + (posAttr[b * 3 + 2] - posAttr[a * 3 + 2]) * p.t;
      pulseAlpha[i] = Math.sin(p.t * Math.PI);            // hladký náběh i doběh
      pulseSize[i]  = p.size * (0.7 + 0.3 * pulseAlpha[i]);
    }
    pulseGeo.attributes.position.needsUpdate = true;
    pulseGeo.attributes.aAlpha.needsUpdate = true;
    pulseGeo.attributes.aSize.needsUpdate = true;

    // pomalá rotace + parallax na myš
    mouse.x += (mouse.tx - mouse.x) * 0.045;
    mouse.y += (mouse.ty - mouse.y) * 0.045;
    scene.rotation.y = frame * 0.035 + mouse.x * 0.35;
    scene.rotation.x = mouse.y * 0.22;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // statická, ale stále hezká scéna pro reduced-motion
  function renderStatic() {
    for (let i = 0; i < PULSE_COUNT; i++) {
      const p = pulses[i], [a, b] = p.pair;
      pulsePos[i * 3]     = nodes[a].base.x + (nodes[b].base.x - nodes[a].base.x) * 0.5;
      pulsePos[i * 3 + 1] = nodes[a].base.y + (nodes[b].base.y - nodes[a].base.y) * 0.5;
      pulsePos[i * 3 + 2] = nodes[a].base.z + (nodes[b].base.z - nodes[a].base.z) * 0.5;
      pulseAlpha[i] = 0.8; pulseSize[i] = p.size;
    }
    pulseGeo.attributes.position.needsUpdate = true;
    pulseGeo.attributes.aAlpha.needsUpdate = true;
    pulseGeo.attributes.aSize.needsUpdate = true;
    updateLines();
    scene.rotation.y = 0.35;
    scene.rotation.x = -0.06;
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
