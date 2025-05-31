<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$lib/services/database';
  import { userProfile, weightHistory } from '$lib/stores/app';
  import type { MonthlyInsight, DailyLog, WeightEntry } from '$lib/types';
  
  let selectedMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  let monthlyInsight: MonthlyInsight | null = null;
  let isGenerating = false;
  let monthlyLogs: DailyLog[] = [];
  let monthlyWeights: WeightEntry[] = [];
  
  onMount(() => {
    loadMonthData();
  });
  
  $: if (selectedMonth) {
    loadMonthData();
  }
  
  async function loadMonthData() {
    // Load existing insight if available
    monthlyInsight = await db.getMonthlyInsight(selectedMonth);
    
    // Load logs for the month
    const [year, month] = selectedMonth.split('-');
    const startDate = `${selectedMonth}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
    
    monthlyLogs = await db.getDailyLogsByDateRange(startDate, endDate);
    
    // Filter weight entries for the month
    monthlyWeights = $weightHistory.filter(w => w.date.startsWith(selectedMonth));
  }
  
  async function generateInsight() {
    if (!$userProfile || monthlyLogs.length === 0) return;
    
    isGenerating = true;
    
    try {
      // Simulate AI processing - in real app, this would call AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Analyze the data
      const totalWorkouts = monthlyLogs.reduce((sum, log) => sum + log.exercises.length, 0);
      const totalExerciseMinutes = monthlyLogs.reduce((sum, log) => 
        sum + log.exercises.reduce((exSum, ex) => exSum + ex.duration, 0), 0
      );
      const totalCaloriesBurned = monthlyLogs.reduce((sum, log) => sum + log.exerciseCalories, 0);
      
      const avgDailyCalories = Math.round(
        monthlyLogs.reduce((sum, log) => sum + log.totalCalories, 0) / monthlyLogs.length
      );
      
      const weekdayLogs = monthlyLogs.filter(log => {
        const day = new Date(log.date).getDay();
        return day >= 1 && day <= 5;
      });
      const weekendLogs = monthlyLogs.filter(log => {
        const day = new Date(log.date).getDay();
        return day === 0 || day === 6;
      });
      
      const weekdayAvg = weekdayLogs.length > 0 ? 
        Math.round(weekdayLogs.reduce((sum, log) => sum + log.totalCalories, 0) / weekdayLogs.length) : 0;
      const weekendAvg = weekendLogs.length > 0 ? 
        Math.round(weekendLogs.reduce((sum, log) => sum + log.totalCalories, 0) / weekendLogs.length) : 0;
      
      // Count days on target
      const daysOnTarget = monthlyLogs.filter(log => 
        Math.abs(log.totalCalories - log.targetCalories) <= 100
      ).length;
      const consistency = Math.round((daysOnTarget / monthlyLogs.length) * 100);
      
      // Calculate weight change
      const startWeight = monthlyWeights.length > 0 ? monthlyWeights[0].weight : $userProfile.weight;
      const endWeight = monthlyWeights.length > 0 ? monthlyWeights[monthlyWeights.length - 1].weight : $userProfile.weight;
      const weightChange = endWeight - startWeight;
      
      // Get favorite activities
      const activityCounts: Record<string, number> = {};
      monthlyLogs.forEach(log => {
        log.exercises.forEach(ex => {
          activityCounts[ex.activity] = (activityCounts[ex.activity] || 0) + 1;
        });
      });
      const favoriteActivities = Object.entries(activityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([activity]) => activity);
      
      // Generate insight
      const insight: MonthlyInsight = {
        month: selectedMonth,
        summary: generateSummary(consistency, weightChange, totalWorkouts),
        achievements: generateAchievements(monthlyLogs, consistency, totalWorkouts),
        challenges: generateChallenges(weekdayAvg, weekendAvg, consistency),
        exercisePatterns: {
          totalWorkouts,
          favoriteActivities,
          averageDuration: totalWorkouts > 0 ? Math.round(totalExerciseMinutes / totalWorkouts) : 0,
          caloriesBurned: totalCaloriesBurned
        },
        nutritionPatterns: {
          averageDailyCalories: avgDailyCalories,
          weekdayVsWeekend: {
            weekday: weekdayAvg,
            weekend: weekendAvg
          },
          consistency
        },
        recommendations: generateRecommendations(consistency, weekdayAvg, weekendAvg, favoriteActivities),
        weightChange
      };
      
      // Save the insight
      await db.saveMonthlyInsight(insight);
      monthlyInsight = insight;
      
    } catch (error) {
      console.error('Failed to generate insight:', error);
    } finally {
      isGenerating = false;
    }
  }
  
  function generateSummary(consistency: number, weightChange: number, workouts: number): string {
    if (consistency >= 80 && weightChange < 0) {
      return "Excellent month! You stayed consistent with your calorie targets and made great progress.";
    } else if (consistency >= 60) {
      return "Good effort this month! You maintained decent consistency with room for improvement.";
    } else {
      return "This was a challenging month, but every day is a new opportunity to improve.";
    }
  }
  
  function generateAchievements(logs: DailyLog[], consistency: number, workouts: number): string[] {
    const achievements: string[] = [];
    
    if (consistency >= 80) {
      achievements.push("Maintained excellent calorie target adherence");
    }
    
    if (workouts >= 20) {
      achievements.push("Exercised regularly throughout the month");
    }
    
    const streak = calculateLongestStreak(logs);
    if (streak >= 7) {
      achievements.push(`Achieved a ${streak}-day logging streak`);
    }
    
    if (logs.some(log => log.exerciseCalories > 500)) {
      achievements.push("Completed high-intensity workout sessions");
    }
    
    return achievements.length > 0 ? achievements : ["Started tracking your health journey"];
  }
  
  function generateChallenges(weekdayAvg: number, weekendAvg: number, consistency: number): string[] {
    const challenges: string[] = [];
    
    if (weekendAvg > weekdayAvg * 1.2) {
      challenges.push("Weekend calories significantly higher than weekdays");
    }
    
    if (consistency < 60) {
      challenges.push("Inconsistent adherence to daily calorie targets");
    }
    
    return challenges;
  }
  
  function generateRecommendations(consistency: number, weekdayAvg: number, weekendAvg: number, activities: string[]): string[] {
    const recommendations: string[] = [];
    
    if (consistency < 70) {
      recommendations.push("Try meal prepping on Sundays to improve weekday consistency");
    }
    
    if (weekendAvg > weekdayAvg * 1.2) {
      recommendations.push("Plan weekend activities that don't revolve around food");
    }
    
    if (activities.length < 2) {
      recommendations.push("Add variety to your exercise routine to prevent boredom");
    }
    
    recommendations.push("Continue logging daily to maintain awareness and accountability");
    
    return recommendations;
  }
  
  function calculateLongestStreak(logs: DailyLog[]): number {
    if (logs.length === 0) return 0;
    
    let maxStreak = 0;
    let currentStreak = 0;
    
    const sortedLogs = logs.sort((a, b) => a.date.localeCompare(b.date));
    
    for (let i = 0; i < sortedLogs.length; i++) {
      if (i === 0 || isConsecutiveDays(sortedLogs[i-1].date, sortedLogs[i].date)) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  }
  
  function isConsecutiveDays(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  }
  
  function changeMonth(direction: number) {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + direction, 1);
    selectedMonth = newDate.toISOString().slice(0, 7);
  }
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Header with Month Navigation -->
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Monthly Insights</h1>
    <div class="flex items-center space-x-4">
      <button
        on:click={() => changeMonth(-1)}
        class="btn-secondary px-3 py-1"
      >
        ← Previous
      </button>
      <span class="text-sm font-medium">
        {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </span>
      <button
        on:click={() => changeMonth(1)}
        disabled={selectedMonth >= new Date().toISOString().slice(0, 7)}
        class="btn-secondary px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  </div>
  
  {#if !monthlyInsight && monthlyLogs.length > 0}
    <!-- Generate Insight CTA -->
    <div class="card p-8 text-center">
      <h2 class="text-xl font-semibold mb-2">No insights generated yet</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Generate AI-powered insights for this month's data
      </p>
      <button
        on:click={generateInsight}
        disabled={isGenerating}
        class="btn-primary"
      >
        {isGenerating ? 'Generating...' : '✨ Generate Insights'}
      </button>
    </div>
  {:else if monthlyInsight}
    <!-- Summary Card -->
    <div class="card p-6">
      <h2 class="text-lg font-semibold mb-3">Summary</h2>
      <p class="text-gray-700 dark:text-gray-300">{monthlyInsight.summary}</p>
    </div>
    
    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">Weight Change</p>
        <p class="text-2xl font-bold mt-1 {monthlyInsight.weightChange < 0 ? 'text-green-600' : monthlyInsight.weightChange > 0 ? 'text-orange-600' : ''}">
          {monthlyInsight.weightChange > 0 ? '+' : ''}{monthlyInsight.weightChange.toFixed(1)} lbs
        </p>
      </div>
      
      <div class="card p-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">Avg Calories</p>
        <p class="text-2xl font-bold mt-1">{monthlyInsight.nutritionPatterns.averageDailyCalories}</p>
      </div>
      
      <div class="card p-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">Consistency</p>
        <p class="text-2xl font-bold mt-1">{monthlyInsight.nutritionPatterns.consistency}%</p>
      </div>
      
      <div class="card p-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">Workouts</p>
        <p class="text-2xl font-bold mt-1">{monthlyInsight.exercisePatterns.totalWorkouts}</p>
      </div>
    </div>
    
    <!-- Achievements & Challenges -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {#if monthlyInsight.achievements.length > 0}
        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4 text-green-600 dark:text-green-400">🏆 Achievements</h3>
          <ul class="space-y-2">
            {#each monthlyInsight.achievements as achievement}
              <li class="flex items-start">
                <span class="text-green-600 mr-2">✓</span>
                <span class="text-sm">{achievement}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
      
      {#if monthlyInsight.challenges.length > 0}
        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4 text-orange-600 dark:text-orange-400">🎯 Challenges</h3>
          <ul class="space-y-2">
            {#each monthlyInsight.challenges as challenge}
              <li class="flex items-start">
                <span class="text-orange-600 mr-2">!</span>
                <span class="text-sm">{challenge}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
    
    <!-- Exercise Patterns -->
    {#if monthlyInsight.exercisePatterns.totalWorkouts > 0}
      <div class="card p-6">
        <h3 class="text-lg font-semibold mb-4">💪 Exercise Patterns</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
            <p class="text-lg font-medium">{monthlyInsight.exercisePatterns.totalWorkouts}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Avg Duration</p>
            <p class="text-lg font-medium">{monthlyInsight.exercisePatterns.averageDuration} min</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Calories Burned</p>
            <p class="text-lg font-medium">{monthlyInsight.exercisePatterns.caloriesBurned}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Favorite Activities</p>
            <p class="text-sm font-medium">{monthlyInsight.exercisePatterns.favoriteActivities.join(', ') || 'None'}</p>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Nutrition Patterns -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold mb-4">🍽️ Nutrition Patterns</h3>
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600 dark:text-gray-400">Weekday Average</span>
          <span class="font-medium">{monthlyInsight.nutritionPatterns.weekdayVsWeekend.weekday} cal</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600 dark:text-gray-400">Weekend Average</span>
          <span class="font-medium">{monthlyInsight.nutritionPatterns.weekdayVsWeekend.weekend} cal</span>
        </div>
        {#if monthlyInsight.nutritionPatterns.weekdayVsWeekend.weekend > monthlyInsight.nutritionPatterns.weekdayVsWeekend.weekday * 1.1}
          <p class="text-sm text-orange-600 dark:text-orange-400">
            ⚠️ Weekend calories are {Math.round((monthlyInsight.nutritionPatterns.weekdayVsWeekend.weekend / monthlyInsight.nutritionPatterns.weekdayVsWeekend.weekday - 1) * 100)}% higher than weekdays
          </p>
        {/if}
      </div>
    </div>
    
    <!-- Recommendations -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold mb-4">💡 Recommendations</h3>
      <ul class="space-y-3">
        {#each monthlyInsight.recommendations as recommendation}
          <li class="flex items-start">
            <span class="text-primary-600 mr-2 mt-0.5">→</span>
            <span class="text-sm">{recommendation}</span>
          </li>
        {/each}
      </ul>
    </div>
    
    <!-- Regenerate Button -->
    <div class="text-center">
      <button
        on:click={generateInsight}
        disabled={isGenerating}
        class="btn-secondary"
      >
        {isGenerating ? 'Regenerating...' : '🔄 Regenerate Insights'}
      </button>
    </div>
  {:else}
    <!-- No Data -->
    <div class="card p-8 text-center">
      <p class="text-gray-500 dark:text-gray-400">
        No data available for this month. Start logging your meals and exercises to generate insights!
      </p>
    </div>
  {/if}
</div> 