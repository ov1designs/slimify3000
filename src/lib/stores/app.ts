import { writable, derived, get } from 'svelte/store';
import type { 
  UserProfile, 
  DailyLog, 
  WeeklyPlan,
  WeightEntry,
  UserPreferences,
  ChatMessage
} from '$lib/types';
import { db } from '$lib/services/database';
import { generateZigzagPlan } from '$lib/utils/calories';

// User Profile Store
export const userProfile = writable<UserProfile | null>(null);

// Daily Log Store
export const currentDailyLog = writable<DailyLog | null>(null);

// Weekly Plan Store
export const weeklyPlan = writable<WeeklyPlan | null>(null);

// Weight History Store
export const weightHistory = writable<WeightEntry[]>([]);

// Preferences Store
export const preferences = writable<UserPreferences>({
  theme: 'system',
  enableNotifications: true,
  reminderTimes: {},
  units: {
    weight: 'lbs',
    height: 'inches'
  }
});

// Chat Messages Store
export const chatMessages = writable<ChatMessage[]>([]);

// Loading States
export const isLoading = writable(false);
export const loadingMessage = writable('');

// Error State
export const error = writable<string | null>(null);

// Derived Stores
export const isOnboarded = derived(
  userProfile,
  $userProfile => $userProfile !== null
);

export const todayStats = derived(
  currentDailyLog,
  $log => {
    if (!$log) {
      return {
        totalCalories: 0,
        exerciseCalories: 0,
        netCalories: 0,
        targetCalories: 2000,
        remaining: 2000,
        percentComplete: 0
      };
    }
    
    return {
      totalCalories: $log.totalCalories,
      exerciseCalories: $log.exerciseCalories,
      netCalories: $log.netCalories,
      targetCalories: $log.targetCalories,
      remaining: $log.targetCalories - $log.totalCalories + $log.exerciseCalories,
      percentComplete: Math.round(($log.totalCalories / $log.targetCalories) * 100)
    };
  }
);

// Initialize app data from database
export async function initializeApp() {
  try {
    isLoading.set(true);
    loadingMessage.set('Loading your data...');
    
    // Initialize database
    await db.init();
    
    // Load user profile
    const profile = await db.getProfile();
    if (profile) {
      userProfile.set(profile);
      
      // Load today's log
      const today = new Date().toISOString().split('T')[0];
      const todayLog = await db.getDailyLog(today);
      currentDailyLog.set(todayLog);
      
      // Load current weekly plan
      const plan = await db.getCurrentWeeklyPlan();
      weeklyPlan.set(plan);
      
      // Load weight history
      const history = await db.getWeightHistory(30);
      weightHistory.set(history);
      
      // Load preferences
      const prefs = await db.getPreferences();
      preferences.set(prefs);
    }
    
    error.set(null);
  } catch (err) {
    console.error('Failed to initialize app:', err);
    error.set('Failed to load data. Please refresh the page.');
  } finally {
    isLoading.set(false);
    loadingMessage.set('');
  }
}

// Save user profile and generate initial weekly plan
export async function saveUserProfile(profile: UserProfile) {
  try {
    isLoading.set(true);
    loadingMessage.set('Saving profile...');
    
    // Save profile
    await db.saveProfile(profile);
    userProfile.set(profile);
    
    // Generate and save weekly plan
    const zigzagTargets = generateZigzagPlan(profile);
    const totalTarget = Object.values(zigzagTargets).reduce((sum, cal) => sum + cal, 0);
    const avgTarget = Math.round(totalTarget / 7);
    const weeklyDeficit = (profile.weeklyGoal * 3500); // 1 lb = 3500 calories
    
    const plan: WeeklyPlan = {
      weekStartDate: new Date().toISOString().split('T')[0],
      dailyTargets: zigzagTargets,
      averageTarget: avgTarget,
      totalDeficit: weeklyDeficit,
      projectedLoss: profile.weeklyGoal
    };
    
    await db.saveWeeklyPlan(plan);
    weeklyPlan.set(plan);
    
    // Initialize today's log
    const today = new Date().toISOString().split('T')[0];
    const todayLog: DailyLog = {
      date: today,
      meals: [],
      exercises: [],
      targetCalories: zigzagTargets[today] || avgTarget,
      totalCalories: 0,
      exerciseCalories: 0,
      netCalories: 0,
      feedback: []
    };
    
    await db.saveDailyLog(todayLog);
    currentDailyLog.set(todayLog);
    
    error.set(null);
  } catch (err) {
    console.error('Failed to save profile:', err);
    error.set('Failed to save profile. Please try again.');
  } finally {
    isLoading.set(false);
    loadingMessage.set('');
  }
}

// Update daily log
export async function updateDailyLog(updates: Partial<DailyLog>) {
  try {
    const current = get(currentDailyLog);
    if (!current) return;
    
    const updated = { ...current, ...updates };
    await db.saveDailyLog(updated);
    currentDailyLog.set(updated);
  } catch (err) {
    console.error('Failed to update daily log:', err);
    error.set('Failed to save changes. Please try again.');
  }
}

// Add weight entry
export async function addWeight(weight: number, notes?: string) {
  try {
    const entry: WeightEntry = {
      date: new Date().toISOString().split('T')[0],
      weight,
      notes
    };
    
    await db.addWeightEntry(entry);
    
    // Update weight history
    const history = get(weightHistory);
    weightHistory.set([entry, ...history].slice(0, 30));
    
    // Update profile weight
    const profile = get(userProfile);
    if (profile) {
      profile.weight = weight;
      profile.updatedAt = new Date();
      await db.saveProfile(profile);
      userProfile.set(profile);
    }
  } catch (err) {
    console.error('Failed to add weight entry:', err);
    error.set('Failed to save weight. Please try again.');
  }
}

// Save preferences
export async function savePreferences(prefs: UserPreferences) {
  try {
    await db.savePreferences(prefs);
    preferences.set(prefs);
    
    // Apply theme
    if (prefs.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (prefs.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  } catch (err) {
    console.error('Failed to save preferences:', err);
    error.set('Failed to save preferences. Please try again.');
  }
}

// Clear error
export function clearError() {
  error.set(null);
}

// Add chat message
export function addChatMessage(message: ChatMessage) {
  chatMessages.update(messages => [...messages, message]);
}

// Clear chat messages
export function clearChat() {
  chatMessages.set([]);
}

// Remove food entry
export async function removeFoodEntry(entryId: string) {
  try {
    isLoading.set(true);
    loadingMessage.set('Removing entry...');
    
    await db.removeFoodEntry(entryId);
    
    // Reload today's log
    const today = new Date().toISOString().split('T')[0];
    const updatedLog = await db.getDailyLog(today);
    currentDailyLog.set(updatedLog);
    
    error.set(null);
  } catch (err) {
    console.error('Failed to remove food entry:', err);
    error.set('Failed to remove entry. Please try again.');
  } finally {
    isLoading.set(false);
    loadingMessage.set('');
  }
}

// Remove exercise entry
export async function removeExerciseEntry(entryId: string) {
  try {
    isLoading.set(true);
    loadingMessage.set('Removing entry...');
    
    await db.removeExerciseEntry(entryId);
    
    // Reload today's log
    const today = new Date().toISOString().split('T')[0];
    const updatedLog = await db.getDailyLog(today);
    currentDailyLog.set(updatedLog);
    
    error.set(null);
  } catch (err) {
    console.error('Failed to remove exercise entry:', err);
    error.set('Failed to remove entry. Please try again.');
  } finally {
    isLoading.set(false);
    loadingMessage.set('');
  }
} 