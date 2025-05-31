import type { UserProfile } from '$lib/types';

// Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
export function calculateBMR(profile: UserProfile): number {
  const { weight, height, age, sex } = profile;
  
  // Convert to metric if needed (assuming weight in lbs, height in inches)
  const weightKg = weight * 0.453592;
  const heightCm = height * 2.54;
  
  if (sex === 'male') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  } else {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
  }
}

// Activity level multipliers
const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725
} as const;

// Calculate Total Daily Energy Expenditure
export function calculateTDEE(profile: UserProfile): number {
  const bmr = calculateBMR(profile);
  const multiplier = activityMultipliers[profile.activityLevel];
  return Math.round(bmr * multiplier);
}

// Calculate daily calorie target based on weight loss goal
export function calculateDailyTarget(profile: UserProfile): number {
  const tdee = calculateTDEE(profile);
  // 1 pound = 3500 calories, so weekly goal * 500 = daily deficit
  const dailyDeficit = profile.weeklyGoal * 500;
  
  const target = tdee - dailyDeficit;
  
  // Ensure safe minimum calories
  const minCalories = profile.sex === 'male' ? 1500 : 1200;
  return Math.max(target, minCalories);
}

// Generate zigzag calorie cycling plan for a week
export function generateZigzagPlan(profile: UserProfile): { [date: string]: number } {
  const baseTarget = calculateDailyTarget(profile);
  const weeklyTotal = baseTarget * 7;
  
  // Create a pattern: high, medium, low days
  const patterns = {
    monday: 1.1,    // High
    tuesday: 0.9,   // Low
    wednesday: 1.0, // Medium
    thursday: 0.9,  // Low
    friday: 1.1,    // High
    saturday: 1.05, // Medium-High
    sunday: 0.95    // Medium-Low
  };
  
  const plan: { [date: string]: number } = {};
  let total = 0;
  
  // Generate dates for the next 7 days
  const today = new Date();
  const dates: string[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Apply pattern
  dates.forEach((date, index) => {
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const multiplier = patterns[dayName as keyof typeof patterns] || 1.0;
    const calories = Math.round(baseTarget * multiplier);
    plan[date] = calories;
    total += calories;
  });
  
  // Adjust to match weekly total
  const adjustment = (weeklyTotal - total) / 7;
  Object.keys(plan).forEach(date => {
    plan[date] = Math.round(plan[date] + adjustment);
  });
  
  return plan;
}

// Calculate calories burned from exercise
export function calculateExerciseCalories(
  activityType: string,
  duration: number,
  intensity: 'light' | 'moderate' | 'intense',
  weight: number
): number {
  // MET values for common activities
  const metValues: { [key: string]: { [key in 'light' | 'moderate' | 'intense']: number } } = {
    walking: { light: 2.5, moderate: 3.5, intense: 4.5 },
    running: { light: 6.0, moderate: 8.0, intense: 10.0 },
    cycling: { light: 4.0, moderate: 6.0, intense: 8.0 },
    swimming: { light: 5.0, moderate: 7.0, intense: 9.0 },
    'strength training': { light: 3.0, moderate: 4.5, intense: 6.0 },
    yoga: { light: 2.0, moderate: 3.0, intense: 4.0 },
    dancing: { light: 3.0, moderate: 4.5, intense: 6.5 },
    hiking: { light: 4.0, moderate: 5.5, intense: 7.0 },
    default: { light: 3.0, moderate: 5.0, intense: 7.0 }
  };
  
  const activity = activityType.toLowerCase();
  const mets = metValues[activity] || metValues.default;
  const met = mets[intensity];
  
  // Convert weight to kg
  const weightKg = weight * 0.453592;
  
  // Calories = METs × weight(kg) × time(hours)
  const calories = met * weightKg * (duration / 60);
  
  return Math.round(calories);
}

// Check if net calories are in safe range
export function checkSafetyThresholds(
  netCalories: number,
  sex: 'male' | 'female',
  exerciseDuration: number
): {
  safe: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Check minimum net calories
  const minCalories = sex === 'male' ? 1500 : 1200;
  const warningCalories = sex === 'male' ? 1700 : 1400;
  
  if (netCalories < minCalories) {
    warnings.push(`Net calories (${netCalories}) are below the safe minimum of ${minCalories}`);
  } else if (netCalories < warningCalories) {
    warnings.push(`Net calories (${netCalories}) are getting low. Consider eating more.`);
  }
  
  // Check excessive exercise
  if (exerciseDuration > 120) {
    warnings.push(`Exercise duration (${exerciseDuration}min) exceeds recommended maximum of 2 hours`);
  } else if (exerciseDuration > 90) {
    warnings.push(`High exercise duration (${exerciseDuration}min). Remember to rest and recover.`);
  }
  
  return {
    safe: warnings.length === 0,
    warnings
  };
}

// Format calorie display with color coding
export function getCalorieStatus(current: number, target: number): {
  percentage: number;
  status: 'under' | 'optimal' | 'over';
  color: string;
} {
  const percentage = (current / target) * 100;
  
  if (percentage < 90) {
    return { percentage, status: 'under', color: 'text-green-600' };
  } else if (percentage <= 110) {
    return { percentage, status: 'optimal', color: 'text-blue-600' };
  } else {
    return { percentage, status: 'over', color: 'text-orange-600' };
  }
}

// Calculate weekly statistics
export function calculateWeeklyStats(logs: Array<{ totalCalories: number; exerciseCalories: number; targetCalories: number }>): {
  averageIntake: number;
  averageExercise: number;
  averageNet: number;
  adherenceRate: number;
  totalDeficit: number;
} {
  if (logs.length === 0) {
    return {
      averageIntake: 0,
      averageExercise: 0,
      averageNet: 0,
      adherenceRate: 0,
      totalDeficit: 0
    };
  }
  
  const totals = logs.reduce((acc, log) => ({
    intake: acc.intake + log.totalCalories,
    exercise: acc.exercise + log.exerciseCalories,
    deficit: acc.deficit + (log.targetCalories - log.totalCalories + log.exerciseCalories),
    onTarget: acc.onTarget + (Math.abs(log.totalCalories - log.targetCalories) <= 100 ? 1 : 0)
  }), { intake: 0, exercise: 0, deficit: 0, onTarget: 0 });
  
  return {
    averageIntake: Math.round(totals.intake / logs.length),
    averageExercise: Math.round(totals.exercise / logs.length),
    averageNet: Math.round((totals.intake - totals.exercise) / logs.length),
    adherenceRate: Math.round((totals.onTarget / logs.length) * 100),
    totalDeficit: Math.round(totals.deficit)
  };
} 