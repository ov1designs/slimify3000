<script lang="ts">
  export let current: number;
  export let target: number;
  export let exercise: number = 0;
  
  $: percentage = Math.min((current / target) * 100, 100);
  $: strokeDasharray = 2 * Math.PI * 45; // radius = 45
  $: strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;
  
  $: status = percentage < 90 ? 'under' : percentage <= 110 ? 'optimal' : 'over';
  $: ringColor = status === 'under' ? '#10b981' : status === 'optimal' ? '#3b82f6' : '#f97316';
</script>

<div class="flex flex-col items-center">
  <div class="relative w-32 h-32">
    <svg class="w-32 h-32 transform -rotate-90">
      <!-- Background circle -->
      <circle
        cx="64"
        cy="64"
        r="45"
        stroke="currentColor"
        stroke-width="8"
        fill="none"
        class="text-gray-200 dark:text-gray-700"
      />
      <!-- Progress circle -->
      <circle
        cx="64"
        cy="64"
        r="45"
        stroke={ringColor}
        stroke-width="8"
        fill="none"
        stroke-linecap="round"
        style="stroke-dasharray: {strokeDasharray}; stroke-dashoffset: {strokeDashoffset}; transition: stroke-dashoffset 0.5s ease;"
      />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <p class="text-2xl font-bold">{current}</p>
      <p class="text-xs text-gray-600 dark:text-gray-400">of {target}</p>
    </div>
  </div>
  
  <div class="mt-4 text-center">
    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Calories Consumed</h3>
    <p class="text-lg font-semibold mt-1">{percentage.toFixed(0)}%</p>
    {#if exercise > 0}
      <p class="text-sm text-green-600 dark:text-green-400 mt-1">
        +{exercise} from exercise
      </p>
    {/if}
  </div>
</div> 