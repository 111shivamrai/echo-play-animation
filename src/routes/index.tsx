import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import factoryAsset from "@/assets/factory.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Muffin Factory" },
      { name: "description", content: "An always-running muffin factory floor." },
    ],
  }),
  component: Index,
});

type Stage = "mixer" | "baker" | "icer" | "packer";
const STAGES: Stage[] = ["mixer", "baker", "icer", "packer"];
const STAGE_X: Record<Stage, number> = { mixer: 14, baker: 30, icer: 50, packer: 66 };
const STAGE_TIME = 1500;
const PRICE = 12;

type Batch = { id: number; stage: Stage; progress: number; moving: boolean; beltX: number };

function Index() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [produced, setProduced] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const idRef = useRef(1);
  const lastSpawn = useRef(0);
  const lastTick = useRef(performance.now());

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(100, now - lastTick.current);
      lastTick.current = now;

      setBatches((prev) => {
        const next: Batch[] = [];
        let producedDelta = 0;
        const occupied: Record<Stage, boolean> = { mixer: false, baker: false, icer: false, packer: false };
        for (const b of prev) if (!b.moving) occupied[b.stage] = true;

        for (const b of prev) {
          if (b.moving) {
            const target = nextStage(b.stage);
            const targetX = target ? STAGE_X[target] : 95;
            const nx = b.beltX + (18 * dt) / 1000;
            if (nx >= targetX) {
              if (!target) { producedDelta += 1; continue; }
              if (!occupied[target]) {
                occupied[target] = true;
                next.push({ ...b, stage: target, moving: false, progress: 0, beltX: targetX });
              } else next.push({ ...b, beltX: targetX });
            } else next.push({ ...b, beltX: nx });
          } else {
            const p = b.progress + dt / STAGE_TIME;
            if (p >= 1) {
              next.push({ ...b, progress: 1, moving: true, beltX: STAGE_X[b.stage] });
              occupied[b.stage] = false;
            } else next.push({ ...b, progress: p });
          }
        }

        if (producedDelta > 0) {
          setProduced((v) => v + producedDelta);
          setRevenue((v) => v + producedDelta * PRICE);
        }

        lastSpawn.current += dt;
        if (lastSpawn.current >= 1100) {
          lastSpawn.current = 0;
          if (!next.some((b) => b.stage === "mixer" && !b.moving)) {
            next.push({ id: idRef.current++, stage: "mixer", progress: 0, moving: false, beltX: STAGE_X.mixer });
          }
        }
        return next;
      });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-4">
      <div
        className="relative w-full max-w-[1100px] overflow-hidden rounded-2xl shadow-2xl"
        style={{ aspectRatio: "744 / 496" }}
      >
        <img src={factoryAsset.url} alt="Factory floor" className="absolute inset-0 h-full w-full select-none" draggable={false} />

        {/* Status pill */}
        <div className="absolute flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white sm:text-xs"
             style={{ right: "2%", top: "2.5%" }}>
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.7)]" />
          ALL SYSTEMS NORMAL
        </div>

        {/* Production counter */}
        <div className="absolute rounded-md bg-emerald-900/85 px-2 py-1 text-right font-mono text-white shadow"
             style={{ right: "2%", top: "9%", minWidth: "84px" }}>
          <div className="text-[8px] leading-tight opacity-80 sm:text-[10px]">TODAY'S PRODUCTION</div>
          <div className="text-base font-bold tabular-nums sm:text-xl">{produced.toString().padStart(5, "0")}</div>
        </div>

        {/* ============ MIXER — rotating whisk over the bowl ============ */}
        <svg className="pointer-events-none absolute" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
             style={{ left: `${STAGE_X.mixer - 6}%`, top: "38%", width: "12%", height: "18%" }}>
          {/* batter ripples */}
          <circle cx="50" cy="70" r="22" fill="#f4a4c0" opacity="0.0">
            <animate attributeName="r" values="14;22;14" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.05;0.4" dur="1.6s" repeatCount="indefinite" />
          </circle>
          {/* whisk wires rotating */}
          <g style={{ transformOrigin: "50px 50px", animation: "spin 0.7s linear infinite" }}>
            <ellipse cx="50" cy="55" rx="10" ry="18" fill="none" stroke="#cfd8dc" strokeWidth="2" />
            <ellipse cx="50" cy="55" rx="10" ry="18" fill="none" stroke="#cfd8dc" strokeWidth="2" transform="rotate(60 50 55)" />
            <ellipse cx="50" cy="55" rx="10" ry="18" fill="none" stroke="#cfd8dc" strokeWidth="2" transform="rotate(120 50 55)" />
            <line x1="50" y1="10" x2="50" y2="38" stroke="#90a4ae" strokeWidth="3" />
          </g>
        </svg>

        {/* ============ BAKER — flickering oven glow + steam from chimney ============ */}
        <div className="pointer-events-none absolute rounded-md"
             style={{
               left: `${STAGE_X.baker - 5.5}%`, top: "42%", width: "11%", height: "15%",
               background: "radial-gradient(ellipse, rgba(255,170,80,0.65), rgba(255,120,40,0) 70%)",
               mixBlendMode: "screen", animation: "ovenPulse 0.9s ease-in-out infinite",
             }} />
        {/* steam puffs from chimney */}
        <div className="pointer-events-none absolute" style={{ left: `${STAGE_X.baker + 1}%`, top: "14%", width: "2%", height: "20%" }}>
          <span className="steam" style={{ animationDelay: "0s" }} />
          <span className="steam" style={{ animationDelay: "0.7s" }} />
          <span className="steam" style={{ animationDelay: "1.4s" }} />
        </div>

        {/* ============ ICER — rotating plate + pink icing drip ============ */}
        <svg className="pointer-events-none absolute" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
             style={{ left: `${STAGE_X.icer - 7}%`, top: "44%", width: "14%", height: "16%" }}>
          {/* rotating plate */}
          <g style={{ transformOrigin: "50px 75px", animation: "spin 2.5s linear infinite" }}>
            <ellipse cx="50" cy="75" rx="32" ry="8" fill="#ffffff" stroke="#cfd8dc" strokeWidth="1.5" />
            <ellipse cx="50" cy="73" rx="32" ry="6" fill="#f5f5f5" />
            {/* tick marks so rotation is visible */}
            <circle cx="20" cy="73" r="1.5" fill="#b0bec5" />
            <circle cx="80" cy="73" r="1.5" fill="#b0bec5" />
            <circle cx="50" cy="68" r="1.5" fill="#b0bec5" />
          </g>
        </svg>
        {/* icing nozzle drip */}
        <div className="pointer-events-none absolute" style={{ left: `${STAGE_X.icer}%`, top: "40%", width: 0, height: 0 }}>
          <span className="drip" style={{ animationDelay: "0s" }} />
          <span className="drip" style={{ animationDelay: "0.45s" }} />
          <span className="drip" style={{ animationDelay: "0.9s" }} />
        </div>

        {/* ============ PACKER — pressing plunger + boxes dropping ============ */}
        <svg className="pointer-events-none absolute" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
             style={{ left: `${STAGE_X.packer - 6}%`, top: "38%", width: "12%", height: "20%" }}>
          {/* plunger goes down/up */}
          <g style={{ animation: "press 0.9s ease-in-out infinite" }}>
            <rect x="42" y="10" width="16" height="30" fill="#90a4ae" stroke="#546e7a" strokeWidth="1.5" rx="2" />
            <rect x="38" y="38" width="24" height="6" fill="#455a64" rx="1" />
          </g>
        </svg>

        {/* Outgoing boxes drifting along right belt */}
        <div className="pointer-events-none absolute overflow-hidden" style={{ left: "72%", top: "70%", width: "26%", height: "14%" }}>
          <Box delay="0s" />
          <Box delay="1s" />
          <Box delay="2s" />
        </div>

        {/* Batches moving on the main belt (SVG cupcakes / boxes) */}
        {batches.filter((b) => b.moving).map((b) => (
          <div key={b.id} className="pointer-events-none absolute"
               style={{ left: `${b.beltX}%`, top: "76%", transform: "translate(-50%, -50%)", width: "5%", aspectRatio: "1/1" }}>
            {b.stage === "packer" ? <BoxSVG /> : <CupcakeSVG iced={b.stage === "icer"} />}
          </div>
        ))}

        <style>{`
          @keyframes spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }
          @keyframes ovenPulse { 0%,100% { opacity:.4 } 50% { opacity:.95 } }
          @keyframes press {
            0%,100% { transform: translateY(0) }
            50%     { transform: translateY(14px) }
          }
          .steam {
            position: absolute; left: 0; bottom: 0;
            width: 14px; height: 14px; border-radius: 50%;
            background: rgba(255,255,255,0.75); filter: blur(3px);
            animation: steamRise 2.1s ease-out infinite;
          }
          @keyframes steamRise {
            0%   { transform: translate(0,0) scale(0.6); opacity: 0 }
            20%  { opacity: 0.85 }
            100% { transform: translate(-10px,-70px) scale(1.7); opacity: 0 }
          }
          .drip {
            position: absolute; left: -4px; top: 0;
            width: 8px; height: 8px; border-radius: 50%;
            background: #ff5fa2; box-shadow: 0 0 6px rgba(255,95,162,0.7);
            animation: drip 1.3s ease-in infinite;
          }
          @keyframes drip {
            0%   { transform: translateY(0) scale(0.6); opacity: 0 }
            20%  { opacity: 1 }
            100% { transform: translateY(38px) scale(1); opacity: 0 }
          }
        `}</style>
      </div>

      <div className="grid w-full max-w-[1100px] grid-cols-2 gap-3 text-white sm:grid-cols-3">
        <Stat label="Produced Today" value={produced.toLocaleString()} accent="bg-amber-500/20 border-amber-400/40" />
        <Stat label="Revenue" value={`₹${revenue.toLocaleString()}`} accent="bg-emerald-500/20 border-emerald-400/40" />
        <Stat label="Status" value="All systems running" accent="bg-blue-500/20 border-blue-400/40" />
      </div>
    </div>
  );
}

function nextStage(s: Stage): Stage | null {
  const i = STAGES.indexOf(s);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null;
}

function CupcakeSVG({ iced = false }: { iced?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" style={{ filter: "drop-shadow(0 2px 1px rgba(0,0,0,0.4))" }}>
      {/* wrapper */}
      <path d="M10 22 L30 22 L27 38 L13 38 Z" fill="#c98a4b" stroke="#7a4a1f" strokeWidth="1" />
      <path d="M12 24 L14 38 M16 24 L17 38 M20 24 L20 38 M24 24 L23 38 M28 24 L26 38" stroke="#7a4a1f" strokeWidth="0.7" />
      {/* top muffin */}
      <path d="M8 22 C8 12, 32 12, 32 22 Z" fill="#e3b97b" stroke="#7a4a1f" strokeWidth="1" />
      {/* chocolate chips */}
      <circle cx="14" cy="19" r="1.4" fill="#4a2618" />
      <circle cx="20" cy="16" r="1.4" fill="#4a2618" />
      <circle cx="25" cy="20" r="1.4" fill="#4a2618" />
      {/* icing swirl */}
      {iced && (
        <>
          <path d="M11 18 C13 10, 27 10, 29 18 C26 14, 14 14, 11 18 Z" fill="#ff5fa2" />
          <circle cx="20" cy="11" r="2" fill="#ff8ec0" />
        </>
      )}
    </svg>
  );
}

function BoxSVG() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" style={{ filter: "drop-shadow(0 2px 1px rgba(0,0,0,0.4))" }}>
      <rect x="8" y="14" width="24" height="20" fill="#c98a4b" stroke="#7a4a1f" strokeWidth="1.2" />
      <rect x="8" y="14" width="24" height="4" fill="#a8702e" stroke="#7a4a1f" strokeWidth="1.2" />
      <line x1="20" y1="14" x2="20" y2="34" stroke="#7a4a1f" strokeWidth="1" />
    </svg>
  );
}

function Box({ delay }: { delay: string }) {
  return (
    <div className="absolute" style={{ top: "30%", left: 0, width: "16%", aspectRatio: "1/1", animation: "shipOut 3s linear infinite", animationDelay: delay }}>
      <BoxSVG />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${accent} text-white`}>
      <div className="text-[10px] uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}
