export interface Task {
  id: number;
  text: string;
  completed: boolean;
  category?: 'daily' | 'today';
}

export interface DayPlan {
  date: string;
  day: string;
  focus: string;
  inspiration: string;
  todayTasks: Task[];
  dailyTasks: Task[];
  goal: string;
  milestoneTitle: string;
  milestoneDescription: string;
}

export interface AppState {
  [key: string]: {
    todayTasks: Task[];
    dailyTasks: Task[];
  };
}
