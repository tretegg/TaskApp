<script lang="ts">
  import {
    startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, addMonths, addYears, isSameMonth, isSameDay, isToday, getDay, isBefore, startOfToday, parseISO, addDays, set
  } from 'date-fns';
  import { browser } from '$app/environment';
  
  import { Haptics, ImpactStyle } from '@capacitor/haptics';
  import { LocalNotifications } from '@capacitor/local-notifications';

  import RecurringTaskModal from '$lib/components/RecurringTaskModal.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import SettingsModal from '$lib/components/SettingsModal.svelte';
  import TaskDetailsModal from '$lib/components/TaskDetailsModal.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { onMount } from 'svelte';

  // ... (Interfaces remain same) ...
  interface SubTask { id: string; title: string; completed: boolean; }
  interface Task { id: string; title: string; date: Date; completed: boolean; subtasks: SubTask[]; isRecurring?: boolean; description?: string; isExpanded?: boolean; }
  interface CalendarDay { date: Date; isCurrentMonth: boolean; isToday: boolean; }

  let currentDate = new Date();
  let tasks: Task[] = [];
  let isLoaded = false;
  
  let themeColor = '#06b6d4';
  let themeBg = 'linear-gradient(-45deg, #0f172a, #155e75, #0e7490, #083344)';
  let startOnMonday = false; 
  let hideCompleted = false;
  let remindersEnabled = false;
  let reminderTime = '09:00';
  
  let showToast = false;
  let toastMessage = '';
  let toastType: 'success' | 'error' = 'success';

  let newTaskTitle = '';
  let newSubTaskTitles: Record<string, string> = {}; 
  let activeSubTaskInput: string | null = null; 
  let selectedDate: Date | null = new Date();
  
  let showRecurringModal = false;
  let showDeleteModal = false;
  let showSettingsModal = false;
  let showDetailsModal = false;
  let taskToEdit: Task | null = null;
  
  let taskToDeleteId: string | null = null; 
  let bulkDeleteName: string | null = null;
  let isBulkDelete = false;
  let isResetAll = false;

  $: days = generateCalendar(currentDate, startOnMonday ? 1 : 0);
  $: selectedDayTasks = tasks
      .filter(t => selectedDate && isSameDay(t.date, selectedDate))
      .filter(t => hideCompleted ? !t.completed : true);

  // Re-schedule notifications whenever tasks change
  $: if (isLoaded && remindersEnabled) {
      scheduleNotifications();
  }

  onMount(() => {
    if (browser) {
      const saved = localStorage.getItem('liquid-calendar-tasks');
      if (saved) {
        try {
          tasks = JSON.parse(saved, (key, value) => {
            if (key === 'date') return new Date(value);
            return value;
          });
        } catch (e) { console.error("Error", e); }
      }
      
      const savedTheme = localStorage.getItem('liquid-calendar-theme-color');
      const savedBg = localStorage.getItem('liquid-calendar-theme-bg');
      const savedMonday = localStorage.getItem('liquid-calendar-pref-monday');
      const savedHide = localStorage.getItem('liquid-calendar-pref-hide');
      const savedReminders = localStorage.getItem('liquid-calendar-pref-reminders');
      const savedTime = localStorage.getItem('liquid-calendar-pref-time');
      
      if (savedTheme) themeColor = savedTheme;
      if (savedBg) themeBg = savedBg;
      if (savedMonday) startOnMonday = JSON.parse(savedMonday);
      if (savedHide) hideCompleted = JSON.parse(savedHide);
      if (savedReminders) remindersEnabled = JSON.parse(savedReminders);
      if (savedTime) reminderTime = savedTime;

      if (remindersEnabled) {
          scheduleNotifications();
      }

      isLoaded = true;
    }
  });
  
  $: if (browser && isLoaded) {
      localStorage.setItem('liquid-calendar-tasks', JSON.stringify(tasks));
      localStorage.setItem('liquid-calendar-theme-color', themeColor);
      localStorage.setItem('liquid-calendar-theme-bg', themeBg);
      localStorage.setItem('liquid-calendar-pref-monday', JSON.stringify(startOnMonday));
      localStorage.setItem('liquid-calendar-pref-hide', JSON.stringify(hideCompleted));
      localStorage.setItem('liquid-calendar-pref-reminders', JSON.stringify(remindersEnabled));
      localStorage.setItem('liquid-calendar-pref-time', reminderTime);
  }

  // --- SMART NOTIFICATION LOGIC ---
  async function scheduleNotifications() {
      if (!browser) return;
      try {
          const permission = await LocalNotifications.requestPermissions();
          if (permission.display !== 'granted') return;

          // 1. Clear ALL old pending notifications
          await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }] });

          if (!remindersEnabled) return;

          const [hour, minute] = reminderTime.split(':').map(Number);
          const notificationsToSchedule = [];

          // 2. Schedule for the next 7 days
          for (let i = 0; i < 7; i++) {
              const targetDate = addDays(startOfToday(), i);
              
              // Get incomplete tasks for this day
              const dayTasks = tasks.filter(t => isSameDay(t.date, targetDate) && !t.completed);
              
              let bodyText = "You have no tasks scheduled for today.";
              
              if (dayTasks.length > 0) {
                  const titles = dayTasks.map(t => t.title).join(', ');
                  // Truncate if too long
                  const truncated = titles.length > 40 ? titles.substring(0, 40) + '...' : titles;
                  bodyText = `${dayTasks.length} Tasks: ${truncated}`;
              } else {
                  // Optional: Skip notification if no tasks? 
                  // For now, let's keep it so user knows app is working
                  bodyText = "No tasks for today. Enjoy!";
              }

              // Create specific date object for this notification
              const scheduleDate = set(targetDate, { hours: hour, minutes: minute, seconds: 0 });
              
              // Only schedule if it's in the future
              if (scheduleDate.getTime() > Date.now()) {
                  notificationsToSchedule.push({
                      id: i + 1, // IDs 1 through 7
                      title: i === 0 ? 'Today\'s Tasks' : 'Upcoming Tasks',
                      body: bodyText,
                      schedule: { at: scheduleDate }, // Specific point in time
                      actionTypeId: "", 
                      extra: null
                  });
              }
          }

          if (notificationsToSchedule.length > 0) {
              await LocalNotifications.schedule({ notifications: notificationsToSchedule });
          }

      } catch (e) { console.warn('Notifications not supported'); }
  }

  // --- DEV OPTION: TEST NOTIFICATION ---
  async function handleTestNotification() {
      if (!browser) return;
      try {
          const permission = await LocalNotifications.requestPermissions();
          if (permission.display !== 'granted') {
              triggerToast('Permission denied', 'error');
              return;
          }

          // Get today's tasks
          const todayTasks = tasks.filter(t => isSameDay(t.date, startOfToday()) && !t.completed);
          const bodyText = todayTasks.length > 0 
              ? `${todayTasks.length} Tasks: ${todayTasks.map(t => t.title).join(', ')}`
              : "No tasks left for today!";

          await LocalNotifications.schedule({
              notifications: [{
                  title: 'Test Notification',
                  body: bodyText,
                  id: 999, // Unique ID for test
                  schedule: { at: new Date(Date.now() + 5000) }, // 5 seconds from now
                  actionTypeId: "", 
                  extra: null
              }]
          });
          
          triggerToast('Notification coming in 5 seconds...', 'success');
      } catch (e) {
          triggerToast('Error scheduling notification', 'error');
      }
  }

  async function handleVibrate() {
      if (!browser) return;
      try { await Haptics.impact({ style: ImpactStyle.Light }); } catch(e) {}
  }

  // ... (Rest of functions: generateCalendar, addTask, etc. remain unchanged) ...
  function triggerToast(message: string, type: 'success' | 'error' = 'success') {
      toastMessage = message; toastType = type; showToast = true;
      setTimeout(() => showToast = false, 3000);
  }

  function handleThemeChange(event: CustomEvent<{ accent: string; bg: string }>) {
      themeColor = event.detail.accent; themeBg = event.detail.bg;
  }

  function generateCalendar(date: Date, weekStart: 0 | 1): CalendarDay[] {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: weekStart });
    const end = endOfWeek(endOfMonth(date), { weekStartsOn: weekStart });
    return eachDayOfInterval({ start, end }).map((day) => ({
      date: day, isCurrentMonth: isSameMonth(day, date), isToday: isToday(day)
    }));
  }

  function getDayStats(date: Date, currentTasks: Task[]) {
    const dayTasks = currentTasks.filter(t => isSameDay(t.date, date));
    const total = dayTasks.length;
    const completed = dayTasks.filter(t => t.completed).length;
    const progress = total === 0 ? 0 : (completed / total) * 100;
    return { dayTasks, total, completed, progress };
  }

  function changeMonth(amount: number) { currentDate = addMonths(currentDate, amount); }

  function addTask() {
    if (!newTaskTitle || !newTaskTitle.trim() || !selectedDate) return;
    const newTask: Task = { 
        id: crypto.randomUUID(), 
        title: newTaskTitle, 
        date: selectedDate, 
        completed: false, 
        subtasks: [],
        description: '',
        isExpanded: true 
    };
    tasks = [...tasks, newTask];
    newTaskTitle = '';
    handleVibrate();
  }

  function toggleTaskExpanded(e: Event, taskId: string) {
      e.stopPropagation();
      tasks = tasks.map(t => t.id === taskId ? { ...t, isExpanded: !t.isExpanded } : t);
  }

  function openTaskDetails(task: Task) {
      taskToEdit = task; 
      showDetailsModal = true;
  }

  function saveTaskDetails(event: CustomEvent<any>) {
      const updated = event.detail;
      tasks = tasks.map(t => t.id === updated.id ? updated : t);
      triggerToast('Task updated successfully.');
  }

  function requestDeleteTask(e: Event, taskId: string) {
    e.stopPropagation(); taskToDeleteId = taskId; isBulkDelete = false; isResetAll = false; showDeleteModal = true;
    handleVibrate();
  }

  function handleSettingsDeleteByName(event: CustomEvent<string>) {
      bulkDeleteName = event.detail; isBulkDelete = true; isResetAll = false; showDeleteModal = true;
  }

  function handleSettingsDeleteAll() {
      isResetAll = true; isBulkDelete = false; showDeleteModal = true;
  }

  function confirmAction() {
      if (isResetAll) {
          tasks = [];
          triggerToast('All data cleared.', 'success');
      } else if (isBulkDelete && bulkDeleteName) {
          const nameLower = bulkDeleteName.toLowerCase();
          const initialCount = tasks.length;
          tasks = tasks.filter(t => t.title.toLowerCase() !== nameLower);
          triggerToast(`Deleted ${initialCount - tasks.length} tasks.`);
      } else if (taskToDeleteId) {
          tasks = tasks.filter(t => t.id !== taskToDeleteId);
      }
      taskToDeleteId = null; bulkDeleteName = null; isBulkDelete = false; isResetAll = false; showDeleteModal = false;
      handleVibrate();
  }

  function handleImportData(event: CustomEvent<any[]>) {
      const imported = event.detail.map(t => ({ ...t, date: new Date(t.date) }));
      tasks = imported;
  }

  function handleInputKeydown(e: KeyboardEvent) { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }

  function handleRecurringCreate(event: CustomEvent<{ title: string; days: number[]; startDate: string; endDate: string; description: string }>) {
    const { title, days: selectedDays, startDate, endDate, description } = event.detail;
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const interval = eachDayOfInterval({ start, end });
    const newTasks: Task[] = [];
    interval.forEach(date => {
      const dayOfWeek = getDay(date); 
      if (selectedDays.includes(dayOfWeek)) {
        newTasks.push({ 
            id: crypto.randomUUID(), 
            title, 
            date, 
            completed: false, 
            subtasks: [], 
            isRecurring: true, 
            description: description, 
            isExpanded: true 
        });
      }
    });
    tasks = [...tasks, ...newTasks];
    triggerToast(`Scheduled ${newTasks.length} recurring tasks.`);
  }

  function toggleTask(id: string) { tasks = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t); handleVibrate(); }
  
  function addSubTask(taskId: string) {
    const title = newSubTaskTitles[taskId]; if (!title || !title.trim()) return;
    const newSub: SubTask = { id: crypto.randomUUID(), title, completed: false };
    tasks = tasks.map(t => t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSub] } : t);
    newSubTaskTitles[taskId] = ''; activeSubTaskInput = null; 
  }
  
  function toggleSubTask(taskId: string, subTaskId: string) {
    tasks = tasks.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks.map(s => s.id === subTaskId ? { ...s, completed: !s.completed } : s) } : t);
    handleVibrate();
  }

  function deleteSubTask(taskId: string, subTaskId: string) {
      tasks = tasks.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks.filter(s => s.id !== subTaskId) } : t);
      handleVibrate();
  }

  function selectDay(date: Date) { selectedDate = date; }
  function openSubTaskInput(taskId: string) { activeSubTaskInput = taskId; if (!newSubTaskTitles[taskId]) newSubTaskTitles[taskId] = ''; }
</script>

<div 
    class="h-[100dvh] w-screen animated-gradient-bg font-sans text-white relative selection:bg-[var(--theme-color)] overflow-hidden flex flex-col lg:flex-row lg:p-8 lg:gap-8"
    style="background: {themeBg}; background-size: 400% 400%; --theme-color: {themeColor};"
>
    <Toast visible={showToast} message={toastMessage} type={toastType} />

  <section class="flex-shrink-0 lg:flex-1 lg:h-full flex flex-col bg-white/5 backdrop-blur-xl border-b lg:border border-white/10 lg:rounded-3xl shadow-2xl z-20">
      <div class="flex justify-between items-center p-3 lg:p-6 border-b border-white/5 pt-safe-top">
        <h1 class="text-lg lg:text-2xl font-bold tracking-tight text-white/90 drop-shadow-md">{format(currentDate, 'MMMM yyyy')}</h1>
        <div class="flex gap-2">
            <button on:click={() => showSettingsModal = true} class="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 active:bg-white/20 transition-all mr-2">
                <svg class="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>
            <button on:click={() => changeMonth(-1)} class="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 active:bg-white/20 transition-all">&lt;</button>
            <button on:click={() => changeMonth(1)} class="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 active:bg-white/20 transition-all">&gt;</button>
        </div>
      </div>
      
      <div class="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
        {#each (startOnMonday ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S']) as day}
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
          {@const isTopLeft = index === 0} {@const isTopRight = index === 6}
          <button on:click={() => selectDay(day.date)} class="group relative border-r border-b border-white/5 transition-all duration-200 text-left flex flex-col gap-0.5 lg:gap-1 h-[8dvh] lg:h-auto lg:min-h-[100px] p-1 lg:p-3 active:bg-white/5 focus:outline-none overflow-hidden {day.isCurrentMonth ? 'text-white/90' : 'text-white/20 bg-black/10'} {isTopLeft ? 'lg:rounded-tl-2xl' : ''} {isTopRight ? 'lg:rounded-tr-2xl' : ''} {isSelected ? '!bg-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]' : isMissed ? 'bg-red-500/5 shadow-[inset_0_0_15px_rgba(239,68,68,0.05)]' : isCompleted ? 'bg-emerald-500/5 shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]' : ''}">
            <div class="flex justify-between w-full mb-1 relative z-10">
              <span class="text-[10px] lg:text-sm font-medium w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center rounded-full {day.isToday ? 'bg-[var(--theme-color)] text-white shadow-[0_0_8px_var(--theme-color)]' : ''}" style={day.isToday ? `background-color: ${themeColor}80; box-shadow: 0 0 8px ${themeColor}60;` : ''}>{format(day.date, 'd')}</span>
              {#if isCompleted} <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)] mr-1 mt-1"></div>
              {:else if isMissed} <div class="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_5px_rgba(248,113,113,0.8)] mr-1 mt-1"></div>{/if}
            </div>
            <div class="flex flex-wrap gap-0.5 content-end mt-auto mb-1 px-0.5">
              {#each dayTasks.slice(0, 5) as task}
                <div class="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full transition-colors duration-300 {task.completed ? 'bg-emerald-400/80' : 'bg-[var(--theme-color)]'}" style={!task.completed ? `background-color: ${themeColor}; opacity: 0.8;` : ''}></div>
              {/each}
              {#if total > 5} <div class="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-white/20"></div>{/if}
            </div>
            {#if isSelected} <div class="absolute inset-0 border-2 border-white/30 pointer-events-none z-20"></div>{/if}
          </button>
        {/each}
      </div>
  </section>

  <section class="flex-1 flex flex-col bg-white/5 backdrop-blur-xl lg:border lg:border-white/10 lg:rounded-3xl shadow-2xl z-10 min-h-0">
      <div class="p-3 lg:p-6 border-b border-white/5 flex-shrink-0 bg-white/5 backdrop-blur-md z-20">
        <h2 class="text-base lg:text-xl font-semibold text-white/90">{selectedDate ? format(selectedDate, 'EEEE, MMM do') : 'Select a date'}</h2>
      </div>
      <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {#if !selectedDate} <div class="h-full flex flex-col items-center justify-center text-white/30 space-y-2"><span>Tap a day to view tasks</span></div>
        {:else if selectedDayTasks.length === 0} <div class="h-full flex flex-col items-center justify-center text-white/30 space-y-2"><span class="text-sm">No tasks for this day</span></div>
        {:else}
          {#each selectedDayTasks as task (task.id)}
            <div 
                class="group relative rounded-xl border overflow-hidden transition-all duration-200 active:scale-[0.99] transform-gpu
                {task.completed ? 'bg-black/10 border-white/5' : 'bg-white/5 border-white/10'}"
            >
              <div class="p-3 flex items-start gap-3">
                <button on:click={() => toggleTask(task.id)} class="mt-1 relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 flex-shrink-0 {task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'}">
                  {#if task.completed} <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>{/if}
                </button>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start">
                    <span class="text-left flex-1 text-sm lg:text-base font-medium transition-all duration-300 block break-words mt-0.5 {task.completed ? 'line-through text-white/40' : 'text-white/90'}">
                      {task.title}
                    </span>
                    <div class="flex gap-2 ml-2">
                        <button on:click={() => openTaskDetails(task)} class="p-1.5 -mt-1 text-white/30 hover:text-[var(--theme-color)] transition-colors" style="color: hover {themeColor};"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                        {#if task.description}
                            <button on:click={(e) => toggleTaskExpanded(e, task.id)} class="p-1.5 -mt-1 text-white/30 hover:text-white transition-colors"><svg class="w-5 h-5 transition-transform duration-300 {task.isExpanded ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></button>
                        {/if}
                        <button on:click={(e) => requestDeleteTask(e, task.id)} class="p-1.5 -mt-1 text-white/30 hover:text-red-400 active:text-red-500 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                  </div>
                  {#if task.isExpanded && task.description}
                    <div class="mt-2 text-xs text-white/60 leading-relaxed bg-black/10 p-2 rounded-lg animate-in slide-in-from-top-1 whitespace-pre-wrap">{task.description}</div>
                  {/if}
                  {#if task.subtasks.length > 0}
                    <div class="mt-3 space-y-2 relative pl-2">
                       <div class="absolute left-0 top-0 bottom-2 w-0.5 bg-white/10 rounded-full"></div>
                       {#each task.subtasks as sub (sub.id)}
                         <div class="flex items-center gap-3 group/sub">
                           <button on:click={() => toggleSubTask(task.id, sub.id)} class="w-4 h-4 rounded border border-white/30 flex items-center justify-center transition-all {sub.completed ? 'bg-[var(--theme-color)] border-[var(--theme-color)]' : ''}" style={sub.completed ? `background-color: ${themeColor}; border-color: ${themeColor}` : ''}>{#if sub.completed}<div class="w-2 h-2 bg-white rounded-sm"></div>{/if}</button>
                           <span class="text-xs lg:text-sm {sub.completed ? 'text-white/30 line-through' : 'text-white/70'} flex-1">{sub.title}</span>
                           <button on:click={() => deleteSubTask(task.id, sub.id)} class="text-white/20 hover:text-red-400 opacity-0 group-hover/sub:opacity-100 transition-opacity p-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                         </div>
                       {/each}
                    </div>
                  {/if}
                  <div class="mt-2">
                    {#if activeSubTaskInput === task.id}
                      <form class="flex items-center gap-2 mt-2 animate-in fade-in duration-200" on:submit|preventDefault={() => addSubTask(task.id)}>
                        <input autoFocus type="text" enterkeyhint="done" bind:value={newSubTaskTitles[task.id]} on:blur={() => !newSubTaskTitles[task.id] && (activeSubTaskInput = null)} placeholder="Subtask..." class="bg-black/20 rounded-xl px-2 py-1 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--theme-color)] w-full" style="--tw-ring-color: {themeColor};" />
                      </form>
                    {:else}
                      <button on:click={() => openSubTaskInput(task.id)} class="text-xs text-white/30 hover:text-[var(--theme-color)] flex items-center gap-1 mt-1 py-1" style="color: hover {themeColor};">+ Subtask</button>
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
            <input id="taskInput" bind:value={newTaskTitle} on:keydown={handleInputKeydown} disabled={!selectedDate} type="text" enterkeyhint="go" placeholder="Add task..." class="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 pr-10 focus:outline-none focus:bg-black/50 focus:border-[var(--theme-color)] transition-all placeholder-white/30 text-white disabled:opacity-50 text-base" style="border-color: focus {themeColor};" />
            <button on:click={addTask} disabled={!selectedDate || !newTaskTitle} class="absolute right-2 top-2 p-1.5 rounded-xl bg-[var(--theme-color)] text-white disabled:opacity-0 transition-all opacity-80 hover:opacity-100" style="background-color: {themeColor};"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg></button>
          </div>
          <button on:click={() => showRecurringModal = true} class="p-3 rounded-2xl bg-white/5 border border-white/10 active:bg-white/20 transition-all"><svg class="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></button>
        </div>
      </div>
  </section>
  
  <RecurringTaskModal bind:isOpen={showRecurringModal} on:create={handleRecurringCreate} />
  
  <TaskDetailsModal 
    bind:isOpen={showDetailsModal} 
    task={taskToEdit} 
    on:close={() => showDetailsModal = false}
    on:save={saveTaskDetails}
  />

  <ConfirmModal 
    bind:isOpen={showDeleteModal} 
    title={isResetAll ? 'Reset Everything?' : 'Delete Task?'}
    message={isResetAll ? 'This will wipe all data. Ensure you have a backup.' : 'This cannot be undone.'}
    confirmText={isResetAll ? 'Reset' : 'Delete'}
    isDestructive={true}
    on:confirm={confirmAction}
    on:cancel={() => showDeleteModal = false}
  />
  
  <SettingsModal
    bind:isOpen={showSettingsModal}
    currentAccent={themeColor}
    startOnMonday={startOnMonday}
    hideCompleted={hideCompleted}
    remindersEnabled={remindersEnabled}
    reminderTime={reminderTime}
    tasks={tasks}
    on:close={() => showSettingsModal = false}
    on:changeTheme={handleThemeChange}
    on:toggleMonday={(e) => startOnMonday = e.detail}
    on:toggleHideCompleted={(e) => hideCompleted = e.detail}
    on:toggleReminders={(e) => { remindersEnabled = e.detail; if(remindersEnabled) scheduleNotifications(); else scheduleNotifications(); }}
    on:changeReminderTime={(e) => { reminderTime = e.detail; scheduleNotifications(); }}
    on:deleteByName={handleSettingsDeleteByName}
    on:deleteAll={handleSettingsDeleteAll}
    on:importData={handleImportData}
    on:notify={(e) => triggerToast(e.detail.message, e.detail.type)}
    on:testNotification={handleTestNotification}
  />
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
  :global(body) { font-family: 'Outfit', sans-serif; }
  .animated-gradient-bg { animation: gradientMove 30s ease infinite; }
  .pt-safe-top { padding-top: max(1.5rem, env(safe-area-inset-top) + 0.5rem); }
  @keyframes gradientMove {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .mb-safe { margin-bottom: env(safe-area-inset-bottom); }
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
</style>