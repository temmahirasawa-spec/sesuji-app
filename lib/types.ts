export interface Task {
  id: number;
  text: string;
  completed: boolean;
  category?: 'morning' | 'work' | 'evening' | 'night';
}

export interface TimeRecord {
  target: string;    // e.g. "08:00"
  actual: string;    // e.g. "09:00"
}

export interface DayPlan {
  date: string;
  day: string;
  focus: string;
  inspiration: string;
  todayTasks: Task[];
  dailyTasks: Task[];
  goals: string[];
  milestoneTitle: string;
  milestoneDescription: string;
}
