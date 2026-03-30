export interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export interface DayPlan {
  date: string;
  day: string;
  focus: string;
  inspiration: string;
  tasks: Task[];
  sexStatus: string;
  milestoneTitle: string;
  milestoneDescription: string;
  color: string;
}

export interface AppState {
  [key: string]: {
    tasks: Task[];
  };
}
