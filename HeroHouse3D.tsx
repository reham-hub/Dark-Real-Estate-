import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

/**
 * Animated low-poly 3D house built from simple geometric shapes.
 * Browser-only: load it lazily behind <ClientOnly>.
 */

// Three.js cannot consume CSS variables directly; resolve semantic colors after mount.
const COLOR_TOKENS = {
  ivory: "--card",
  sand: "--ivory",
  copper: "--primary",
  copperDark: "--foreground",
  gold: "--primary",
  sky: "--muted-foreground",
  navy: "--foreground",
  sage: "--muted-foreground",
  sageDeep: "--foreground",
  coral: "--primary",
  periwinkle: "--ivory",
};
type SceneColors = Record<keyof typeof COLOR_TOKENS, string>;

const easeOutBack = (t: number) => {
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type Vec3 = [number, number, number];

/** A part that pops into place (drops + springs) after `delay` seconds. */
function Piece({
  delay,
  start,
  animate,
  position,
  rotation,
  children,
}: {
  delay: number;
  start: number;
  animate: boolean;
  position?: Vec3;
  rotation?: Vec3;
  children: ReactNode;
}) {
  const inner = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = inner.current;
    if (!g) return;
    const t = animate ? Math.min(Math.max((clock.elapsedTime - start - delay) / 0.75, 0), 1) : 1;
    g.scale.setScalar(Math.max(easeOutBack(t), 0.0001));
    g.position.y = (1 - easeOutCubic(t)) * 1.6;
  });
  return (
    <group position={position ?? [0, 0, 0]} rotation={rotation ?? [0, 0, 0]}>
      <group ref={inner} scale={animate ? 0.0001 : 1}>
        {children}
      </group>
    </group>
  );
}

function Mat({ color, rough = 0.75 }: { color: string; rough?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={0.02} flatShading />;
}

/** A floating geometric accent that bobs and spins. */
function Floater({
  position,
  speed = 1,
  children,
}: {
  position: Vec3;
  speed?: number;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime * speed + phase;
    g.position.y = Math.sin(t) * 0.18;
    g.rotation.x = t * 0.4;
    g.rotation.y = t * 0.6;
  });
  return (
    <group position={position}>
      <group ref={ref}>{children}</group>
    </group>
  );
}

function House({
  animate,
  start,
  colors: C,
}: {
  animate: boolean;
  start: number;
  colors: SceneColors;
}) {
  const root = useRef<THREE.Group>(null);
  const roofGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.35, 0);
    s.lineTo(1.35, 0);
    s.lineTo(0, 1.05);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 2.1, bevelEnabled: false });
    g.translate(0, 0, -1.05);
    return g;
  }, []);
  const archGeo = useMemo(() => new THREE.CircleGeometry(0.26, 24, 0, Math.PI), []);

  useFrame(({ clock, pointer }) => {
    const g = root.current;
    if (!g || !animate) return;
    const t = clock.elapsedTime;
    const targetY = -0.5 + Math.sin(t * 0.22) * 0.32 + pointer.x * 0.18;
    g.rotation.y += (targetY - g.rotation.y) * 0.05;
    g.rotation.x += (-pointer.y * 0.05 - g.rotation.x) * 0.05;
    g.position.y = Math.sin(t * 0.8) * 0.06;
  });

  const P = (d: number) => ({ delay: d, start, animate });

  return (
    <group ref={root} rotation={[0, -0.5, 0]}>
      {/* Hexagon ground */}
      <Piece {...P(0)}>
        <mesh position={[0, -0.12, 0]} receiveShadow>
          <cylinderGeometry args={[3.3, 3.3, 0.24, 6]} />
          <Mat color={C.sage} />
        </mesh>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[3.3, 3.05, 0.32, 6]} />
          <Mat color={C.sand} />
        </mesh>
      </Piece>

      {/* Path */}
      <Piece {...P(0.15)} position={[-0.3, 0.01, 2.0]}>
        <mesh receiveShadow>
          <boxGeometry args={[0.7, 0.04, 1.6]} />
          <Mat color={C.sand} />
        </mesh>
      </Piece>

      {/* Main block */}
      <Piece {...P(0.3)} position={[-0.3, 0.75, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.3, 1.5, 1.9]} />
          <Mat color={C.ivory} />
        </mesh>
      </Piece>

      {/* Tower (Yemeni style) */}
      <Piece {...P(0.5)} position={[1.45, 1.35, -0.25]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.15, 2.7, 1.15]} />
          <Mat color={C.sand} />
        </mesh>
        <mesh position={[0, 1.42, 0]} castShadow>
          <boxGeometry args={[1.3, 0.14, 1.3]} />
          <Mat color={C.ivory} />
        </mesh>
        {[-0.45, 0, 0.45].map((x) => (
          <mesh key={x} position={[x, 1.6, 0.5]} castShadow>
            <boxGeometry args={[0.2, 0.22, 0.2]} />
            <Mat color={C.ivory} />
          </mesh>
        ))}
        {/* Qamariya arched window */}
        <mesh position={[0, 0.45, 0.585]}>
          <boxGeometry args={[0.52, 0.55, 0.04]} />
          <Mat color={C.sky} rough={0.3} />
        </mesh>
        <mesh geometry={archGeo} position={[0, 0.725, 0.6]}>
          <meshStandardMaterial color={C.gold} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.55, 0.585]}>
          <boxGeometry args={[0.5, 0.5, 0.04]} />
          <Mat color={C.sky} rough={0.3} />
        </mesh>
        <mesh position={[0.585, 0.45, 0]}>
          <boxGeometry args={[0.04, 0.5, 0.45]} />
          <Mat color={C.sky} rough={0.3} />
        </mesh>
      </Piece>

      {/* Roof */}
      <Piece {...P(0.7)} position={[-0.3, 1.5, 0]}>
        <mesh geometry={roofGeo} castShadow receiveShadow>
          <Mat color={C.copper} />
        </mesh>
        <mesh position={[0.7, 0.75, -0.3]} castShadow>
          <boxGeometry args={[0.28, 0.6, 0.28]} />
          <Mat color={C.coral} />
        </mesh>
      </Piece>

      {/* Front details: door, windows, step */}
      <Piece {...P(0.9)} position={[-0.3, 0, 0.96]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.5, 0.9, 0.05]} />
          <Mat color={C.navy} rough={0.5} />
        </mesh>
        <mesh position={[0.15, 0.5, 0.05]}>
          <sphereGeometry args={[0.04, 10, 10]} />
          <meshStandardMaterial color={C.gold} metalness={0.5} roughness={0.3} />
        </mesh>
        {[-0.72, 0.72].map((x) => (
          <group key={x} position={[x, 0.85, 0]}>
            <mesh>
              <boxGeometry args={[0.46, 0.42, 0.05]} />
              <Mat color={C.sky} rough={0.3} />
            </mesh>
            <mesh position={[0, -0.25, 0.04]}>
              <boxGeometry args={[0.56, 0.06, 0.1]} />
              <Mat color={C.gold} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.05, 0.18]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.1, 0.35]} />
          <Mat color={C.ivory} />
        </mesh>
      </Piece>

      {/* Trees and bushes */}
      <Piece {...P(1.05)} position={[-2.25, 0, 0.6]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.6, 6]} />
          <Mat color={C.copperDark} />
        </mesh>
        <mesh position={[0, 1.0, 0]} castShadow>
          <coneGeometry args={[0.5, 1.2, 6]} />
          <Mat color={C.sageDeep} />
        </mesh>
      </Piece>
      <Piece {...P(1.15)} position={[1.9, 0, 1.55]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
          <Mat color={C.copperDark} />
        </mesh>
        <mesh position={[0, 0.78, 0]} castShadow>
          <icosahedronGeometry args={[0.45, 0]} />
          <Mat color={C.sageDeep} />
        </mesh>
      </Piece>
      <Piece {...P(1.25)} position={[-1.7, 0.18, -1.6]}>
        <mesh castShadow>
          <dodecahedronGeometry args={[0.28, 0]} />
          <Mat color={C.sageDeep} />
        </mesh>
        <mesh position={[0.4, -0.04, 0.2]} castShadow>
          <dodecahedronGeometry args={[0.2, 0]} />
          <Mat color={C.coral} />
        </mesh>
      </Piece>

      {/* Floating geometric accents */}
      <Piece {...P(1.4)}>
        <Floater position={[-2.6, 3.0, -0.6]} speed={0.9}>
          <mesh>
            <icosahedronGeometry args={[0.3, 0]} />
            <Mat color={C.gold} rough={0.45} />
          </mesh>
        </Floater>
        <Floater position={[2.9, 3.3, 0.6]} speed={0.7}>
          <mesh>
            <torusGeometry args={[0.24, 0.09, 10, 24]} />
            <Mat color={C.coral} rough={0.5} />
          </mesh>
        </Floater>
        <Floater position={[0.2, 3.9, -1.6]} speed={1.1}>
          <mesh>
            <octahedronGeometry args={[0.26, 0]} />
            <Mat color={C.periwinkle} rough={0.45} />
          </mesh>
        </Floater>
        <Floater position={[-1.2, 3.6, 1.6]} speed={0.8}>
          <mesh>
            <sphereGeometry args={[0.16, 16, 16]} />
            <Mat color={C.sky} rough={0.4} />
          </mesh>
        </Floater>
        <Floater position={[2.6, 1.9, -1.8]} speed={1.0}>
          <mesh>
            <coneGeometry args={[0.2, 0.36, 4]} />
            <Mat color={C.copper} rough={0.5} />
          </mesh>
        </Floater>
      </Piece>
    </group>
  );
}

/** Keeps the whole house in frame for any canvas shape (phone strip or desktop half). */
function CameraRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const dist = aspect < 1.25 ? 13.8 * (1.25 / aspect) * 1.15 : 13.8;
    const dir = new THREE.Vector3(1, 0.62, 1.25).normalize();
    camera.position.copy(dir.multiplyScalar(dist));
    camera.lookAt(0, 1.45, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function ReadySignal({ target }: { target: React.RefObject<HTMLDivElement | null> }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    target.current?.setAttribute("data-scene-ready", "true");
  });
  return null;
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function HeroHouse3D({ className }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [C, setColors] = useState<SceneColors | null>(null);
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    setColors(
      Object.fromEntries(
        Object.entries(COLOR_TOKENS).map(([key, token]) => [
          key,
          css.getPropertyValue(token).trim(),
        ]),
      ) as SceneColors,
    );
  }, []);
  const [animate] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  // Start building after the opening screen has faded (it covers ~1.6s of a fresh load).
  const [start] = useState(() => Math.max(0.25, 1.7 - performance.now() / 1000));

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e?.isIntersecting ?? true));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className={className} aria-hidden>
      <SceneBoundary>
        {C && (
          <Canvas
            shadows
            flat
            dpr={[1, 1.75]}
            frameloop={visible ? "always" : "never"}
            camera={{ fov: 28, near: 0.5, far: 60, position: [9, 6, 11] }}
            gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          >
            <CameraRig />
            <ambientLight intensity={0.55} />
            <hemisphereLight args={[C.ivory, C.navy, 0.6]} />
            <directionalLight
              position={[5, 9, 6]}
              intensity={1.6}
              color={C.ivory}
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-camera-left={-5}
              shadow-camera-right={5}
              shadow-camera-top={6}
              shadow-camera-bottom={-5}
              shadow-bias={-0.0005}
            />
            <directionalLight position={[-6, 3, -4]} intensity={0.45} color={C.sand} />
            <Environment resolution={64}>
              <Lightformer
                intensity={1.2}
                position={[0, 6, 0]}
                scale={[10, 10, 1]}
                rotation-x={Math.PI / 2}
              />
              <Lightformer
                intensity={0.6}
                color={C.ivory}
                position={[-6, 2, 2]}
                rotation-y={Math.PI / 2}
                scale={[10, 2, 1]}
              />
            </Environment>
            <House animate={animate} start={start} colors={C} />
            <ReadySignal target={wrap} />
          </Canvas>
        )}
      </SceneBoundary>
    </div>
  );
}
