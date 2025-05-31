<script lang="ts">
  import { isOnboarded, todayStats, currentDailyLog, userProfile, weeklyPlan } from '$lib/stores/app';
  import { checkSafetyThresholds } from '$lib/utils/calories';
  import Onboarding from '$lib/components/Onboarding.svelte';
  import CalorieRing from '$lib/components/CalorieRing.svelte';
  import QuickActions from '$lib/components/QuickActions.svelte';
  import DailyMeals from '$lib/components/DailyMeals.svelte';
  import DailyExercises from '$lib/components/DailyExercises.svelte';
  
  $: safetyCheck = $currentDailyLog && $userProfile ? 
    checkSafetyThresholds($currentDailyLog.netCalories, $userProfile.sex, 
      $currentDailyLog.exercises.reduce((sum, ex) => sum + ex.duration, 0)) : 
    { safe: true, warnings: [] };
  
  $: netCaloriesClass = !safetyCheck.safe ? 'safe-zone-red' : 
    $todayStats.netCalories < ($userProfile?.sex === 'male' ? 1700 : 1400) ? 'safe-zone-yellow' : 
    'safe-zone-green';
</script>

{#if !$isOnboarded}
  <Onboarding />
{:else}
  <div class="space-y-6">
    <!-- Welcome Section -->
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Today's Dashboard
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
    
    <!-- Main Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Calorie Progress -->
      <div class="card p-6">
        <CalorieRing 
          current={$todayStats.totalCalories} 
          target={$todayStats.targetCalories}
          exercise={$todayStats.exerciseCalories}
        />
      </div>
      
      <!-- Net Calories -->
      <div class="card p-6 {netCaloriesClass}">
        <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Net Calories</h3>
        <p class="text-3xl font-bold">{$todayStats.netCalories}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Food ({$todayStats.totalCalories}) - Exercise ({$todayStats.exerciseCalories})
        </p>
        {#if !safetyCheck.safe}
          <div class="mt-3 text-sm text-red-600 dark:text-red-400">
            ⚠️ {safetyCheck.warnings[0]}
          </div>
        {/if}
      </div>
      
      <!-- Remaining Calories -->
      <div class="card p-6">
        <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Remaining</h3>
        <p class="text-3xl font-bold {$todayStats.remaining < 0 ? 'text-orange-600' : 'text-green-600'}">
          {$todayStats.remaining}
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          calories left for today
        </p>
      </div>
    </div>
    
    <!-- Quick Actions -->
    <QuickActions />
    
    <!-- Daily Summary -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DailyMeals />
      <DailyExercises />
    </div>
    
    <!-- AI Feedback -->
    {#if $currentDailyLog?.feedback && $currentDailyLog.feedback.length > 0}
      <div class="card p-6">
        <h2 class="text-lg font-semibold mb-4">Today's Insights</h2>
        <div class="space-y-3">
          {#each $currentDailyLog.feedback as feedback}
            <div class="flex items-start space-x-3">
              <span class="text-2xl">
                {feedback.type === 'encouragement' ? '🌟' : 
                 feedback.type === 'warning' ? '⚠️' : 
                 feedback.type === 'tip' ? '💡' : '🏆'}
              </span>
              <p class="text-gray-700 dark:text-gray-300">{feedback.message}</p>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}
