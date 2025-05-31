import { openDB, type IDBPDatabase } from 'idb';
import type {
  UserProfile,
  DailyLog,
  WeeklyPlan,
  WeightEntry,
  MonthlyInsight,
  SafetyLog,
  UserPreferences,
  FoodEntry,
  ExerciseEntry
} from '$lib/types';

const DB_NAME = 'SlimifyDB';
const DB_VERSION = 1;

export class DatabaseService {
  private db: IDBPDatabase | null = null;

  async init() {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // User Profile Store
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile');
        }

        // Daily Logs Store
        if (!db.objectStoreNames.contains('dailyLogs')) {
          const dailyStore = db.createObjectStore('dailyLogs', { keyPath: 'date' });
          dailyStore.createIndex('byMonth', 'date', { unique: false });
        }

        // Weekly Plans Store
        if (!db.objectStoreNames.contains('weeklyPlans')) {
          const weeklyStore = db.createObjectStore('weeklyPlans', { keyPath: 'weekStartDate' });
          weeklyStore.createIndex('byDate', 'weekStartDate', { unique: false });
        }

        // Weight History Store
        if (!db.objectStoreNames.contains('weightHistory')) {
          const weightStore = db.createObjectStore('weightHistory', { keyPath: 'date' });
          weightStore.createIndex('byMonth', 'date', { unique: false });
        }

        // Monthly Insights Store
        if (!db.objectStoreNames.contains('monthlyInsights')) {
          db.createObjectStore('monthlyInsights', { keyPath: 'month' });
        }

        // Safety Violations Store
        if (!db.objectStoreNames.contains('safetyViolations')) {
          const safetyStore = db.createObjectStore('safetyViolations', { keyPath: 'id', autoIncrement: true });
          safetyStore.createIndex('byDate', 'date', { unique: false });
          safetyStore.createIndex('byType', 'violationType', { unique: false });
        }

        // Preferences Store
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences');
        }
      }
    });
  }

  // Profile Methods
  async getProfile(): Promise<UserProfile | null> {
    if (!this.db) await this.init();
    return (await this.db!.get('profile', 'current')) || null;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('profile', profile, 'current');
  }

  // Daily Log Methods
  async getDailyLog(date: string): Promise<DailyLog | null> {
    if (!this.db) await this.init();
    return (await this.db!.get('dailyLogs', date)) || null;
  }

  async saveDailyLog(log: DailyLog): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('dailyLogs', log);
  }

  async getDailyLogsByDateRange(startDate: string, endDate: string): Promise<DailyLog[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('dailyLogs', 'readonly');
    const store = tx.objectStore('dailyLogs');
    const logs: DailyLog[] = [];
    
    const range = IDBKeyRange.bound(startDate, endDate);
    for await (const cursor of store.iterate(range)) {
      logs.push(cursor.value);
    }
    
    return logs;
  }

  // Weekly Plan Methods
  async getCurrentWeeklyPlan(): Promise<WeeklyPlan | null> {
    if (!this.db) await this.init();
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const weekStart = monday.toISOString().split('T')[0];
    
    return await this.db!.get('weeklyPlans', weekStart);
  }

  async saveWeeklyPlan(plan: WeeklyPlan): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('weeklyPlans', plan);
  }

  // Weight History Methods
  async addWeightEntry(entry: WeightEntry): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('weightHistory', entry);
  }

  async getWeightHistory(limit?: number): Promise<WeightEntry[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('weightHistory', 'readonly');
    const store = tx.objectStore('weightHistory');
    const entries: WeightEntry[] = [];
    
    let count = 0;
    for await (const cursor of store.iterate(null, 'prev')) {
      entries.push(cursor.value);
      count++;
      if (limit && count >= limit) break;
    }
    
    return entries;
  }

  async getLatestWeight(): Promise<number | null> {
    const entries = await this.getWeightHistory(1);
    return entries.length > 0 ? entries[0].weight : null;
  }

  // Monthly Insights Methods
  async getMonthlyInsight(month: string): Promise<MonthlyInsight | null> {
    if (!this.db) await this.init();
    return await this.db!.get('monthlyInsights', month);
  }

  async saveMonthlyInsight(insight: MonthlyInsight): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('monthlyInsights', insight);
  }

  // Safety Violations Methods
  async addSafetyViolation(violation: Omit<SafetyLog, 'id'>): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.add('safetyViolations', violation);
  }

  async getSafetyViolations(limit?: number): Promise<SafetyLog[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('safetyViolations', 'readonly');
    const store = tx.objectStore('safetyViolations');
    const violations: SafetyLog[] = [];
    
    let count = 0;
    for await (const cursor of store.index('byDate').iterate(null, 'prev')) {
      violations.push({ ...cursor.value, id: cursor.primaryKey });
      count++;
      if (limit && count >= limit) break;
    }
    
    return violations;
  }

  // Preferences Methods
  async getPreferences(): Promise<UserPreferences> {
    if (!this.db) await this.init();
    const prefs = await this.db!.get('preferences', 'current');
    return prefs || this.getDefaultPreferences();
  }

  async savePreferences(preferences: UserPreferences): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('preferences', preferences, 'current');
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'system',
      enableNotifications: true,
      reminderTimes: {},
      units: {
        weight: 'lbs',
        height: 'inches'
      }
    };
  }

  // Helper method to add food entry to today's log
  async addFoodEntry(entry: FoodEntry): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    let dailyLog = await this.getDailyLog(today);
    
    if (!dailyLog) {
      const profile = await this.getProfile();
      const weeklyPlan = await this.getCurrentWeeklyPlan();
      
      dailyLog = {
        date: today,
        meals: [],
        exercises: [],
        targetCalories: weeklyPlan?.dailyTargets[today] || 2000,
        totalCalories: 0,
        exerciseCalories: 0,
        netCalories: 0,
        feedback: []
      };
    }
    
    dailyLog.meals.push(entry);
    dailyLog.totalCalories = dailyLog.meals.reduce((sum, meal) => sum + meal.calories, 0);
    dailyLog.netCalories = dailyLog.totalCalories - dailyLog.exerciseCalories;
    
    await this.saveDailyLog(dailyLog);
  }

  // Helper method to add exercise entry to today's log
  async addExerciseEntry(entry: ExerciseEntry): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    let dailyLog = await this.getDailyLog(today);
    
    if (!dailyLog) {
      const profile = await this.getProfile();
      const weeklyPlan = await this.getCurrentWeeklyPlan();
      
      dailyLog = {
        date: today,
        meals: [],
        exercises: [],
        targetCalories: weeklyPlan?.dailyTargets[today] || 2000,
        totalCalories: 0,
        exerciseCalories: 0,
        netCalories: 0,
        feedback: []
      };
    }
    
    dailyLog.exercises.push(entry);
    dailyLog.exerciseCalories = dailyLog.exercises.reduce((sum, ex) => sum + ex.caloriesBurned, 0);
    dailyLog.netCalories = dailyLog.totalCalories - dailyLog.exerciseCalories;
    
    await this.saveDailyLog(dailyLog);
  }

  // Helper method to remove food entry from today's log
  async removeFoodEntry(entryId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const dailyLog = await this.getDailyLog(today);
    
    if (!dailyLog) return;
    
    // Remove the entry
    dailyLog.meals = dailyLog.meals.filter(meal => meal.id !== entryId);
    
    // Recalculate totals
    dailyLog.totalCalories = dailyLog.meals.reduce((sum, meal) => sum + meal.calories, 0);
    dailyLog.netCalories = dailyLog.totalCalories - dailyLog.exerciseCalories;
    
    await this.saveDailyLog(dailyLog);
  }

  // Helper method to remove exercise entry from today's log
  async removeExerciseEntry(entryId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const dailyLog = await this.getDailyLog(today);
    
    if (!dailyLog) return;
    
    // Remove the entry
    dailyLog.exercises = dailyLog.exercises.filter(ex => ex.id !== entryId);
    
    // Recalculate totals
    dailyLog.exerciseCalories = dailyLog.exercises.reduce((sum, ex) => sum + ex.caloriesBurned, 0);
    dailyLog.netCalories = dailyLog.totalCalories - dailyLog.exerciseCalories;
    
    await this.saveDailyLog(dailyLog);
  }

  // Clear all data (for testing or reset)
  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();
    const stores = ['profile', 'dailyLogs', 'weeklyPlans', 'weightHistory', 'monthlyInsights', 'safetyViolations', 'preferences'];
    
    const tx = this.db!.transaction(stores, 'readwrite');
    for (const store of stores) {
      await tx.objectStore(store).clear();
    }
    await tx.done;
  }
}

// Export a singleton instance
export const db = new DatabaseService(); 