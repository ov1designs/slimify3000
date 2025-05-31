<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { initializeApp, isOnboarded, userProfile, error, clearError, isLoading, loadingMessage } from '$lib/stores/app';
	import { page } from '$app/stores';
	
	onMount(() => {
		initializeApp();
	});
	
	const navItems = [
		{ href: '/', label: 'Dashboard', icon: '🏠' },
		{ href: '/chat', label: 'Log Food', icon: '💬' },
		{ href: '/weekly', label: 'Weekly View', icon: '📊' },
		{ href: '/insights', label: 'Insights', icon: '🎯' },
		{ href: '/settings', label: 'Settings', icon: '⚙️' }
	];
</script>

<div class="min-h-screen flex flex-col">
	<!-- Header -->
	<header class="glass sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-16">
				<div class="flex items-center space-x-4">
					<h1 class="text-2xl font-bold text-primary-600 dark:text-primary-400">
						Slimify 3000
					</h1>
					{#if $userProfile}
						<span class="text-sm text-gray-600 dark:text-gray-400">
							Hi, {$userProfile.id.split('-')[0]}! 👋
						</span>
					{/if}
				</div>
				
				{#if $isOnboarded}
					<nav class="hidden md:flex space-x-8">
						{#each navItems as item}
							<a 
								href={item.href}
								class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors {$page.url.pathname === item.href ? 'text-primary-600 dark:text-primary-400' : ''}"
							>
								<span class="mr-1">{item.icon}</span>
								{item.label}
							</a>
						{/each}
					</nav>
				{/if}
			</div>
		</div>
	</header>

	<!-- Mobile Navigation -->
	{#if $isOnboarded}
		<nav class="md:hidden glass fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-gray-700">
			<div class="flex justify-around py-2">
				{#each navItems as item}
					<a 
						href={item.href}
						class="flex flex-col items-center px-3 py-2 text-xs {$page.url.pathname === item.href ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}"
					>
						<span class="text-lg mb-1">{item.icon}</span>
						<span>{item.label}</span>
					</a>
				{/each}
			</div>
		</nav>
	{/if}

	<!-- Main Content -->
	<main class="flex-1 pb-20 md:pb-0">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<slot />
		</div>
	</main>

	<!-- Loading Overlay -->
	{#if $isLoading}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div class="card p-6 flex flex-col items-center space-y-4">
				<div class="spinner w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
				<p class="text-gray-600 dark:text-gray-400">{$loadingMessage || 'Loading...'}</p>
			</div>
		</div>
	{/if}

	<!-- Error Toast -->
	{#if $error}
		<div class="fixed top-20 right-4 z-50 chat-message">
			<div class="card p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 max-w-sm">
				<div class="flex items-start space-x-3">
					<span class="text-red-600 dark:text-red-400">⚠️</span>
					<div class="flex-1">
						<p class="text-sm text-red-800 dark:text-red-200">{$error}</p>
					</div>
					<button 
						on:click={clearError}
						class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
					>
						✕
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
</style>
