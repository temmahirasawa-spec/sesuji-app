const STORAGE_KEY = 'sesuji_week_tasks';

export const loadTasks = (date: string) => {
  if (typeof window === 'undefined') return null;
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    const allTasks = JSON.parse(data);
    return allTasks[date] || null;
  } catch (error) {
    console.error('Failed to load tasks:', error);
    return null;
  }
};

export const saveTasks = (date: string, tasks: any[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const allTasks = data ? JSON.parse(data) : {};
    
    allTasks[date] = tasks;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allTasks));
  } catch (error) {
    console.error('Failed to save tasks:', error);
  }
};

export const getAllTasksProgress = (tasksData: any) => {
  let totalTasks = 0;
  let completedTasks = 0;
  
  Object.keys(tasksData).forEach(date => {
    if (tasksData[date]?.tasks) {
      tasksData[date].tasks.forEach((task: any) => {
        totalTasks++;
        if (task.completed) completedTasks++;
      });
    }
  });
  
  return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
};

export const getDayProgress = (tasks: any[]) => {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
};
