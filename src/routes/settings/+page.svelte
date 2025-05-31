<script lang="ts">
  import { userProfile, preferences, savePreferences, saveUserProfile } from '$lib/stores/app';
  import { db } from '$lib/services/database';
  import { goto } from '$app/navigation';
  import type { UserProfile, UserPreferences } from '$lib/types';
  
  let profileForm: UserProfile | null = null;
  let preferencesForm: UserPreferences | null = null;
  let showDeleteConfirm = false;
  let activeTab: 'profile' | 'preferences' | 'data' = 'profile';
  
  $: if ($userProfile && !profileForm) {
    profileForm = { ...$userProfile };
  }
  
  $: if ($preferences && !preferencesForm) {
    preferencesForm = { ...$preferences };
  }
  
  async function handleProfileUpdate() {
    if (!profileForm) return;
    
    profileForm.updatedAt = new Date();
    await saveUserProfile(profileForm);
    alert('Profile updated successfully!');
  }
  
  async function handlePreferencesUpdate() {
    if (!preferencesForm) return;
    
    await savePreferences(preferencesForm);
    alert('Preferences saved successfully!');
  }
  
  async function handleDataExport() {
    try {
      const allData = {
        profile: $userProfile,
        preferences: $preferences,
        dailyLogs: await db.getDailyLogsByDateRange('2020-01-01', '2030-12-31'),
        weightHistory: await db.getWeightHistory(),
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `slimify-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export data');
    }
  }
  
  async function handleDataReset() {
    if (!showDeleteConfirm) {
      showDeleteConfirm = true;
      return;
    }
    
    try {
      await db.clearAllData();
      goto('/');
      window.location.reload();
    } catch (error) {
      alert('Failed to reset data');
    }
  }
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <h1 class="text-2xl font-bold">Settings</h1>
  
  <!-- Tab Navigation -->
  <div class="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
    <button
      on:click={() => activeTab = 'profile'}
      class="flex-1 px-4 py-2 rounded-md transition-colors {activeTab === 'profile' ? 'bg-white dark:bg-gray-700 font-medium' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}"
    >
      Profile
    </button>
    <button
      on:click={() => activeTab = 'preferences'}
      class="flex-1 px-4 py-2 rounded-md transition-colors {activeTab === 'preferences' ? 'bg-white dark:bg-gray-700 font-medium' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}"
    >
      Preferences
    </button>
    <button
      on:click={() => activeTab = 'data'}
      class="flex-1 px-4 py-2 rounded-md transition-colors {activeTab === 'data' ? 'bg-white dark:bg-gray-700 font-medium' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}"
    >
      Data Management
    </button>
  </div>
  
  <!-- Profile Tab -->
  {#if activeTab === 'profile' && profileForm}
    <div class="card p-6">
      <h2 class="text-lg font-semibold mb-4">Profile Information</h2>
      <form on:submit|preventDefault={handleProfileUpdate} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="age" class="block text-sm font-medium mb-2">Age</label>
            <input
              type="number"
              id="age"
              bind:value={profileForm.age}
              min="18"
              max="100"
              required
              class="input"
            />
          </div>
          
          <div>
            <label for="sex" class="block text-sm font-medium mb-2">Sex</label>
            <select
              id="sex"
              bind:value={profileForm.sex}
              class="input"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
          
          <div>
            <label for="weight" class="block text-sm font-medium mb-2">Current Weight (lbs)</label>
            <input
              type="number"
              id="weight"
              bind:value={profileForm.weight}
              min="50"
              max="500"
              step="0.1"
              required
              class="input"
            />
          </div>
          
          <div>
            <label for="height" class="block text-sm font-medium mb-2">Height (inches)</label>
            <input
              type="number"
              id="height"
              bind:value={profileForm.height}
              min="48"
              max="96"
              required
              class="input"
            />
            <p class="text-xs text-gray-500 mt-1">
              {Math.floor(profileForm.height / 12)}'{profileForm.height % 12}"
            </p>
          </div>
          
          <div>
            <label for="activity" class="block text-sm font-medium mb-2">Activity Level</label>
            <select
              id="activity"
              bind:value={profileForm.activityLevel}
              class="input"
            >
              <option value="sedentary">Sedentary</option>
              <option value="light">Lightly Active</option>
              <option value="moderate">Moderately Active</option>
              <option value="active">Very Active</option>
            </select>
          </div>
          
          <div>
            <label for="targetWeight" class="block text-sm font-medium mb-2">Target Weight (lbs)</label>
            <input
              type="number"
              id="targetWeight"
              bind:value={profileForm.targetWeight}
              min="50"
              max="500"
              step="0.1"
              required
              class="input"
            />
          </div>
          
          <div>
            <label for="weeklyGoal" class="block text-sm font-medium mb-2">Weekly Weight Loss Goal</label>
            <select
              id="weeklyGoal"
              bind:value={profileForm.weeklyGoal}
              class="input"
            >
              <option value={0.5}>0.5 lbs/week</option>
              <option value={1}>1 lb/week</option>
              <option value={1.5}>1.5 lbs/week</option>
              <option value={2}>2 lbs/week</option>
            </select>
          </div>
        </div>
        
        <div class="flex justify-end">
          <button type="submit" class="btn-primary">
            Update Profile
          </button>
        </div>
      </form>
    </div>
  {/if}
  
  <!-- Preferences Tab -->
  {#if activeTab === 'preferences' && preferencesForm}
    <div class="card p-6">
      <h2 class="text-lg font-semibold mb-4">App Preferences</h2>
      <form on:submit|preventDefault={handlePreferencesUpdate} class="space-y-6">
        <div>
          <label for="theme" class="block text-sm font-medium mb-2">Theme</label>
          <select
            id="theme"
            bind:value={preferencesForm.theme}
            class="input"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
        
        <div>
          <label class="flex items-center space-x-3">
            <input
              type="checkbox"
              bind:checked={preferencesForm.enableNotifications}
              class="rounded"
            />
            <span class="text-sm font-medium">Enable Notifications</span>
          </label>
        </div>
        
        <div>
          <h3 class="text-sm font-medium mb-3">Reminder Times</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="breakfast-time" class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Breakfast</label>
              <input
                type="time"
                id="breakfast-time"
                bind:value={preferencesForm.reminderTimes.breakfast}
                class="input"
              />
            </div>
            <div>
              <label for="lunch-time" class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Lunch</label>
              <input
                type="time"
                id="lunch-time"
                bind:value={preferencesForm.reminderTimes.lunch}
                class="input"
              />
            </div>
            <div>
              <label for="dinner-time" class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Dinner</label>
              <input
                type="time"
                id="dinner-time"
                bind:value={preferencesForm.reminderTimes.dinner}
                class="input"
              />
            </div>
            <div>
              <label for="weigh-time" class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Weigh-in</label>
              <input
                type="time"
                id="weigh-time"
                bind:value={preferencesForm.reminderTimes.weigh}
                class="input"
              />
            </div>
          </div>
        </div>
        
        <div class="flex justify-end">
          <button type="submit" class="btn-primary">
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  {/if}
  
  <!-- Data Management Tab -->
  {#if activeTab === 'data'}
    <div class="space-y-6">
      <div class="card p-6">
        <h2 class="text-lg font-semibold mb-4">Export Data</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Download all your data as a JSON file for backup or transfer to another device.
        </p>
        <button on:click={handleDataExport} class="btn-secondary">
          📥 Export All Data
        </button>
      </div>
      
      <div class="card p-6 border-red-200 dark:border-red-800">
        <h2 class="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Danger Zone</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          This will permanently delete all your data including profile, logs, and settings.
        </p>
        {#if showDeleteConfirm}
          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
            <p class="text-sm text-red-800 dark:text-red-200">
              Are you absolutely sure? This action cannot be undone.
            </p>
          </div>
          <div class="flex space-x-3">
            <button on:click={handleDataReset} class="btn-primary bg-red-600 hover:bg-red-700">
              Yes, Delete Everything
            </button>
            <button on:click={() => showDeleteConfirm = false} class="btn-secondary">
              Cancel
            </button>
          </div>
        {:else}
          <button on:click={() => showDeleteConfirm = true} class="btn-secondary border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20">
            🗑️ Reset All Data
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div> 