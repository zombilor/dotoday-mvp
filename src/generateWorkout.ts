type TimeMinutes = 10 | 20 | 30 | 45 | 60;
type Location = "home" | "hotel" | "gym";
type Equipment = "none" | "dumbbells" | "barbell" | "full_gym";
type Experience = "beginner" | "intermediate" | "advanced";
type Energy = "low" | "medium" | "high";
type WorkoutStyle = "balanced" | "strength" | "conditioning" | "powerlifting";

export type WorkoutInputs = {
  time_minutes: TimeMinutes;
  location: Location;
  equipment: Equipment;
  experience: Experience;
  energy: Energy;
  limitations?: string;
  is_free_user: boolean;
  variation_seed?: number;
  workout_style?: WorkoutStyle;
};

type Exercise = {
  name: string;
  at: Location[];
  equip: Equipment[];
  type: "bodyweight" | "dumbbell" | "barbell";
  tags: string[];
};

const LIBRARY: Record<"bodyweight" | "dumbbell" | "barbell", Exercise[]> = {
  bodyweight: [
    { name: "Squat", at: ["home", "hotel", "gym"], equip: ["none"], type: "bodyweight", tags: ["lower", "squat"] },
    { name: "Push-up", at: ["home", "hotel", "gym"], equip: ["none"], type: "bodyweight", tags: ["upper"] },
    { name: "Reverse lunge", at: ["home", "hotel", "gym"], equip: ["none"], type: "bodyweight", tags: ["lower", "lunge"] },
    { name: "Glute bridge", at: ["home", "hotel", "gym"], equip: ["none"], type: "bodyweight", tags: ["hinge", "glute"] },
    { name: "Plank", at: ["home", "hotel", "gym"], equip: ["none"], type: "bodyweight", tags: ["core"] },
    { name: "Dead bug", at: ["home", "hotel", "gym"], equip: ["none"], type: "bodyweight", tags: ["core"] },
    { name: "Mountain climber", at: ["home", "hotel", "gym"], equip: ["none"], type: "bodyweight", tags: ["core", "cardio"] },
    { name: "Step-back lunge", at: ["home", "hotel", "gym"], equip: ["none"], type: "bodyweight", tags: ["lower", "lunge"] },
    { name: "Hip hinge", at: ["home", "hotel", "gym"], equip: ["none"], type: "bodyweight", tags: ["hinge"] },
    { name: "Standing calf raise", at: ["home", "hotel", "gym"], equip: ["none"], type: "bodyweight", tags: ["lower"] },
  ],
  dumbbell: [
    { name: "Dumbbell squat", at: ["home", "hotel", "gym"], equip: ["dumbbells", "full_gym"], type: "dumbbell", tags: ["lower", "squat"] },
    { name: "Dumbbell row", at: ["home", "hotel", "gym"], equip: ["dumbbells", "full_gym"], type: "dumbbell", tags: ["upper", "row"] },
    { name: "Dumbbell deadlift", at: ["home", "hotel", "gym"], equip: ["dumbbells", "full_gym"], type: "dumbbell", tags: ["hinge"] },
    { name: "Dumbbell press", at: ["home", "hotel", "gym"], equip: ["dumbbells", "full_gym"], type: "dumbbell", tags: ["upper"] },
    { name: "Dumbbell lunge", at: ["home", "hotel", "gym"], equip: ["dumbbells", "full_gym"], type: "dumbbell", tags: ["lower", "lunge"] },
    { name: "Dumbbell shoulder press", at: ["home", "hotel", "gym"], equip: ["dumbbells", "full_gym"], type: "dumbbell", tags: ["upper"] },
    { name: "Farmer carry", at: ["home", "hotel", "gym"], equip: ["dumbbells", "full_gym"], type: "dumbbell", tags: ["carry", "core"] },
  ],
  barbell: [
    { name: "Barbell squat", at: ["gym"], equip: ["barbell", "full_gym"], type: "barbell", tags: ["lower", "squat", "main_lift"] },
    { name: "Barbell bench press", at: ["gym"], equip: ["barbell", "full_gym"], type: "barbell", tags: ["upper", "bench", "main_lift"] },
    { name: "Barbell deadlift", at: ["gym"], equip: ["barbell", "full_gym"], type: "barbell", tags: ["hinge", "deadlift", "main_lift"] },
    { name: "Barbell row", at: ["gym"], equip: ["barbell", "full_gym"], type: "barbell", tags: ["upper", "row"] },
    { name: "Barbell overhead press", at: ["gym"], equip: ["barbell", "full_gym"], type: "barbell", tags: ["upper"] },
  ],
};

const FOCUS: Record<Energy, string> = {
  low: "Gentle Full Body",
  medium: "Balanced Full Body",
  high: "Full Body Power",
};

function clampTime(isFree: boolean, time: TimeMinutes): TimeMinutes {
  if (!isFree) return time;
  return time > 20 ? 20 : time;
}

function normalizeEquipment(isFree: boolean, equipment: Equipment): Equipment {
  return isFree ? "none" : equipment;
}

function hasKneeLimitations(limitations: string): boolean {
  const text = limitations.toLowerCase();
  return text.includes("knee");
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function resolveStyle(inputs: Required<WorkoutInputs>, equip: Equipment): WorkoutStyle {
  const requested = inputs.workout_style ?? "balanced";
  if (requested === "powerlifting") {
    if (inputs.is_free_user) return "strength";
    if (equip !== "barbell" && equip !== "full_gym") return "strength";
  }
  return requested;
}

function buildPool(inputs: Required<WorkoutInputs>, equip: Equipment): Exercise[] {
  const allowedTypes: ("bodyweight" | "dumbbell" | "barbell")[] = ["bodyweight"];
  if (equip === "dumbbells" || equip === "full_gym") allowedTypes.push("dumbbell");
  if (equip === "barbell" || equip === "full_gym") allowedTypes.push("barbell");

  const kneeLimited = hasKneeLimitations(inputs.limitations);
  const kneeExcludeTags = new Set(["jump", "run", "lunge", "squat", "step-up"]);
  const kneePreferTags = new Set(["upper", "core", "hinge", "carry"]);
  const freeExcludeTags = new Set(["lunge", "jump"]);

  const poolBase = allowedTypes
    .flatMap((t) => LIBRARY[t])
    .filter((ex) => ex.at.includes(inputs.location))
    .filter((ex) => ex.equip.includes(equip) || equip === "full_gym")
    .filter((ex) => !kneeLimited || !ex.tags.some((tag) => kneeExcludeTags.has(tag)))
    .filter((ex) => !inputs.is_free_user || !ex.tags.some((tag) => freeExcludeTags.has(tag)))
    .sort((a, b) => {
      if (!kneeLimited) return 0;
      const aScore = a.tags.some((t) => kneePreferTags.has(t)) ? 1 : 0;
      const bScore = b.tags.some((t) => kneePreferTags.has(t)) ? 1 : 0;
      return bScore - aScore;
    });

  return Number.isFinite(inputs.variation_seed)
    ? shuffleWithSeed(poolBase, inputs.variation_seed as number)
    : poolBase;
}

function pickExercises(pool: Exercise[], count: number): Exercise[] {
  return pool.slice(0, Math.min(count, pool.length));
}

function planForStyle(style: WorkoutStyle, time: TimeMinutes) {
  if (style === "strength") {
    if (time === 10) return { label: "ROUNDS", rounds: 3, moves: 2 };
    if (time === 20) return { label: "ROUNDS", rounds: 3, moves: 3 };
    if (time === 30) return { label: "ROUNDS", rounds: 4, moves: 3 };
    if (time === 45) return { label: "ROUNDS", rounds: 5, moves: 4 };
    return { label: "ROUNDS", rounds: 5, moves: 4 };
  }

  if (style === "conditioning") {
    if (time === 10) return { label: "EMOM", rounds: 1, moves: 3 };
    if (time === 20) return { label: "AMRAP", rounds: 1, moves: 4 };
    if (time === 30) return { label: "AMRAP", rounds: 1, moves: 4 };
    if (time === 45) return { label: "AMRAP", rounds: 1, moves: 5 };
    return { label: "AMRAP", rounds: 1, moves: 5 };
  }

  if (time === 10) return { label: "EMOM", rounds: 1, moves: 3 };
  if (time === 20) return { label: "AMRAP", rounds: 1, moves: 4 };
  if (time === 30) return { label: "ROUNDS", rounds: 4, moves: 4 };
  if (time === 45) return { label: "ROUNDS", rounds: 5, moves: 4 };
  return { label: "ROUNDS", rounds: 6, moves: 4 };
}

function volumeFor(style: WorkoutStyle, energy: Energy, hasLimitations: boolean) {
  const base = style === "strength"
    ? { reps: 6, seconds: 20 }
    : style === "conditioning"
      ? { reps: 14, seconds: 40 }
      : { reps: 10, seconds: 30 };

  if (energy === "low" || hasLimitations) {
    return { reps: Math.max(6, base.reps - 2), seconds: Math.max(15, base.seconds - 10) };
  }

  if (energy === "high") {
    return { reps: base.reps + 2, seconds: base.seconds + 5 };
  }

  return base;
}

function formatLine(ex: Exercise, reps: number, seconds: number, label: string, rounds: number): string {
  const prefix = label === "ROUNDS" ? `Rounds ${rounds}` : label;
  if (ex.name === "Plank") return `- ${prefix}: ${ex.name}: ${seconds}s`;
  return `- ${prefix}: ${ex.name}: ${reps} reps`;
}

function powerliftPrescription(exp: Experience): string {
  if (exp === "beginner") return "3x5";
  if (exp === "advanced") return "5x3";
  return "5x5";
}

type WarmupMove = { name: string; reps?: number; seconds?: number };
type WarmupTemplate = {
  label: string;
  minutes: number;
  moves: WarmupMove[];
  usesBarbell?: boolean;
  noJump?: boolean;
  kneeSafe?: boolean;
};

function formatWarmupMove(move: WarmupMove): string {
  if (move.seconds) return `- ${move.name}: ${move.seconds}s`;
  return `- ${move.name}: ${move.reps ?? 8} reps`;
}

function warmupTemplatesForStyle(style: WorkoutStyle): WarmupTemplate[] {
  if (style === "strength") {
    return [
      { label: "Activate", minutes: 3, noJump: true, kneeSafe: true, moves: [
        { name: "March in place", seconds: 30 },
        { name: "Hip hinge", reps: 8 },
        { name: "Glute bridge", reps: 8 },
        { name: "Plank", seconds: 20 },
      ]},
      { label: "Prep", minutes: 4, noJump: true, kneeSafe: true, moves: [
        { name: "March in place", seconds: 30 },
        { name: "Glute bridge", reps: 8 },
        { name: "Dead bug", reps: 6 },
        { name: "Plank", seconds: 20 },
      ]},
      { label: "Get loose", minutes: 4, noJump: true, kneeSafe: true, moves: [
        { name: "Arm circles", seconds: 20 },
        { name: "Hip hinge", reps: 8 },
        { name: "Wall push-up", reps: 8 },
        { name: "Calf raise", reps: 10 },
      ]},
    ];
  }

  if (style === "conditioning") {
    return [
      { label: "Wake up", minutes: 3, noJump: true, kneeSafe: true, moves: [
        { name: "March in place", seconds: 30 },
        { name: "Mountain climber", seconds: 20 },
        { name: "Hip hinge", reps: 8 },
        { name: "Plank", seconds: 20 },
      ]},
      { label: "Quick prep", minutes: 4, noJump: true, kneeSafe: true, moves: [
        { name: "March in place", seconds: 30 },
        { name: "Push-up", reps: 6 },
        { name: "Dead bug", reps: 6 },
        { name: "Plank", seconds: 20 },
      ]},
      { label: "Get loose", minutes: 4, noJump: true, kneeSafe: true, moves: [
        { name: "Arm circles", seconds: 20 },
        { name: "Hip hinge", reps: 8 },
        { name: "Glute bridge", reps: 8 },
        { name: "Plank", seconds: 20 },
      ]},
      { label: "Activate", minutes: 5, noJump: true, kneeSafe: true, moves: [
        { name: "March in place", seconds: 30 },
        { name: "Glute bridge", reps: 8 },
        { name: "Push-up", reps: 6 },
        { name: "Dead bug", reps: 6 },
        { name: "Plank", seconds: 20 },
      ]},
    ];
  }

  if (style === "powerlifting") {
    return [
      { label: "Barbell prep", minutes: 4, usesBarbell: true, noJump: true, kneeSafe: false, moves: [
        { name: "Barbell warm-up set", reps: 8 },
        { name: "Barbell warm-up set", reps: 5 },
        { name: "Hip hinge", reps: 6 },
        { name: "Plank", seconds: 20 },
      ]},
      { label: "Activate", minutes: 3, noJump: true, kneeSafe: true, moves: [
        { name: "March in place", seconds: 30 },
        { name: "Hip hinge", reps: 8 },
        { name: "Glute bridge", reps: 8 },
        { name: "Plank", seconds: 20 },
      ]},
      { label: "Prep", minutes: 4, noJump: true, kneeSafe: true, moves: [
        { name: "Arm circles", seconds: 20 },
        { name: "Hip hinge", reps: 8 },
        { name: "Glute bridge", reps: 8 },
        { name: "Dead bug", reps: 6 },
      ]},
    ];
  }

  return [
    { label: "Activate", minutes: 3, noJump: true, kneeSafe: true, moves: [
      { name: "March in place", seconds: 30 },
      { name: "Hip hinge", reps: 8 },
      { name: "Push-up", reps: 6 },
      { name: "Plank", seconds: 20 },
    ]},
    { label: "Prep", minutes: 4, noJump: true, kneeSafe: true, moves: [
      { name: "March in place", seconds: 30 },
      { name: "Glute bridge", reps: 8 },
      { name: "Push-up", reps: 6 },
      { name: "Dead bug", reps: 6 },
    ]},
    { label: "Get loose", minutes: 4, noJump: true, kneeSafe: true, moves: [
      { name: "Arm circles", seconds: 20 },
      { name: "Hip hinge", reps: 8 },
      { name: "Wall push-up", reps: 8 },
      { name: "Plank", seconds: 20 },
    ]},
    { label: "Wake up", minutes: 5, noJump: true, kneeSafe: true, moves: [
      { name: "March in place", seconds: 30 },
      { name: "Hip hinge", reps: 8 },
      { name: "Glute bridge", reps: 8 },
      { name: "Push-up", reps: 6 },
      { name: "Plank", seconds: 20 },
    ]},
  ];
}

function buildWarmup(
  style: WorkoutStyle,
  inputs: Required<WorkoutInputs>,
  equip: Equipment
): { label: string; minutes: number; lines: string[] } {
  const templates = warmupTemplatesForStyle(style);
  const seed = Number.isFinite(inputs.variation_seed) ? (inputs.variation_seed as number) : 1;
  const shuffled = Number.isFinite(inputs.variation_seed) ? shuffleWithSeed(templates, seed + 3) : templates;

  const kneeLimited = hasKneeLimitations(inputs.limitations);
  const allowBarbell = !inputs.is_free_user && (equip === "barbell" || equip === "full_gym");

  const filtered = shuffled.filter((t) => {
    if (kneeLimited && !t.kneeSafe) return false;
    if (inputs.is_free_user && t.noJump === false) return false;
    if (t.usesBarbell && !allowBarbell) return false;
    return true;
  });

  const chosen = filtered[0] ?? shuffled.find((t) => t.kneeSafe && (!t.usesBarbell || allowBarbell)) ?? shuffled[0];

  return { label: chosen.label, minutes: chosen.minutes, lines: chosen.moves.map(formatWarmupMove) };
}

function sanitizeLimitations(limitations?: string): string {
  if (!limitations) return "";
  return limitations.trim();
}

export function generateWorkout(raw: WorkoutInputs): string {
  const inputs: Required<WorkoutInputs> = {
    ...raw,
    limitations: raw.limitations ?? "",
    variation_seed: raw.variation_seed ?? Number.NaN,
    workout_style: raw.workout_style ?? "balanced",
  };

  const time = clampTime(inputs.is_free_user, inputs.time_minutes);
  const equip = normalizeEquipment(inputs.is_free_user, inputs.equipment);
  const limitations = sanitizeLimitations(inputs.limitations);
  const style = resolveStyle(inputs, equip);
  const pool = buildPool({ ...inputs, time_minutes: time, equipment: equip }, equip);

  let lines: string[] = [];
  let warmup = { label: "Warm-up", minutes: 3, lines: [] as string[] };

  if (style === "powerlifting") {
    const mainCandidates = pool.filter((ex) => ex.tags.includes("main_lift"));
    if (mainCandidates.length === 0) {
      const fallback = planForStyle("strength", time);
      const volume = volumeFor("strength", inputs.energy, limitations.length > 0);
      const selected = pickExercises(pool, fallback.moves);
      lines = selected.map((ex) => formatLine(ex, volume.reps, volume.seconds, fallback.label, fallback.rounds));
      warmup = buildWarmup("strength", inputs, equip);
    } else {
      const seed = Number.isFinite(inputs.variation_seed) ? (inputs.variation_seed as number) : 1;
      const mainList = Number.isFinite(inputs.variation_seed)
        ? shuffleWithSeed(mainCandidates, seed)
        : mainCandidates;
      const mainLift = mainList[0];
      const mainLine = `- ${mainLift.name}: ${powerliftPrescription(inputs.experience)} (rest 2-3 min)`;

      const accessoryCount = time <= 20 ? 1 : 2;
      const accessoryPool = pool.filter((ex) => ex.name !== mainLift.name);
      const accessoryPreferred = new Set(["row", "hinge", "core", "carry", "upper"]);
      const accessorySorted = accessoryPool.sort((a, b) => {
        const aScore = a.tags.some((t) => accessoryPreferred.has(t)) ? 1 : 0;
        const bScore = b.tags.some((t) => accessoryPreferred.has(t)) ? 1 : 0;
        return bScore - aScore;
      });
      const accessoryShuffled = Number.isFinite(inputs.variation_seed)
        ? shuffleWithSeed(accessorySorted, seed + 1)
        : accessorySorted;
      const accessories = pickExercises(accessoryShuffled, accessoryCount);
      const accessoryLines = accessories.map((ex) =>
        ex.name === "Plank" ? `- ${ex.name}: 30s` : `- ${ex.name}: 3x8`
      );
      lines = [mainLine, ...accessoryLines];
      warmup = buildWarmup("powerlifting", inputs, equip);
    }
  } else {
    const plan = planForStyle(style, time);
    const volume = volumeFor(style, inputs.energy, limitations.length > 0);
    const selected = pickExercises(pool, plan.moves);
    lines = selected.map((ex) => formatLine(ex, volume.reps, volume.seconds, plan.label, plan.rounds));
    warmup = buildWarmup(style, inputs, equip);
  }

  return [
    `Today's Focus: ${FOCUS[inputs.energy]}`,
    `${warmup.label} (${warmup.minutes} min):`,
    ...warmup.lines,
    `Workout (${time} min):`,
    ...lines,
    "Rest as needed. Start now.",
  ].join("\n");
}
