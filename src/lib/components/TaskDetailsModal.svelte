<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	export let isOpen = false;
    export let task: any = null;

	const dispatch = createEventDispatcher<{ save: any; close: void; }>();

    let title = '';
    let description = '';

    $: if (isOpen && task) {
        title = task.title;
        description = task.description || '';
    }

    function handleSave() {
        if (!title.trim()) return; 
        dispatch('save', { ...task, title, description });
        isOpen = false; 
    }
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
		<div class="absolute inset-0 bg-black/30 backdrop-blur-sm" on:click={() => dispatch('close')} transition:fade={{ duration: 200 }}></div>
		
        <div class="relative w-full max-w-md bg-black/10 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col" transition:scale={{ duration: 300, easing: quintOut, start: 0.95 }}>
			
            <div class="p-6 pb-2 border-b border-white/5 bg-white/5">
                <div class="flex items-center gap-3 mb-4">
                    <div class="p-2 rounded-2xl bg-[var(--theme-color)] bg-opacity-20 text-[var(--theme-color)]">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </div>
                    <span class="text-xs font-bold uppercase tracking-widest text-white/40">Edit Task</span>
                    <button on:click={() => dispatch('close')} class="ml-auto text-white/30 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <input type="text" bind:value={title} class="w-full bg-white/5 text-xl font-bold text-white placeholder-white/20 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-[var(--theme-color)] transition-all px-5 py-4 rounded-2xl border border-white/5" placeholder="Task Title" />
            </div>

            <div class="flex-1 p-6 flex flex-col gap-2">
                <div class="flex items-center gap-2 text-white/40 mb-1 pl-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                    <span class="text-xs font-semibold uppercase tracking-wide">Notes</span>
                </div>
                <textarea bind:value={description} placeholder="Tap to add details..." rows="6" class="w-full bg-white/5 text-base text-white/80 placeholder-white/20 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-[var(--theme-color)] resize-none leading-relaxed custom-scrollbar p-5 rounded-3xl transition-all border border-white/5"></textarea>
            </div>

            <div class="p-4 bg-black/10 border-t border-white/5 flex gap-3">
                 <button on:click={() => dispatch('close')} class="px-6 py-3.5 rounded-2xl text-white/50 hover:text-white font-medium transition-colors text-sm hover:bg-white/5">Cancel</button>
                <button on:click={handleSave} disabled={!title.trim()} class="flex-1 py-3.5 rounded-2xl bg-[var(--theme-color)] hover:brightness-110 text-white font-bold shadow-lg transition-all disabled:opacity-50">Save Changes</button>
            </div>
		</div>
	</div>
{/if}