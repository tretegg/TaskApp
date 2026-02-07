<script lang="ts">
  import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    addMonths,
    addYears,
    isSameMonth,
    isSameDay,
    isToday,
    getDay,
    isBefore,
    startOfToday
  } from 'date-fns';
  
  // FIX 1: Import browser to check if we are running on the client
  import { browser } from '$app/environment';
  
  import RecurringTaskModal from '$lib/components/RecurringTaskModal.svelte';
  import { onMount } from 'svelte';

  // --- Types ---
  interface SubTask {
    id: string;
    title: string;
    completed: boolean;
  }

  interface Task {
    id: string;
    title: string;
    date: Date;
    completed: boolean;
    subtasks: SubTask[];
    isRecurring?: boolean;
  }

  interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
  }

  // --- State ---
  let currentDate = new Date();
  
  let tasks: Task[] = [];
  
  let newTaskTitle = '';
  let newSubTaskTitles: Record<string, string> = {}; 
  let activeSubTaskInput: string | null = null; 
  let selectedDate: Date | null = new Date();

  // Modal State
  let showRecurringModal = false;

  // --- Reactivity ---
  $: days = generateCalendar(currentDate);
  $: selectedDayTasks = tasks.filter(t => selectedDate && isSameDay(t.date, selectedDate));

  // ADD: Load tasks from local storage on startup
  onMount(() => {
    // FIX 2: Only access localStorage in the browser
    if (browser) {
      const saved = localStorage.getItem('liquid-calendar-tasks');
      if (saved) {
        try {
          // Restore dates from strings (JSON doesn't save Date objects)
          tasks = JSON.parse(saved, (key, value) => {
            if (key === 'date') return new Date(value);
            return value;
          });
        } catch (e) {
          console.error("Could not load tasks", e);
        }
      } else {
        // Default data if nothing is saved
        tasks = [
          { 
            id: '1', 
            title: 'Welcome!', 
            date: new Date(), 
            completed: false, 
            subtasks: [] 
          }
        ];
      }
    }
  });
  
  // ADD: Save to local storage whenever 'tasks' changes
  $: if (tasks) {
    // FIX 3: Robust check to prevent 500 Server Errors
    if (browser) {
      localStorage.setItem('liquid-calendar-tasks', JSON.stringify(tasks));
    }
  }

  function generateCalendar(date: Date): CalendarDay[] {
    const start = startOfWeek(startOfMonth(date));
    const end = endOfWeek(endOfMonth(date));

    return eachDayOfInterval({ start, end }).map((day) => ({
      date: day,
      isCurrentMonth: isSameMonth(day, date),
      isToday: isToday(day)
    }));
  }

  function getDayStats(date: Date, currentTasks: Task[]) {
    const dayTasks = currentTasks.filter(t => isSameDay(t.date, date));
    const total = dayTasks.length;
    const completed = dayTasks.filter(t => t.completed).length;
    const progress = total === 0 ? 0 : (completed / total) * 100;
    return { dayTasks, total, completed, progress };
  }

  // --- Actions ---
  function changeMonth(amount: number) {
    currentDate = addMonths(currentDate, amount);
  }

  function addTask() {
    // Trim and check validity
    if (!newTaskTitle || !newTaskTitle.trim() || !selectedDate) return;
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      date: selectedDate,
      completed: false,
      subtasks: []
    };
    
    tasks = [...tasks, newTask];
    newTaskTitle = '';
  }

  // Robust handler for Mobile Keyboards
  function handleInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default form submission or newline
      addTask();
    }
  }

  function handleRecurringCreate(event: CustomEvent<{ title: string; days: number[] }>) {
    const { title, days: selectedDays } = event.detail;
    
    const start = new Date();
    const end = addYears(start, 1);
    const interval = eachDayOfInterval({ start, end });

    const newTasks: Task[] = [];

    interval.forEach(date => {
      const dayOfWeek = getDay(date); 
      if (selectedDays.includes(dayOfWeek)) {
        newTasks.push({
          id: crypto.randomUUID(),
          title: title,
          date: date,
          completed: false,
          subtasks: [],
          isRecurring: true
        });
      }
    });

    tasks = [...tasks, ...newTasks];
  }

  function toggleTask(id: string) {
    tasks = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t);
  }

  function addSubTask(taskId: string) {
    const title = newSubTaskTitles[taskId];
    if (!title || !title.trim()) return;

    const newSub: SubTask = {
      id: crypto.randomUUID(),
      title: title,
      completed: false
    };

    tasks = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, subtasks: [...t.subtasks, newSub] };
      }
      return t;
    });

    newSubTaskTitles[taskId] = '';
    activeSubTaskInput = null; 
  }

  function toggleSubTask(taskId: string, subTaskId: string) {
    tasks = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(s => s.id === subTaskId ? { ...s, completed: !s.completed } : s)
        };
      }
      return t;
    });
  }

  function selectDay(date: Date) {
    selectedDate = date;
  }

  function openSubTaskInput(taskId: string) {
    activeSubTaskInput = taskId;
    if (!newSubTaskTitles[taskId]) newSubTaskTitles[taskId] = '';
  }
</script>

<div class="min-h-screen animated-gradient-bg font-sans text-white relative selection:bg-cyan-500/30 overflow-y-auto lg:overflow-hidden">
  
  <main class="relative z-10 container mx-auto p-4 lg:p-8 flex flex-col lg:flex-row gap-6 lg:h-screen">
    
    <div class="flex-1 flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl ring-1 ring-white/5">
      
      <div class="flex justify-between items-center p-4 lg:p-6 border-b border-white/5">
        <h1 class="text-xl lg:text-2xl font-bold tracking-tight text-white/90 drop-shadow-md">
          {format(currentDate, 'MMMM yyyy')}
        </h1>
        <div class="flex gap-2">
          <button on:click={() => changeMonth(-1)} class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all text-white/70 active:bg-white/20">&lt;</button>
          <button on:click={() => changeMonth(1)} class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all text-white/70 active:bg-white/20">&gt;</button>
        </div>
      </div>

      <div class="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
        {#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as day}
          <div class="py-2 lg:py-3 text-center text-[10px] lg:text-xs font-semibold uppercase tracking-widest text-white/40">{day}</div>
        {/each}
      </div>

      <div class="grid grid-cols-7 flex-1 auto-rows-fr bg-white/[0.02]">
        {#each days as day}
          {@const { dayTasks, total, completed, progress } = getDayStats(day.date, tasks)}
          
          {@const isSelected = selectedDate && isSameDay(day.date, selectedDate)}
          {@const isCompleted = progress === 100 && total > 0}
          {@const isPast = isBefore(day.date, startOfToday())}
          {@const isMissed = isPast && total > 0 && !isCompleted}
          
          <button
            on:click={() => selectDay(day.date)}
            class="
              group relative border-r border-b transition-all duration-300 text-left flex flex-col gap-0.5 lg:gap-1 
              min-h-[70px] lg:min-h-[100px] p-1 lg:p-3
              hover:bg-white/5 focus:outline-none overflow-hidden
              {day.isCurrentMonth ? 'text-white/90' : 'text-white/20 bg-black/10'}
              
              {isSelected 
                ? '!bg-white/10 border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]' 
                : isMissed
                  ? 'bg-red-500/5 border-red-500/20 shadow-[inset_0_0_15px_rgba(239,68,68,0.05)]'
                  : isCompleted 
                    ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]'
                    : 'border-white/5'
              }
            "
          >
            <div class="flex justify-between w-full mb-1 relative z-10">
              <span class="
                text-xs lg:text-sm font-medium w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center rounded-full
                {day.isToday ? 'bg-cyan-500/50 text-white shadow-[0_0_5px_rgba(6,182,212,0.3)]' : ''}
              ">
                {format(day.date, 'd')}
              </span>

              {#if isCompleted}
                <div class="animate-in fade-in zoom-in duration-300">
                  <div class="w-4 h-4 lg:w-6 lg:h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <svg class="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
              {:else if isMissed}
                <div class="animate-in fade-in zoom-in duration-300">
                  <div class="w-4 h-4 lg:w-6 lg:h-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <svg class="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 text-red-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
              {/if}
            </div>

            <div class="hidden lg:block flex-1 w-full space-y-0.5 lg:space-y-1 overflow-hidden relative z-10">
              {#each dayTasks.slice(0, 3) as task}
                <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <div class="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full flex-shrink-0 transition-colors duration-300 {task.completed ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.6)]' : 'bg-pink-400'}"></div>
                  <span class="text-[9px] lg:text-[10px] truncate w-full transition-all duration-300 {task.completed ? 'line-through text-white/30' : 'text-white/70'}">
                    {task.title}
                  </span>
                </div>
              {/each}
              {#if total > 3}
                <div class="text-[8px] lg:text-[9px] text-white/30 pl-2 lg:pl-3">+{total - 3} more</div>
              {/if}
            </div>

            <div class="lg:hidden flex flex-wrap gap-1 content-end mt-auto mb-2 px-1">
              {#each dayTasks.slice(0, 8) as task}
                <div class="w-1.5 h-1.5 rounded-full transition-colors duration-300
                  {task.completed ? 'bg-green-400/80 shadow-[0_0_4px_rgba(74,222,128,0.5)]' : 'bg-pink-400/80'}">
                </div>
              {/each}
              {#if total > 8}
                <div class="w-1.5 h-1.5 rounded-full bg-white/20"></div>
              {/if}
            </div>

            {#if total > 0}
              <div class="absolute bottom-1.5 lg:bottom-3 left-1.5 lg:left-3 right-1.5 lg:right-3 h-0.5 lg:h-1 bg-white/10 rounded-full overflow-hidden z-10">
                <div 
                  class="h-full rounded-full transition-all duration-500 ease-out 
                  {progress === 100 ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : ''}
                  {isMissed ? 'bg-red-400/50' : ''}
                  {!isMissed && progress < 100 ? 'bg-gradient-to-r from-pink-500 to-purple-500' : ''}" 
                  style="width: {progress}%"
                ></div>
              </div>
            {/if}

            {#if isSelected}
              <div class="absolute inset-0 border-2 border-white/20 pointer-events-none z-20"></div>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <div class="w-full lg:w-[450px] h-[600px] lg:h-auto flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl ring-1 ring-white/5 p-4 lg:p-6 mb-8 lg:mb-0">
      
      <div class="mb-4 lg:mb-6">
        <h2 class="text-lg lg:text-xl font-semibold text-white/90">
          {selectedDate ? format(selectedDate, 'EEEE') : 'Select a date'}
        </h2>
        <p class="text-xs lg:text-sm text-white/50">
          {selectedDate ? format(selectedDate, 'MMMM do, yyyy') : ''}
        </p>
      </div>

      <div class="flex-1 overflow-y-auto space-y-3 lg:space-y-4 pr-1 custom-scrollbar pb-4">
        {#if !selectedDate}
          <div class="h-full flex flex-col items-center justify-center text-white/30 space-y-2">
            <svg class="w-10 h-10 lg:w-12 lg:h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span>Tap a day to view tasks</span>
          </div>
        {:else if selectedDayTasks.length === 0}
          <div class="h-full flex flex-col items-center justify-center text-white/30 space-y-2">
            <span class="text-sm">No tasks for this day</span>
          </div>
        {:else}
          {#each selectedDayTasks as task (task.id)}
            <div 
              class="rounded-xl border border-white/5 bg-white/5 overflow-hidden transition-all duration-200 hover:border-white/10"
              class:opacity-75={task.completed}
            >
              <div class="p-3 flex items-start gap-3">
                <button 
                  on:click={() => toggleTask(task.id)}
                  class="mt-1 relative flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all duration-300 flex-shrink-0
                  {task.completed ? 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'border-white/30 hover:border-cyan-400'}"
                >
                  {#if task.completed}
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                  {/if}
                </button>
                
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start">
                    <span class="text-sm font-medium transition-all duration-300 block break-words {task.completed ? 'line-through text-white/50' : 'text-white/90'}">
                      {task.title}
                    </span>
                    {#if task.isRecurring}
                      <div title="Recurring task" class="text-white/30 ml-2">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                      </div>
                    {/if}
                  </div>
                  
                  {#if task.subtasks.length > 0}
                    <div class="mt-3 space-y-2 relative">
                      <div class="absolute left-[-15px] top-0 bottom-2 w-px bg-white/10"></div>
                      {#each task.subtasks as sub (sub.id)}
                        <div class="flex items-center gap-3 relative">
                          <div class="absolute left-[-15px] top-1/2 w-3 h-px bg-white/10"></div>
                          <button 
                            on:click={() => toggleSubTask(task.id, sub.id)}
                            class="w-3 h-3 rounded-full border border-white/30 flex items-center justify-center transition-all
                            {sub.completed ? 'bg-cyan-500 border-cyan-500' : 'hover:border-white/60'}"
                          >
                          </button>
                          <span class="text-xs {sub.completed ? 'text-white/30 line-through' : 'text-white/70'}">{sub.title}</span>
                        </div>
                      {/each}
                    </div>
                  {/if}

                  <div class="mt-2">
                    {#if activeSubTaskInput === task.id}
                      <div class="flex items-center gap-2 mt-2 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div class="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                        <input 
                          autoFocus
                          type="text"
                          bind:value={newSubTaskTitles[task.id]}
                          on:keydown={(e) => e.key === 'Enter' && addSubTask(task.id)}
                          on:blur={() => !newSubTaskTitles[task.id] && (activeSubTaskInput = null)}
                          placeholder="Subtask name..."
                          class="bg-transparent border-b border-white/20 text-xs text-white placeholder-white/20 focus:outline-none focus:border-cyan-400 w-full py-1"
                        />
                      </div>
                    {:else}
                      <button 
                        on:click={() => openSubTaskInput(task.id)}
                        class="text-[10px] text-white/30 hover:text-cyan-400 transition-colors flex items-center gap-1 mt-1"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Add subtask
                      </button>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <div class="mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-white/10">
        <div class="flex gap-2">
          <div class="relative group flex-1">
            <input 
              id="taskInput"
              bind:value={newTaskTitle}
              on:keydown={handleInputKeydown}
              disabled={!selectedDate}
              type="text" 
              enterkeyhint="go" 
              placeholder="Add a new main task..."
              class="
                w-full bg-black/20 border border-white/10 rounded-2xl px-4 lg:px-5 py-3 lg:py-4 pr-12 
                focus:outline-none focus:bg-black/40 focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)]
                transition-all placeholder-white/30 text-white disabled:opacity-50 text-sm lg:text-base
              "
            />
            <button 
              on:click={addTask}
              disabled={!selectedDate || !newTaskTitle}
              class="absolute right-2 top-2 lg:right-3 lg:top-3 p-1.5 lg:p-2 rounded-xl bg-white/10 hover:bg-cyan-500 hover:text-white text-white/50 transition-all disabled:opacity-0 disabled:scale-75"
            >
              <svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
          </div>
          
          <button 
            on:click={() => showRecurringModal = true}
            title="Recurring Task"
            class="p-3 lg:p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/50 transition-all group"
          >
            <svg class="w-5 h-5 lg:w-6 lg:h-6 text-white/50 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </div>
    </div>
  </main>
  
  <RecurringTaskModal 
    bind:isOpen={showRecurringModal} 
    on:create={handleRecurringCreate} 
  />

</div>

<style>
  /* Faded Moving Gradient Background */
  .animated-gradient-bg {
    background: linear-gradient(-45deg, #1a1f2e, #4a4759, #3b5c66, #66424e);
    background-size: 400% 400%;
    animation: gradientMove 30s ease infinite;
  }

  @keyframes gradientMove {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* Scrollbar styles */
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>