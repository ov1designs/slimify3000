<script lang="ts">
  import { currentDailyLog, removeExerciseEntry } from '$lib/stores/app';
  
  let deletingId: string | null = null;
  
  $: exercises = $currentDailyLog?.exercises || [];
  
  const intensityColors = {
    light: 'text-green-600 dark:text-green-400',
    moderate: 'text-yellow-600 dark:text-yellow-400',
    intense: 'text-red-600 dark:text-red-400'
  };
  
  const intensityEmojis = {
    light: '🚶',
    moderate: '🏃',
    intense: '💪'
  };
  
  async function handleDelete(entryId: string) {
    if (deletingId === entryId) {
      // Confirm delete
      await removeExerciseEntry(entryId);
      deletingId = null;
    } else {
      // Show confirmation
      deletingId = entryId;
      // Reset confirmation after 3 seconds
      setTimeout(() => {
        if (deletingId === entryId) deletingId = null;
      }, 3000);
    }
  }
</script>

<div class="card p-4">
  <h3 class="font-medium mb-3">Today's Exercise</h3>
  
  {#if exercises.length === 0}
    <p class="text-sm text-gray-500">No exercise logged yet</p>
  {:else}
    <div class="space-y-2">
      {#each exercises as exercise}
        <div class="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-lg">{intensityEmojis[exercise.intensity]}</span>
              <div>
                <p class="text-sm font-medium">{exercise.activity}</p>
                <p class="text-xs text-gray-500">
                  {exercise.duration} min • 
                  <span class={intensityColors[exercise.intensity]}>
                    {exercise.intensity}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">{exercise.caloriesBurned} cal</span>
            <button
              on:click={() => handleDelete(exercise.id)}
              class="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded {deletingId === exercise.id ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}"
            >
              {deletingId === exercise.id ? 'Confirm?' : 'Remove'}
            </button>
          </div>
        </div>
      {/each}
      
      <div class="border-t pt-2 mt-2">
        <div class="flex justify-between text-sm font-medium">
          <span>Total Burned</span>
          <span class="text-orange-600 dark:text-orange-400">
            {$currentDailyLog?.exerciseCalories || 0} cal
          </span>
        </div>
      </div>
    </div>
  {/if}
</div> 