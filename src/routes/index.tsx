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

type Batch = {
  id: number;
  stage: Stage;
  progress: number;
  moving: boolean;
  beltX: number;
};

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
              if (!target) {
                producedDelta += 1;
                continue;
              }
              if (!occupied[target]) {
                occupied[target] = true;
                next.push({ ...b, stage: target, moving: false, progress: 0, beltX: targetX });
              } else {
                next.push({ ...b, beltX: targetX });
              }
            } else {
              next.push({ ...b, beltX: nx });
            }
          } else {
            const p = b.progress + dt / STAGE_TIME;
            if (p >= 1) {
              next.push({ ...b, progress: 1, moving: true, beltX: STAGE_X[b.stage] });
              occupied[b.stage] = false;
            } else {
              next.push({ ...b, progress: p });
            }
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
            next.push({
              id: idRef.current++,
              stage: "mixer",
              progress: 0,
              moving: false,
              beltX: STAGE_X.mixer,
            });
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
        <img
          src={factoryAsset.url}
          alt="Factory floor"
          className="absolute inset-0 h-full w-full select-none"
          draggable={false}
        />

        {/* Status pill */}
        <div
          className="absolute flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white sm:text-xs"
          style={{ right: "2%", top: "2.5%" }}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.7)]" />
          ALL SYSTEMS NORMAL
        </div>

        {/* Production counter */}
        <div
          className="absolute rounded-md bg-emerald-900/85 px-2 py-1 text-right font-mono text-white shadow"
          style={{ right: "2%", top: "9%", minWidth: "84px" }}
        >
          <div className="text-[8px] leading-tight opacity-80 sm:text-[10px]">TODAY'S PRODUCTION</div>
          <div className="text-base font-bold tabular-nums sm:text-xl">
            {produced.toString().padStart(5, "0")}
          </div>
        </div>

        {/* MIXER — spinning whisk */}
        <div
          className="pointer-events-none absolute flex items-center justify-center"
          style={{ left: `${STAGE_X.mixer}%`, top: "48%", transform: "translate(-50%, -50%)" }}
        >
          <span className="block animate-[spin_0.8s_linear_infinite] text-2xl sm:text-4xl">🌀</span>
        </div>
        {/* mixer glow */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            left: `${STAGE_X.mixer - 4}%`,
            top: "44%",
            width: "8%",
            height: "10%",
            background: "radial-gradient(circle, rgba(255,182,193,0.55), rgba(255,182,193,0) 70%)",
            mixBlendMode: "screen",
            animation: "machinePulse 1.2s ease-in-out infinite",
          }}
        />

        {/* BAKER — flame/heat shimmer + muffin */}
        <div
          className="pointer-events-none absolute flex items-center justify-center"
          style={{ left: `${STAGE_X.baker}%`, top: "47%", transform: "translate(-50%, -50%)" }}
        >
          <span className="block animate-[bake_0.9s_ease-in-out_infinite] text-xl sm:text-3xl">🔥</span>
        </div>
        <div
          className="pointer-events-none absolute rounded-md"
          style={{
            left: `${STAGE_X.baker - 5}%`,
            top: "42%",
            width: "10%",
            height: "14%",
            background: "radial-gradient(ellipse, rgba(255,170,80,0.6), rgba(255,120,40,0) 70%)",
            mixBlendMode: "screen",
            animation: "ovenPulse 1.1s ease-in-out infinite",
          }}
        />

        {/* ICER — rotating cupcake getting iced */}
        <div
          className="pointer-events-none absolute"
          style={{ left: `${STAGE_X.icer}%`, top: "50%", transform: "translate(-50%, -50%)" }}
        >
          <span className="inline-block animate-[spin_1.2s_linear_infinite] text-2xl sm:text-4xl">🧁</span>
        </div>
        {/* pink icing drip */}
        <div
          className="pointer-events-none absolute"
          style={{ left: `${STAGE_X.icer}%`, top: "40%", width: "0", height: "0" }}
        >
          <div className="drip" style={{ animationDelay: "0s" }} />
          <div className="drip" style={{ animationDelay: "0.5s" }} />
          <div className="drip" style={{ animationDelay: "1s" }} />
        </div>

        {/* PACKER — gift box thumping */}
        <div
          className="pointer-events-none absolute"
          style={{ left: `${STAGE_X.packer}%`, top: "48%", transform: "translate(-50%, -50%)" }}
        >
          <span className="inline-block animate-[pack_0.7s_ease-in-out_infinite] text-2xl sm:text-4xl">🎁</span>
        </div>
        {/* outgoing boxes drifting on the right belt */}
        <div className="pointer-events-none absolute" style={{ left: "72%", top: "76%", width: "26%", height: "8%" }}>
          <span className="absolute text-xl sm:text-2xl" style={{ animation: "shipOut 3s linear infinite" }}>📦</span>
          <span className="absolute text-xl sm:text-2xl" style={{ animation: "shipOut 3s linear infinite", animationDelay: "1s" }}>📦</span>
          <span className="absolute text-xl sm:text-2xl" style={{ animation: "shipOut 3s linear infinite", animationDelay: "2s" }}>📦</span>
        </div>

        {/* Batches moving on the main belt */}
        {batches
          .filter((b) => b.moving)
          .map((b) => (
            <div
              key={b.id}
              className="pointer-events-none absolute"
              style={{
                left: `${b.beltX}%`,
                top: "76%",
                transform: "translate(-50%, -50%)",
                fontSize: "clamp(18px, 2.8vw, 34px)",
                filter: "drop-shadow(0 2px 1px rgba(0,0,0,0.4))",
              }}
            >
              {batchEmoji(b.stage)}
            </div>
          ))}

        <style>{`
          @keyframes machinePulse { 0%,100% { opacity:.4 } 50% { opacity:1 } }
          @keyframes ovenPulse { 0%,100% { opacity:.45 } 50% { opacity:.95 } }
          @keyframes bake { 0%,100% { transform: scale(1) translateY(0) } 50% { transform: scale(1.15) translateY(-2px) } }
          @keyframes pack { 0%,100% { transform: scale(1) rotate(-3deg) } 50% { transform: scale(1.1) rotate(3deg) } }
          @keyframes shipOut {
            0% { transform: translateX(0); opacity: 0 }
            10% { opacity: 1 }
            90% { opacity: 1 }
            100% { transform: translateX(120%); opacity: 0 }
          }
          .drip {
            position: absolute;
            left: -4px;
            top: 0;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ff5fa2;
            box-shadow: 0 0 6px rgba(255,95,162,0.7);
            animation: drip 1.4s ease-in infinite;
          }
          @keyframes drip {
            0% { transform: translateY(0) scale(0.6); opacity: 0 }
            20% { opacity: 1 }
            100% { transform: translateY(34px) scale(1); opacity: 0 }
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
function batchEmoji(s: Stage) {
  switch (s) {
    case "mixer": return "🥣";
    case "baker": return "🧁";
    case "icer":  return "🧁";
    case "packer":return "📦";
  }
}
function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${accent}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}
