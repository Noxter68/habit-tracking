// src/utils/habitHelpers.ts
import { HabitType } from '../types';

export interface Task {
  id: string;
  name: string;
  description: string;
  icon: string;
  duration?: string;
}

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
        { id: 'skincare', name: 'Skincare Routine', description: 'Complete skincare routine', icon: '🧴', duration: '10 min' },
        { id: 'floss', name: 'Floss Teeth', description: 'Dental hygiene', icon: '🦷', duration: '2 min' },
      ],
      bad: [
        { id: 'no-stress', name: 'Stress Management', description: 'Avoid stressful situations', icon: '😤', duration: 'All day' },
        { id: 'no-late-nights', name: 'No Late Nights', description: 'Sleep before midnight', icon: '🌙', duration: 'Evening' },
        { id: 'no-skipping-meals', name: "Don't Skip Meals", description: 'Eat regular meals', icon: '🍽️', duration: 'Meal times' },
      ],
    },
    nutrition: {
      good: [
        { id: 'healthy-breakfast', name: 'Healthy Breakfast', description: 'Nutritious morning meal', icon: '🥞', duration: '20 min' },
        { id: 'vegetables', name: '5 Servings Veggies', description: 'Eat 5 servings of vegetables', icon: '🥦', duration: 'All day' },
        { id: 'fruits', name: '2 Fruits Daily', description: 'Eat at least 2 fruits', icon: '🍎', duration: 'All day' },
        { id: 'protein', name: 'Protein Goals', description: 'Meet daily protein target', icon: '🥚', duration: 'All day' },
        { id: 'meal-prep', name: 'Meal Prep', description: 'Prepare healthy meals', icon: '🥗', duration: '1 hour' },
        { id: 'smoothie', name: 'Green Smoothie', description: 'Make a healthy smoothie', icon: '🥤', duration: '10 min' },
      ],
      bad: [
        { id: 'no-sugar', name: 'No Added Sugar', description: 'Avoid sugary foods', icon: '🍬', duration: 'All day' },
        { id: 'no-fast-food', name: 'Skip Fast Food', description: 'Avoid fast food restaurants', icon: '🍔', duration: 'All day' },
        { id: 'no-soda', name: 'No Soda', description: 'Avoid carbonated drinks', icon: '🥤', duration: 'All day' },
      ],
    },
    learning: {
      good: [
        { id: 'read-book', name: 'Read 30 Pages', description: 'Read from a book', icon: '📚', duration: '30 min' },
        { id: 'online-course', name: 'Online Course', description: 'Complete course module', icon: '💻', duration: '45 min' },
        { id: 'podcast', name: 'Educational Podcast', description: 'Listen to learning content', icon: '🎧', duration: '30 min' },
        { id: 'practice-skill', name: 'Practice New Skill', description: 'Work on a new skill', icon: '🎯', duration: '30 min' },
        { id: 'journal', name: 'Learning Journal', description: 'Write what you learned', icon: '📝', duration: '15 min' },
        { id: 'language', name: 'Language Practice', description: 'Practice new language', icon: '🗣️', duration: '20 min' },
      ],
      bad: [
        { id: 'no-mindless-scrolling', name: 'No Mindless Scrolling', description: 'Avoid social media', icon: '📱', duration: 'All day' },
        { id: 'no-multitasking', name: 'Focus on One Thing', description: 'Avoid multitasking', icon: '🎯', duration: 'All day' },
        { id: 'no-distractions', name: 'Remove Distractions', description: 'Study without interruptions', icon: '🚫', duration: 'Study time' },
      ],
    },
    productivity: {
      good: [
        { id: 'morning-routine', name: 'Morning Routine', description: 'Complete morning ritual', icon: '🌅', duration: '30 min' },
        { id: 'todo-list', name: 'Complete To-Do List', description: 'Finish daily tasks', icon: '✅', duration: 'All day' },
        { id: 'deep-work', name: 'Deep Work Session', description: 'Focused work time', icon: '🎯', duration: '90 min' },
        { id: 'time-blocking', name: 'Time Blocking', description: 'Plan your day', icon: '📅', duration: '15 min' },
        { id: 'inbox-zero', name: 'Inbox Zero', description: 'Clear email inbox', icon: '📧', duration: '30 min' },
        { id: 'review-day', name: 'Daily Review', description: 'Review accomplishments', icon: '📊', duration: '10 min' },
      ],
      bad: [
        { id: 'no-procrastination', name: 'Start Immediately', description: "Don't delay tasks", icon: '⏰', duration: 'All day' },
        { id: 'no-perfectionism', name: 'Done Over Perfect', description: 'Avoid perfectionism', icon: '✨', duration: 'All day' },
        { id: 'no-meetings', name: 'Limit Meetings', description: 'Avoid unnecessary meetings', icon: '👥', duration: 'Work hours' },
      ],
    },
    mindfulness: {
      good: [
        { id: 'gratitude', name: 'Gratitude Practice', description: 'Write 3 things grateful for', icon: '🙏', duration: '5 min' },
        { id: 'mindful-eating', name: 'Mindful Eating', description: 'Eat without distractions', icon: '🍽️', duration: 'Meal times' },
        { id: 'nature-walk', name: 'Nature Walk', description: 'Mindful walk outdoors', icon: '🌳', duration: '20 min' },
        { id: 'body-scan', name: 'Body Scan', description: 'Body awareness meditation', icon: '🧘', duration: '15 min' },
        { id: 'breathing', name: 'Breathing Exercise', description: 'Conscious breathing', icon: '💨', duration: '10 min' },
        { id: 'affirmations', name: 'Positive Affirmations', description: 'Repeat affirmations', icon: '💭', duration: '5 min' },
      ],
      bad: [
        { id: 'no-rushing', name: "Don't Rush", description: 'Slow down and be present', icon: '⏸️', duration: 'All day' },
        { id: 'no-multitasking', name: 'Single-Tasking', description: 'Focus on one thing', icon: '1️⃣', duration: 'All day' },
        { id: 'no-negative-self-talk', name: 'Positive Self-Talk', description: 'Avoid negative thoughts', icon: '🚫', duration: 'All day' },
      ],
    },
    sleep: {
      good: [
        { id: 'bedtime-routine', name: 'Bedtime Routine', description: 'Calming pre-sleep ritual', icon: '🛏️', duration: '30 min' },
        { id: 'no-screens', name: 'No Screens Before Bed', description: 'Digital detox', icon: '📵', duration: '1 hour' },
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
