import { createFileRoute } from "@tanstack/react-router";
import factoryAsset from "@/assets/factory.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Factory Floor" },
      { name: "description", content: "Animated muffin factory floor." },
    ],
  }),
  component: Index,
});

function Index() {
  // Belt animation: muffins moving left -> right across the conveyor at bottom.
  const muffins = Array.from({ length: 12 });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div
        className="relative w-full max-w-[1100px] overflow-hidden rounded-2xl shadow-2xl"
        style={{ aspectRatio: "744 / 496" }}
      >
        {/* Base factory image */}
        <img
          src={factoryAsset.url}
          alt="Factory floor"
          className="absolute inset-0 h-full w-full select-none"
          draggable={false}
        />

        {/* Conveyor belt — moving muffins overlay.
            Belt sits roughly y: 67%-88%, x: 4%-72% of the image. */}
        <div
          className="absolute overflow-hidden"
          style={{ left: "4%", right: "28%", top: "70%", height: "14%" }}
        >
          <div className="belt-track absolute inset-y-0 flex items-center gap-[3.2%]">
            {[...muffins, ...muffins].map((_, i) => (
              <span
                key={i}
                className="muffin-emoji shrink-0"
                style={{ fontSize: "clamp(20px, 3.6vw, 44px)" }}
              >
                🧁
              </span>
            ))}
          </div>
        </div>

        {/* Mixer whisk spin indicator (top-left machine) */}
        <div
          className="absolute rounded-full"
          style={{
            left: "9.5%",
            top: "38%",
            width: "11%",
            height: "16%",
            background:
              "radial-gradient(circle, rgba(255,182,193,0.0) 40%, rgba(255,255,255,0.25) 60%, rgba(255,255,255,0) 70%)",
            animation: "spin 1.8s linear infinite",
            mixBlendMode: "overlay",
          }}
        />

        {/* Oven glow pulse */}
        <div
          className="absolute rounded-md"
          style={{
            left: "25%",
            top: "38%",
            width: "13%",
            height: "20%",
            background:
              "radial-gradient(ellipse, rgba(255,170,80,0.45), rgba(255,120,40,0) 70%)",
            animation: "ovenPulse 1.6s ease-in-out infinite",
            mixBlendMode: "screen",
          }}
        />

        {/* Icer drip */}
        <div
          className="absolute"
          style={{ left: "53.5%", top: "40%", width: "1.2%", height: "10%" }}
        >
          <div className="drip" />
        </div>

        {/* Steam puffs above baker */}
        <div
          className="absolute"
          style={{ left: "30%", top: "10%", width: "2%", height: "20%" }}
        >
          <div className="steam" style={{ animationDelay: "0s" }} />
          <div className="steam" style={{ animationDelay: "0.7s" }} />
          <div className="steam" style={{ animationDelay: "1.4s" }} />
        </div>

        {/* Status LED blink (top-right) */}
        <div
          className="absolute rounded-full bg-green-400 shadow-[0_0_12px_4px_rgba(74,222,128,0.7)]"
          style={{
            right: "21%",
            top: "3.5%",
            width: "1.2%",
            height: "1.8%",
            animation: "blink 1.2s ease-in-out infinite",
          }}
        />

        <style>{`
          @keyframes beltScroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .belt-track {
            width: 200%;
            animation: beltScroll 6s linear infinite;
            padding-left: 2%;
          }
          .muffin-emoji {
            filter: drop-shadow(0 2px 1px rgba(0,0,0,0.35));
            animation: bob 0.6s ease-in-out infinite;
          }
          .muffin-emoji:nth-child(odd) { animation-delay: 0.3s; }
          @keyframes bob {
            0%,100% { transform: translateY(0); }
            50%     { transform: translateY(-2px); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes ovenPulse {
            0%,100% { opacity: 0.35; }
            50%     { opacity: 0.85; }
          }
          @keyframes blink {
            0%,100% { opacity: 1; }
            50%     { opacity: 0.35; }
          }
          .drip {
            position: absolute;
            left: 50%;
            top: 0;
            width: 6px;
            height: 6px;
            margin-left: -3px;
            border-radius: 50%;
            background: #ff5fa2;
            box-shadow: 0 0 4px rgba(255,95,162,0.6);
            animation: drip 1.4s ease-in infinite;
          }
          @keyframes drip {
            0%   { transform: translateY(0) scale(0.6); opacity: 0; }
            20%  { opacity: 1; }
            100% { transform: translateY(40px) scale(1); opacity: 0; }
          }
          .steam {
            position: absolute;
            left: 0;
            bottom: 0;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: rgba(255,255,255,0.7);
            filter: blur(3px);
            animation: steamRise 2.1s ease-out infinite;
          }
          @keyframes steamRise {
            0%   { transform: translate(0,0) scale(0.6); opacity: 0; }
            20%  { opacity: 0.8; }
            100% { transform: translate(-8px,-60px) scale(1.6); opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}
