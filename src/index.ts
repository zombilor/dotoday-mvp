import { generateWorkout } from "./generateWorkout";

const examples = [
  {
    time_minutes: 20,
    location: "home",
    equipment: "dumbbells",
    experience: "beginner",
    energy: "low",
    limitations: "",
    is_free_user: true,
  },
  {
    time_minutes: 30,
    location: "hotel",
    equipment: "none",
    experience: "intermediate",
    energy: "medium",
    limitations: "knee pain",
    is_free_user: false,
  },
  {
    time_minutes: 45,
    location: "gym",
    equipment: "barbell",
    experience: "advanced",
    energy: "high",
    limitations: "",
    is_free_user: false,
  },
  {
    time_minutes: 30,
    location: "gym",
    equipment: "full_gym",
    experience: "intermediate",
    energy: "high",
    limitations: "",
    is_free_user: true,
  },
  {
    time_minutes: 20,
    location: "home",
    equipment: "dumbbells",
    experience: "intermediate",
    energy: "medium",
    limitations: "knee pain",
    is_free_user: false,
  },
];

for (const input of examples) {
  const output = generateWorkout(input);
  console.log(output);
  console.log("---");
}
