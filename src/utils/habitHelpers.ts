// src/utils/habitHelpers.ts
import { HabitType, Task } from '../types';

// Auto-generate habit name based on category and type
export const getCategoryName = (category: string, type: HabitType): string => {
  const names: Record<string, { good: string; bad: string }> = {
    fitness: { good: 'Fitness Journey', bad: 'Quit Sedentary Lifestyle' },
    health: { good: 'Health & Wellness', bad: 'Break Unhealthy Habits' },
    nutrition: { good: 'Healthy Eating', bad: 'Stop Junk Food' },
    learning: { good: 'Daily Learning', bad: 'Stop Procrastinating' },
    productivity: { good: 'Productivity Boost', bad: 'Beat Procrastination' },
    mindfulness: { good: 'Mindful Living', bad: 'Stop Negative Thinking' },
    sleep: { good: 'Better Sleep', bad: 'Fix Sleep Schedule' },
    hydration: { good: 'Stay Hydrated', bad: 'Quit Sugary Drinks' },
    smoking: { good: 'Fresh Air Life', bad: 'Quit Smoking' },
    'junk-food': { good: 'Clean Eating', bad: 'Stop Junk Food' },
    shopping: { good: 'Smart Spending', bad: 'Control Shopping' },
    'screen-time': { good: 'Digital Balance', bad: 'Reduce Screen Time' },
    procrastination: { good: 'Get Things Done', bad: 'Stop Procrastinating' },
    'negative-thinking': { good: 'Positive Mindset', bad: 'Stop Negative Thoughts' },
    alcohol: { good: 'Sober Living', bad: 'Quit Drinking' },
    oversleeping: { good: 'Morning Routine', bad: 'Stop Oversleeping' },
  };

  return names[category]?.[type] || `${type === 'good' ? 'Build' : 'Quit'} ${category}`;
};

// Get available tasks based on category and habit type
export const getTasksForCategory = (category: string, type: HabitType): Task[] => {
  const taskLibrary: Record<string, { good: Task[]; bad: Task[] }> = {
    fitness: {
      good: [
        { id: 'morning-run', name: 'Morning Run', description: 'Go for a run or jog', icon: '🏃', duration: '30 min' },
        { id: 'gym-workout', name: 'Gym Workout', description: 'Complete gym session', icon: '🏋️', duration: '45 min' },
        { id: 'yoga-session', name: 'Yoga Practice', description: 'Complete yoga routine', icon: '🧘', duration: '20 min' },
        { id: 'push-ups', name: '50 Push-ups', description: 'Do 50 push-ups throughout the day', icon: '💪', duration: '10 min' },
        { id: 'walk-10k', name: '10,000 Steps', description: 'Walk 10,000 steps', icon: '🚶', duration: 'Throughout day' },
        { id: 'stretching', name: 'Stretching', description: 'Morning or evening stretches', icon: '🤸', duration: '15 min' },
      ],
      bad: [
        { id: 'no-elevator', name: 'Skip Elevator', description: 'Take stairs instead', icon: '🪜', duration: 'All day' },
        { id: 'no-couch', name: 'No Couch Potato', description: 'Limit sitting time', icon: '🛋️', duration: 'All day' },
        { id: 'active-breaks', name: 'Active Breaks', description: 'Move every hour', icon: '⏰', duration: '5 min/hour' },
      ],
    },
    health: {
      good: [
        { id: 'meditation', name: 'Meditation', description: 'Mindful meditation practice', icon: '🧘', duration: '15 min' },
        { id: 'deep-breathing', name: 'Deep Breathing', description: '5 minutes of breathing exercises', icon: '💨', duration: '5 min' },
        { id: 'cold-shower', name: 'Cold Shower', description: 'Take a cold shower', icon: '🚿', duration: '5 min' },
        { id: 'vitamins', name: 'Take Vitamins', description: 'Daily vitamin supplements', icon: '💊', duration: '1 min' },
        { id: 'skincare', name: 'Skincare Routine', description: 'Morning/evening skincare', icon: '🧴', duration: '10 min' },
        { id: 'health-checkup', name: 'Health Check', description: 'Monitor vital signs', icon: '🩺', duration: '5 min' },
      ],
      bad: [
        { id: 'no-stress', name: 'Stress Management', description: 'Avoid stressful situations', icon: '😌', duration: 'All day' },
        { id: 'no-late-nights', name: 'No Late Nights', description: 'Sleep before midnight', icon: '🌙', duration: 'Evening' },
        { id: 'no-overwork', name: 'Avoid Overworking', description: 'Take regular breaks', icon: '⏸️', duration: 'All day' },
      ],
    },
    nutrition: {
      good: [
        { id: 'healthy-breakfast', name: 'Healthy Breakfast', description: 'Nutritious morning meal', icon: '🥗', duration: '20 min' },
        { id: 'fruit-serving', name: 'Eat Fruits', description: '2-3 servings of fruit', icon: '🍎', duration: '5 min' },
        { id: 'vegetables', name: 'Eat Vegetables', description: '5 servings of vegetables', icon: '🥦', duration: 'Meals' },
        { id: 'meal-prep', name: 'Meal Prep', description: 'Prepare healthy meals', icon: '🍱', duration: '30 min' },
        { id: 'protein-intake', name: 'Protein Goals', description: 'Meet protein targets', icon: '🥚', duration: 'Meals' },
        { id: 'whole-grains', name: 'Whole Grains', description: 'Choose whole grains', icon: '🌾', duration: 'Meals' },
      ],
      bad: [
        { id: 'no-fast-food', name: 'No Fast Food', description: 'Avoid fast food', icon: '🍔', duration: 'All day' },
        { id: 'no-sugar', name: 'Limit Sugar', description: 'Reduce sugar intake', icon: '🍬', duration: 'All day' },
        { id: 'no-late-snacks', name: 'No Late Snacking', description: 'No eating after 8pm', icon: '🚫', duration: 'Evening' },
      ],
    },
    learning: {
      good: [
        { id: 'read-book', name: 'Read Book', description: 'Read for knowledge', icon: '📚', duration: '30 min' },
        { id: 'online-course', name: 'Online Course', description: 'Complete course module', icon: '💻', duration: '45 min' },
        { id: 'practice-skill', name: 'Practice Skill', description: 'Skill development', icon: '🎯', duration: '30 min' },
        { id: 'language-study', name: 'Language Study', description: 'Learn new language', icon: '🗣️', duration: '20 min' },
        { id: 'write-journal', name: 'Journal Writing', description: 'Reflect and write', icon: '📝', duration: '15 min' },
        { id: 'watch-tutorial', name: 'Watch Tutorial', description: 'Educational videos', icon: '🎥', duration: '20 min' },
      ],
      bad: [
        { id: 'no-distractions', name: 'Avoid Distractions', description: 'Focus on learning', icon: '🎯', duration: 'Study time' },
        { id: 'no-multitask', name: 'No Multitasking', description: 'One task at a time', icon: '🧠', duration: 'Study time' },
        { id: 'no-cramming', name: 'No Cramming', description: 'Regular study schedule', icon: '📅', duration: 'Daily' },
      ],
    },
    productivity: {
      good: [
        { id: 'morning-routine', name: 'Morning Routine', description: 'Start day right', icon: '🌅', duration: '30 min' },
        { id: 'time-blocking', name: 'Time Blocking', description: 'Schedule tasks', icon: '📅', duration: '15 min' },
        { id: 'pomodoro', name: 'Pomodoro Session', description: '25min focused work', icon: '🍅', duration: '25 min' },
        { id: 'daily-review', name: 'Daily Review', description: 'Review progress', icon: '📊', duration: '10 min' },
        { id: 'priority-tasks', name: 'Top 3 Tasks', description: 'Complete priorities', icon: '⭐', duration: 'Variable' },
        { id: 'inbox-zero', name: 'Inbox Zero', description: 'Clear all emails', icon: '📧', duration: '20 min' },
      ],
      bad: [
        { id: 'no-social-media', name: 'No Social Media', description: 'During work hours', icon: '📱', duration: 'Work hours' },
        { id: 'no-procrastination', name: 'Start Tasks', description: "Don't delay tasks", icon: '⏳', duration: 'All day' },
        { id: 'no-perfectionism', name: 'Done > Perfect', description: 'Ship work regularly', icon: '✅', duration: 'All day' },
      ],
    },
    mindfulness: {
      good: [
        { id: 'meditation', name: 'Meditation', description: 'Mindful meditation', icon: '🧘', duration: '15 min' },
        { id: 'gratitude', name: 'Gratitude Practice', description: 'List 3 things', icon: '🙏', duration: '5 min' },
        { id: 'breathing', name: 'Breathing Exercise', description: 'Deep breathing', icon: '💨', duration: '5 min' },
        { id: 'nature-walk', name: 'Nature Walk', description: 'Mindful walking', icon: '🌳', duration: '20 min' },
        { id: 'body-scan', name: 'Body Scan', description: 'Body awareness', icon: '👤', duration: '10 min' },
        { id: 'visualization', name: 'Visualization', description: 'Positive imagery', icon: '🌈', duration: '10 min' },
      ],
      bad: [
        { id: 'no-rushing', name: 'Slow Down', description: "Don't rush tasks", icon: '🐢', duration: 'All day' },
        { id: 'no-negativity', name: 'Positive Thinking', description: 'Avoid negative thoughts', icon: '☀️', duration: 'All day' },
        { id: 'no-overthinking', name: 'Stop Overthinking', description: 'Be present', icon: '🎯', duration: 'All day' },
      ],
    },
    sleep: {
      good: [
        { id: 'bedtime-routine', name: 'Bedtime Routine', description: 'Wind down ritual', icon: '🛏️', duration: '30 min' },
        { id: 'sleep-8hrs', name: '8 Hours Sleep', description: 'Get full rest', icon: '😴', duration: '8 hours' },
        { id: 'wake-same-time', name: 'Consistent Wake Time', description: 'Wake at same time', icon: '⏰', duration: 'Morning' },
        { id: 'bedroom-prep', name: 'Prepare Bedroom', description: 'Cool, dark, quiet room', icon: '🌙', duration: '10 min' },
      ],
      bad: [
        { id: 'no-caffeine-pm', name: 'No Late Caffeine', description: 'Avoid caffeine after 2pm', icon: '☕', duration: 'Afternoon' },
        { id: 'no-naps', name: 'No Long Naps', description: 'Avoid daytime sleeping', icon: '💤', duration: 'Daytime' },
        { id: 'no-snooze', name: 'No Snooze Button', description: 'Get up immediately', icon: '⏰', duration: 'Morning' },
      ],
    },
    hydration: {
      good: [
        { id: 'water-morning', name: 'Morning Water', description: 'Glass of water upon waking', icon: '💧', duration: '1 min' },
        { id: 'water-8-glasses', name: '8 Glasses Water', description: 'Drink 8 glasses daily', icon: '🚰', duration: 'All day' },
        { id: 'herbal-tea', name: 'Herbal Tea', description: 'Drink herbal tea', icon: '🍵', duration: '10 min' },
        { id: 'water-bottle', name: 'Carry Water Bottle', description: 'Keep water accessible', icon: '🍶', duration: 'All day' },
        { id: 'infused-water', name: 'Infused Water', description: 'Add fruits to water', icon: '🍋', duration: '5 min' },
      ],
      bad: [
        { id: 'no-soda', name: 'No Soda', description: 'Avoid sugary drinks', icon: '🥤', duration: 'All day' },
        { id: 'no-alcohol', name: 'Limit Alcohol', description: 'Reduce alcohol intake', icon: '🍺', duration: 'All day' },
        { id: 'no-energy-drinks', name: 'No Energy Drinks', description: 'Avoid energy drinks', icon: '⚡', duration: 'All day' },
      ],
    },
  };

  // Return tasks for the category and type, or empty array if not found
  return taskLibrary[category]?.[type] || [];
};
