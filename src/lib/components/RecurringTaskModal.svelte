<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	export let isOpen = false;

	const dispatch = createEventDispatcher<{
		create: { title: string; days: number[] };
		close: void;
	}>();

	let recurringTitle = '';
	let selectedRecurringDays: number[] = []; // 0 = Sun, 1 = Mon...

	function toggleRecurringDay(dayIndex: number) {
		if (selectedRecurringDays.includes(dayIndex)) {
			selectedRecurringDays = selectedRecurringDays.filter((d) => d !== dayIndex);
		} else {
			selectedRecurringDays = [...selectedRecurringDays, dayIndex];
		}
	}

	function handleCreate() {
		if (!recurringTitle || selectedRecurringDays.length === 0) return;
		
		dispatch('create', { 
			title: recurringTitle, 
			days: selectedRecurringDays 
		});
		
		// Reset form
		recurringTitle = '';
		selectedRecurringDays = [];
		isOpen = false;
	}

	function handleClose() {
		isOpen = false;
		dispatch('close');
	}
</script>

{#if isOpen}
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
	>
		<div 
			class="absolute inset-0 bg-black/60 backdrop-blur-sm" 
			on:click={handleClose}
			transition:fade={{ duration: 200 }}
		></div>
		
		<form 
			class="relative w-full max-w-md bg-[#1e293b] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 flex flex-col gap-6"
			transition:scale={{ duration: 300, easing: quintOut, start: 0.95 }}
			on:submit|preventDefault={handleCreate}
		>
			<div>
				<h3 class="text-2xl font-bold text-white">Repeat Task</h3>
				<p class="text-white/50 mt-1">Select days to repeat this task for the next year.</p>
			</div>

			<input 
				type="text" 
				bind:value={recurringTitle} 
				placeholder="Task title (e.g. Gym)"
				enterkeyhint="done"
				class="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500/50 transition-all text-white placeholder-white/30"
			/>

			<div class="flex justify-between gap-1">
				{#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as dayChar, index}
					<button 
						type="button"
						on:click={() => toggleRecurringDay(index)}
						class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
						{selectedRecurringDays.includes(index) 
							? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-110' 
							: 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}"
					>
						{dayChar}
					</button>
				{/each}
			</div>

			<div class="flex gap-3 pt-2">
				<button 
					type="button"
					on:click={handleClose}
					class="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
				>
					Cancel
				</button>
				<button 
					type="submit"
					disabled={!recurringTitle || selectedRecurringDays.length === 0}
					class="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
				>
					Create
				</button>
			</div>
		</form>
	</div>
{/if}