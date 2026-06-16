<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
    import { format } from 'date-fns';

	export let isOpen = false;

	const dispatch = createEventDispatcher<{
		create: { title: string; days: number[]; startDate: string; endDate: string; description: string };
		close: void;
	}>();

	let recurringTitle = '';
    let description = '';
	let selectedRecurringDays: number[] = []; 
    
    let startDate = format(new Date(), 'yyyy-MM-dd');
    let endDate = format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd');

	function toggleRecurringDay(dayIndex: number) {
		if (selectedRecurringDays.includes(dayIndex)) {
			selectedRecurringDays = selectedRecurringDays.filter((d) => d !== dayIndex);
		} else {
			selectedRecurringDays = [...selectedRecurringDays, dayIndex];
		}
	}

	function handleCreate() {
		if (!recurringTitle || selectedRecurringDays.length === 0 || !startDate || !endDate) return;
		dispatch('create', { title: recurringTitle, days: selectedRecurringDays, startDate, endDate, description });
		recurringTitle = ''; description = ''; selectedRecurringDays = [];
        startDate = format(new Date(), 'yyyy-MM-dd');
		isOpen = false;
	}

	function handleClose() { isOpen = false; dispatch('close'); }
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
		<div class="absolute inset-0 bg-black/30 backdrop-blur-sm" on:click={handleClose} transition:fade={{ duration: 200 }}></div>
		
        <form 
			class="relative w-full max-w-md bg-black/10 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl p-8 flex flex-col gap-5 max-h-[85vh] overflow-y-auto custom-scrollbar"
			transition:scale={{ duration: 300, easing: quintOut, start: 0.95 }}
			on:submit|preventDefault={handleCreate}
		>
			<div class="text-center mb-1">
				<h3 class="text-2xl font-bold text-white drop-shadow-md">Repeat Task</h3>
				<p class="text-white/60 text-sm mt-1">Schedule tasks for specific days.</p>
			</div>

			<input 
				type="text" 
				bind:value={recurringTitle} 
				placeholder="Task title (e.g. Gym)"
				class="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:bg-white/10 focus:border-[var(--theme-color)] transition-all text-white placeholder-white/30 text-lg shadow-inner"
			/>

            <textarea 
                bind:value={description}
                placeholder="Description (optional)..."
                rows="2"
                class="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:bg-white/10 focus:border-[var(--theme-color)] transition-all text-white placeholder-white/30 text-sm resize-none shadow-inner"
            ></textarea>

            <div class="flex gap-3">
                <div class="flex-1 space-y-2">
                    <label class="text-[10px] text-white/50 font-bold uppercase tracking-wider ml-2">Start Date</label>
                    <input type="date" bind:value={startDate} class="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[var(--theme-color)] text-sm shadow-inner" />
                </div>
                <div class="flex-1 space-y-2">
                    <label class="text-[10px] text-white/50 font-bold uppercase tracking-wider ml-2">End Date</label>
                    <input type="date" bind:value={endDate} class="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[var(--theme-color)] text-sm shadow-inner" />
                </div>
            </div>

			<div class="flex justify-between gap-1 p-2 bg-white/5 rounded-2xl border border-white/5 mt-2">
				{#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as dayChar, index}
					<button 
						type="button"
						on:click={() => toggleRecurringDay(index)}
						class="w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200
						{selectedRecurringDays.includes(index) 
							? 'bg-[var(--theme-color)] text-white shadow-lg scale-105' 
							: 'text-white/30 hover:text-white'}"
					>
						{dayChar}
					</button>
				{/each}
			</div>

			<div class="flex gap-3 pt-4 border-t border-white/5">
				<button type="button" on:click={handleClose} class="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors font-medium border border-white/5">Cancel</button>
				<button type="submit" disabled={!recurringTitle || selectedRecurringDays.length === 0} class="flex-1 py-3.5 rounded-2xl bg-[var(--theme-color)] hover:brightness-110 text-white font-bold shadow-lg disabled:opacity-50 disabled:shadow-none transition-all">Schedule</button>
			</div>
		</form>
	</div>
{/if}