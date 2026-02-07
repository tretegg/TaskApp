<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	export let isOpen = false;
	export let message = 'Are you sure?';
	export let confirmText = 'Delete';

	const dispatch = createEventDispatcher();

	function handleConfirm() {
		dispatch('confirm');
		isOpen = false;
	}

	function handleCancel() {
		dispatch('cancel');
		isOpen = false;
	}
</script>

{#if isOpen}
	<div 
		class="fixed inset-0 z-[60] flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
	>
		<div 
			class="absolute inset-0 bg-black/60 backdrop-blur-sm" 
			on:click={handleCancel}
			transition:fade={{ duration: 200 }}
		></div>
		
		<div 
			class="relative w-full max-w-sm bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.6)] p-6 flex flex-col gap-6 text-center"
			transition:scale={{ duration: 300, easing: quintOut, start: 0.95 }}
		>
			<div class="space-y-2">
				<div class="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center mb-2">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
				</div>
				<h3 class="text-xl font-bold text-white">Confirm Action</h3>
				<p class="text-white/60 text-sm">{message}</p>
			</div>

			<div class="flex gap-3">
				<button 
					on:click={handleCancel}
					class="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-colors font-medium border border-white/5"
				>
					Cancel
				</button>
				<button 
					on:click={handleConfirm}
					class="flex-1 py-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-500/20 transition-all"
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}