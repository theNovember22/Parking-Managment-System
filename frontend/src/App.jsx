const { useState, useEffect, useCallback, useMemo, useRef } = React;

const MotionExports = window.Motion || {};
const motion = MotionExports.motion || {
  div: 'div',
  section: 'section',
  button: 'button',
  span: 'span',
};
const AnimatePresence =
  MotionExports.AnimatePresence || (({ children }) => React.createElement(React.Fragment, null, children));

const Lucide = window.LucideReact || {};

function Icon({ name, className = 'w-4 h-4', fallback = null }) {
  const Comp = Lucide[name];
  if (Comp) {
    return <Comp className={className} />;
  }
  return fallback ? <span className={className}>{fallback}</span> : null;
}

const API_BASE =
  typeof window !== 'undefined' &&
  window.location.origin.startsWith('http') &&
  window.location.port !== '5173' &&
  window.location.port !== '3000'
    ? ''
    : 'http://localhost:8080';

const IMAGES = {
  homeHero: {
    url: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1600&q=85',
    fallback: '/assets/home-hero.jpg',
    alt: 'Modern underground parking garage',
  },
  slotsHero: {
    url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1600&q=85',
    fallback: '/assets/slots-hero.jpg',
    alt: 'Overhead numbered parking bays',
  },
  ticketsHero: {
    url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1600&q=85',
    fallback: '/assets/tickets-hero.jpg',
    alt: 'Modern parking garage exit way',
  },
  Car: {
    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80',
    fallback: '/assets/car.jpg',
    alt: 'Modern coupe car',
  },
  Bike: {
    url: 'https://images.unsplash.com/photo-1558980394-da1f85d3b540?auto=format&fit=crop&w=900&q=80',
    fallback: '/assets/bike.jpg',
    alt: 'Cruiser motorcycle',
  },
  Truck: {
    url: 'https://images.unsplash.com/photo-1592805144716-feeccccef5ac?auto=format&fit=crop&w=900&q=80',
    fallback: '/assets/truck.jpg',
    alt: 'Commercial freight truck',
  },
};

const VEHICLE_META = {
  Car: { rate: 50, iconName: 'Car', zone: 'Zones A, B & C • Covered Bays' },
  Bike: { rate: 20, iconName: 'Bike', zone: 'Zone D • Two-Wheeler Deck' },
  Truck: { rate: 150, iconName: 'Truck', zone: 'Zone E • Heavy Vehicle Bays' },
};

const ZONE_LABELS = {
  A: 'Zone A — Executive Car Deck',
  B: 'Zone B — Standard Car Deck',
  C: 'Zone C — Express Car Deck',
  D: 'Zone D — Two-Wheeler Bay',
  E: 'Zone E — Heavy Truck Bay',
};

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  if (mins > 0) return `${mins}m ${String(secs).padStart(2, '0')}s`;
  return `${secs}s`;
}

function SmartImage({ imgKey, className = '', altOverride }) {
  const cfg = IMAGES[imgKey] || IMAGES.homeHero;
  const [src, setSrc] = useState(cfg.url);

  useEffect(() => {
    setSrc(cfg.url);
  }, [cfg.url]);

  return (
    <img
      src={src}
      alt={altOverride || cfg.alt}
      loading="lazy"
      onError={() => {
        if (src !== cfg.fallback) setSrc(cfg.fallback);
      }}
      className={className}
    />
  );
}

function getPageFromHash() {
  if (typeof window === 'undefined') return 'home';
  const h = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (h === 'slots' || h === 'parking-slots') return 'slots';
  if (h === 'tickets' || h === 'active-tickets') return 'tickets';
  return 'home';
}

/* Smooth numeric counter animation */
function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const start = prevRef.current;
    if (start === target) {
      setDisplay(target);
      return;
    }
    const duration = 360;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.max(0, Date.now() - startTime);
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (progress >= 1) {
        clearInterval(timer);
        prevRef.current = target;
        setDisplay(target);
      }
    }, 16);

    return () => {
      clearInterval(timer);
      prevRef.current = target;
    };
  }, [target]);

  return (
    <span>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* Subtle mouse-tracked 3D perspective card */
function TiltCard3D({ children, className = '', maxTilt = 5 }) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)');

  const handleMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotY = (px - 0.5) * (maxTilt * 2);
    const rotX = (0.5 - py) * (maxTilt * 2);
    setTransform(`perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(4px)`);
  };

  const handleLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transform }}
      className={`tilt-card-3d ${className}`}
    >
      {children}
    </div>
  );
}

/* Interactive Three.js 3D Vehicle Stage (Car, Bike, Truck) with CSS-3D Fallback */
function Vehicle3DCanvas({ type = 'Car', className = 'h-44 w-full', compact = false }) {
  const mountRef = useRef(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    const THREE = window.THREE;
    if (!container || !THREE) {
      setUseFallback(true);
      return;
    }

    let renderer;
    let frameId = 0;
    let resizeObserver;
    let isMounted = true;

    try {
      const width = container.clientWidth || 360;
      const height = container.clientHeight || 180;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
      camera.position.set(3.15, 1.32, 3.25);
      camera.lookAt(0, 0.34, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // Studio monochrome lighting
      const ambient = new THREE.AmbientLight(0xffffff, 0.72);
      scene.add(ambient);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
      keyLight.position.set(4, 6, 4);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xd4d4d8, 0.75);
      rimLight.position.set(-4, 3, -3);
      scene.add(rimLight);

      const stageGroup = new THREE.Group();
      scene.add(stageGroup);

      // Architectural circular parking pad
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.35,
        roughness: 0.55,
      });
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.68, 1.74, 0.08, 48), padMat);
      pad.position.y = -0.05;
      stageGroup.add(pad);

      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x71717a,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.52, 1.56, 48), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.002;
      stageGroup.add(ring);

      // Shared materials (strict monochrome studio aesthetic)
      const bodyLightMat = new THREE.MeshStandardMaterial({
        color: 0xf4f4f5,
        metalness: 0.48,
        roughness: 0.24,
      });
      const bodyDarkMat = new THREE.MeshStandardMaterial({
        color: 0x27272a,
        metalness: 0.55,
        roughness: 0.32,
      });
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x09090b,
        metalness: 0.9,
        roughness: 0.1,
      });
      const tireMat = new THREE.MeshStandardMaterial({
        color: 0x111113,
        roughness: 0.85,
        metalness: 0.1,
      });
      const rimMat = new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        metalness: 0.85,
        roughness: 0.2,
      });
      const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      const vehicle = new THREE.Group();
      const wheels = [];

      const addWheel = (x, y, z, radius = 0.24, thickness = 0.16) => {
        const wheelGroup = new THREE.Group();
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thickness, 24), tireMat);
        tire.rotation.x = Math.PI / 2;
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.56, radius * 0.56, thickness + 0.02, 16), rimMat);
        hub.rotation.x = Math.PI / 2;
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.95, 0.04, thickness + 0.03), bodyDarkMat);
        wheelGroup.add(tire, hub, spoke);
        wheelGroup.position.set(x, y, z);
        vehicle.add(wheelGroup);
        wheels.push(wheelGroup);
      };

      if (type === 'Bike') {
        // Sculpted 3D Sport Motorcycle
        addWheel(-0.68, 0.28, 0, 0.28, 0.11);
        addWheel(0.68, 0.28, 0, 0.28, 0.11);

        const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.24), bodyDarkMat);
        chassis.position.set(0, 0.42, 0);
        vehicle.add(chassis);

        const tank = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.24, 0.3), bodyLightMat);
        tank.position.set(0.16, 0.64, 0);
        tank.rotation.z = -0.15;
        vehicle.add(tank);

        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.24), bodyDarkMat);
        seat.position.set(-0.28, 0.58, 0);
        seat.rotation.z = 0.12;
        vehicle.add(seat);

        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.2), bodyLightMat);
        tail.position.set(-0.66, 0.64, 0);
        tail.rotation.z = 0.22;
        vehicle.add(tail);

        const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.68, 12), rimMat);
        fork.position.set(0.52, 0.56, 0);
        fork.rotation.z = 0.42;
        vehicle.add(fork);

        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.52, 12), rimMat);
        handle.rotation.x = Math.PI / 2;
        handle.position.set(0.38, 0.84, 0);
        vehicle.add(handle);

        const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.62, 12), rimMat);
        exhaust.rotation.z = Math.PI / 2 - 0.12;
        exhaust.position.set(-0.34, 0.28, 0.15);
        vehicle.add(exhaust);

        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 16), ledMat);
        lamp.rotation.z = Math.PI / 2;
        lamp.position.set(0.58, 0.72, 0);
        vehicle.add(lamp);

        vehicle.scale.setScalar(1.06);
      } else if (type === 'Truck') {
        // Heavy Commercial Truck + Ribbed Trailer
        addWheel(0.88, 0.24, 0.52, 0.24, 0.16);
        addWheel(0.88, 0.24, -0.52, 0.24, 0.16);
        addWheel(-0.38, 0.24, 0.52, 0.24, 0.16);
        addWheel(-0.38, 0.24, -0.52, 0.24, 0.16);
        addWheel(-0.94, 0.24, 0.52, 0.24, 0.16);
        addWheel(-0.94, 0.24, -0.52, 0.24, 0.16);

        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.14, 0.92), bodyDarkMat);
        chassis.position.set(-0.02, 0.28, 0);
        vehicle.add(chassis);

        // Tractor cab
        const cab = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.76, 0.92), bodyDarkMat);
        cab.position.set(0.84, 0.7, 0);
        vehicle.add(cab);

        const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.22, 0.88), bodyLightMat);
        fairing.position.set(0.74, 1.12, 0);
        fairing.rotation.z = -0.18;
        vehicle.add(fairing);

        const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.82), glassMat);
        windshield.position.set(1.22, 0.82, 0);
        vehicle.add(windshield);

        const grille = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.62), rimMat);
        grille.position.set(1.22, 0.48, 0);
        vehicle.add(grille);

        // Cargo container
        const cargo = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.94, 0.98), bodyLightMat);
        cargo.position.set(-0.42, 0.83, 0);
        vehicle.add(cargo);

        for (let r = -1.05; r <= 0.25; r += 0.32) {
          const rib = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.95, 1.0), bodyDarkMat);
          rib.position.set(r, 0.83, 0);
          vehicle.add(rib);
        }

        const hlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.16), ledMat);
        hlLeft.position.set(1.23, 0.42, 0.32);
        const hlRight = hlLeft.clone();
        hlRight.position.z = -0.32;
        vehicle.add(hlLeft, hlRight);

        vehicle.scale.setScalar(0.92);
      } else {
        // Sleek 3D Coupe Car
        addWheel(0.72, 0.22, 0.5, 0.22, 0.15);
        addWheel(0.72, 0.22, -0.5, 0.22, 0.15);
        addWheel(-0.72, 0.22, 0.5, 0.22, 0.15);
        addWheel(-0.72, 0.22, -0.5, 0.22, 0.15);

        const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.24, 0.96), bodyDarkMat);
        lowerBody.position.set(0, 0.28, 0);
        vehicle.add(lowerBody);

        const upperBody = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.16, 0.92), bodyLightMat);
        upperBody.position.set(0, 0.45, 0);
        vehicle.add(upperBody);

        const hood = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 0.86), bodyLightMat);
        hood.position.set(0.66, 0.52, 0);
        hood.rotation.z = -0.07;
        vehicle.add(hood);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.3, 0.8), glassMat);
        cabin.position.set(-0.18, 0.65, 0);
        vehicle.add(cabin);

        const roof = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.76), bodyLightMat);
        roof.position.set(-0.22, 0.81, 0);
        vehicle.add(roof);

        const spoiler = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.84), bodyDarkMat);
        spoiler.position.set(-1.02, 0.58, 0);
        vehicle.add(spoiler);

        const frontBar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.78), ledMat);
        frontBar.position.set(1.12, 0.41, 0);
        vehicle.add(frontBar);

        const rearBar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.78), rimMat);
        rearBar.position.set(-1.12, 0.44, 0);
        vehicle.add(rearBar);
      }

      stageGroup.add(vehicle);

      // Drag-to-orbit interaction state
      let isDragging = false;
      let prevX = 0;
      let prevY = 0;
      let targetRotY = -0.55;
      let targetRotX = 0.06;
      let currentRotY = -0.9;
      let currentRotX = 0.06;
      let popScale = 0.82;

      const onDown = (e) => {
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
        container.style.cursor = 'grabbing';
      };
      const onMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        prevX = e.clientX;
        prevY = e.clientY;
        targetRotY += dx * 0.014;
        targetRotX = Math.max(-0.22, Math.min(0.32, targetRotX + dy * 0.008));
      };
      const onUp = () => {
        isDragging = false;
        container.style.cursor = 'grab';
      };

      container.style.cursor = 'grab';
      container.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);

      const handleResize = () => {
        if (!container || !renderer) return;
        const w = container.clientWidth || 360;
        const h = container.clientHeight || 180;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);
      }

      const clockStart = performance.now();
      const animate = (now) => {
        if (!isMounted) return;
        const elapsed = (now - clockStart) * 0.001;

        if (!isDragging) {
          targetRotY += 0.0075;
          targetRotX += (0.06 - targetRotX) * 0.04;
        }

        currentRotY += (targetRotY - currentRotY) * 0.1;
        currentRotX += (targetRotX - currentRotX) * 0.1;
        popScale += (1 - popScale) * 0.12;

        stageGroup.rotation.y = currentRotY;
        stageGroup.rotation.x = currentRotX;
        stageGroup.scale.setScalar(popScale);

        // Subtle suspension float + live wheel roll
        vehicle.position.y = Math.sin(elapsed * 2.3) * 0.014;
        wheels.forEach((w) => {
          w.rotation.z -= 0.055;
        });

        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };

      frameId = requestAnimationFrame(animate);

      return () => {
        isMounted = false;
        cancelAnimationFrame(frameId);
        container.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        if (resizeObserver) resizeObserver.disconnect();
        if (renderer) renderer.dispose();
      };
    } catch {
      setUseFallback(true);
    }
  }, [type]);

  if (useFallback) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-b from-[#121215] to-[#08080a] flex flex-col items-center justify-center perspective-stage ${className}`}
      >
        <div className="animate-spin-3d flex flex-col items-center text-white">
          <Icon name={VEHICLE_META[type]?.iconName || 'Car'} className={compact ? 'w-10 h-10' : 'w-14 h-14'} />
          <div className="mt-2 h-1.5 w-20 rounded-full bg-white/20" />
        </div>
        <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
          3D {type} Deck
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-b from-[#141418] to-[#08080a] select-none ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />
      <div ref={mountRef} className="relative z-10 w-full h-full" />
      <div className="pointer-events-none absolute bottom-2.5 left-3 z-20 flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-md px-2.5 py-1 border border-white/10">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-200">
          3D {type} • Drag to Orbit
        </span>
      </div>
    </div>
  );
}

/* ============================================================================
   2D TOP-DOWN (AERIAL) PARKING LOT MAP & VEHICLE SILHOUETTES
   ============================================================================ */

function TopDownCar({ plate, facing = 'south', className = '' }) {
  const isFacingNorth = facing === 'north';
  return (
    <div
      className={`relative flex items-center justify-center transition-transform duration-300 ${
        isFacingNorth ? 'rotate-180' : ''
      } ${className}`}
      style={{ width: '42px', height: '84px' }}
    >
      <svg
        viewBox="0 0 60 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
      >
        <defs>
          <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2c2e35" />
            <stop offset="40%" stopColor="#1e2025" />
            <stop offset="100%" stopColor="#141518" />
          </linearGradient>
          <linearGradient id="carGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0d0e12" />
            <stop offset="100%" stopColor="#1b1d24" />
          </linearGradient>
          <linearGradient id="carRoofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#25272e" />
            <stop offset="100%" stopColor="#18191d" />
          </linearGradient>
        </defs>

        {/* Shadow base */}
        <path
          d="M 12 8 Q 30 4 48 8 Q 57 14 57 32 L 57 92 Q 57 114 46 117 Q 30 119 14 117 Q 3 114 3 92 L 3 32 Q 3 14 12 8 Z"
          fill="#0a0a0c"
          opacity="0.6"
        />

        {/* Outer Car Body Silhouette */}
        <path
          d="M 12 10 Q 30 6 48 10 Q 56 16 56 34 L 56 90 Q 56 112 46 115 Q 30 117 14 115 Q 4 112 4 90 L 4 34 Q 4 16 12 10 Z"
          fill="url(#carBodyGrad)"
          stroke="#3f3f46"
          strokeWidth="1.2"
        />

        {/* Hood Contours */}
        <path d="M 18 12 L 20 28" stroke="#3f3f46" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
        <path d="M 42 12 L 40 28" stroke="#3f3f46" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />

        {/* Dual Front Headlights (Warm White / Amber Xenon) */}
        <rect x="7" y="11" width="7" height="4" rx="1.5" fill="#fef08a" opacity="0.9" />
        <rect x="46" y="11" width="7" height="4" rx="1.5" fill="#fef08a" opacity="0.9" />

        {/* Side Mirrors */}
        <path d="M 4 34 L 0 32 Q -2 36 0 40 L 4 38 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />
        <line x1="0" y1="34" x2="0" y2="39" stroke="#94a3b8" strokeWidth="0.9" />
        <path d="M 56 34 L 60 32 Q 62 36 60 40 L 56 38 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />
        <line x1="60" y1="34" x2="60" y2="39" stroke="#94a3b8" strokeWidth="0.9" />

        {/* Front Windshield Glass */}
        <path
          d="M 10 32 L 50 32 L 44 46 L 16 46 Z"
          fill="url(#carGlassGrad)"
          stroke="#27272a"
          strokeWidth="0.8"
        />
        {/* Glass Reflection Accent */}
        <line x1="22" y1="35" x2="36" y2="43" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round" />

        {/* Cabin Roof Panel */}
        <rect x="15" y="46" width="30" height="34" rx="3" fill="url(#carRoofGrad)" stroke="#27272a" strokeWidth="0.6" />
        {/* Sunroof */}
        <rect x="18" y="49" width="24" height="15" rx="2" fill="#090a0d" stroke="#3f3f46" strokeWidth="0.6" />

        {/* Rear Windshield Glass */}
        <path
          d="M 16 80 L 44 80 L 49 94 L 11 94 Z"
          fill="url(#carGlassGrad)"
          stroke="#27272a"
          strokeWidth="0.8"
        />
        {/* Rear defroster lines */}
        <line x1="17" y1="84" x2="43" y2="84" stroke="rgba(239,68,68,0.25)" strokeWidth="0.6" />
        <line x1="15" y1="88" x2="45" y2="88" stroke="rgba(239,68,68,0.25)" strokeWidth="0.6" />

        {/* Rear Dual Red LED Taillights */}
        <rect x="8" y="112" width="9" height="3" rx="1" fill="#ef4444" />
        <rect x="43" y="112" width="9" height="3" rx="1" fill="#ef4444" />
        {/* Center High Mount Stop Lamp */}
        <rect x="25" y="94" width="10" height="2" rx="0.5" fill="#dc2626" />

        {/* License Plate Badge on Roof/Trunk */}
        <g transform="translate(11, 66)">
          <rect x="0" y="0" width="38" height="12" rx="2.5" fill="#ffffff" stroke="#09090b" strokeWidth="0.8" />
          <text
            x="19"
            y="9"
            textAnchor="middle"
            fill="#09090b"
            fontSize="6.5"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
            letterSpacing="0.04em"
          >
            {plate ? (plate.length > 9 ? plate.slice(0, 9) : plate) : 'CAR'}
          </text>
        </g>
      </svg>
    </div>
  );
}

function TopDownBike({ plate, facing = 'south', className = '' }) {
  const isFacingNorth = facing === 'north';
  return (
    <div
      className={`relative flex items-center justify-center transition-transform duration-300 ${
        isFacingNorth ? 'rotate-180' : ''
      } ${className}`}
      style={{ width: '26px', height: '66px' }}
    >
      <svg
        viewBox="0 0 40 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
      >
        {/* Front Tire */}
        <rect x="17" y="3" width="6" height="18" rx="3" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />

        {/* Front Fender */}
        <path d="M 16 12 C 16 8 24 8 24 12" stroke="#71717a" strokeWidth="1.2" fill="none" />

        {/* Handlebars with Grips & Levers */}
        <line x1="5" y1="22" x2="35" y2="22" stroke="#a1a1aa" strokeWidth="2.2" strokeLinecap="round" />
        <rect x="3" y="19" width="5" height="6" rx="1.5" fill="#18181b" />
        <rect x="32" y="19" width="5" height="6" rx="1.5" fill="#18181b" />
        {/* Mirrors */}
        <circle cx="4" cy="17" r="2.2" fill="#38bdf8" stroke="#18181b" strokeWidth="0.6" />
        <circle cx="36" cy="17" r="2.2" fill="#38bdf8" stroke="#18181b" strokeWidth="0.6" />

        {/* Front Headlight (Round Xenon) */}
        <circle cx="20" cy="18" r="3.5" fill="#fef08a" stroke="#eab308" strokeWidth="0.8" />

        {/* Fuel Tank */}
        <path
          d="M 20 25 C 27 25 28 38 25 46 C 22 50 18 50 15 46 C 12 38 13 25 20 25 Z"
          fill="#27272a"
          stroke="#52525b"
          strokeWidth="1"
        />
        {/* Tank Cap */}
        <circle cx="20" cy="32" r="1.8" fill="#e4e4e7" stroke="#18181b" strokeWidth="0.5" />

        {/* Driver Saddle */}
        <path
          d="M 16 46 C 16 46 14 54 14 60 C 14 64 26 64 26 60 C 26 54 24 46 24 46 Z"
          fill="#18181b"
          stroke="#27272a"
          strokeWidth="0.8"
        />

        {/* Passenger Pillion Seat */}
        <rect x="16" y="60" width="8" height="12" rx="2" fill="#09090b" stroke="#27272a" strokeWidth="0.6" />

        {/* Rear Tire */}
        <rect x="17" y="70" width="6" height="16" rx="3" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />

        {/* Rear Tail Lamp (Red) */}
        <rect x="16" y="78" width="8" height="2.5" rx="1" fill="#ef4444" />

        {/* Compact License Tag */}
        <g transform="translate(7, 50)">
          <rect x="0" y="0" width="26" height="9" rx="2" fill="#ffffff" stroke="#09090b" strokeWidth="0.6" />
          <text
            x="13"
            y="7"
            textAnchor="middle"
            fill="#09090b"
            fontSize="5.2"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            {plate ? (plate.length > 7 ? plate.slice(0, 7) : plate) : 'BIKE'}
          </text>
        </g>
      </svg>
    </div>
  );
}

function TopDownTruck({ plate, facing = 'south', className = '' }) {
  const isFacingNorth = facing === 'north';
  return (
    <div
      className={`relative flex items-center justify-center transition-transform duration-300 ${
        isFacingNorth ? 'rotate-180' : ''
      } ${className}`}
      style={{ width: '52px', height: '116px' }}
    >
      <svg
        viewBox="0 0 76 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]"
      >
        <defs>
          <linearGradient id="truckCabGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2e3038" />
            <stop offset="100%" stopColor="#18191d" />
          </linearGradient>
          <linearGradient id="truckTrailerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#25272e" />
            <stop offset="100%" stopColor="#121316" />
          </linearGradient>
        </defs>

        {/* Front Cab Bumper */}
        <rect x="10" y="6" width="56" height="8" rx="3" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
        <rect x="12" y="7" width="8" height="4" rx="1" fill="#fef08a" />
        <rect x="56" y="7" width="8" height="4" rx="1" fill="#fef08a" />

        {/* Cab Body */}
        <rect x="10" y="12" width="56" height="42" rx="4" fill="url(#truckCabGrad)" stroke="#3f3f46" strokeWidth="1" />

        {/* Large Curved Front Windshield */}
        <path
          d="M 14 16 L 62 16 L 58 26 L 18 26 Z"
          fill="#090a0d"
          stroke="#27272a"
          strokeWidth="0.8"
        />
        <line x1="24" y1="18" x2="52" y2="24" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" />

        {/* Heavy Duty Side Mirrors on Brackets */}
        <rect x="2" y="16" width="6" height="12" rx="1.5" fill="#18181b" stroke="#52525b" strokeWidth="0.8" />
        <line x1="8" y1="20" x2="10" y2="20" stroke="#71717a" strokeWidth="1.2" />
        <rect x="68" y="16" width="6" height="12" rx="1.5" fill="#18181b" stroke="#52525b" strokeWidth="0.8" />
        <line x1="66" y1="20" x2="68" y2="20" stroke="#71717a" strokeWidth="1.2" />

        {/* Cab Roof Air Fairing & 5 Amber Clearance Lights */}
        <rect x="22" y="28" width="32" height="22" rx="2" fill="#202228" stroke="#3f3f46" strokeWidth="0.6" />
        <circle cx="26" cy="14" r="1.2" fill="#f59e0b" />
        <circle cx="32" cy="14" r="1.2" fill="#f59e0b" />
        <circle cx="38" cy="14" r="1.2" fill="#f59e0b" />
        <circle cx="44" cy="14" r="1.2" fill="#f59e0b" />
        <circle cx="50" cy="14" r="1.2" fill="#f59e0b" />

        {/* Articulation Pivot Gap / Fifth Wheel Coupling */}
        <rect x="26" y="54" width="24" height="6" rx="1" fill="#09090b" stroke="#27272a" strokeWidth="0.8" />
        <circle cx="38" cy="57" r="2.2" fill="#52525b" />

        {/* Trailer Cargo Container */}
        <rect x="7" y="60" width="62" height="92" rx="3" fill="url(#truckTrailerGrad)" stroke="#3f3f46" strokeWidth="1.2" />

        {/* Corrugated Roof Longitudinal Ribs */}
        {[16, 24, 32, 40, 48, 56, 64].map((x) => (
          <line key={x} x1={x} y1="64" x2={x} y2="148" stroke="#18191d" strokeWidth="1.2" />
        ))}

        {/* Rear Safety Bumper with Yellow/Black Chevrons */}
        <rect x="9" y="152" width="58" height="6" rx="1.5" fill="#eab308" stroke="#09090b" strokeWidth="0.8" />
        <g stroke="#09090b" strokeWidth="2.2">
          <line x1="14" y1="152" x2="19" y2="158" />
          <line x1="22" y1="152" x2="27" y2="158" />
          <line x1="30" y1="152" x2="35" y2="158" />
          <line x1="38" y1="152" x2="43" y2="158" />
          <line x1="46" y1="152" x2="51" y2="158" />
          <line x1="54" y1="152" x2="59" y2="158" />
        </g>

        {/* Rear Red Taillights */}
        <rect x="10" y="148" width="6" height="3" fill="#ef4444" />
        <rect x="60" y="148" width="6" height="3" fill="#ef4444" />

        {/* License Plate Badge across Container Roof */}
        <g transform="translate(16, 98)">
          <rect x="0" y="0" width="44" height="13" rx="2.5" fill="#ffffff" stroke="#09090b" strokeWidth="0.9" />
          <text
            x="22"
            y="9.5"
            textAnchor="middle"
            fill="#09090b"
            fontSize="6.8"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
            letterSpacing="0.04em"
          >
            {plate ? (plate.length > 9 ? plate.slice(0, 9) : plate) : 'TRUCK'}
          </text>
        </g>
      </svg>
    </div>
  );
}

function TopDownVehicleSvg({ type, plate, facing = 'south', className = '' }) {
  if (type === 'Bike') {
    return <TopDownBike plate={plate} facing={facing} className={className} />;
  }
  if (type === 'Truck') {
    return <TopDownTruck plate={plate} facing={facing} className={className} />;
  }
  return <TopDownCar plate={plate} facing={facing} className={className} />;
}

function ParkingBay2D({
  slot,
  facing = 'south',
  isSelected = false,
  isInspected = false,
  isDimmed = false,
  onClick,
  nowMs,
  syncedAtMs,
}) {
  const isAvailable = slot.isAvailable;
  const isBike = slot.type === 'Bike';
  const isTruck = slot.type === 'Truck';
  const v = slot.vehicle;
  const rate = VEHICLE_META[slot.type]?.rate ?? 50;

  return (
    <div
      onClick={() => onClick(slot)}
      className={`group relative flex flex-col justify-between rounded-xl transition-all duration-200 cursor-pointer select-none ${
        isBike
          ? 'w-[72px] sm:w-[80px] h-[132px]'
          : isTruck
          ? 'w-[96px] sm:w-[104px] h-[154px]'
          : 'w-[82px] sm:w-[90px] h-[132px]'
      } ${
        isDimmed
          ? 'opacity-20 grayscale pointer-events-none'
          : isSelected
          ? 'ring-2 ring-blue-500 bg-[#1a1f2b] shadow-[0_0_18px_rgba(59,130,246,0.45)]'
          : isInspected
          ? 'ring-2 ring-white bg-[#1b1c22] shadow-[0_0_18px_rgba(255,255,255,0.25)]'
          : 'bg-[#131418] hover:bg-[#181920] hover:border-white/30'
      } border ${
        isAvailable ? 'border-white/10 hover:border-emerald-500/40' : 'border-white/10 hover:border-rose-500/40'
      } p-2`}
      title={
        isAvailable
          ? `Bay ${slot.slotLabel} (${slot.type}) — Available at ₹${rate}/hr. Click to park.`
          : `Bay ${slot.slotLabel} — Occupied by ${v?.number}. Click to inspect & exit.`
      }
    >
      {/* Top Header: Bay ID & Sensor LED */}
      <div className="flex items-center justify-between w-full">
        <span
          className={`font-mono text-[11px] font-bold ${
            isAvailable ? 'text-zinc-200' : 'text-zinc-400'
          }`}
        >
          {slot.slotLabel}
        </span>

        {/* Status Sensor LED */}
        <div className="flex items-center">
          {isAvailable ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            </span>
          ) : (
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
            </span>
          )}
        </div>
      </div>

      {/* Bay Center: Occupied Vehicle SVG or Clean Available State */}
      <div className="flex-1 flex flex-col items-center justify-center relative my-1">
        {!isAvailable && v ? (
          <div className="relative w-full flex items-center justify-center">
            <TopDownVehicleSvg
              type={slot.type}
              plate={v.number}
              facing={facing}
            />
            {/* Minimal clean hover pill */}
            <div className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/20 text-[9px] font-mono text-white whitespace-nowrap z-20 shadow-lg">
              {v.number}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-mono text-zinc-500 group-hover:text-emerald-400 transition font-medium">
              ₹{rate}/h
            </span>
            <span className="mt-1 text-[9px] font-mono uppercase tracking-wider text-zinc-600 group-hover:text-emerald-400 font-bold transition">
              Free
            </span>
          </div>
        )}
      </div>

      {/* Painted threshold stop line facing aisle */}
      <div
        className={`w-full flex justify-between px-1 ${
          facing === 'south' ? 'border-b border-white/20 pb-0.5' : 'border-t border-white/20 pt-0.5'
        }`}
      >
        <span className="w-1.5 h-0.5 bg-white/40 rounded-sm" />
        <span className="w-1.5 h-0.5 bg-white/40 rounded-sm" />
      </div>
    </div>
  );
}

function OccupiedSlotModal2D({
  slot,
  onClose,
  onExitVehicle,
  nowMs,
  syncedAtMs,
  exitingVehicle,
}) {
  if (!slot || slot.isAvailable || !slot.vehicle) return null;
  const v = slot.vehicle;

  const deltaSec = syncedAtMs ? Math.max(0, Math.floor((nowMs - syncedAtMs) / 1000)) : 0;
  const liveSec = (Number(v.durationSeconds) || 0) + deltaSec;
  const liveHours = Math.max(1, Math.ceil(liveSec / 3600));
  const liveBill = liveHours * (Number(v.ratePerHour) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-7 shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/8 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-black text-white px-2.5 py-1 font-mono text-sm font-bold">
              Bay [{slot.slotLabel}]
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {slot.type} • Occupied
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-black transition"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Top-Down Vehicle Stage Preview */}
        <div className="mt-5 rounded-2xl bg-gradient-to-b from-[#14151a] to-[#0a0a0c] p-5 flex flex-col items-center justify-center border border-zinc-800">
          <TopDownVehicleSvg type={slot.type} plate={v.number} facing="south" />
          <div className="mt-3.5 inline-flex items-center gap-2 rounded-lg border-2 border-zinc-700 bg-white px-3.5 py-1 shadow-sm">
            <span className="font-mono text-[10px] font-bold text-blue-900 bg-blue-100 px-1 rounded">IND</span>
            <span className="font-mono text-sm font-bold text-zinc-900 tracking-wider">{v.number}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-black/10 bg-[#fcfcfc] p-3">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Elapsed Time</span>
            <div className="mt-1 font-mono text-base font-semibold text-black">
              {formatDuration(liveSec)}
            </div>
            <span className="text-[10px] text-zinc-500">{liveHours} billed hrs</span>
          </div>

          <div className="rounded-xl border border-black/10 bg-[#fcfcfc] p-3">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Accrued Bill</span>
            <div className="mt-1 font-mono text-base font-semibold text-black">
              ₹{liveBill}
            </div>
            <span className="text-[10px] text-zinc-500">₹{v.ratePerHour}/hr rate</span>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-black/8 bg-zinc-50 px-3 py-2 flex items-center justify-between text-xs text-zinc-600">
          <span>Parked on</span>
          <span className="font-mono text-zinc-800">{v.entryTime}</span>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-black/15 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition"
          >
            Keep Parked
          </button>
          <button
            type="button"
            disabled={exitingVehicle}
            onClick={() => {
              onExitVehicle(v.number);
              onClose();
            }}
            className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition"
          >
            <Icon name="LogOut" className="w-4 h-4" />
            <span>Exit & Settle (₹{liveBill})</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ParkingLot2DMap({
  slots = [],
  selectedSlotId = null,
  inspectedSlotId = null,
  onSelectSlot,
  onInspectSlot,
  onExitVehicle,
  nowMs,
  syncedAtMs,
  exitingVehicle = false,
  title = "Facility Deck 2D Sensor Map",
  subtitle = "Live aerial top-down radar view of all 20 bays",
  className = "",
}) {
  const [filter, setFilter] = useState('All');
  const [inspectedOccupiedSlot, setInspectedOccupiedSlot] = useState(null);

  // Group slots into Rows A..E
  const rowA = slots.filter((s) => s.slotLabel && s.slotLabel.startsWith('A'));
  const rowB = slots.filter((s) => s.slotLabel && s.slotLabel.startsWith('B'));
  const rowC = slots.filter((s) => s.slotLabel && s.slotLabel.startsWith('C'));
  const rowD = slots.filter((s) => s.slotLabel && s.slotLabel.startsWith('D'));
  const rowE = slots.filter((s) => s.slotLabel && s.slotLabel.startsWith('E'));

  const totalCount = slots.length;
  const openCount = slots.filter((s) => s.isAvailable).length;
  const occupiedCount = totalCount - openCount;

  const handleBayClick = (slot) => {
    if (!slot.isAvailable) {
      setInspectedOccupiedSlot(slot);
      if (onInspectSlot) onInspectSlot(slot);
    } else {
      if (onSelectSlot) onSelectSlot(slot);
    }
  };

  const isSlotDimmed = (slot) => {
    if (filter === 'All') return false;
    if (filter === 'Car') return slot.type !== 'Car';
    if (filter === 'Bike') return slot.type !== 'Bike';
    if (filter === 'Truck') return slot.type !== 'Truck';
    if (filter === 'Available') return !slot.isAvailable;
    if (filter === 'Occupied') return slot.isAvailable;
    return false;
  };

  return (
    <div className={`w-full rounded-[28px] border border-black/10 bg-[#0d0e12] p-5 md:p-7 shadow-2xl text-white relative overflow-hidden ${className}`}>
      {/* Background Asphalt Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Clean Top Map Header & Controls */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-semibold">
              Live Sensor Telemetry
            </span>
          </div>
          <h3 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight text-white flex items-center gap-2.5">
            <span>{title}</span>
            <span className="text-xs font-normal text-zinc-400 bg-white/10 px-2.5 py-0.5 rounded-full font-mono">
              Top View
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Legend & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {openCount} Open
            </span>
            <span className="text-zinc-600">|</span>
            <span className="inline-flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {occupiedCount} Occupied
            </span>
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            {['All', 'Car', 'Bike', 'Truck', 'Available', 'Occupied'].map((tab) => {
              const active = filter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    active
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Blueprint Canvas Container */}
      <div className="relative z-10 mt-5 overflow-x-auto pb-2">
        <div className="min-w-[960px] p-5 rounded-2xl bg-[#111216] border border-white/10 space-y-4">
          
          {/* DECK 1: NORTH DECK — PASSENGER CARS (Rows A & B - 8 bays facing South) */}
          <div className="rounded-xl bg-[#0b0c0f] border border-white/5 p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  North Deck • Passenger Cars (Rows A & B)
                </span>
                <span className="text-[10px] text-zinc-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                  8 Bays • ₹50/hr
                </span>
              </div>
              <div className="text-[10px] font-mono text-emerald-400">
                ⚡ EV Charging Ready (A1–A2)
              </div>
            </div>

            <div className="flex items-center justify-between gap-6">
              {/* Row A */}
              <div className="flex-1">
                <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                  Row A — Executive Bays (A1–A4)
                </span>
                <div className="grid grid-cols-4 gap-3">
                  {rowA.map((slot) => (
                    <ParkingBay2D
                      key={slot.slotId}
                      slot={slot}
                      facing="south"
                      isSelected={selectedSlotId === slot.slotId}
                      isInspected={inspectedSlotId === slot.slotId}
                      isDimmed={isSlotDimmed(slot)}
                      onClick={handleBayClick}
                      nowMs={nowMs}
                      syncedAtMs={syncedAtMs}
                    />
                  ))}
                </div>
              </div>

              {/* Row B */}
              <div className="flex-1">
                <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                  Row B — Standard Bays (B1–B4)
                </span>
                <div className="grid grid-cols-4 gap-3">
                  {rowB.map((slot) => (
                    <ParkingBay2D
                      key={slot.slotId}
                      slot={slot}
                      facing="south"
                      isSelected={selectedSlotId === slot.slotId}
                      isInspected={inspectedSlotId === slot.slotId}
                      isDimmed={isSlotDimmed(slot)}
                      onClick={handleBayClick}
                      nowMs={nowMs}
                      syncedAtMs={syncedAtMs}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CENTRAL TRANSIT DRIVEWAY */}
          <div className="py-3 px-6 rounded-xl bg-[#07080a] border-y border-dashed border-white/20 flex items-center justify-between">
            {/* Entry Gate */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[11px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                GATE 01 IN
              </span>
              <span className="font-mono text-base text-zinc-400">➔</span>
            </div>

            {/* Aisle markings & Zebra Crossing */}
            <div className="flex items-center gap-8">
              <span className="font-mono text-xs text-amber-400/90 font-semibold tracking-widest">
                ➔ TWO-WAY TRANSIT AISLE • 10 KM/H ➔
              </span>

              {/* Pedestrian Crosswalk */}
              <div className="flex flex-col items-center">
                <div className="flex gap-1.5 py-0.5 px-3 bg-white/5 rounded">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-2.5 h-6 bg-white/80 rounded-sm" />
                  ))}
                </div>
                <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">
                  Lobby Crosswalk
                </span>
              </div>
            </div>

            {/* Exit Gate */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-base text-zinc-400">➔</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono text-[11px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                GATE 02 OUT
              </span>
            </div>
          </div>

          {/* DECK 2: SOUTH DECK — EXPRESS CARS & TWO-WHEELERS (Rows C & D - 8 bays facing North) */}
          <div className="rounded-xl bg-[#0b0c0f] border border-white/5 p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  South Deck • Express Cars & Two-Wheelers (Rows C & D)
                </span>
                <span className="text-[10px] text-zinc-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                  8 Bays
                </span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                Core Elevator & Ground Access
              </div>
            </div>

            <div className="flex items-center justify-between gap-6">
              {/* Row C: Express Cars */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                    Row C — Express Bays (C1–C4)
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">₹50/h</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {rowC.map((slot) => (
                    <ParkingBay2D
                      key={slot.slotId}
                      slot={slot}
                      facing="north"
                      isSelected={selectedSlotId === slot.slotId}
                      isInspected={inspectedSlotId === slot.slotId}
                      isDimmed={isSlotDimmed(slot)}
                      onClick={handleBayClick}
                      nowMs={nowMs}
                      syncedAtMs={syncedAtMs}
                    />
                  ))}
                </div>
              </div>

              {/* Row D: Two-Wheelers / Bikes */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider font-semibold">
                    Row D — Two-Wheeler Pavilion (D1–D4)
                  </span>
                  <span className="text-[9px] font-mono text-sky-400/80">₹20/h</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {rowD.map((slot) => (
                    <ParkingBay2D
                      key={slot.slotId}
                      slot={slot}
                      facing="north"
                      isSelected={selectedSlotId === slot.slotId}
                      isInspected={inspectedSlotId === slot.slotId}
                      isDimmed={isSlotDimmed(slot)}
                      onClick={handleBayClick}
                      nowMs={nowMs}
                      syncedAtMs={syncedAtMs}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* DECK 3: COMMERCIAL LOGISTICS WING — HEAVY TRUCKS (Row E - 4 bays) */}
          <div className="rounded-xl bg-[#0b0c0f] border border-white/5 p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Logistics Wing • Heavy Commercial Trucks (Row E)
                </span>
                <span className="text-[10px] text-zinc-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                  4 Bays • ₹150/hr
                </span>
              </div>
              <div className="text-[10px] font-mono text-amber-400/80">
                High-Clearance Freight Dock & Apron
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                Row E — Heavy Freight Bays (E1–E4)
              </span>
              <span className="text-[9px] font-mono text-zinc-500">Wide Turning Radius Clearance</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {rowE.map((slot) => (
                <ParkingBay2D
                  key={slot.slotId}
                  slot={slot}
                  facing="north"
                  isSelected={selectedSlotId === slot.slotId}
                  isInspected={inspectedSlotId === slot.slotId}
                  isDimmed={isSlotDimmed(slot)}
                  onClick={handleBayClick}
                  nowMs={nowMs}
                  syncedAtMs={syncedAtMs}
                />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Clean Legend & Action Hint Footer */}
      <div className="relative z-10 mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-zinc-400 pt-3 border-t border-white/10">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            <span>Available (Click bay to park)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
            <span>Occupied (Click bay to inspect / exit)</span>
          </span>
        </div>
        <div className="font-mono text-[11px] text-zinc-500">
          Scroll horizontally on mobile ↔
        </div>
      </div>

      {/* Occupied Bay Inspector Modal */}
      {inspectedOccupiedSlot && (
        <OccupiedSlotModal2D
          slot={inspectedOccupiedSlot}
          onClose={() => setInspectedOccupiedSlot(null)}
          onExitVehicle={onExitVehicle}
          nowMs={nowMs}
          syncedAtMs={syncedAtMs}
          exitingVehicle={exitingVehicle}
        />
      )}
    </div>
  );
}

/* ============================================================================
   FLOATING LIQUID GLASS CAPSULE NAVBAR (Inspired by MovieGo+)
   ============================================================================ */
function Navbar({
  currentPage,
  onNavigate,
  scrolled,
  totalSlots,
  activeTicketsCount,
  serverOnline,
  isRefreshing,
  onRefresh,
  onReset,
}) {
  const overDarkHero = currentPage === 'home' && !scrolled;

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'slots', label: `Parking Slots (${totalSlots})` },
    { id: 'tickets', label: `Active Tickets (${activeTicketsCount})` },
  ];

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[92%] md:w-[70%] lg:w-[62%] h-12 px-5 md:px-7 flex items-center justify-between rounded-full transition-all duration-300 ${
        overDarkHero ? 'glass-nav-dark text-white' : 'glass-nav-light text-black'
      }`}
    >
      {/* Brand */}
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className="flex items-center gap-2 text-base md:text-lg font-bold tracking-tight cursor-pointer"
      >
        <span className="grid grid-cols-2 gap-0.5 p-1 rounded-md border border-current opacity-85">
          <span className="h-1.5 w-1.5 bg-current rounded-[1px]" />
          <span className="h-1.5 w-1.5 bg-current rounded-[1px] opacity-40" />
          <span className="h-1.5 w-1.5 bg-current rounded-[1px] opacity-40" />
          <span className="h-1.5 w-1.5 bg-current rounded-[1px]" />
        </span>
        <span>BayGrid</span>
      </button>

      {/* Center Links with animated underline */}
      <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-6 lg:gap-8">
        {navItems.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative text-[14px] font-medium tracking-[-0.01em] transition duration-300 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:transition-all after:duration-300 ${
                active ? 'after:w-full font-semibold' : 'after:w-0 hover:after:w-full'
              } ${
                overDarkHero
                  ? 'text-white/90 hover:text-white after:bg-white'
                  : 'text-zinc-700 hover:text-black after:bg-black'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        <span
          title={serverOnline ? 'C++ Crow Server Online' : 'C++ Crow Server Offline'}
          className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-medium ${
            overDarkHero ? 'text-zinc-200' : 'text-zinc-600'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              serverOnline
                ? overDarkHero
                  ? 'bg-white'
                  : 'bg-black'
                : 'border border-zinc-400 bg-transparent'
            }`}
          />
          <span className="hidden lg:inline">{serverOnline ? 'Live' : 'Offline'}</span>
        </span>

        <button
          type="button"
          onClick={onRefresh}
          title="Refresh data"
          className={`p-1.5 rounded-full transition ${
            overDarkHero ? 'hover:bg-white/15 text-white' : 'hover:bg-black/5 text-black'
          }`}
        >
          <Icon name="RefreshCw" className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onReset}
          className="rounded-full bg-blue-600 hover:bg-blue-700 px-3.5 py-1 text-xs font-semibold text-white transition"
        >
          Reset
        </button>
      </div>
    </header>
  );
}

/* Mobile Bottom/Sub Nav */
function MobileNavBar({ currentPage, onNavigate, totalSlots, activeTicketsCount }) {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'slots', label: `Slots (${totalSlots})` },
    { id: 'tickets', label: `Tickets (${activeTicketsCount})` },
  ];

  return (
    <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] glass-nav-light rounded-full p-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const active = currentPage === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${
              active ? 'bg-black text-white' : 'text-zinc-600 hover:text-black'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================================
   PAGE 1: HOME
   ============================================================================ */
function HomePage({
  stats,
  tickets,
  slots = [],
  nowMs,
  syncedAtMs,
  vehicleNumber,
  setVehicleNumber,
  vehicleType,
  setVehicleType,
  selectedSlot,
  setSelectedSlot,
  submittingPark,
  onParkVehicle,
  exitInput,
  setExitInput,
  exitingVehicle,
  onExitVehicle,
  onNavigate,
  onFilterAndGoToSlots,
}) {
  const [tariff3D, setTariff3D] = useState({});
  const occupancyPct =
    stats.totalSlots > 0 ? Math.round((stats.occupiedSlots / stats.totalSlots) * 100) : 0;
  const availablePct = stats.totalSlots > 0 ? 100 - occupancyPct : 0;

  return (
    <motion.div
      key="page-home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Full-Bleed Monochrome Photographic Hero */}
      <section className="relative w-full h-[82vh] min-h-[600px] max-h-[780px] bg-black overflow-hidden flex items-end pb-16 md:pb-24">
        <SmartImage
          imgKey="homeHero"
          className="absolute inset-0 w-full h-full object-cover opacity-80 animate-hero-drift"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25" />

        <div className="relative z-10 max-w-6xl mx-auto w-full px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
              Smart Parking<br />Management
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-zinc-300">
              <span>{stats.totalSlots} Total Bays</span>
              <span className="text-zinc-600">|</span>
              <span>Car • Bike • Truck</span>
              <span className="text-zinc-600">|</span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="Clock" className="w-4 h-4 text-zinc-100" />
                Live C++ Crow Backend
              </span>
            </div>

            <p className="mt-4 max-w-lg text-sm md:text-base text-zinc-300 leading-relaxed">
              Automated slot allocation, 3D fleet telemetry, and real-time hourly billing across covered parking decks.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => onNavigate('slots')}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                <span>Parking Slots</span>
                <Icon name="ArrowRight" className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('tickets')}
                className="glass-overlay-pill inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white hover:bg-white/25 transition hover:-translate-y-0.5"
              >
                <span>Active Tickets ({tickets.length})</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Subtle animated scroll indicator */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden md:flex absolute bottom-6 right-10 z-10 items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-400"
        >
          <span>Scroll</span>
          <span>↓</span>
        </motion.div>
      </section>

      {/* Spacious Pure White Content Sections */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-24 space-y-24">
        {/* 1. Facility Overview KPIs */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-black/10 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Facility Status
              </p>
              <h2 className="mt-1.5 text-2xl md:text-3xl font-semibold tracking-tight text-black">
                Live Bay Overview
              </h2>
            </div>
            <p className="text-sm text-zinc-500">
              Updated automatically from the parking engine
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <TiltCard3D>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full rounded-2xl border border-black/10 bg-[#fcfcfc] p-7 sm:p-8 hover:border-black/25 hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Total Slots
                </p>
                <div className="mt-4 text-5xl font-semibold tracking-tight text-black">
                  <AnimatedNumber value={stats.totalSlots} />
                </div>
                <div className="mt-6 h-1.5 w-full rounded-full bg-zinc-200 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-black rounded-full"
                  />
                </div>
                <p className="mt-3 text-sm text-zinc-500">
                  {stats.cars?.total ?? 0} Cars • {stats.bikes?.total ?? 0} Bikes • {stats.trucks?.total ?? 0} Trucks
                </p>
              </motion.div>
            </TiltCard3D>

            <TiltCard3D>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.06 }}
                className="h-full rounded-2xl border border-black/10 bg-[#fcfcfc] p-7 sm:p-8 hover:border-black/25 hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Available Slots
                  </p>
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-black bg-white" />
                </div>
                <div className="mt-4 text-5xl font-semibold tracking-tight text-black">
                  <AnimatedNumber value={stats.availableSlots} />
                </div>
                <div className="mt-6 h-1.5 w-full rounded-full bg-zinc-200 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${availablePct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-black rounded-full"
                  />
                </div>
                <p className="mt-3 text-sm text-zinc-500">
                  {availablePct}% of facility open for immediate entry
                </p>
              </motion.div>
            </TiltCard3D>

            <TiltCard3D>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12 }}
                className="h-full rounded-2xl border border-black/10 bg-[#fcfcfc] p-7 sm:p-8 hover:border-black/25 hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Occupied Slots
                  </p>
                  <span className="h-2.5 w-2.5 rounded-full bg-black" />
                </div>
                <div className="mt-4 text-5xl font-semibold tracking-tight text-black">
                  <AnimatedNumber value={stats.occupiedSlots} />
                </div>
                <div className="mt-6 h-1.5 w-full rounded-full bg-zinc-200 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${occupancyPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-black rounded-full"
                  />
                </div>
                <p className="mt-3 text-sm text-zinc-500">
                  {occupancyPct}% current utilization rate
                </p>
              </motion.div>
            </TiltCard3D>
          </div>

          {/* Quick Nav Pill to 2D Floor Map in Parking Slots */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-black/8 mt-4">
            <span className="text-xs text-zinc-500">
              Live automated bay sensor telemetry • 20 active bays
            </span>
            <button
              type="button"
              onClick={() => onNavigate('slots')}
              className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white transition shadow-sm w-fit"
            >
              <Icon name="Map" className="w-3.5 h-3.5" />
              <span>Explore 2D Aerial Floor Map ➔</span>
            </button>
          </div>
        </section>

        {/* 2. Gate Operations: Park Vehicle & Exit Vehicle */}
        <section className="space-y-8">
          <div className="border-b border-black/10 pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Gate Operations
            </p>
            <h2 className="mt-1.5 text-2xl md:text-3xl font-semibold tracking-tight text-black">
              Vehicle Entry & Exit
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Park Vehicle Card */}
            <div id="park-vehicle-card" className="rounded-[24px] border border-black/10 bg-white p-7 sm:p-9 shadow-[0_20px_50px_rgba(15,23,42,0.05)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-black/8 pb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-black">Park Vehicle</h3>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      Assigns the nearest compatible bay and issues a ticket
                    </p>
                  </div>
                  <Icon name="LogIn" className="w-5 h-5 text-zinc-400" />
                </div>

                <form onSubmit={onParkVehicle} className="mt-6 space-y-6">
                  {selectedSlot && (
                    <div className="flex items-center justify-between rounded-xl border border-black/15 bg-zinc-50 px-4 py-3 text-xs">
                      <span className="font-medium text-black">
                        Selected target bay: <span className="font-mono font-bold">[{selectedSlot.slotLabel}]</span> ({selectedSlot.type})
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedSlot(null)}
                        className="font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Reset to Auto
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        Live 3D Vehicle Stage
                      </span>
                      <span className="font-mono text-xs text-zinc-500">
                        {vehicleType} • ₹{VEHICLE_META[vehicleType].rate}/hr
                      </span>
                    </div>
                    <Vehicle3DCanvas
                      type={vehicleType}
                      className="h-44 w-full rounded-2xl border border-black/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-3">
                      Vehicle Category
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Car', 'Bike', 'Truck'].map((type) => {
                        const active = vehicleType === type;
                        const freeCount =
                          type === 'Car'
                            ? stats.cars?.available ?? 0
                            : type === 'Bike'
                            ? stats.bikes?.available ?? 0
                            : stats.trucks?.available ?? 0;

                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setVehicleType(type);
                              if (selectedSlot && selectedSlot.type !== type) setSelectedSlot(null);
                            }}
                            className={`group rounded-2xl overflow-hidden border text-left transition-all ${
                              active
                                ? 'border-black ring-2 ring-black/10 bg-zinc-50'
                                : 'border-black/10 bg-white hover:border-black/30'
                            }`}
                          >
                            <div className="h-20 w-full overflow-hidden bg-zinc-100">
                              <SmartImage
                                imgKey={type}
                                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                                  active ? 'grayscale-0' : 'grayscale-[40%]'
                                }`}
                              />
                            </div>
                            <div className="p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-black">{type}</span>
                                <span className="font-mono text-xs text-zinc-500">
                                  ₹{VEHICLE_META[type].rate}
                                </span>
                              </div>
                              <div className="mt-0.5 text-xs text-zinc-500">
                                {freeCount} free
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-2">
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. KA-01-AB-1234"
                      className="w-full rounded-xl border border-black/15 bg-[#fcfcfc] px-4 py-3.5 font-mono text-sm font-semibold uppercase text-black placeholder:font-sans placeholder:font-normal placeholder:normal-case placeholder:text-zinc-400 focus:border-black focus:bg-white focus:outline-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPark}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3.5 text-sm font-semibold text-white transition disabled:opacity-50"
                  >
                    {submittingPark
                      ? 'Assigning Bay...'
                      : selectedSlot
                      ? `Park ${vehicleType} in [${selectedSlot.slotLabel}]`
                      : `Park ${vehicleType}`}
                  </button>
                </form>
              </div>
            </div>

            {/* Exit Vehicle Card */}
            <div className="rounded-[24px] border border-black/10 bg-white p-7 sm:p-9 shadow-[0_20px_50px_rgba(15,23,42,0.05)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-black/8 pb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-black">Exit Vehicle</h3>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      Closes the active ticket, frees the slot, and bills duration
                    </p>
                  </div>
                  <Icon name="LogOut" className="w-5 h-5 text-zinc-400" />
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onExitVehicle();
                  }}
                  className="mt-6 space-y-6"
                >
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-2">
                      Vehicle Number to Checkout
                    </label>
                    <input
                      type="text"
                      list="home-exit-list"
                      value={exitInput}
                      onChange={(e) => setExitInput(e.target.value.toUpperCase())}
                      placeholder="Type or select parked vehicle..."
                      className="w-full rounded-xl border border-black/15 bg-[#fcfcfc] px-4 py-3.5 font-mono text-sm font-semibold uppercase text-black placeholder:font-sans placeholder:font-normal placeholder:normal-case placeholder:text-zinc-400 focus:border-black focus:bg-white focus:outline-none transition"
                    />
                    <datalist id="home-exit-list">
                      {tickets.map((t) => (
                        <option key={t.ticketId} value={t.vehicleNumber}>
                          [{t.slotLabel}] • {t.vehicleType}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        Currently Parked ({tickets.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('tickets')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        View All Tickets →
                      </button>
                    </div>

                    {tickets.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-black/15 bg-[#fcfcfc] px-4 py-6 text-center text-sm text-zinc-500">
                        No vehicles currently parked.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2.5 max-h-32 overflow-y-auto">
                        {tickets.slice(0, 6).map((t) => {
                          const selected = exitInput === t.vehicleNumber;
                          return (
                            <button
                              key={t.ticketId}
                              type="button"
                              onClick={() => setExitInput(t.vehicleNumber)}
                              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-mono font-medium transition ${
                                selected
                                  ? 'bg-black text-white border-black'
                                  : 'bg-[#fcfcfc] text-black border-black/10 hover:border-black/35'
                              }`}
                            >
                              <span className={selected ? 'text-zinc-300' : 'text-zinc-400'}>
                                {t.slotLabel}
                              </span>
                              <span>{t.vehicleNumber}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!!exitingVehicle}
                    className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-3.5 text-sm font-semibold text-white transition disabled:opacity-50"
                  >
                    {exitingVehicle ? 'Processing Checkout...' : 'Exit & Calculate Bill'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Tariff & Capacity Summary */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-black/10 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Pricing & Capacity
              </p>
              <h2 className="mt-1.5 text-2xl md:text-3xl font-semibold tracking-tight text-black">
                Tariff & Capacity Summary
              </h2>
            </div>
            <p className="text-sm text-zinc-500">
              Rounded upward to complete hours • 1 hour minimum
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {[
              { type: 'Car', data: stats.cars },
              { type: 'Bike', data: stats.bikes },
              { type: 'Truck', data: stats.trucks },
            ].map(({ type, data }) => {
              const meta = VEHICLE_META[type];
              const total = data?.total ?? 0;
              const avail = data?.available ?? 0;
              const occ = data?.occupied ?? 0;
              const pct = total > 0 ? Math.round((occ / total) * 100) : 0;

              const is3D = !!tariff3D[type];

              return (
                <TiltCard3D key={type}>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="group h-full rounded-2xl border border-black/10 bg-[#fcfcfc] overflow-hidden flex flex-col justify-between transition hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-zinc-200">
                      {is3D ? (
                        <Vehicle3DCanvas type={type} compact className="h-full w-full" />
                      ) : (
                        <SmartImage
                          imgKey={type}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setTariff3D((prev) => ({ ...prev, [type]: !prev[type] }))
                        }
                        className="absolute top-3 right-3 z-20 rounded-full bg-black/75 backdrop-blur-md border border-white/20 px-3 py-1 font-mono text-[11px] font-medium text-white hover:bg-black transition"
                      >
                        {is3D ? 'Photo' : '3D View'}
                      </button>
                    </div>

                  <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-xl font-semibold text-black">{type}</h3>
                        <span className="font-mono text-lg font-semibold text-black">
                          ₹{meta.rate}/hr
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{meta.zone}</p>

                      <div className="mt-5 space-y-2.5 text-sm">
                        <div className="flex justify-between border-b border-black/8 pb-2.5">
                          <span className="text-zinc-500">Available</span>
                          <span className="font-medium text-black">{avail} of {total}</span>
                        </div>
                        <div className="flex justify-between border-b border-black/8 pb-2.5">
                          <span className="text-zinc-500">Occupied</span>
                          <span className="font-medium text-black">{occ} ({pct}%)</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onFilterAndGoToSlots(type)}
                      className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition"
                    >
                      Inspect {type} Slots
                    </button>
                  </div>
                  </motion.div>
                </TiltCard3D>
              );
            })}
          </div>
        </section>
      </div>
    </motion.div>
  );
}

/* ============================================================================
   PAGE 2: PARKING SLOTS (Spacious Slot Details & Zone Layout)
   ============================================================================ */
function ParkingSlotsPage({
  slots,
  stats,
  loading,
  typeFilter,
  setTypeFilter,
  exitingVehicle,
  onExitVehicle,
  onParkInSpecificSlot,
  nowMs,
  syncedAtMs,
}) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('2d');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedSlotId, setInspectedSlotId] = useState(null);
  const [inspector3D, setInspector3D] = useState(true);
  const [quickPlate, setQuickPlate] = useState('');
  const [quickParking, setQuickParking] = useState(false);

  const deltaSec = Math.max(0, Math.floor((nowMs - syncedAtMs) / 1000));

  const filteredSlots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return slots.filter((s) => {
      if (typeFilter !== 'All' && s.type !== typeFilter) return false;
      if (statusFilter === 'Available' && !s.isAvailable) return false;
      if (statusFilter === 'Occupied' && s.isAvailable) return false;
      if (q) {
        const matchLabel = s.slotLabel.toLowerCase().includes(q);
        const matchPlate = s.vehicle?.number?.toLowerCase().includes(q);
        const matchType = s.type.toLowerCase().includes(q);
        if (!matchLabel && !matchPlate && !matchType) return false;
      }
      return true;
    });
  }, [slots, typeFilter, statusFilter, searchQuery]);

  const groupedZones = useMemo(() => {
    const groups = {};
    filteredSlots.forEach((slot) => {
      const zone = slot.slotLabel.charAt(0) || 'A';
      if (!groups[zone]) groups[zone] = [];
      groups[zone].push(slot);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredSlots]);

  const inspectedSlot = useMemo(
    () => slots.find((s) => s.slotId === inspectedSlotId) || null,
    [slots, inspectedSlotId]
  );

  const handleQuickPark = async (e) => {
    e.preventDefault();
    if (!inspectedSlot || !quickPlate.trim()) return;
    setQuickParking(true);
    const ok = await onParkInSpecificSlot(quickPlate.trim().toUpperCase(), inspectedSlot.type, inspectedSlot.slotId);
    setQuickParking(false);
    if (ok) setQuickPlate('');
  };

  return (
    <motion.div
      key="page-slots"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-6xl mx-auto px-6 md:px-10 pt-28 pb-24 space-y-12"
    >
      {/* Editorial Photo Header */}
      <section className="relative rounded-[28px] overflow-hidden bg-black h-56 md:h-64 flex items-end">
        <SmartImage
          imgKey="slotsHero"
          className="absolute inset-0 w-full h-full object-cover opacity-65 animate-hero-drift"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />
        <div className="relative z-10 w-full p-7 md:p-9 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
              Floor Map & Telemetry
            </p>
            <h1 className="mt-1.5 text-3xl md:text-4xl font-semibold tracking-tight text-white">
              Parking Slots Directory
            </h1>
          </div>
          <div className="flex items-center gap-6 text-sm text-white">
            <div>
              <span className="font-semibold text-xl">
                <AnimatedNumber value={stats.availableSlots} />
              </span>
              <span className="ml-2 text-zinc-300">Available</span>
            </div>
            <span className="text-zinc-600">|</span>
            <div>
              <span className="font-semibold text-xl">
                <AnimatedNumber value={stats.occupiedSlots} />
              </span>
              <span className="ml-2 text-zinc-300">Occupied</span>
            </div>
          </div>
        </div>
      </section>

      {/* Deck Occupancy Quick-Filter Strip */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { type: 'Car', label: 'Car Decks (A–C)', data: stats.cars },
          { type: 'Bike', label: 'Two-Wheeler Deck (D)', data: stats.bikes },
          { type: 'Truck', label: 'Heavy Bays (E)', data: stats.trucks },
        ].map(({ type, label, data }) => {
          const total = data?.total ?? 0;
          const avail = data?.available ?? 0;
          const occ = data?.occupied ?? 0;
          const pct = total > 0 ? Math.round((occ / total) * 100) : 0;
          const active = typeFilter === type;

          return (
            <TiltCard3D key={type} maxTilt={4}>
              <button
                type="button"
                onClick={() => setTypeFilter(active ? 'All' : type)}
                className={`w-full text-left rounded-2xl border p-5 transition ${
                  active
                    ? 'border-black bg-white ring-2 ring-black/15 shadow-[0_14px_34px_rgba(15,23,42,0.08)]'
                    : 'border-black/10 bg-[#fcfcfc] hover:border-black/30 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    {label}
                  </span>
                  <Icon name={VEHICLE_META[type].iconName} className="w-4 h-4 text-black" />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-semibold text-black">
                    <AnimatedNumber value={avail} />{' '}
                    <span className="text-sm font-normal text-zinc-500">of {total} free</span>
                  </span>
                  <span className="font-mono text-xs text-zinc-500">{pct}% full</span>
                </div>
                <div className="mt-3.5 h-1.5 w-full rounded-full bg-zinc-200 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-black rounded-full"
                  />
                </div>
              </button>
            </TiltCard3D>
          );
        })}
      </section>

      {/* Monochrome Filter & Search Bar */}
      <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-black/10 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1">
            {['All', 'Car', 'Bike', 'Truck'].map((type) => {
              const active = typeFilter === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
                  className={`relative rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    active ? 'text-white' : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="slots-type-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-black"
                    />
                  )}
                  <span className="relative z-10">{type}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1">
            {['All', 'Available', 'Occupied'].map((st) => {
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`relative rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    active ? 'text-white' : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="slots-status-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-black"
                    />
                  )}
                  <span className="relative z-10">{st}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* View Mode Toggle: 2D Floor Map vs Bay Grid */}
          <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={`relative rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === '2d' ? 'text-white' : 'text-zinc-600 hover:text-black'
              }`}
            >
              {viewMode === '2d' && (
                <motion.span
                  layoutId="slots-view-mode-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-black"
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon name="Map" className="w-3.5 h-3.5" />
                <span>2D Floor Map</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`relative rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === 'grid' ? 'text-white' : 'text-zinc-600 hover:text-black'
              }`}
            >
              {viewMode === 'grid' && (
                <motion.span
                  layoutId="slots-view-mode-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-black"
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon name="Grid" className="w-3.5 h-3.5" />
                <span>Bay Grid</span>
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Icon name="Search" className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bay (A2) or plate..."
              className="w-full rounded-full border border-black/15 bg-[#fcfcfc] pl-10 pr-4 py-2 text-xs text-black placeholder:text-zinc-400 focus:border-black focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* 2D Floor Map View */}
      {viewMode === '2d' && (
        <section className="space-y-6">
          <ParkingLot2DMap
            slots={filteredSlots}
            selectedSlotId={inspectedSlotId}
            inspectedSlotId={inspectedSlotId}
            onSelectSlot={(slot) => setInspectedSlotId(slot.slotId)}
            onInspectSlot={(slot) => setInspectedSlotId(slot.slotId)}
            onExitVehicle={onExitVehicle}
            nowMs={nowMs}
            syncedAtMs={syncedAtMs}
            exitingVehicle={exitingVehicle}
            title="Interactive 2D Deck Floor Map"
            subtitle="Architectural aerial view — click any bay to quick-park or inspect stay"
          />

          {/* Quick Inspector Drawer when a bay is selected in 2D view */}
          {inspectedSlot && (
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-lg">
                  {inspectedSlot.slotLabel}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-black">
                      Bay [{inspectedSlot.slotLabel}] • {inspectedSlot.type}
                    </h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        inspectedSlot.isAvailable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {inspectedSlot.isAvailable ? 'AVAILABLE' : 'OCCUPIED'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {inspectedSlot.isAvailable
                      ? `Ready for immediate parking at ₹${VEHICLE_META[inspectedSlot.type]?.rate}/hr`
                      : `Vehicle ${inspectedSlot.vehicle?.number} parked since ${inspectedSlot.vehicle?.entryTime}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {inspectedSlot.isAvailable ? (
                  <form onSubmit={handleQuickPark} className="flex items-center gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      value={quickPlate}
                      onChange={(e) => setQuickPlate(e.target.value.toUpperCase())}
                      placeholder="e.g. KA-05-AB-1234"
                      className="rounded-xl border border-black/15 px-3 py-2 text-xs font-mono uppercase text-black placeholder:text-zinc-400 focus:border-black focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={quickParking || !quickPlate.trim()}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 shadow transition whitespace-nowrap"
                    >
                      {quickParking ? 'Parking...' : 'Park Here'}
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    disabled={exitingVehicle === inspectedSlot.vehicle?.number}
                    onClick={() => onExitVehicle(inspectedSlot.vehicle?.number)}
                    className="rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 shadow transition flex items-center gap-2"
                  >
                    <Icon name="LogOut" className="w-4 h-4" />
                    <span>Exit Vehicle</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setInspectedSlotId(null)}
                  className="rounded-xl border border-black/15 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-100 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Zone Grid + Optional Inspector (when in 'grid' viewMode) */}
      {viewMode === 'grid' && (
        <div className={`grid grid-cols-1 ${inspectedSlot ? 'lg:grid-cols-12' : ''} gap-8 items-start`}>
        <div className={inspectedSlot ? 'lg:col-span-8 space-y-10' : 'space-y-10'}>
          {loading ? (
            <div className="rounded-2xl border border-black/10 bg-[#fcfcfc] p-12 text-center text-sm text-zinc-500">
              Loading parking bays...
            </div>
          ) : groupedZones.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 bg-[#fcfcfc] p-12 text-center text-sm text-zinc-500">
              No parking slots match your filters.
            </div>
          ) : (
            groupedZones.map(([zone, zoneSlots]) => {
              const openCount = zoneSlots.filter((s) => s.isAvailable).length;
              const zoneOccPct =
                zoneSlots.length > 0
                  ? Math.round(((zoneSlots.length - openCount) / zoneSlots.length) * 100)
                  : 0;
              return (
              <div key={zone} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-black">
                    {ZONE_LABELS[zone] || `Zone ${zone}`}
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:block w-20 h-1 rounded-full bg-zinc-200 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${zoneOccPct}%` }}
                        transition={{ duration: 0.45 }}
                        className="h-full bg-black rounded-full"
                      />
                    </div>
                    <span className="text-xs font-medium text-zinc-500">
                      {openCount} of {zoneSlots.length} open
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 perspective-stage">
                  {zoneSlots.map((slot, idx) => {
                    const isSelected = inspectedSlotId === slot.slotId;
                    const available = slot.isAvailable;
                    const v = slot.vehicle;
                    const liveDuration = v ? (Number(v.durationSeconds) || 0) + deltaSec : 0;

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.15) }}
                        key={slot.slotId}
                        onClick={() => setInspectedSlotId(isSelected ? null : slot.slotId)}
                        className={`cursor-pointer rounded-2xl border p-5 transition-colors ${
                          isSelected
                            ? 'border-black bg-white ring-2 ring-black/15 shadow-md'
                            : available
                            ? 'border-black/10 bg-[#fcfcfc] hover:border-black/35 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.06)]'
                            : 'border-black/15 bg-white hover:border-black/40 shadow-[0_6px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-semibold text-black">
                            [{slot.slotLabel}]
                          </span>
                          <span className="relative flex h-2.5 w-2.5 items-center justify-center" title={available ? 'Available' : 'Occupied'}>
                            {!available && (
                              <span className="absolute inline-flex h-full w-full rounded-full bg-black/30 animate-ping" />
                            )}
                            <span
                              className={`relative h-2.5 w-2.5 rounded-full ${
                                available ? 'border-2 border-black bg-white' : 'bg-black'
                              }`}
                            />
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                          <span>{slot.type} • Bay #{slot.slotId}</span>
                          <Icon name={VEHICLE_META[slot.type]?.iconName || 'Car'} className="w-3.5 h-3.5 text-zinc-400" />
                        </div>

                        {available ? (
                          <div className="mt-5 pt-3 border-t border-black/8 flex items-center justify-between text-xs">
                            <span className="font-medium text-zinc-600">Available</span>
                            <span className="font-semibold text-black">Details →</span>
                          </div>
                        ) : (
                          <div className="mt-4 pt-3 border-t border-black/8 space-y-1">
                            <div className="font-mono text-xs font-semibold text-black truncate">
                              {v?.number}
                            </div>
                            <div className="flex items-center justify-between text-xs text-zinc-500">
                              <span>{formatDuration(liveDuration)}</span>
                              <span className="font-semibold text-black">₹{v?.currentBill}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              );
            })
          )}
        </div>

        {/* Monochrome Slot Details Drawer */}
        <AnimatePresence>
          {inspectedSlot && (
            <motion.aside
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="lg:col-span-4 rounded-[24px] border border-black/10 bg-white overflow-hidden shadow-[0_24px_60px_rgba(15,23,42,0.1)] sticky top-24"
            >
              <div className="relative h-44 bg-zinc-900">
                {inspector3D ? (
                  <Vehicle3DCanvas type={inspectedSlot.type} compact className="h-full w-full" />
                ) : (
                  <SmartImage imgKey={inspectedSlot.type} className="w-full h-full object-cover" />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <button
                  type="button"
                  onClick={() => setInspector3D((prev) => !prev)}
                  className="absolute top-3 left-3 z-20 rounded-full bg-black/65 backdrop-blur-md border border-white/20 px-3 py-1 font-mono text-[11px] text-white hover:bg-black transition"
                >
                  {inspector3D ? 'Photo' : '3D Model'}
                </button>
                <button
                  type="button"
                  onClick={() => setInspectedSlotId(null)}
                  className="absolute top-3 right-3 z-20 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition"
                >
                  <Icon name="X" className="w-4 h-4" fallback="✕" />
                </button>
                <div className="pointer-events-none absolute bottom-3 left-5 z-20 flex items-center gap-2.5 text-white">
                  <span className="font-mono text-lg font-semibold">[{inspectedSlot.slotLabel}]</span>
                  <span className="text-xs font-medium text-zinc-300">
                    • {inspectedSlot.isAvailable ? 'Available' : 'Occupied'}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-black/8 pb-2.5">
                    <span className="text-zinc-500">Slot Number</span>
                    <span className="font-mono font-medium text-black">
                      #{inspectedSlot.slotId} ({inspectedSlot.slotLabel})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-black/8 pb-2.5">
                    <span className="text-zinc-500">Vehicle Class</span>
                    <span className="font-medium text-black">{inspectedSlot.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/8 pb-2.5">
                    <span className="text-zinc-500">Hourly Tariff</span>
                    <span className="font-mono font-medium text-black">
                      ₹{VEHICLE_META[inspectedSlot.type]?.rate}/hr
                    </span>
                  </div>
                </div>

                {inspectedSlot.isAvailable ? (
                  <form onSubmit={handleQuickPark} className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Park Directly in [{inspectedSlot.slotLabel}]
                    </label>
                    <input
                      type="text"
                      value={quickPlate}
                      onChange={(e) => setQuickPlate(e.target.value.toUpperCase())}
                      placeholder={`Enter ${inspectedSlot.type} plate...`}
                      className="w-full rounded-xl border border-black/15 bg-[#fcfcfc] px-3.5 py-2.5 font-mono text-sm font-semibold uppercase text-black focus:border-black focus:bg-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={quickParking || !quickPlate.trim()}
                      className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
                    >
                      {quickParking ? 'Parking...' : `Park in [${inspectedSlot.slotLabel}]`}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2.5 rounded-2xl border border-black/10 bg-[#fcfcfc] p-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Ticket ID</span>
                        <span className="font-mono font-semibold text-black">
                          #{inspectedSlot.vehicle?.ticketId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Vehicle Plate</span>
                        <span className="font-mono font-semibold text-black">
                          {inspectedSlot.vehicle?.number}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Entry Time</span>
                        <span className="text-zinc-700 text-xs">{inspectedSlot.vehicle?.entryTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Duration</span>
                        <span className="font-mono font-medium text-black">
                          {formatDuration((Number(inspectedSlot.vehicle?.durationSeconds) || 0) + deltaSec)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-black/8 pt-2.5">
                        <span className="font-medium text-black">Current Bill</span>
                        <span className="font-mono text-base font-semibold text-black">
                          ₹{inspectedSlot.vehicle?.currentBill}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={exitingVehicle === inspectedSlot.vehicle?.number}
                      onClick={() => onExitVehicle(inspectedSlot.vehicle?.number)}
                      className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
                    >
                      {exitingVehicle === inspectedSlot.vehicle?.number
                        ? 'Processing...'
                        : 'Exit & Calculate Bill'}
                    </button>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
      )}
    </motion.div>
  );
}

/* ============================================================================
   PAGE 3: ACTIVE TICKETS (Clean Monochrome Table + Colored Checkout Buttons)
   ============================================================================ */
function ActiveTicketsPage({
  tickets,
  exitingVehicle,
  onExitVehicle,
  onNavigate,
  nowMs,
  syncedAtMs,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('ticketAsc');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticket3D, setTicket3D] = useState(true);

  const deltaSec = Math.max(0, Math.floor((nowMs - syncedAtMs) / 1000));

  const totalAccruedBill = useMemo(
    () => tickets.reduce((sum, t) => sum + (Number(t.currentBill) || 0), 0),
    [tickets]
  );

  const avgDurationSec = useMemo(() => {
    if (tickets.length === 0) return 0;
    const sum = tickets.reduce((acc, t) => acc + (Number(t.durationSeconds) || 0) + deltaSec, 0);
    return Math.round(sum / tickets.length);
  }, [tickets, deltaSec]);

  const peakTicket = useMemo(() => {
    if (tickets.length === 0) return null;
    return [...tickets].sort((a, b) => (Number(b.currentBill) || 0) - (Number(a.currentBill) || 0))[0];
  }, [tickets]);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.ticketId === selectedTicketId) || null,
    [tickets, selectedTicketId]
  );

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = tickets.filter((t) => {
      if (typeFilter !== 'All' && t.vehicleType !== typeFilter) return false;
      if (!q) return true;
      return (
        t.vehicleNumber.toLowerCase().includes(q) ||
        t.slotLabel.toLowerCase().includes(q) ||
        String(t.ticketId).includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'billDesc') return b.currentBill - a.currentBill;
      if (sortBy === 'durationDesc') return b.durationSeconds - a.durationSeconds;
      return a.ticketId - b.ticketId;
    });
  }, [tickets, typeFilter, searchQuery, sortBy]);

  return (
    <motion.div
      key="page-tickets"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-6xl mx-auto px-6 md:px-10 pt-28 pb-24 space-y-10"
    >
      {/* Editorial Photo Header */}
      <section className="relative rounded-[28px] overflow-hidden bg-black h-56 md:h-64 flex items-end">
        <SmartImage
          imgKey="ticketsHero"
          className="absolute inset-0 w-full h-full object-cover opacity-65 animate-hero-drift"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />
        <div className="relative z-10 w-full p-7 md:p-9 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
              Billing Ledger
            </p>
            <h1 className="mt-1.5 text-3xl md:text-4xl font-semibold tracking-tight text-white">
              Active Parking Tickets
            </h1>
          </div>
          <div className="flex items-center gap-6 text-sm text-white">
            <div>
              <span className="font-semibold text-xl">
                <AnimatedNumber value={tickets.length} />
              </span>
              <span className="ml-2 text-zinc-300">Active</span>
            </div>
            <span className="text-zinc-600">|</span>
            <div>
              <span className="font-mono font-semibold text-xl">
                <AnimatedNumber value={totalAccruedBill} prefix="₹" />
              </span>
              <span className="ml-2 text-zinc-300">Accrued</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Billing Telemetry Summary Strip */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <TiltCard3D maxTilt={4}>
          <div className="h-full rounded-2xl border border-black/10 bg-[#fcfcfc] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Active Sessions
            </p>
            <div className="mt-3 text-3xl font-semibold text-black">
              <AnimatedNumber value={tickets.length} />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {tickets.filter((t) => t.vehicleType === 'Car').length} Cars •{' '}
              {tickets.filter((t) => t.vehicleType === 'Bike').length} Bikes •{' '}
              {tickets.filter((t) => t.vehicleType === 'Truck').length} Trucks
            </p>
          </div>
        </TiltCard3D>

        <TiltCard3D maxTilt={4}>
          <div className="h-full rounded-2xl border border-black/10 bg-[#fcfcfc] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Accrued Revenue
            </p>
            <div className="mt-3 font-mono text-3xl font-semibold text-black">
              <AnimatedNumber value={totalAccruedBill} prefix="₹" />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Avg stay duration: {formatDuration(avgDurationSec)}
            </p>
          </div>
        </TiltCard3D>

        <TiltCard3D maxTilt={4}>
          <div className="h-full rounded-2xl border border-black/10 bg-[#fcfcfc] p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Highest Active Bill
              </p>
              {peakTicket ? (
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <span className="font-mono text-lg font-semibold text-black truncate">
                    {peakTicket.vehicleNumber}
                  </span>
                  <span className="font-mono text-2xl font-semibold text-black">
                    ₹{peakTicket.currentBill}
                  </span>
                </div>
              ) : (
                <div className="mt-3 text-xl font-semibold text-zinc-400">No active stays</div>
              )}
            </div>
            {peakTicket && (
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-black/8">
                <span className="font-mono text-xs text-zinc-500">
                  #{peakTicket.ticketId} • [{peakTicket.slotLabel}]
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTicketId(peakTicket.ticketId)}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1 text-xs font-semibold text-white transition"
                >
                  Inspect 3D
                </button>
              </div>
            )}
          </div>
        </TiltCard3D>
      </section>

      {/* Toolbar */}
      <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-black/10 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1">
            {['All', 'Car', 'Bike', 'Truck'].map((type) => {
              const active = typeFilter === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
                  className={`relative rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    active ? 'text-white' : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="tickets-type-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-black"
                    />
                  )}
                  <span className="relative z-10">{type}</span>
                </button>
              );
            })}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-full border border-black/15 bg-[#fcfcfc] px-4 py-1.5 text-xs font-medium text-black focus:border-black focus:outline-none"
          >
            <option value="ticketAsc">Sort: Ticket #</option>
            <option value="billDesc">Sort: Highest Bill</option>
            <option value="durationDesc">Sort: Longest Stay</option>
          </select>
        </div>

        <div className="relative w-full lg:w-72">
          <Icon name="Search" className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket #, plate, or slot..."
            className="w-full rounded-full border border-black/15 bg-[#fcfcfc] pl-10 pr-4 py-2 text-xs text-black placeholder:text-zinc-400 focus:border-black focus:bg-white focus:outline-none"
          />
        </div>
      </section>

      {/* Clean Monochrome Table (MovieGo+ style) */}
      {filteredTickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-[#fcfcfc] px-6 py-14 text-center space-y-4">
          <p className="text-base font-medium text-black">No active tickets found</p>
          <p className="text-sm text-zinc-500">
            Vehicles parked from the entry gate will appear here with live billing timers.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white transition"
          >
            Park a Vehicle
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${selectedTicket ? 'lg:grid-cols-12' : ''} gap-8 items-start`}>
          <div className={`${selectedTicket ? 'lg:col-span-8' : ''} overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.04)]`}>
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 bg-[#fcfcfc] text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  <th className="px-6 py-4">Ticket</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Bay</th>
                  <th className="px-6 py-4">Entry Time</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Bill</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/8">
                {filteredTickets.map((t, idx) => {
                  const liveDuration = (Number(t.durationSeconds) || 0) + deltaSec;
                  const hourProgressPct = Math.round(((liveDuration % 3600) / 3600) * 100);
                  const isExiting = exitingVehicle === t.vehicleNumber;
                  const isSelected = selectedTicketId === t.ticketId;

                  return (
                    <motion.tr
                      key={t.ticketId}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: Math.min(idx * 0.03, 0.18) }}
                      onClick={() => setSelectedTicketId(isSelected ? null : t.ticketId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-zinc-100/80' : 'hover:bg-zinc-50/80'
                      }`}
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-zinc-500">
                        #{t.ticketId}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <SmartImage
                            imgKey={t.vehicleType}
                            className="h-10 w-16 shrink-0 rounded-lg object-cover border border-black/10"
                          />
                          <span className="font-mono text-sm font-semibold text-black">
                            {t.vehicleNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-700 whitespace-nowrap">
                        {t.vehicleType} <span className="text-xs text-zinc-400">(₹{t.ratePerHour}/h)</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-black">
                        [{t.slotLabel}]
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500 whitespace-nowrap">
                        {t.entryTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-black">
                          {formatDuration(liveDuration)}
                        </div>
                        <div className="mt-1.5 h-1 w-20 rounded-full bg-zinc-200 overflow-hidden">
                          <div
                            className="h-full bg-black rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(6, hourProgressPct)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-black">
                        ₹{t.currentBill}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          disabled={isExiting}
                          onClick={(e) => {
                            e.stopPropagation();
                            onExitVehicle(t.vehicleNumber);
                          }}
                          className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50"
                        >
                          {isExiting ? 'Exiting...' : 'Exit & Pay'}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <AnimatePresence>
            {selectedTicket && (
              <motion.aside
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="lg:col-span-4 rounded-[24px] border border-black/10 bg-white overflow-hidden shadow-[0_24px_60px_rgba(15,23,42,0.1)] sticky top-24"
              >
                <div className="relative h-44 bg-zinc-900">
                  {ticket3D ? (
                    <Vehicle3DCanvas type={selectedTicket.vehicleType} compact className="h-full w-full" />
                  ) : (
                    <SmartImage imgKey={selectedTicket.vehicleType} className="w-full h-full object-cover" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <button
                    type="button"
                    onClick={() => setTicket3D((prev) => !prev)}
                    className="absolute top-3 left-3 z-20 rounded-full bg-black/65 backdrop-blur-md border border-white/20 px-3 py-1 font-mono text-[11px] text-white hover:bg-black transition"
                  >
                    {ticket3D ? 'Photo' : '3D Model'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTicketId(null)}
                    className="absolute top-3 right-3 z-20 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition"
                  >
                    <Icon name="X" className="w-4 h-4" fallback="✕" />
                  </button>
                  <div className="pointer-events-none absolute bottom-3 left-5 z-20 flex items-center gap-2.5 text-white">
                    <span className="font-mono text-lg font-semibold">#{selectedTicket.ticketId}</span>
                    <span className="text-xs font-medium text-zinc-300">
                      • Bay [{selectedTicket.slotLabel}]
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between border-b border-black/8 pb-2.5">
                      <span className="text-zinc-500">Vehicle Plate</span>
                      <span className="font-mono font-semibold text-black">{selectedTicket.vehicleNumber}</span>
                    </div>
                    <div className="flex justify-between border-b border-black/8 pb-2.5">
                      <span className="text-zinc-500">Category</span>
                      <span className="font-medium text-black">
                        {selectedTicket.vehicleType} (₹{selectedTicket.ratePerHour}/hr)
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-black/8 pb-2.5">
                      <span className="text-zinc-500">Elapsed Stay</span>
                      <span className="font-mono font-medium text-black">
                        {formatDuration((Number(selectedTicket.durationSeconds) || 0) + deltaSec)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="font-medium text-black">Current Bill</span>
                      <span className="font-mono text-lg font-semibold text-black">
                        ₹{selectedTicket.currentBill}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={exitingVehicle === selectedTicket.vehicleNumber}
                    onClick={() => onExitVehicle(selectedTicket.vehicleNumber)}
                    className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
                  >
                    {exitingVehicle === selectedTicket.vehicleNumber
                      ? 'Processing Checkout...'
                      : 'Exit & Calculate Bill'}
                  </button>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

/* ============================================================================
   MONOCHROME RECEIPT MODAL
   ============================================================================ */
function ExitReceiptModal({ receipt, onClose }) {
  return (
    <AnimatePresence>
      {receipt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-[24px] border border-black/15 bg-white overflow-hidden shadow-2xl"
          >
            <div className="bg-black px-6 py-5 text-white flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  Exit Receipt
                </p>
                <h3 className="mt-0.5 text-lg font-semibold">Vehicle Checked Out</h3>
              </div>
              <Icon name="CheckCircle2" className="w-6 h-6 text-white" />
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-black/8 pb-2.5">
                  <span className="text-zinc-500">Ticket ID</span>
                  <span className="font-mono font-semibold text-black">#{receipt.ticketId}</span>
                </div>
                <div className="flex justify-between border-b border-black/8 pb-2.5">
                  <span className="text-zinc-500">Vehicle Number</span>
                  <span className="font-mono font-semibold text-black">{receipt.vehicleNumber}</span>
                </div>
                <div className="flex justify-between border-b border-black/8 pb-2.5">
                  <span className="text-zinc-500">Category</span>
                  <span className="font-medium text-black">{receipt.vehicleType}</span>
                </div>
                <div className="flex justify-between border-b border-black/8 pb-2.5">
                  <span className="text-zinc-500">Bay Released</span>
                  <span className="font-mono font-medium text-black">
                    [{receipt.slotLabel}] (Slot #{receipt.slotId})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Duration</span>
                  <span className="font-mono font-medium text-black">
                    {formatDuration(receipt.durationSeconds)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-black/10 bg-[#fcfcfc] px-5 py-4">
                <span className="text-sm font-medium text-zinc-600">Total Bill Paid</span>
                <span className="font-mono text-2xl font-semibold text-black">₹{receipt.bill}</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================================
   FOOTER (Matching MovieGo+ Dark Editorial Footer)
   ============================================================================ */
function Footer({ onNavigate }) {
  return (
    <footer className="w-full bg-gradient-to-b from-black via-[#141414] to-[#2b2b2b] px-6 py-16 text-white">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-lg font-bold tracking-tight">
            <span className="grid grid-cols-2 gap-0.5 p-1 rounded-md border border-zinc-400">
              <span className="h-1.5 w-1.5 bg-white rounded-[1px]" />
              <span className="h-1.5 w-1.5 bg-zinc-500 rounded-[1px]" />
              <span className="h-1.5 w-1.5 bg-zinc-500 rounded-[1px]" />
              <span className="h-1.5 w-1.5 bg-white rounded-[1px]" />
            </span>
            <span>BayGrid</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-400">
            C++ Crow REST Backend & React 3D Dashboard
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm text-zinc-300">
          <button type="button" onClick={() => onNavigate('home')} className="hover:text-white transition">
            Home
          </button>
          <button type="button" onClick={() => onNavigate('slots')} className="hover:text-white transition">
            Parking Slots
          </button>
          <button type="button" onClick={() => onNavigate('tickets')} className="hover:text-white transition">
            Active Tickets
          </button>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================================
   MAIN APPLICATION SHELL
   ============================================================================ */
function App() {
  const [currentPage, setCurrentPage] = useState(getPageFromHash);
  const [scrolled, setScrolled] = useState(false);

  const [slots, setSlots] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    totalSlots: 0,
    availableSlots: 0,
    occupiedSlots: 0,
    cars: { total: 0, available: 0, occupied: 0, ratePerHour: 50 },
    bikes: { total: 0, available: 0, occupied: 0, ratePerHour: 20 },
    trucks: { total: 0, available: 0, occupied: 0, ratePerHour: 150 },
  });

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [exitInput, setExitInput] = useState('');
  const [slotsTypeFilter, setSlotsTypeFilter] = useState('All');

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submittingPark, setSubmittingPark] = useState(false);
  const [exitingVehicle, setExitingVehicle] = useState(null);
  const [serverOnline, setServerOnline] = useState(true);
  const [toast, setToast] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const [syncedAtMs, setSyncedAtMs] = useState(Date.now());
  const [nowMs, setNowMs] = useState(Date.now());
  const toastTimerRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navigate = useCallback((pageId) => {
    setCurrentPage(pageId);
    const hashMap = { home: '#/', slots: '#/slots', tickets: '#/tickets' };
    if (window.location.hash !== hashMap[pageId]) {
      window.location.hash = hashMap[pageId];
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onHashChange = () => setCurrentPage(getPageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const showToast = useCallback((message, kind = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, kind, id: Date.now() });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchDashboardData = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const [slotsRes, ticketsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/parking/slots`),
        fetch(`${API_BASE}/api/tickets`),
        fetch(`${API_BASE}/api/stats`),
      ]);

      if (!slotsRes.ok || !ticketsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch from C++ Crow backend');
      }

      const [slotsData, ticketsData, statsData] = await Promise.all([
        slotsRes.json(),
        ticketsRes.json(),
        statsRes.json(),
      ]);

      setSlots(Array.isArray(slotsData) ? slotsData : []);
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      setStats(statsData);
      setSyncedAtMs(Date.now());
      setServerOnline(true);
    } catch (err) {
      setServerOnline(false);
    } finally {
      setLoading(false);
      if (manual) setTimeout(() => setIsRefreshing(false), 300);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const poll = setInterval(() => fetchDashboardData(false), 3000);
    return () => clearInterval(poll);
  }, [fetchDashboardData]);

  useEffect(() => {
    const tick = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const parkVehicleRequest = async (plate, type, slotId = null) => {
    const cleaned = plate.trim().toUpperCase();
    if (!cleaned) {
      showToast('Please enter a vehicle registration number.', 'error');
      return false;
    }

    setSubmittingPark(true);
    try {
      const payload = { vehicleNumber: cleaned, type };
      if (slotId) payload.slotId = slotId;

      const res = await fetch(`${API_BASE}/api/vehicles/park`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(
          `Parked ${data.vehicleType} ${data.vehicleNumber} in [${data.slotLabel}] (Ticket #${data.ticketId})`,
          'success'
        );
        await fetchDashboardData(false);
        return true;
      }
      showToast(data.message || 'Unable to park vehicle.', 'error');
      return false;
    } catch (err) {
      showToast('Unable to reach C++ Crow backend.', 'error');
      return false;
    } finally {
      setSubmittingPark(false);
    }
  };

  const handleParkSubmit = async (e) => {
    e.preventDefault();
    const targetId = selectedSlot && selectedSlot.type === vehicleType ? selectedSlot.slotId : null;
    const ok = await parkVehicleRequest(vehicleNumber, vehicleType, targetId);
    if (ok) {
      setVehicleNumber('');
      setSelectedSlot(null);
    }
  };

  const handleExitVehicle = async (targetNumber) => {
    const cleaned = (targetNumber || exitInput).trim().toUpperCase();
    if (!cleaned) {
      showToast('Enter or select a vehicle number to exit.', 'error');
      return;
    }

    setExitingVehicle(cleaned);
    try {
      const res = await fetch(`${API_BASE}/api/vehicles/exit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleNumber: cleaned }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setReceipt(data);
        if (!targetNumber) setExitInput('');
        showToast(`Vehicle ${data.vehicleNumber} exited. Bill: ₹${data.bill}`, 'success');
        await fetchDashboardData(false);
      } else {
        showToast(data.message || 'Vehicle exit failed.', 'error');
      }
    } catch (err) {
      showToast('Unable to reach C++ Crow backend.', 'error');
    } finally {
      setExitingVehicle(null);
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedSlot(null);
        showToast('Parking lot reset to demo state (20 slots).', 'success');
        await fetchDashboardData(true);
      }
    } catch (err) {
      showToast('Failed to reset parking lot.', 'error');
    }
  };

  const handleFilterAndGoToSlots = (type) => {
    setSlotsTypeFilter(type);
    navigate('slots');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-black pb-16 md:pb-0">
      {/* Minimal Monochrome Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-20 right-5 z-50 max-w-sm"
          >
            <div className="flex items-center gap-3 rounded-xl border border-black/15 bg-black px-4 py-3 text-xs font-medium text-white shadow-xl">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  toast.kind === 'error' ? 'border border-white bg-transparent' : 'bg-white'
                }`}
              />
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="ml-2 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <ExitReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />

      {/* Top Floating Capsule Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={navigate}
        scrolled={scrolled}
        totalSlots={stats.totalSlots}
        activeTicketsCount={tickets.length}
        serverOnline={serverOnline}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchDashboardData(true)}
        onReset={handleResetDemo}
      />

      <MobileNavBar
        currentPage={currentPage}
        onNavigate={navigate}
        totalSlots={stats.totalSlots}
        activeTicketsCount={tickets.length}
      />

      {/* Page Router */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <HomePage
              stats={stats}
              tickets={tickets}
              slots={slots}
              nowMs={nowMs}
              syncedAtMs={syncedAtMs}
              vehicleNumber={vehicleNumber}
              setVehicleNumber={setVehicleNumber}
              vehicleType={vehicleType}
              setVehicleType={setVehicleType}
              selectedSlot={selectedSlot}
              setSelectedSlot={setSelectedSlot}
              submittingPark={submittingPark}
              onParkVehicle={handleParkSubmit}
              exitInput={exitInput}
              setExitInput={setExitInput}
              exitingVehicle={exitingVehicle}
              onExitVehicle={handleExitVehicle}
              onNavigate={navigate}
              onFilterAndGoToSlots={handleFilterAndGoToSlots}
            />
          )}

          {currentPage === 'slots' && (
            <ParkingSlotsPage
              slots={slots}
              stats={stats}
              loading={loading}
              typeFilter={slotsTypeFilter}
              setTypeFilter={setSlotsTypeFilter}
              exitingVehicle={exitingVehicle}
              onExitVehicle={handleExitVehicle}
              onParkInSpecificSlot={parkVehicleRequest}
              nowMs={nowMs}
              syncedAtMs={syncedAtMs}
            />
          )}

          {currentPage === 'tickets' && (
            <ActiveTicketsPage
              tickets={tickets}
              exitingVehicle={exitingVehicle}
              onExitVehicle={handleExitVehicle}
              onNavigate={navigate}
              nowMs={nowMs}
              syncedAtMs={syncedAtMs}
            />
          )}
        </AnimatePresence>
      </main>

      <Footer onNavigate={navigate} />
    </div>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App />);
}
