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
const STAGE_X: Record<Stage, number> = { mixer: 15, baker: 43, icer: 64, packer: 83 };
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
        className="relative w-full max-w-[1400px] overflow-hidden rounded-2xl shadow-2xl"
        style={{ aspectRatio: "1584 / 552" }}
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
             style={{ right: "2%", top: "12%", minWidth: "84px" }}>
          <div className="text-[8px] leading-tight opacity-80 sm:text-[10px]">TODAY'S PRODUCTION</div>
          <div className="text-base font-bold tabular-nums sm:text-xl">{produced.toString().padStart(5, "0")}</div>
        </div>

        {/* ============ MIXER — whisk rotating in pink batter bowl ============ */}
        <svg
          className="pointer-events-none absolute"
          viewBox="0 0 40 40"
          preserveAspectRatio="xMidYMid meet"
          style={{
            left: "13%",
            top: "32%",
            width: "5%",
            height: "30%",
            transformOrigin: "50% 30%",
            animation: "spin 0.9s linear infinite",
          }}
        >
          <g stroke="#e8eef2" strokeWidth="1.6" fill="none" strokeLinecap="round">
            <path d="M20 10 C 10 18, 10 30, 20 34" />
            <path d="M20 10 C 30 18, 30 30, 20 34" />
            <path d="M20 10 C 15 18, 15 30, 20 34" />
            <path d="M20 10 C 25 18, 25 30, 20 34" />
          </g>
        </svg>

        {/* Batter ripple in bowl */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            left: "12%", top: "60%", width: "7%", height: "5%",
            background: "radial-gradient(ellipse, rgba(255,120,160,0.5), rgba(255,120,160,0) 70%)",
            animation: "ovenPulse 0.6s ease-in-out infinite",
          }}
        />

        {/* ============ BAKER — flickering oven glow + steam from chimney ============ */}
        <div className="pointer-events-none absolute rounded-md"
             style={{
               left: `${STAGE_X.baker - 5}%`, top: "38%", width: "10%", height: "22%",
               background: "radial-gradient(ellipse, rgba(255,170,80,0.6), rgba(255,120,40,0) 70%)",
               mixBlendMode: "screen", animation: "ovenPulse 0.9s ease-in-out infinite",
             }} />
        <div className="pointer-events-none absolute" style={{ left: `${STAGE_X.baker - 0.5}%`, top: "0%", width: "2%", height: "20%" }}>
          <span className="steam" style={{ animationDelay: "0s" }} />
          <span className="steam" style={{ animationDelay: "0.7s" }} />
          <span className="steam" style={{ animationDelay: "1.4s" }} />
        </div>

        {/* ============ ICER — continuous pink icing stream from cone tip to cupcake ============ */}
        <div
          className="pointer-events-none absolute overflow-hidden"
          style={{
            left: "63.6%",
            top: "44%",
            width: "1.2%",
            height: "12%",
            background:
              "repeating-linear-gradient(to bottom, #ff5fa2 0px, #ff5fa2 6px, #ff8ec0 6px, #ff8ec0 12px)",
            borderRadius: "999px",
            boxShadow: "0 0 6px rgba(255,95,162,0.7)",
            animation: "icingFlow 0.35s linear infinite",
          }}
        />

        {/* Packer chimney steam */}
        <div className="pointer-events-none absolute" style={{ left: `${STAGE_X.packer - 0.5}%`, top: "0%", width: "2%", height: "20%" }}>
          <span className="steam" style={{ animationDelay: "0.3s" }} />
          <span className="steam" style={{ animationDelay: "1.1s" }} />
        </div>

        {/* ============ PACKER — pressing plunger glow ============ */}
        <div className="pointer-events-none absolute rounded-md"
             style={{
               left: `${STAGE_X.packer - 4}%`, top: "38%", width: "8%", height: "22%",
               background: "radial-gradient(ellipse, rgba(255,200,220,0.55), rgba(255,200,220,0) 70%)",
               mixBlendMode: "screen", animation: "press 0.9s ease-in-out infinite",
             }} />


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
          @keyframes shipOut {
            0% { transform: translateX(0); opacity: 0 }
            10% { opacity: 1 }
            90% { opacity: 1 }
            100% { transform: translateX(420%); opacity: 0 }
          }
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
          @keyframes icingFlow {
            0%   { background-position: 0 0 }
            100% { background-position: 0 12px }
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
