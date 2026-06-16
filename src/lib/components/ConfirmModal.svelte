<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	export let isOpen = false;
	export let title = 'Are you sure?';
	export let message = 'This action cannot be undone.';
	export let confirmText = 'Confirm';
    export let cancelText = 'Cancel';
    export let isDestructive = false; 

	const dispatch = createEventDispatcher();
</script>

{#if isOpen}
	<div class="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
		<div class="absolute inset-0 bg-black/30 backdrop-blur-sm" on:click={() => dispatch('cancel')} transition:fade={{ duration: 200 }}></div>
        <div class="relative w-full max-w-sm bg-black/10 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl p-8 flex flex-col gap-6 text-center" transition:scale={{ duration: 300, easing: quintOut, start: 0.95 }}>
			<div class="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-2 shadow-inner border border-white/5 {isDestructive ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70'}">
                {#if isDestructive} <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                {:else} <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>{/if}
			</div>
			<div class="space-y-2"><h3 class="text-xl font-bold text-white drop-shadow-md">{title}</h3><p class="text-white/70 text-sm leading-relaxed">{message}</p></div>
			<div class="flex gap-3">
				<button on:click={() => dispatch('cancel')} class="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors font-medium border border-white/5">{cancelText}</button>
				<button on:click={() => dispatch('confirm')} class="flex-1 py-3.5 rounded-2xl font-bold shadow-lg transition-all text-white border border-white/5 {isDestructive ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/20'}">{confirmText}</button>
			</div>
		</div>
	</div>
{/if}