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
  
  import { browser } from '$app/environment';
  import RecurringTaskModal from '$lib/components/RecurringTaskModal.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
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
  let isLoaded = false;
  
  let newTaskTitle = '';
  let newSubTaskTitles: Record<string, string> = {}; 
  let activeSubTaskInput: string | null = null; 
  let selectedDate: Date | null = new Date();
  
  // Modal States
  let showRecurringModal = false;
  let showDeleteModal = false;
  let taskToDeleteId: string | null = null; 

  // --- Reactivity ---
  $: days = generateCalendar(currentDate);
  $: selectedDayTasks = tasks.filter(t => selectedDate && isSameDay(t.date, selectedDate));

  // --- Load / Save ---
  onMount(() => {
    if (browser) {
      const saved = localStorage.getItem('liquid-calendar-tasks');
      if (saved) {
        try {
          tasks = JSON.parse(saved, (key, value) => {
            if (key === 'date') return new Date(value);
            return value;
          });
        } catch (e) {
          console.error("Could not load tasks", e);
        }
      }
      isLoaded = true;
    }
  });
  
  $: if (browser && isLoaded) {
      localStorage.setItem('liquid-calendar-tasks', JSON.stringify(tasks));
  }

  // --- Functions ---
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

  function changeMonth(amount: number) {
    currentDate = addMonths(currentDate, amount);
  }

  function addTask() {
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

  function requestDeleteTask(e: Event, taskId: string) {
    e.stopPropagation();
    taskToDeleteId = taskId;
    showDeleteModal = true;
  }

  function confirmDeleteTask() {
    if (taskToDeleteId) {
        tasks = tasks.filter(t => t.id !== taskToDeleteId);
        taskToDeleteId = null;
        showDeleteModal = false;
    }
  }

  function handleInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault(); 
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
      if (t.id === taskId) { return { ...t, subtasks: [...t.subtasks, newSub] }; }
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

<div class="h-[100dvh] w-screen animated-gradient-bg font-sans text-white relative selection:bg-cyan-500/30 overflow-hidden flex flex-col lg:flex-row lg:p-8 lg:gap-8">
  
  <section class="flex-shrink-0 lg:flex-1 lg:h-full flex flex-col bg-white/5 backdrop-blur-xl border-b lg:border border-white/10 lg:rounded-3xl shadow-2xl z-20">
      
      <div class="flex justify-between items-center p-3 pt-6 lg:p-6 border-b border-white/5">
        <h1 class="text-lg lg:text-2xl font-bold tracking-tight text-white/90 drop-shadow-md">
          {format(currentDate, 'MMMM yyyy')}
        </h1>
        <div class="flex gap-2">
          <button on:click={() => changeMonth(-1)} class="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 active:bg-white/20 transition-all">&lt;</button>
          <button on:click={() => changeMonth(1)} class="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 active:bg-white/20 transition-all">&gt;</button>
        </div>
      </div>

      <div class="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
        {#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as day}
          <div class="py-1.5 lg:py-2 text-center text-[10px] lg:text-xs font-semibold uppercase tracking-widest text-white/40">{day}</div>
        {/each}
      </div>

      <div class="grid grid-cols-7 flex-1 auto-rows-fr bg-white/[0.02]">
        {#each days as day, index}
          {@const { dayTasks, total, completed, progress } = getDayStats(day.date, tasks)}
          {@const isSelected = selectedDate && isSameDay(day.date, selectedDate)}
          {@const isCompleted = progress === 100 && total > 0}
          {@const isPast = isBefore(day.date, startOfToday())}
          {@const isMissed = isPast && total > 0 && !isCompleted}
          
          {@const isTopLeft = index === 0}
          {@const isTopRight = index === 6}

          <button
            on:click={() => selectDay(day.date)}
            class="
              group relative border-r border-b border-white/5 transition-all duration-200 text-left flex flex-col gap-0.5 lg:gap-1 
              /* CHANGED: From 14dvh to 8dvh for mobile shortness */
              h-[8dvh] lg:h-auto lg:min-h-[100px] p-1 lg:p-3
              active:bg-white/5 focus:outline-none overflow-hidden
              {day.isCurrentMonth ? 'text-white/90' : 'text-white/20 bg-black/10'}
              {isTopLeft ? 'lg:rounded-tl-2xl' : ''} 
              {isTopRight ? 'lg:rounded-tr-2xl' : ''}
              {isSelected 
                ? '!bg-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]' 
                : isMissed
                  ? 'bg-red-500/5 shadow-[inset_0_0_15px_rgba(239,68,68,0.05)]'
                  : isCompleted 
                    ? 'bg-emerald-500/5 shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]'
                    : ''
              }
            "
          >
            <div class="flex justify-between w-full mb-1 relative z-10">
              <span class="
                text-[10px] lg:text-sm font-medium w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center rounded-full
                {day.isToday ? 'bg-cyan-500/50 text-white shadow-[0_0_8px_rgba(6,182,212,0.4)]' : ''}
              ">
                {format(day.date, 'd')}
              </span>

              {#if isCompleted}
                 <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)] mr-1 mt-1"></div>
              {:else if isMissed}
                 <div class="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_5px_rgba(248,113,113,0.8)] mr-1 mt-1"></div>
              {/if}
            </div>

            <div class="flex flex-wrap gap-0.5 content-end mt-auto mb-1 px-0.5">
              {#each dayTasks.slice(0, 5) as task}
                <div class="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full transition-colors duration-300
                  {task.completed ? 'bg-emerald-400/80' : 'bg-pink-400/80'}">
                </div>
              {/each}
              {#if total > 5}
                <div class="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-white/20"></div>
              {/if}
            </div>

            {#if isSelected}
              <div class="absolute inset-0 border-2 border-white/30 pointer-events-none z-20"></div>
            {/if}
          </button>
        {/each}
      </div>
  </section>

  <section class="flex-1 flex flex-col bg-white/5 backdrop-blur-xl lg:border lg:border-white/10 lg:rounded-3xl shadow-2xl z-10 min-h-0">
      
      <div class="p-3 lg:p-6 border-b border-white/5 flex-shrink-0 bg-white/5 backdrop-blur-md z-20">
        <h2 class="text-base lg:text-xl font-semibold text-white/90">
          {selectedDate ? format(selectedDate, 'EEEE, MMM do') : 'Select a date'}
        </h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {#if !selectedDate}
          <div class="h-full flex flex-col items-center justify-center text-white/30 space-y-2">
            <span>Tap a day to view tasks</span>
          </div>
        {:else if selectedDayTasks.length === 0}
          <div class="h-full flex flex-col items-center justify-center text-white/30 space-y-2">
            <span class="text-sm">No tasks for this day</span>
          </div>
        {:else}
          {#each selectedDayTasks as task (task.id)}
            <div 
              class="group relative rounded-xl border border-white/5 bg-white/5 overflow-hidden transition-all duration-200 active:scale-[0.99]"
              class:opacity-60={task.completed}
            >
              <div class="p-3 flex items-start gap-3">
                <button 
                  on:click={() => toggleTask(task.id)}
                  class="mt-1 relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 flex-shrink-0
                  {task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'}"
                >
                  {#if task.completed}
                    <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                  {/if}
                </button>
                
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start">
                    <span class="text-sm lg:text-base font-medium transition-all duration-300 block break-words {task.completed ? 'line-through text-white/50' : 'text-white/90'}">
                      {task.title}
                    </span>
                    
                    <button 
                      on:click={(e) => requestDeleteTask(e, task.id)}
                      class="p-1.5 -mt-1 -mr-1 text-white/30 hover:text-red-400 active:text-red-500 transition-colors"
                      aria-label="Delete task"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>

                  {#if task.subtasks.length > 0}
                    <div class="mt-3 space-y-2 relative pl-2">
                       <div class="absolute left-0 top-0 bottom-2 w-0.5 bg-white/10 rounded-full"></div>
                       {#each task.subtasks as sub (sub.id)}
                         <div class="flex items-center gap-3">
                           <button 
                             on:click={() => toggleSubTask(task.id, sub.id)}
                             class="w-4 h-4 rounded border border-white/30 flex items-center justify-center transition-all
                             {sub.completed ? 'bg-cyan-500 border-cyan-500' : ''}"
                           >
                             {#if sub.completed}<div class="w-2 h-2 bg-white rounded-sm"></div>{/if}
                           </button>
                           <span class="text-xs lg:text-sm {sub.completed ? 'text-white/30 line-through' : 'text-white/70'}">{sub.title}</span>
                         </div>
                       {/each}
                    </div>
                  {/if}

                  <div class="mt-2">
                    {#if activeSubTaskInput === task.id}
                      <div class="flex items-center gap-2 mt-2 animate-in fade-in duration-200">
                        <input 
                          autoFocus
                          type="text"
                          bind:value={newSubTaskTitles[task.id]}
                          on:keydown={(e) => e.key === 'Enter' && addSubTask(task.id)}
                          on:blur={() => !newSubTaskTitles[task.id] && (activeSubTaskInput = null)}
                          placeholder="Subtask..."
                          class="bg-black/20 rounded px-2 py-1 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-400 w-full"
                        />
                      </div>
                    {:else}
                      <button 
                        on:click={() => openSubTaskInput(task.id)}
                        class="text-xs text-white/30 hover:text-cyan-400 flex items-center gap-1 mt-1 py-1"
                      >
                        + Subtask
                      </button>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <div class="p-3 lg:p-6 border-t border-white/10 bg-white/5 backdrop-blur-md flex-shrink-0 mb-safe">
        <div class="flex gap-3">
          <div class="relative flex-1">
            <input 
              id="taskInput"
              bind:value={newTaskTitle}
              on:keydown={handleInputKeydown}
              disabled={!selectedDate}
              type="text" 
              enterkeyhint="go" 
              placeholder="Add task..."
              class="
                w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 pr-10
                focus:outline-none focus:bg-black/50 focus:border-cyan-500/50 
                transition-all placeholder-white/30 text-white disabled:opacity-50 text-base
              "
            />
            <button 
              on:click={addTask}
              disabled={!selectedDate || !newTaskTitle}
              class="absolute right-2 top-2 p-1.5 rounded-xl bg-cyan-600/80 text-white disabled:opacity-0 transition-all"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
          </div>
          
          <button 
            on:click={() => showRecurringModal = true}
            class="p-3 rounded-2xl bg-white/5 border border-white/10 active:bg-white/20 transition-all"
          >
            <svg class="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </div>
  </section>
  
  <RecurringTaskModal 
    bind:isOpen={showRecurringModal} 
    on:create={handleRecurringCreate} 
  />

  <ConfirmModal 
    bind:isOpen={showDeleteModal} 
    message="Are you sure you want to delete this task? This cannot be undone."
    confirmText="Delete Task"
    on:confirm={confirmDeleteTask}
  />

</div>

<style>
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

  .mb-safe {
    margin-bottom: env(safe-area-inset-bottom);
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
</style>