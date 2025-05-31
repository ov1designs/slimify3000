<script lang="ts">
  import { currentDailyLog, removeFoodEntry } from '$lib/stores/app';
  
  let deletingId: string | null = null;
  
  $: meals = $currentDailyLog?.meals || [];
  $: groupedMeals = meals.reduce((acc, meal) => {
    const type = meal.mealType || 'snack';
    if (!acc[type]) acc[type] = [];
    acc[type].push(meal);
    return acc;
  }, {} as Record<string, typeof meals>);
  
  $: mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
  
  const mealEmojis = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍿'
  };
  
  async function handleDelete(entryId: string) {
    if (deletingId === entryId) {
      // Confirm delete
      await removeFoodEntry(entryId);
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
  <h3 class="font-medium mb-3">Today's Meals</h3>
  
  {#if meals.length === 0}
    <p class="text-sm text-gray-500">No meals logged yet</p>
  {:else}
    <div class="space-y-3">
      {#each mealTypes as mealType}
        {#if groupedMeals[mealType]?.length > 0}
          <div>
            <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {mealEmojis[mealType]} {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </h4>
            <div class="space-y-1">
              {#each groupedMeals[mealType] as meal}
                <div class="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded">
                  <div class="flex-1">
                    <span class="text-sm">{meal.name}</span>
                    <span class="text-xs text-gray-500 ml-2">{meal.calories} cal</span>
                  </div>
                  <button
                    on:click={() => handleDelete(meal.id)}
                    class="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded {deletingId === meal.id ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}"
                  >
                    {deletingId === meal.id ? 'Confirm?' : 'Remove'}
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
      
      <div class="border-t pt-2 mt-2">
        <div class="flex justify-between text-sm font-medium">
          <span>Total Calories</span>
          <span>{$currentDailyLog?.totalCalories || 0}</span>
        </div>
      </div>
    </div>
  {/if}
</div> 