<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';

	export let message = '';
	export let visible = false;
    export let type: 'success' | 'error' = 'success';

</script>

{#if visible}
	<div 
        class="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/10 min-w-[300px]"
        class:bg-emerald-500-20={type === 'success'}
        class:bg-red-500-20={type === 'error'}
        style="background-color: rgba(30, 41, 59, 0.9);"
        in:fly={{ y: -50, duration: 400, easing: backOut }}
        out:fade={{ duration: 200 }}
    >
        <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center {type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}">
            {#if type === 'success'}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
            {:else}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {/if}
        </div>

        <div class="flex-1">
            <h4 class="text-white font-semibold text-sm">{type === 'success' ? 'Success' : 'Error'}</h4>
            <p class="text-white/60 text-xs">{message}</p>
        </div>
	</div>
{/if}