<script lang="ts">
  import { saveUserProfile } from '$lib/stores/app';
  import type { UserProfile } from '$lib/types';
  
  let step = 1;
  let formData = {
    age: 30,
    weight: 150,
    height: 68,
    sex: 'female' as 'male' | 'female',
    activityLevel: 'moderate' as 'sedentary' | 'light' | 'moderate' | 'active',
    targetWeight: 140,
    weeklyGoal: 1
  };
  
  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
    { value: 'light', label: 'Lightly Active', description: '1-3 days/week' },
    { value: 'moderate', label: 'Moderately Active', description: '3-5 days/week' },
    { value: 'active', label: 'Very Active', description: '6-7 days/week' }
  ];
  
  const weeklyGoals = [
    { value: 0.5, label: '0.5 lbs/week', description: 'Slow & steady' },
    { value: 1, label: '1 lb/week', description: 'Recommended' },
    { value: 1.5, label: '1.5 lbs/week', description: 'Aggressive' },
    { value: 2, label: '2 lbs/week', description: 'Maximum safe' }
  ];
  
  function nextStep() {
    if (step < 3) step++;
  }
  
  function prevStep() {
    if (step > 1) step--;
  }
  
  async function handleSubmit() {
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      ...formData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await saveUserProfile(profile);
  }
</script>

<div class="min-h-screen flex items-center justify-center p-4">
  <div class="card max-w-2xl w-full p-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Welcome to Slimify 3000! 🎯
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Let's set up your profile to create a personalized calorie plan
      </p>
    </div>
    
    <!-- Progress indicator -->
    <div class="flex justify-center mb-8">
      <div class="flex items-center space-x-4">
        {#each [1, 2, 3] as num}
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full flex items-center justify-center {step >= num ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}">
              {num}
            </div>
            {#if num < 3}
              <div class="w-16 h-1 ml-2 {step > num ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}"></div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    
    <form on:submit|preventDefault={handleSubmit}>
      {#if step === 1}
        <div class="space-y-6">
          <h2 class="text-xl font-semibold mb-4">Basic Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="age" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Age
              </label>
              <input
                type="number"
                id="age"
                bind:value={formData.age}
                min="18"
                max="100"
                required
                class="input"
              />
            </div>
            
            <div>
              <label for="sex-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sex
              </label>
              <div class="flex space-x-4" id="sex-input">
                <label class="flex items-center">
                  <input
                    type="radio"
                    bind:group={formData.sex}
                    value="female"
                    class="mr-2"
                    name="sex"
                  />
                  <span>Female</span>
                </label>
                <label class="flex items-center">
                  <input
                    type="radio"
                    bind:group={formData.sex}
                    value="male"
                    class="mr-2"
                    name="sex"
                  />
                  <span>Male</span>
                </label>
              </div>
            </div>
            
            <div>
              <label for="weight" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Weight (lbs)
              </label>
              <input
                type="number"
                id="weight"
                bind:value={formData.weight}
                min="50"
                max="500"
                step="0.1"
                required
                class="input"
              />
            </div>
            
            <div>
              <label for="height" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Height (inches)
              </label>
              <input
                type="number"
                id="height"
                bind:value={formData.height}
                min="48"
                max="96"
                required
                class="input"
              />
              <p class="text-xs text-gray-500 mt-1">
                {Math.floor(formData.height / 12)}'{formData.height % 12}"
              </p>
            </div>
          </div>
        </div>
      {/if}
      
      {#if step === 2}
        <div class="space-y-6">
          <h2 class="text-xl font-semibold mb-4">Activity Level</h2>
          
          <div class="space-y-3">
            {#each activityLevels as level}
              <label class="card p-4 cursor-pointer hover:border-primary-500 transition-colors {formData.activityLevel === level.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}">
                <div class="flex items-start">
                  <input
                    type="radio"
                    bind:group={formData.activityLevel}
                    value={level.value}
                    class="mt-1 mr-3"
                  />
                  <div>
                    <div class="font-medium">{level.label}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">{level.description}</div>
                  </div>
                </div>
              </label>
            {/each}
          </div>
        </div>
      {/if}
      
      {#if step === 3}
        <div class="space-y-6">
          <h2 class="text-xl font-semibold mb-4">Weight Goals</h2>
          
          <div>
            <label for="targetWeight" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Weight (lbs)
            </label>
            <input
              type="number"
              id="targetWeight"
              bind:value={formData.targetWeight}
              min="50"
              max="500"
              step="0.1"
              required
              class="input"
            />
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Goal: Lose {formData.weight - formData.targetWeight} lbs
            </p>
          </div>
          
          <div>
            <p class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Weekly Weight Loss Goal
            </p>
            <div class="space-y-3">
              {#each weeklyGoals as goal}
                <label class="card p-4 cursor-pointer hover:border-primary-500 transition-colors {formData.weeklyGoal === goal.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}">
                  <div class="flex items-start">
                    <input
                      type="radio"
                      bind:group={formData.weeklyGoal}
                      value={goal.value}
                      class="mt-1 mr-3"
                    />
                    <div>
                      <div class="font-medium">{goal.label}</div>
                      <div class="text-sm text-gray-600 dark:text-gray-400">{goal.description}</div>
                    </div>
                  </div>
                </label>
              {/each}
            </div>
          </div>
        </div>
      {/if}
      
      <div class="flex justify-between mt-8">
        <button
          type="button"
          on:click={prevStep}
          disabled={step === 1}
          class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {#if step < 3}
          <button
            type="button"
            on:click={nextStep}
            class="btn-primary"
          >
            Next
          </button>
        {:else}
          <button
            type="submit"
            class="btn-primary"
          >
            Start Tracking! 🚀
          </button>
        {/if}
      </div>
    </form>
  </div>
</div> 