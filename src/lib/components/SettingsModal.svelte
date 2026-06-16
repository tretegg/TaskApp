<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	export let isOpen = false;
    export let currentAccent = '#06b6d4';
    export let startOnMonday = false;
    export let hideCompleted = false;
    export let remindersEnabled = false;
    export let reminderTime = '09:00';
    export let tasks: any[] = []; 

	const dispatch = createEventDispatcher<{
        close: void; changeTheme: { accent: string; bg: string }; toggleMonday: boolean; toggleHideCompleted: boolean; toggleReminders: boolean; changeReminderTime: string; deleteByName: string; deleteAll: void; importData: any[]; notify: { message: string; type: 'success' | 'error' };
        testNotification: void;
    }>();

    let taskNameDelete = '';
    let fileInput: HTMLInputElement | undefined;

    const themes = [
        // ROW 1: Neutrals & Reds
        { name: 'Abyss', accent: '#94a3b8', bg: 'linear-gradient(-45deg, #000000, #020617, #0f172a, #000000)' },
        { name: 'Charcoal', accent: '#a1a1aa', bg: 'linear-gradient(-45deg, #000000, #18181b, #27272a, #3f3f46)' },
        { name: 'Crimson', accent: '#f87171', bg: 'linear-gradient(-45deg, #450a0a, #7f1d1d, #991b1b, #b91c1c)' },
        { name: 'Red', accent: '#ef4444', bg: 'linear-gradient(-45deg, #18181b, #7f1d1d, #991b1b, #450a0a)' },
        { name: 'Rose', accent: '#f43f5e', bg: 'linear-gradient(-45deg, #4c0519, #9f1239, #e11d48, #881337)' },
        { name: 'Orange', accent: '#f97316', bg: 'linear-gradient(-45deg, #1c1917, #c2410c, #ea580c, #431407)' },

        // ROW 2: Warm & Greens
        { name: 'Amber', accent: '#f59e0b', bg: 'linear-gradient(-45deg, #1c1917, #78350f, #92400e, #451a03)' },
        { name: 'Gold', accent: '#eab308', bg: 'linear-gradient(-45deg, #271a00, #422006, #854d0e, #a16207)' },
        { name: 'Lime', accent: '#84cc16', bg: 'linear-gradient(-45deg, #1a2e05, #3f6212, #65a30d, #14532d)' },
        { name: 'Forest', accent: '#4ade80', bg: 'linear-gradient(-45deg, #022c22, #052e16, #14532d, #064e3b)' },
        { name: 'Emerald', accent: '#10b981', bg: 'linear-gradient(-45deg, #022c22, #064e3b, #065f46, #022c22)' },
        { name: 'Teal', accent: '#14b8a6', bg: 'linear-gradient(-45deg, #042f2e, #0f766e, #115e59, #134e4a)' },

        // ROW 3: Cool & Purples
        { name: 'Cyan', accent: '#06b6d4', bg: 'linear-gradient(-45deg, #0f172a, #155e75, #0e7490, #083344)' },
        { name: 'Midnight', accent: '#60a5fa', bg: 'linear-gradient(-45deg, #000000, #111827, #1e3a8a, #172554)' },
        { name: 'Indigo', accent: '#6366f1', bg: 'linear-gradient(-45deg, #1e1b4b, #3730a3, #4338ca, #312e81)' },
        { name: 'Violet', accent: '#8b5cf6', bg: 'linear-gradient(-45deg, #020617, #2e1065, #4c1d95, #1e1b4b)' },
        { name: 'Fuchsia', accent: '#d946ef', bg: 'linear-gradient(-45deg, #2e1065, #701a75, #a21caf, #d946ef)' },
        { name: 'Pink', accent: '#ec4899', bg: 'linear-gradient(-45deg, #2e1065, #831843, #9d174d, #500724)' },
    ];

    function handleExport() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks));
        const anchor = document.createElement('a');
        anchor.href = dataStr; anchor.download = "backup.json"; document.body.appendChild(anchor); anchor.click(); anchor.remove();
        dispatch('notify', { message: 'Backup saved.', type: 'success' });
    }

    function triggerImport() { fileInput?.click(); }
    function handleFileSelect(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { try { dispatch('importData', JSON.parse(ev.target?.result as string)); dispatch('notify', { message: 'Restored!', type: 'success' }); isOpen = false; } catch (err) { dispatch('notify', { message: 'Invalid file.', type: 'error' }); } };
        reader.readAsText(file);
    }
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-md" on:click={() => dispatch('close')} transition:fade={{ duration: 200 }}></div>
		
        <div class="relative w-full max-w-sm bg-black/20 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" transition:scale={{ duration: 300, easing: quintOut, start: 0.95 }}>
            
            <div class="flex justify-between items-center p-6 pb-2 shrink-0 border-b border-white/5">
				<h3 class="text-2xl font-bold text-white tracking-tight drop-shadow-md">Settings</h3>
                <button on:click={() => dispatch('close')} class="text-white/30 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
			</div>
            
            <div class="px-6 pt-4 pb-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                
                <div class="space-y-3">
                    <label class="text-xs text-white/40 font-bold uppercase tracking-widest ml-1">Appearance</label>
                    <div class="bg-white/5 rounded-3xl p-5 border border-white/5">
                        <div class="grid grid-cols-6 gap-3">
                            {#each themes as theme}
                                <button 
                                    on:click={() => dispatch('changeTheme', { accent: theme.accent, bg: theme.bg })} 
                                    class="w-8 h-8 rounded-full border-2 transition-all duration-300 shadow-lg mx-auto flex items-center justify-center
                                    {currentAccent === theme.accent ? 'border-white scale-110 shadow-white/20' : 'border-transparent hover:scale-110'}" 
                                    style="background-color: {theme.accent};" 
                                    title={theme.name}
                                >
                                    {#if currentAccent === theme.accent}
                                        <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    {/if}
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>

                <div class="space-y-3">
                    <label class="text-xs text-white/40 font-bold uppercase tracking-widest ml-1">General</label>
                    <div class="bg-white/5 rounded-3xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                        
                        <div class="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                </div>
                                <span class="text-sm font-medium text-white/90">Start week on Monday</span>
                            </div>
                            <button on:click={() => dispatch('toggleMonday', !startOnMonday)} class="w-11 h-6 rounded-full transition-colors duration-300 relative {startOnMonday ? 'bg-white' : 'bg-white/10'}">
                                <div class="w-4 h-4 rounded-full absolute top-1 transition-all duration-300 shadow-sm {startOnMonday ? 'left-6 bg-black' : 'left-1 bg-white/50'}"></div>
                            </button>
                        </div>

                        <div class="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <span class="text-sm font-medium text-white/90">Hide completed tasks</span>
                            </div>
                            <button on:click={() => dispatch('toggleHideCompleted', !hideCompleted)} class="w-11 h-6 rounded-full transition-colors duration-300 relative {hideCompleted ? 'bg-white' : 'bg-white/10'}">
                                <div class="w-4 h-4 rounded-full absolute top-1 transition-all duration-300 shadow-sm {hideCompleted ? 'left-6 bg-black' : 'left-1 bg-white/50'}"></div>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="space-y-3">
                    <label class="text-xs text-white/40 font-bold uppercase tracking-widest ml-1">Notifications</label>
                    <div class="bg-white/5 rounded-3xl p-4 border border-white/5 flex flex-col gap-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                </div>
                                <span class="text-sm font-medium text-white/90">Daily Reminder</span>
                            </div>
                            <button on:click={() => dispatch('toggleReminders', !remindersEnabled)} class="w-11 h-6 rounded-full transition-colors duration-300 relative {remindersEnabled ? 'bg-white' : 'bg-white/10'}">
                                <div class="w-4 h-4 rounded-full absolute top-1 transition-all duration-300 shadow-sm {remindersEnabled ? 'left-6 bg-black' : 'left-1 bg-white/50'}"></div>
                            </button>
                        </div>
                        
                        {#if remindersEnabled}
                            <div class="flex items-center justify-between pt-3 border-t border-white/5 animate-in slide-in-from-top-1">
                                <span class="text-xs font-medium text-white/50 ml-1">Time</span>
                                <input type="time" bind:value={reminderTime} on:change={() => dispatch('changeReminderTime', reminderTime)} class="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/30 font-mono" />
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="space-y-3">
                    <label class="text-xs text-white/40 font-bold uppercase tracking-widest ml-1">Data</label>
                    <div class="grid grid-cols-2 gap-3">
                        <button on:click={handleExport} class="py-5 rounded-3xl bg-white/5 hover:bg-white/10 text-white/90 text-sm font-medium border border-white/5 flex flex-col items-center gap-2 transition-colors active:scale-95">
                            <svg class="w-6 h-6 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Export
                        </button>
                        <button on:click={triggerImport} class="py-5 rounded-3xl bg-white/5 hover:bg-white/10 text-white/90 text-sm font-medium border border-white/5 flex flex-col items-center gap-2 transition-colors active:scale-95">
                            <svg class="w-6 h-6 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            Import
                        </button>
                        <input type="file" accept=".json" class="hidden" bind:this={fileInput} on:change={handleFileSelect} />
                    </div>
                </div>

                <div class="space-y-3">
                    <label class="text-xs text-red-400/60 font-bold uppercase tracking-widest ml-1">Danger Zone</label>
                    <div class="bg-red-500/5 rounded-3xl p-4 border border-red-500/10 space-y-3">
                        <div class="flex gap-2">
                            <input 
                                type="text" 
                                bind:value={taskNameDelete} 
                                placeholder="Type task name..." 
                                class="flex-1 min-w-0 bg-black/20 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors" 
                            />
                            <button 
                                on:click={() => dispatch('deleteByName', taskNameDelete)} 
                                disabled={!taskNameDelete} 
                                class="bg-white/5 hover:bg-white/10 border border-white/5 text-white px-3 shrink-0 rounded-2xl text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                Clean
                            </button>
                        </div>
                        <button on:click={() => dispatch('deleteAll')} class="w-full py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-sm transition-colors border border-red-500/20">
                            Reset Everything
                        </button>
                    </div>
                </div>

                <div class="space-y-3 pt-2">
                    <button 
                        on:click={() => dispatch('testNotification')}
                        class="w-full py-4 rounded-3xl bg-transparent hover:bg-white/5 text-white/30 text-xs font-medium border border-transparent hover:border-white/5 flex items-center justify-center gap-2 transition-colors uppercase tracking-widest"
                    >
                        Developer: Test Notification
                    </button>
                </div>

            </div>
		</div>
	</div>
{/if}

<style>
  /* FIX: Hide scrollbar to remove gray line artifact */
  .custom-scrollbar::-webkit-scrollbar { 
      width: 0px; 
      background: transparent; 
  }
</style>