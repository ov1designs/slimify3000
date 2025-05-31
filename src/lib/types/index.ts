// User Profile and Settings
export interface UserProfile {
  id: string;
  age: number;
  weight: number; // in pounds
  height: number; // in inches
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  sex: 'male' | 'female';
  targetWeight: number;
  weeklyGoal: number; // 0.5 to 2 lbs per week
  createdAt: Date;
  updatedAt: Date;
}

// Food and Meal Tracking
export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  timestamp: Date;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  aiGenerated?: boolean;
  rawInput?: string; // Original user input for AI processing
}

// Exercise Tracking
export interface ExerciseEntry {
  id: string;
  activity: string;
  duration: number; // in minutes
  intensity: 'light' | 'moderate' | 'intense';
  caloriesBurned: number;
  timestamp: Date;
  aiGenerated?: boolean;
  rawInput?: string;
}

// Daily Logging
export interface DailyLog {
  date: string; // YYYY-MM-DD format
  meals: FoodEntry[];
  exercises: ExerciseEntry[];
  targetCalories: number;
  totalCalories: number;
  exerciseCalories: number;
  netCalories: number;
  feedback: AIFeedback[];
  weight?: number;
  notes?: string;
}

// Weekly Planning
export interface WeeklyPlan {
  weekStartDate: string;
  dailyTargets: {
    [date: string]: number; // Zigzag calorie targets
  };
  averageTarget: number;
  totalDeficit: number;
  projectedLoss: number;
}

// Weight Tracking
export interface WeightEntry {
  date: string;
  weight: number;
  bodyFat?: number;
  notes?: string;
}

// AI Feedback and Insights
export interface AIFeedback {
  id: string;
  type: 'encouragement' | 'warning' | 'tip' | 'achievement';
  message: string;
  timestamp: Date;
  context?: 'daily' | 'weekly' | 'monthly';
}

export interface MonthlyInsight {
  month: string; // YYYY-MM
  summary: string;
  achievements: string[];
  challenges: string[];
  exercisePatterns: {
    totalWorkouts: number;
    favoriteActivities: string[];
    averageDuration: number;
    caloriesBurned: number;
  };
  nutritionPatterns: {
    averageDailyCalories: number;
    weekdayVsWeekend: {
      weekday: number;
      weekend: number;
    };
    consistency: number; // percentage
  };
  recommendations: string[];
  weightChange: number;
}

// Safety and Health Monitoring
export interface SafetyLog {
  date: string;
  violationType: 'lowCalories' | 'excessiveExercise' | 'rapidWeightLoss';
  details: string;
  netCalories?: number;
  exerciseDuration?: number;
}

// App State and Storage
export interface AppData {
  profile: UserProfile | null;
  dailyLogs: Map<string, DailyLog>;
  weeklyPlans: WeeklyPlan[];
  weightHistory: WeightEntry[];
  monthlyInsights: MonthlyInsight[];
  safetyViolations: SafetyLog[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  enableNotifications: boolean;
  reminderTimes: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    weigh?: string;
  };
  units: {
    weight: 'lbs' | 'kg';
    height: 'inches' | 'cm';
  };
}

// Chat Interface
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    calories?: number;
    foodEntries?: FoodEntry[];
    exerciseEntries?: ExerciseEntry[];
  };
}

// Exercise Preferences
export interface ExercisePrefs {
  favoriteActivities: string[];
  preferredTimes: string[];
  intensityPreference: 'light' | 'moderate' | 'intense';
  restDayPreference: string[]; // days of week
}

// Safety Thresholds
export const SAFETY_THRESHOLDS = {
  minNetCalories: {
    male: 1500,
    female: 1200
  },
  maxExerciseDuration: 120, // minutes
  maxWeeklyWeightLoss: 2, // pounds
  warningZone: {
    netCalories: {
      male: 1700,
      female: 1400
    }
  }
} as const; 