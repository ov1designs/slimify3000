<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { chatMessages, addChatMessage, currentDailyLog, userProfile } from '$lib/stores/app';
  import { db } from '$lib/services/database';
  import { calculateExerciseCalories } from '$lib/utils/calories';
  import type { ChatMessage, FoodEntry, ExerciseEntry } from '$lib/types';
  
  let messageInput = '';
  let isProcessing = false;
  let messagesContainer: HTMLDivElement;
  
  $: isExerciseMode = $page.url.searchParams.get('type') === 'exercise';
  
  onMount(() => {
    // Clear previous chat on mount
    chatMessages.set([]);
    
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: isExerciseMode 
        ? "Hi! I'm here to help you log your exercise. Tell me what activity you did, for how long, and at what intensity. For example: 'I ran for 30 minutes at moderate pace' or 'Did 45 minutes of yoga'."
        : "Hi! I'm here to help you log your meals and snacks. Just tell me what you ate in plain language. For example: 'I had 2 eggs, toast with butter, and orange juice for breakfast' or 'Just ate a chicken salad sandwich'.",
      timestamp: new Date()
    };
    addChatMessage(welcomeMessage);
  });
  
  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
  
  // Simple markdown link parser
  function parseLinks(text: string): string {
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary-600 hover:text-primary-700 underline">$1</a>');
  }
  
  $: if ($chatMessages.length && messagesContainer) {
    setTimeout(scrollToBottom, 100);
  }
  
  async function handleSubmit() {
    if (!messageInput.trim() || isProcessing || !$userProfile) return;
    
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageInput,
      timestamp: new Date()
    };
    
    addChatMessage(userMessage);
    const inputText = messageInput;
    messageInput = '';
    isProcessing = true;
    
    try {
      if (isExerciseMode) {
        // Call exercise API endpoint
        const response = await fetch('/api/ai/exercise', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ input: inputText })
        });
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        const exerciseData = data.exercise;
        
        const caloriesBurned = calculateExerciseCalories(
          exerciseData.activity,
          exerciseData.duration,
          exerciseData.intensity,
          $userProfile.weight
        );
        
        const exerciseEntry: ExerciseEntry = {
          id: crypto.randomUUID(),
          activity: exerciseData.activity,
          duration: exerciseData.duration,
          intensity: exerciseData.intensity,
          caloriesBurned,
          timestamp: new Date(),
          aiGenerated: true,
          rawInput: inputText
        };
        
        await db.addExerciseEntry(exerciseEntry);
        
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Great job! I've logged your ${exerciseData.activity} session:\n\n` +
                   `🏃 Activity: ${exerciseData.activity}\n` +
                   `⏱️ Duration: ${exerciseData.duration} minutes\n` +
                   `💪 Intensity: ${exerciseData.intensity}\n` +
                   `🔥 Calories burned: ${caloriesBurned}\n\n` +
                   `Keep up the great work! Would you like to log another activity?`,
          timestamp: new Date(),
          metadata: {
            exerciseEntries: [exerciseEntry]
          }
        };
        
        addChatMessage(assistantMessage);
        
        // Add dashboard link after successful entry
        setTimeout(() => {
          const linkMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `📊 [View your dashboard](/) to see all your entries and remove any if needed.`,
            timestamp: new Date()
          };
          addChatMessage(linkMessage);
        }, 500);
      } else {
        // Call food API endpoint
        const response = await fetch('/api/ai/food', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ input: inputText })
        });
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        const foodData = data.foods || [];
        const totalCalories = foodData.reduce((sum: number, food: any) => sum + food.calories, 0);
        
        const foodEntries: FoodEntry[] = foodData.map((food: any) => ({
          id: crypto.randomUUID(),
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          mealType: food.mealType,
          timestamp: new Date(),
          aiGenerated: true,
          rawInput: inputText
        }));
        
        for (const entry of foodEntries) {
          await db.addFoodEntry(entry);
        }
        
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `I've logged your meal! Here's what I recorded:\n\n` +
                   foodEntries.map(food => `• ${food.name}: ${food.calories} calories`).join('\n') +
                   `\n\n📊 Total: ${totalCalories} calories\n\n` +
                   `Your daily total is now ${($currentDailyLog?.totalCalories || 0) + totalCalories} calories. ` +
                   `Would you like to log more food?`,
          timestamp: new Date(),
          metadata: {
            calories: totalCalories,
            foodEntries
          }
        };
        
        addChatMessage(assistantMessage);
        
        // Add dashboard link after successful entry
        setTimeout(() => {
          const linkMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `📊 [View your dashboard](/) to see all your entries and remove any if needed.`,
            timestamp: new Date()
          };
          addChatMessage(linkMessage);
        }, 500);
      }
    } catch (error) {
      console.error('Chat processing error:', error);
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: error instanceof Error 
          ? `⚠️ Error: ${error.message}. Please try again.`
          : "I'm sorry, I had trouble processing that. Could you please try again?",
        timestamp: new Date()
      };
      addChatMessage(errorMessage);
    } finally {
      isProcessing = false;
    }
  }
</script>

<div class="h-[calc(100vh-12rem)] flex flex-col">
  <div class="card flex-1 flex flex-col p-4">
    <!-- Chat Header -->
    <div class="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
      <h1 class="text-xl font-semibold">
        {isExerciseMode ? '🏃 Exercise Logger' : '🍽️ Food Logger'}
      </h1>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Tell me what you {isExerciseMode ? 'did' : 'ate'} in plain language
      </p>
    </div>
    
    <!-- Messages Container -->
    <div 
      bind:this={messagesContainer}
      class="flex-1 overflow-y-auto space-y-4 mb-4 scroll-smooth"
    >
      {#each $chatMessages as message}
        <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[80%] {message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'} p-4 rounded-lg chat-message">
            <p class="whitespace-pre-wrap">{@html parseLinks(message.content)}</p>
            <p class="text-xs opacity-70 mt-2">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      {/each}
      
      {#if isProcessing}
        <div class="flex justify-start">
          <div class="chat-message-assistant p-4 rounded-lg">
            <div class="flex space-x-2">
              <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Input Form -->
    <form on:submit|preventDefault={handleSubmit} class="flex gap-3">
      <input
        type="text"
        bind:value={messageInput}
        placeholder={isExerciseMode ? "e.g., 'Ran for 30 minutes'" : "e.g., 'Had a turkey sandwich and apple'"}
        disabled={isProcessing}
        class="input flex-1"
      />
      <button
        type="submit"
        disabled={!messageInput.trim() || isProcessing}
        class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : 'Send'}
      </button>
    </form>
  </div>
  
  <!-- Quick Examples -->
  <div class="mt-4">
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Quick examples:</p>
    <div class="flex flex-wrap gap-2">
      {#if isExerciseMode}
        <button
          on:click={() => messageInput = "Walked for 45 minutes at a moderate pace"}
          class="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Walking 45 min
        </button>
        <button
          on:click={() => messageInput = "Did 30 minutes of strength training"}
          class="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Strength training
        </button>
        <button
          on:click={() => messageInput = "Intense cycling session for 1 hour"}
          class="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Cycling 1 hour
        </button>
      {:else}
        <button
          on:click={() => messageInput = "2 scrambled eggs, 2 slices of toast with butter, and coffee"}
          class="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Breakfast
        </button>
        <button
          on:click={() => messageInput = "Grilled chicken salad with ranch dressing"}
          class="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Lunch
        </button>
        <button
          on:click={() => messageInput = "Apple and a handful of almonds"}
          class="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Snack
        </button>
      {/if}
    </div>
  </div>
</div> 