import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import factoryAsset from "@/assets/factory.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Muffin Factory" },
      { name: "description", content: "Run your muffin factory floor." },
    ],
  }),
  component: Index,
});

type Stage = "mixer" | "baker" | "icer" | "packer";
const STAGES: Stage[] = ["mixer", "baker", "icer", "packer"];

// Horizontal % position of each machine output on the belt
const STAGE_X: Record<Stage, number> = {
  mixer: 14,
  baker: 30,
  icer: 50,
  packer: 66,
};

const STAGE_TIME = 1500; // ms per stage to process
const PRICE = 12; // revenue per packed muffin
const DEMAND_PER_SEC = 1.2; // target throughput

type Batch = {
  id: number;
  stage: Stage;
  // 0..1 progress within the current stage's processing time
  progress: number;
  // when true, batch is ready to advance / moving on the belt
  moving: boolean;
  beltX: number; // % across belt while moving
};

function Index() {
  const [on, setOn] = useState<Record<Stage, boolean>>({
    mixer: true,
    baker: true,
    icer: true,
    packer: true,
  });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [produced, setProduced] = useState(0);
  const [demand, setDemand] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const idRef = useRef(1);
  const lastSpawn = useRef(0);
  const lastTick = useRef(performance.now());

  // Main game loop
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(100, now - lastTick.current);
      lastTick.current = now;

      // grow demand over time
      setDemand((d) => d + (DEMAND_PER_SEC * dt) / 1000);

      setBatches((prev) => {
        const next: Batch[] = [];
        let producedDelta = 0;

        // Track whether next stage already has a batch processing (simple capacity = 1)
        const occupied: Record<Stage, boolean> = {
          mixer: false,
          baker: false,
          icer: false,
          packer: false,
        };
        for (const b of prev) if (!b.moving) occupied[b.stage] = true;

        for (const b of prev) {
          if (b.moving) {
            // travel on belt toward next stage target X
            const targetStage = nextStage(b.stage);
            const targetX = targetStage ? STAGE_X[targetStage] : 95;
            const speed = 18; // % per second
            const nx = b.beltX + (speed * dt) / 1000;
            if (nx >= targetX) {
              if (!targetStage) {
                // exited factory — packed muffin shipped
                producedDelta += 1;
                continue;
              }
              if (!occupied[targetStage]) {
                occupied[targetStage] = true;
                next.push({ ...b, stage: targetStage, moving: false, progress: 0, beltX: targetX });
              } else {
                // wait at target
                next.push({ ...b, beltX: targetX });
              }
            } else {
              next.push({ ...b, beltX: nx });
            }
          } else {
            // processing at current stage (only if machine ON)
            if (on[b.stage]) {
              const p = b.progress + dt / STAGE_TIME;
              if (p >= 1) {
                // try to release onto belt
                next.push({ ...b, progress: 1, moving: true, beltX: STAGE_X[b.stage] });
                occupied[b.stage] = false;
              } else {
                next.push({ ...b, progress: p });
              }
            } else {
              next.push(b); // stalled
            }
          }
        }

        if (producedDelta > 0) {
          setProduced((v) => v + producedDelta);
          setRevenue((v) => v + producedDelta * PRICE);
        }

        // Spawn new batches into mixer
        lastSpawn.current += dt;
        const spawnEvery = 1100;
        if (lastSpawn.current >= spawnEvery) {
          lastSpawn.current = 0;
          if (on.mixer && !next.some((b) => b.stage === "mixer" && !b.moving)) {
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
  }, [on]);

  const fillRate = demand > 0 ? Math.min(100, (produced / demand) * 100) : 100;
  const allOn = STAGES.every((s) => on[s]);

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

        {/* Status pill — top right */}
        <div
          className="absolute flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white sm:text-xs"
          style={{ right: "2%", top: "2.5%" }}
        >
          <span
            className={`h-2 w-2 rounded-full ${allOn ? "bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.7)]" : "bg-red-400"}`}
          />
          {allOn ? "ALL SYSTEMS NORMAL" : "SYSTEM HALTED"}
        </div>

        {/* Production counter — top right under status */}
        <div
          className="absolute rounded-md bg-emerald-900/85 px-2 py-1 text-right font-mono text-white shadow"
          style={{ right: "2%", top: "9%", minWidth: "84px" }}
        >
          <div className="text-[8px] leading-tight opacity-80 sm:text-[10px]">TODAY'S PRODUCTION</div>
          <div className="text-base font-bold tabular-nums sm:text-xl">
            {produced.toString().padStart(5, "0")}
          </div>
        </div>

        {/* Machine status overlays — show processing flash */}
        {STAGES.map((s) => {
          const processing = batches.some((b) => b.stage === s && !b.moving && on[s]);
          return (
            <div
              key={s}
              className="pointer-events-none absolute rounded-full"
              style={{
                left: `${STAGE_X[s] - 4}%`,
                top: "44%",
                width: "8%",
                height: "10%",
                background:
                  on[s] && processing
                    ? "radial-gradient(circle, rgba(255,230,120,0.55), rgba(255,200,80,0) 70%)"
                    : "transparent",
                animation: on[s] && processing ? "pulse 0.9s ease-in-out infinite" : undefined,
                mixBlendMode: "screen",
              }}
            />
          );
        })}

        {/* Moving batches on belt */}
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

        {/* Toggle buttons under each machine */}
        {STAGES.map((s) => (
          <button
            key={s}
            onClick={() => setOn((p) => ({ ...p, [s]: !p[s] }))}
            className="absolute flex items-center gap-1.5 rounded-md bg-black/80 px-2 py-1 text-[10px] font-bold text-white shadow-lg ring-1 ring-white/10 transition hover:scale-105 sm:text-xs"
            style={{ left: `${STAGE_X[s]}%`, top: "61%", transform: "translateX(-50%)" }}
          >
            <span className="uppercase tracking-wider">{s}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] sm:text-[10px] ${on[s] ? "bg-emerald-500 text-black" : "bg-red-500 text-white"}`}
            >
              {on[s] ? "ON" : "OFF"}
            </span>
          </button>
        ))}

        <style>{`
          @keyframes pulse {
            0%,100% { opacity: 0.4; }
            50%     { opacity: 1; }
          }
        `}</style>
      </div>

      {/* HUD */}
      <div className="grid w-full max-w-[1100px] grid-cols-2 gap-3 text-white sm:grid-cols-4">
        <Stat label="Current Demand" value={`${produced} / ${Math.floor(demand)}`} accent="bg-amber-500/20 border-amber-400/40" />
        <Stat label="Fill Rate" value={`${fillRate.toFixed(1)}%`} accent="bg-blue-500/20 border-blue-400/40" />
        <Stat label="Revenue (Today)" value={`₹${revenue.toLocaleString()}`} accent="bg-emerald-500/20 border-emerald-400/40" />
        <Stat
          label="Status"
          value={allOn ? "Running" : "Stalled"}
          accent={allOn ? "bg-emerald-500/20 border-emerald-400/40" : "bg-red-500/20 border-red-400/40"}
        />
      </div>

      <p className="max-w-[1100px] text-center text-xs text-slate-400">
        Tip: click any machine toggle to switch it OFF — the line will back up. Turn it back ON to resume production.
      </p>
    </div>
  );
}

function nextStage(s: Stage): Stage | null {
  const i = STAGES.indexOf(s);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null;
}

function batchEmoji(s: Stage) {
  // What the batch looks like AS IT LEAVES this stage moving toward the next
  switch (s) {
    case "mixer":
      return "🥣"; // batter heading to baker
    case "baker":
      return "🧁"; // baked muffin heading to icer (use muffin)
    case "icer":
      return "🧁"; // iced cupcake heading to packer
    case "packer":
      return "📦"; // boxed, shipping out
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
