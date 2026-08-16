/**
 * SportSelector (Nike Editorial Campaign Grid Style)
 * Renders full-bleed athletic discipline tiles with towering uppercase typography,
 * high-contrast visual lockups, and crisp Nike white pill CTAs.
 */
import type { Sport } from "../types";

interface Props {
  onSelect: (sport: Sport) => void;
}

const sports: { key: Sport; name: string; title: string; subtitle: string; bgGradient: string; tag: string }[] = [
  {
    key: "deadlift",
    name: "Conventional Deadlift",
    title: "POSTERIOR CHAIN POWER",
    subtitle: "Side-on kinematic tracking. Evaluates hip-shoulder rise sync, spinal neutrality, and terminal lockout.",
    bgGradient: "from-zinc-900 via-neutral-900 to-black",
    tag: "POWERLIFTING ENGINE",
  },
  {
    key: "bowling",
    name: "Cricket Fast Bowling",
    title: "MAXIMUM KINETIC DELIVERY",
    subtitle: "Side-on action analysis. Measures ICC legal elbow extension, front-knee brace, and hip rotation.",
    bgGradient: "from-neutral-900 via-zinc-900 to-black",
    tag: "CRICKET BIOMECHANICS",
  },
];

export default function SportSelector({ onSelect }: Props) {
  return (
    <div className="animate-fade-in space-y-8">
      {/* Editorial Headline */}
      <div className="text-center space-y-2">
        <span className="text-xs font-mono font-bold tracking-widest text-gray-400 uppercase">
          FORMCHECK ATHLETIC ENGINE
        </span>
        <h2 className="nike-display-title text-white tracking-tight">
          SELECT DISCIPLINE
        </h2>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Film side-on for optimal 33-point sub-pixel kinematic tracking.
        </p>
      </div>

      {/* Nike Campaign Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {sports.map((s) => (
          <div
            key={s.key}
            id={`sport-${s.key}`}
            onClick={() => onSelect(s.key)}
            className="group relative h-96 rounded-3xl overflow-hidden cursor-pointer border border-white/10
                       bg-gradient-to-br transition-all duration-500 hover:scale-[1.02] hover:border-white/30 shadow-2xl flex flex-col justify-between p-8"
          >
            {/* Ambient Lighting & Image Stage */}
            <div className={`absolute inset-0 bg-gradient-to-br ${s.bgGradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
            <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 blur-3xl group-hover:bg-white/10 transition-all duration-500" />

            {/* Top Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/15 tracking-wider">
                {s.tag}
              </span>
              <span className="text-xs font-mono text-gray-400 group-hover:text-white transition-colors">
                [01 / 02]
              </span>
            </div>

            {/* Title & Copy */}
            <div className="relative z-10 space-y-3">
              <h3 className="nike-display-title text-3xl sm:text-4xl text-white group-hover:text-amber-300 transition-colors">
                {s.title}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed max-w-xs">
                {s.subtitle}
              </p>
            </div>

            {/* Nike White Pill CTA */}
            <div className="relative z-10 pt-2">
              <button className="btn-nike-outline group-hover:bg-white group-hover:scale-105 transition-all">
                <span>SELECT {s.name.toUpperCase()}</span>
                <span className="font-bold">→</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
