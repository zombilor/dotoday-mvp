import { useMemo, useState } from "react";
import { generateWorkout, type WorkoutInputs } from "./generateWorkout";

type FormState = WorkoutInputs;

const timeOptions: FormState["time_minutes"][] = [10, 20, 30, 45, 60];
const locationOptions: FormState["location"][] = ["home", "hotel", "gym"];
const equipmentOptions: FormState["equipment"][] = ["none", "dumbbells", "barbell", "full_gym"];
const experienceOptions: FormState["experience"][] = ["beginner", "intermediate", "advanced"];
const energyOptions: FormState["energy"][] = ["low", "medium", "high"];
const styleOptions: NonNullable<FormState["workout_style"]>[] = ["balanced", "strength", "conditioning", "powerlifting"];

const defaultState: FormState = {
  time_minutes: 20,
  location: "home",
  equipment: "none",
  experience: "beginner",
  energy: "medium",
  limitations: "",
  is_free_user: true,
  workout_style: "balanced",
};

export default function App() {
  const [form, setForm] = useState<FormState>(defaultState);
  const [currentWorkout, setCurrentWorkout] = useState<string | null>(null);
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);

  const capNotice = useMemo(() => {
    if (!form.is_free_user) return "";
    if (form.time_minutes > 20 && form.equipment !== "none") return "Free caps to 20 min and bodyweight.";
    if (form.time_minutes > 20) return "Free caps to 20 min.";
    if (form.equipment !== "none") return "Free uses bodyweight only.";
    return "";
  }, [form.is_free_user, form.time_minutes, form.equipment]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function summaryFromInputs(input: FormState) {
    return [
      `${input.time_minutes} min`,
      input.location,
      input.equipment,
      input.experience,
      `${input.energy} energy`,
      input.limitations ? `limitations: ${input.limitations}` : "no limitations",
      `style: ${input.workout_style ?? "balanced"}`,
      input.is_free_user ? "free" : "pro",
    ].join(" · ");
  }

  function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    const output = generateWorkout({ ...form, variation_seed: Date.now() });
    setCurrentWorkout(output);
    setCurrentSummary(summaryFromInputs(form));
  }

  function onNewWorkout() {
    const output = generateWorkout({ ...form, variation_seed: Date.now() });
    setCurrentWorkout(output);
    setCurrentSummary(summaryFromInputs(form));
  }

  async function onCopy() {
    if (!currentWorkout) return;
    try {
      await navigator.clipboard.writeText(currentWorkout);
    } catch {
      // no-op: copying not supported in some environments
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Do Today</h1>
          <p className="mt-2 text-sm text-slate-600">One focused workout. Clear and doable.</p>
        </div>

        <div className="space-y-6">
          <div className="rounded border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Plan</span>
              <div className="flex rounded border border-slate-300">
                <button
                  type="button"
                  className={`px-3 py-1 text-sm ${form.is_free_user ? "bg-slate-900 text-white" : "text-slate-700"}`}
                  onClick={() => update("is_free_user", true)}
                >
                  Free
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 text-sm ${!form.is_free_user ? "bg-slate-900 text-white" : "text-slate-700"}`}
                  onClick={() => update("is_free_user", false)}
                >
                  Pro
                </button>
              </div>
              {capNotice && <span className="text-xs text-slate-500">{capNotice}</span>}
            </div>

            <form onSubmit={onGenerate} className="mt-4 space-y-4">
              <div className="grid gap-4">
                <div>
                  <div className="text-sm font-medium">Time</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {timeOptions.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`rounded border px-3 py-1 text-sm ${form.time_minutes === t ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700"}`}
                        onClick={() => update("time_minutes", t)}
                      >
                        {t} min
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Location</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {locationOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`rounded border px-3 py-1 text-sm ${form.location === opt ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700"}`}
                        onClick={() => update("location", opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Equipment</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {equipmentOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`rounded border px-3 py-1 text-sm ${form.equipment === opt ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700"}`}
                        onClick={() => update("equipment", opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Experience</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {experienceOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`rounded border px-3 py-1 text-sm ${form.experience === opt ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700"}`}
                        onClick={() => update("experience", opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Energy</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {energyOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`rounded border px-3 py-1 text-sm ${form.energy === opt ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700"}`}
                        onClick={() => update("energy", opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Style</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {styleOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`rounded border px-3 py-1 text-sm ${form.workout_style === opt ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700"}`}
                        onClick={() => update("workout_style", opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label className="block text-sm">
                Limitations (optional)
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  type="text"
                  placeholder="e.g., knee pain"
                  value={form.limitations}
                  onChange={(e) => update("limitations", e.target.value)}
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Generate workout
                </button>
                <button
                  type="button"
                  className="rounded border border-slate-300 px-4 py-2 text-sm"
                  onClick={onNewWorkout}
                  disabled={!currentWorkout}
                >
                  New workout
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            {!currentWorkout && (
              <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Generate a workout to start the chat.
              </div>
            )}
            {currentSummary && (
              <div className="ml-auto max-w-[85%] rounded border border-slate-300 bg-slate-100 px-4 py-3 text-sm">
                <pre className="whitespace-pre-wrap">{currentSummary}</pre>
              </div>
            )}
            {currentWorkout && (
              <div className="mr-auto max-w-[85%] rounded border border-slate-200 bg-white px-4 py-3 text-sm">
                <pre className="whitespace-pre-wrap">{currentWorkout}</pre>
              </div>
            )}
          </div>

          {currentWorkout && (
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded border border-slate-300 px-4 py-2 text-sm"
                onClick={() => {
                  setCurrentWorkout(null);
                  setCurrentSummary(null);
                }}
              >
                Change inputs
              </button>
              <button
                className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                onClick={onCopy}
              >
                Copy workout
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
