export interface Task {
	id: string;
	title: string;
	date: Date;
	completed: boolean;
}

export interface CalendarDay {
	date: Date;
	isCurrentMonth: boolean;
	isToday: boolean;
}