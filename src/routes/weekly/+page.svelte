<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDailyLog, weeklyPlan, userProfile } from '$lib/stores/app';
  import { db } from '$lib/services/database';
  import { calculateWeeklyStats } from '$lib/utils/calories';
  import type { DailyLog } from '$lib/types';
  import Chart from 'chart.js/auto';
  
  let weeklyLogs: DailyLog[] = [];
  let chartCanvas: HTMLCanvasElement;
  let chart: Chart | null = null;
  let selectedWeekOffset = 0; // 0 = current week, -1 = last week, etc.
  
  $: weekStart = getWeekStart(selectedWeekOffset);
  $: weekEnd = getWeekEnd(selectedWeekOffset);
  $: weeklyStats = calculateWeeklyStats(weeklyLogs);
  
  onMount(() => {
    loadWeekData();
    return () => {
      if (chart) chart.destroy();
    };
  });
  
  function getWeekStart(offset: number = 0): Date {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + (offset * 7);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
  
  function getWeekEnd(offset: number = 0): Date {
    const start = getWeekStart(offset);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }
  
  async function loadWeekData() {
    const startDate = weekStart.toISOString().split('T')[0];
    const endDate = weekEnd.toISOString().split('T')[0];
    
    weeklyLogs = await db.getDailyLogsByDateRange(startDate, endDate);
    
    // Fill in missing days with empty logs
    const allDays: DailyLog[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existingLog = weeklyLogs.find(log => log.date === dateStr);
      if (existingLog) {
        allDays.push(existingLog);
      } else {
        allDays.push({
          date: dateStr,
          meals: [],
          exercises: [],
          targetCalories: $weeklyPlan?.dailyTargets[dateStr] || 2000,
          totalCalories: 0,
          exerciseCalories: 0,
          netCalories: 0,
          feedback: []
        });
      }
    }
    
    weeklyLogs = allDays;
    updateChart();
  }
  
  function updateChart() {
    const labels = weeklyLogs.map(log => {
      const date = new Date(log.date);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    });
    
    const data = {
      labels,
      datasets: [
        {
          label: 'Food Calories',
          data: weeklyLogs.map(log => log.totalCalories),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2
        },
        {
          label: 'Exercise Calories',
          data: weeklyLogs.map(log => -log.exerciseCalories),
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2
        },
        {
          label: 'Target',
          data: weeklyLogs.map(log => log.targetCalories),
          borderColor: 'rgb(156, 163, 175)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          type: 'line' as const
        }
      ]
    };
    
    if (chart) {
      chart.data = data;
      chart.update();
    } else if (chartCanvas) {
      chart = new Chart(chartCanvas, {
        type: 'bar',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Weekly Calorie Overview'
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = Math.abs(context.parsed.y);
                  return `${label}: ${value} calories`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }
  
  function changeWeek(direction: number) {
    selectedWeekOffset += direction;
    loadWeekData();
  }
</script>

<div class="space-y-6">
  <!-- Header with Week Navigation -->
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Weekly Overview</h1>
    <div class="flex items-center space-x-4">
      <button
        on:click={() => changeWeek(-1)}
        class="btn-secondary px-3 py-1"
      >
        ← Previous
      </button>
      <span class="text-sm font-medium">
        {weekStart.toLocaleDateString()} - {weekEnd.toLocaleDateString()}
      </span>
      <button
        on:click={() => changeWeek(1)}
        disabled={selectedWeekOffset >= 0}
        class="btn-secondary px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  </div>
  
  <!-- Stats Cards -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="card p-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">Avg Daily Intake</p>
      <p class="text-2xl font-bold mt-1">{weeklyStats.averageIntake}</p>
      <p class="text-xs text-gray-500 mt-1">calories</p>
    </div>
    
    <div class="card p-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">Avg Exercise</p>
      <p class="text-2xl font-bold mt-1 text-green-600">{weeklyStats.averageExercise}</p>
      <p class="text-xs text-gray-500 mt-1">calories/day</p>
    </div>
    
    <div class="card p-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">Net Average</p>
      <p class="text-2xl font-bold mt-1">{weeklyStats.averageNet}</p>
      <p class="text-xs text-gray-500 mt-1">calories/day</p>
    </div>
    
    <div class="card p-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">Adherence</p>
      <p class="text-2xl font-bold mt-1">{weeklyStats.adherenceRate}%</p>
      <p class="text-xs text-gray-500 mt-1">on target</p>
    </div>
  </div>
  
  <!-- Chart -->
  <div class="card p-6">
    <div class="h-80">
      <canvas bind:this={chartCanvas}></canvas>
    </div>
  </div>
  
  <!-- Daily Breakdown -->
  <div class="card p-6">
    <h2 class="text-lg font-semibold mb-4">Daily Breakdown</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th class="text-left py-2">Day</th>
            <th class="text-right py-2">Target</th>
            <th class="text-right py-2">Food</th>
            <th class="text-right py-2">Exercise</th>
            <th class="text-right py-2">Net</th>
            <th class="text-right py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {#each weeklyLogs as log}
            <tr class="border-b border-gray-100 dark:border-gray-800">
              <td class="py-3">
                {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                {#if log.date === new Date().toISOString().split('T')[0]}
                  <span class="text-xs text-primary-600 ml-1">(Today)</span>
                {/if}
              </td>
              <td class="text-right py-3">{log.targetCalories}</td>
              <td class="text-right py-3">{log.totalCalories}</td>
              <td class="text-right py-3 text-green-600">-{log.exerciseCalories}</td>
              <td class="text-right py-3 font-medium">{log.netCalories}</td>
              <td class="text-right py-3">
                {#if log.totalCalories === 0}
                  <span class="text-gray-400">No data</span>
                {:else if Math.abs(log.totalCalories - log.targetCalories) <= 100}
                  <span class="text-green-600">✓ On target</span>
                {:else if log.totalCalories < log.targetCalories}
                  <span class="text-blue-600">Under</span>
                {:else}
                  <span class="text-orange-600">Over</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-gray-300 dark:border-gray-600 font-medium">
            <td class="py-3">Totals</td>
            <td class="text-right py-3">
              {weeklyLogs.reduce((sum, log) => sum + log.targetCalories, 0)}
            </td>
            <td class="text-right py-3">
              {weeklyLogs.reduce((sum, log) => sum + log.totalCalories, 0)}
            </td>
            <td class="text-right py-3 text-green-600">
              -{weeklyLogs.reduce((sum, log) => sum + log.exerciseCalories, 0)}
            </td>
            <td class="text-right py-3">
              {weeklyLogs.reduce((sum, log) => sum + log.netCalories, 0)}
            </td>
            <td class="text-right py-3">
              {#if weeklyStats.totalDeficit > 0}
                <span class="text-green-600">-{weeklyStats.totalDeficit} deficit</span>
              {:else}
                <span class="text-orange-600">+{Math.abs(weeklyStats.totalDeficit)} surplus</span>
              {/if}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
  
  <!-- Weekly Goals Progress -->
  {#if $weeklyPlan && selectedWeekOffset === 0}
    <div class="card p-6">
      <h2 class="text-lg font-semibold mb-4">Weekly Goal Progress</h2>
      <div class="space-y-4">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Target Weight Loss</p>
          <p class="text-lg font-medium">{$weeklyPlan.projectedLoss} lbs</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Required Deficit</p>
          <p class="text-lg font-medium">{$weeklyPlan.totalDeficit} calories</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Current Progress</p>
          <div class="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div 
              class="bg-primary-600 h-4 rounded-full transition-all duration-300"
              style="width: {Math.min((weeklyStats.totalDeficit / $weeklyPlan.totalDeficit) * 100, 100)}%"
            ></div>
          </div>
          <p class="text-sm mt-1">
            {Math.round((weeklyStats.totalDeficit / $weeklyPlan.totalDeficit) * 100)}% of goal
          </p>
        </div>
      </div>
    </div>
  {/if}
</div> 