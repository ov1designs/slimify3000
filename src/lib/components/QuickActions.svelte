<script lang="ts">
  import { goto } from '$app/navigation';
  import { addWeight } from '$lib/stores/app';
  
  let showWeightModal = false;
  let weightInput = '';
  
  async function handleWeightSubmit() {
    const weight = parseFloat(weightInput);
    if (!isNaN(weight) && weight > 0) {
      await addWeight(weight);
      showWeightModal = false;
      weightInput = '';
    }
  }
</script>

<div class="card p-6">
  <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <button
      on:click={() => goto('/chat')}
      class="btn-secondary flex flex-col items-center py-4"
    >
      <span class="text-2xl mb-2">🍽️</span>
      <span>Log Food</span>
    </button>
    
    <button
      on:click={() => goto('/chat?type=exercise')}
      class="btn-secondary flex flex-col items-center py-4"
    >
      <span class="text-2xl mb-2">🏃‍♂️</span>
      <span>Log Exercise</span>
    </button>
    
    <button
      on:click={() => showWeightModal = true}
      class="btn-secondary flex flex-col items-center py-4"
    >
      <span class="text-2xl mb-2">⚖️</span>
      <span>Log Weight</span>
    </button>
    
    <button
      on:click={() => goto('/weekly')}
      class="btn-secondary flex flex-col items-center py-4"
    >
      <span class="text-2xl mb-2">📊</span>
      <span>Weekly View</span>
    </button>
  </div>
</div>

<!-- Weight Modal -->
{#if showWeightModal}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="card max-w-sm w-full p-6">
      <h3 class="text-lg font-semibold mb-4">Log Today's Weight</h3>
      <form on:submit|preventDefault={handleWeightSubmit}>
        <input
          type="number"
          step="0.1"
          placeholder="Enter weight in lbs"
          bind:value={weightInput}
          class="input mb-4"
          required
        />
        <div class="flex space-x-3">
          <button type="submit" class="btn-primary flex-1">
            Save
          </button>
          <button
            type="button"
            on:click={() => {showWeightModal = false; weightInput = '';}}
            class="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
{/if} 