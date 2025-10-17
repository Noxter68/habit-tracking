// src/utils/habitHelpers.ts
import { HabitType, Task } from '../types';

// ============================================================================
// QUOTES DATABASE
// ============================================================================
export const quotes = {
  start: {
    text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Aristotle',
  },
  good: {
    text: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
  },
  bad: {
    text: 'The chains of habit are too weak to be felt until they are too strong to be broken.',
    author: 'Samuel Johnson',
  },
  category: {
    text: 'Success is the sum of small efforts repeated day in and day out.',
    author: 'Robert Collier',
  },
  tasks: {
    text: "You don't have to be great to start, but you have to start to be great.",
    author: 'Zig Ziglar',
  },
  goal: {
    text: 'A goal without a plan is just a wish.',
    author: 'Antoine de Saint-Exupéry',
  },
  frequency: {
    text: 'Repetition is the mother of learning, the father of action.',
    author: 'Zig Ziglar',
  },
  notification: {
    text: 'An ounce of action is worth a ton of theory.',
    author: 'Ralph Waldo Emerson',
  },
};

// ============================================================================
// PROFESSIONAL TIPS DATABASE
// ============================================================================
export const tips = {
  habitType: [
    {
      title: 'Starting Strong',
      content: 'Research shows that building positive habits is 2.5x more effective than breaking bad ones. Start with one habit and master it.',
    },
    {
      title: 'The Science',
      content: 'Your brain forms new neural pathways with each repetition. Building good habits creates positive pathways faster than breaking old ones.',
    },
  ],
  category: [
    {
      title: 'Focus Matters',
      content: 'Studies show that people who focus on one category at a time are 67% more likely to succeed in building lasting habits.',
    },
    {
      title: 'Compound Effect',
      content: 'Small, category-specific improvements compound over time. A 1% daily improvement leads to 37x better results in a year.',
    },
  ],
  tasks: [
    {
      title: 'Keep It Simple',
      content: 'Habits with 1-3 specific actions have an 80% higher success rate than vague goals. Clarity creates commitment.',
    },
    {
      title: 'Stack Your Habits',
      content: "Link new habits to existing routines. This 'habit stacking' technique increases adherence by 58%.",
    },
  ],
  goal: [
    {
      title: 'The 66-Day Truth',
      content: 'Research from University College London found it takes an average of 66 days to form a habit. Give yourself time.',
    },
    {
      title: 'Realistic Timelines',
      content: 'Short-term goals (21-30 days) work for simple habits. Complex behavior changes need 60-90 days to become automatic.',
    },
  ],
  frequency: [
    {
      title: 'Daily Wins',
      content: 'Daily habits are 2.5x more likely to stick than weekly ones. Consistency beats intensity every time.',
    },
    {
      title: 'Recovery Matters',
      content: 'For physical habits, strategic rest days prevent burnout. Listen to your body while maintaining consistency.',
    },
  ],
  notification: [
    {
      title: 'Environmental Cues',
      content: 'Notifications act as environmental triggers. Studies show they increase habit completion rates by 40%.',
    },
    {
      title: 'Optimal Timing',
      content: 'Morning reminders have 65% completion rates vs 42% for evening. Choose times when your willpower is strongest.',
    },
  ],
};

// ============================================================================
// HABIT TYPE DATA
// ============================================================================
export interface HabitTypeData {
  id: HabitType;
  title: string;
  subtitle: string;
  description: string;
  gradient: [string, string];
}

export const habitTypes: HabitTypeData[] = [
  {
    id: 'good',
    title: 'Build a Good Habit',
    subtitle: 'Start something positive and transformative',
    description: 'Create new positive behaviors that align with your best self',
    gradient: ['#10b981', '#059669'], // Jade
  },
  {
    id: 'bad',
    title: 'Quit a Bad Habit',
    subtitle: 'Break free from what holds you back',
    description: 'Replace unwanted patterns with healthier alternatives',
    gradient: ['#ef4444', '#dc2626'], // Ruby
  },
];

// ============================================================================
// CATEGORY DATA
// ============================================================================
export interface CategoryData {
  id: string;
  label: string;
  description: string;
  color: string;
}

export const goodCategories: CategoryData[] = [
  { id: 'fitness', label: 'Fitness & Exercise', description: 'Build strength and endurance', color: '#ef4444' },
  { id: 'health', label: 'Health & Wellness', description: 'Improve overall wellbeing', color: '#ec4899' },
  { id: 'nutrition', label: 'Nutrition', description: 'Healthy eating habits', color: '#10b981' },
  { id: 'learning', label: 'Learning & Growth', description: 'Expand your knowledge', color: '#8b5cf6' },
  { id: 'productivity', label: 'Productivity', description: 'Maximize your efficiency', color: '#f59e0b' },
  { id: 'mindfulness', label: 'Mindfulness', description: 'Mental clarity and focus', color: '#06b6d4' },
  { id: 'sleep', label: 'Sleep Quality', description: 'Better rest and recovery', color: '#6366f1' },
  { id: 'hydration', label: 'Hydration', description: 'Stay properly hydrated', color: '#3b82f6' },
];

export const badCategories: CategoryData[] = [
  { id: 'smoking', label: 'Smoking', description: 'Quit tobacco products', color: '#dc2626' },
  { id: 'junk-food', label: 'Unhealthy Eating', description: 'Reduce junk food intake', color: '#ea580c' },
  { id: 'shopping', label: 'Impulse Shopping', description: 'Control spending habits', color: '#f59e0b' },
  { id: 'screen-time', label: 'Excessive Screen Time', description: 'Reduce device usage', color: '#8b5cf6' },
  { id: 'procrastination', label: 'Procrastination', description: 'Stop delaying tasks', color: '#06b6d4' },
  { id: 'negative-thinking', label: 'Negative Thinking', description: 'Cultivate positivity', color: '#ec4899' },
  { id: 'alcohol', label: 'Alcohol', description: 'Reduce alcohol consumption', color: '#7c3aed' },
  { id: 'oversleeping', label: 'Oversleeping', description: 'Wake up earlier', color: '#6366f1' },
];

export const getCategories = (type: HabitType): CategoryData[] => {
  return type === 'good' ? goodCategories : badCategories;
};

// ============================================================================
// HABIT NAMES
// ============================================================================
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

// ============================================================================
// TASKS DATABASE
// ============================================================================
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
    // BAD HABIT CATEGORIES
    smoking: {
      good: [
        { id: 'breathing-exercises', name: 'Breathing Exercises', description: 'Deep breathing when cravings hit', icon: '💨', duration: '5 min' },
        { id: 'chew-gum', name: 'Chew Gum', description: 'Sugar-free gum as alternative', icon: '🍬', duration: 'As needed' },
        { id: 'stay-hydrated', name: 'Drink Water', description: 'Flush out toxins', icon: '💧', duration: 'All day' },
      ],
      bad: [
        { id: 'no-smoking', name: 'No Cigarettes', description: 'Track smoke-free days', icon: '🚭', duration: 'All day' },
        { id: 'avoid-triggers', name: 'Avoid Triggers', description: 'Skip smoking areas', icon: '⚠️', duration: 'All day' },
        { id: 'no-smoke-breaks', name: 'No Smoke Breaks', description: 'Take walks instead', icon: '🚶', duration: 'Breaks' },
      ],
    },
    'junk-food': {
      good: [
        { id: 'healthy-snacks', name: 'Healthy Snacks', description: 'Prepare nutritious alternatives', icon: '🥕', duration: '10 min' },
        { id: 'meal-planning', name: 'Plan Meals', description: 'Prep healthy options', icon: '📝', duration: '30 min' },
        { id: 'grocery-smart', name: 'Smart Shopping', description: 'Buy whole foods only', icon: '🛒', duration: 'Weekly' },
      ],
      bad: [
        { id: 'no-junk-food', name: 'No Junk Food', description: 'Avoid processed foods', icon: '🍔', duration: 'All day' },
        { id: 'no-drive-thru', name: 'No Drive-Thrus', description: 'Skip fast food restaurants', icon: '🚗', duration: 'All day' },
        { id: 'no-vending-machine', name: 'No Vending Machines', description: 'Avoid unhealthy snacks', icon: '🚫', duration: 'All day' },
      ],
    },
    shopping: {
      good: [
        { id: 'budget-tracking', name: 'Track Budget', description: 'Monitor spending daily', icon: '💰', duration: '10 min' },
        { id: 'shopping-list', name: 'Use Shopping List', description: 'Only buy what you need', icon: '📝', duration: 'Before shopping' },
        { id: 'savings-goal', name: 'Save Money', description: 'Put aside savings', icon: '🏦', duration: 'Daily' },
      ],
      bad: [
        { id: 'no-impulse-buy', name: 'No Impulse Buying', description: 'Wait 24 hours before purchasing', icon: '⏳', duration: 'Shopping' },
        { id: 'unsubscribe-emails', name: 'Unsubscribe Deals', description: 'Remove shopping temptations', icon: '📧', duration: 'One-time' },
        { id: 'no-browsing', name: 'No Window Shopping', description: 'Avoid online stores', icon: '🛍️', duration: 'All day' },
      ],
    },
    'screen-time': {
      good: [
        { id: 'read-physical-book', name: 'Read Physical Books', description: 'Replace screen time with reading', icon: '📖', duration: '30 min' },
        { id: 'outdoor-activity', name: 'Go Outside', description: 'Spend time in nature', icon: '🌳', duration: '30 min' },
        { id: 'face-to-face', name: 'In-Person Time', description: 'Meet people offline', icon: '👥', duration: 'Daily' },
      ],
      bad: [
        { id: 'no-phone-bed', name: 'No Phone in Bed', description: 'Keep devices out of bedroom', icon: '📵', duration: 'Bedtime' },
        { id: 'limit-social-media', name: 'Limit Social Media', description: 'Set app time limits', icon: '📱', duration: '30 min max' },
        { id: 'no-binge-watching', name: 'No Binge Watching', description: 'Limit streaming time', icon: '📺', duration: 'All day' },
      ],
    },
    procrastination: {
      good: [
        { id: 'start-immediately', name: 'Start Immediately', description: '2-minute rule for tasks', icon: '⚡', duration: '2 min' },
        { id: 'break-tasks-down', name: 'Break Down Tasks', description: 'Make tasks manageable', icon: '🧩', duration: '10 min' },
        { id: 'time-block', name: 'Time Blocking', description: 'Schedule specific work times', icon: '📅', duration: 'Daily' },
      ],
      bad: [
        { id: 'no-delay', name: 'No Delaying', description: 'Do it now, not later', icon: '⏰', duration: 'All day' },
        { id: 'no-excuses', name: 'No Excuses', description: 'Take action regardless', icon: '💪', duration: 'All day' },
        { id: 'no-distractions', name: 'Eliminate Distractions', description: 'Focus on one task', icon: '🎯', duration: 'Work time' },
      ],
    },
    'negative-thinking': {
      good: [
        { id: 'positive-affirmations', name: 'Positive Affirmations', description: 'Practice daily affirmations', icon: '✨', duration: '5 min' },
        { id: 'gratitude-journal', name: 'Gratitude Journal', description: 'Write 3 grateful things', icon: '📔', duration: '10 min' },
        { id: 'reframe-thoughts', name: 'Reframe Thoughts', description: 'Find positive perspectives', icon: '🔄', duration: 'As needed' },
      ],
      bad: [
        { id: 'no-complaining', name: 'No Complaining', description: 'Avoid negative talk', icon: '🤐', duration: 'All day' },
        { id: 'no-self-criticism', name: 'No Self-Criticism', description: 'Be kind to yourself', icon: '💖', duration: 'All day' },
        { id: 'no-catastrophizing', name: 'No Catastrophizing', description: 'Stop worst-case thinking', icon: '🛑', duration: 'All day' },
      ],
    },
    alcohol: {
      good: [
        { id: 'mocktails', name: 'Drink Mocktails', description: 'Enjoy non-alcoholic drinks', icon: '🍹', duration: 'Social events' },
        { id: 'exercise-instead', name: 'Exercise', description: 'Physical activity as alternative', icon: '🏃', duration: '30 min' },
        { id: 'support-group', name: 'Support Group', description: 'Connect with others', icon: '👥', duration: 'Weekly' },
      ],
      bad: [
        { id: 'no-alcohol', name: 'No Alcohol', description: 'Track alcohol-free days', icon: '🚫', duration: 'All day' },
        { id: 'avoid-bars', name: 'Avoid Bars', description: 'Skip drinking venues', icon: '🍺', duration: 'All day' },
        { id: 'no-home-stocking', name: 'No Alcohol at Home', description: 'Remove from house', icon: '🏠', duration: 'Ongoing' },
      ],
    },
    oversleeping: {
      good: [
        { id: 'consistent-bedtime', name: 'Consistent Bedtime', description: 'Sleep at same time', icon: '🌙', duration: 'Evening' },
        { id: 'morning-routine', name: 'Morning Routine', description: 'Exciting morning activities', icon: '☀️', duration: '30 min' },
        { id: 'sunlight-exposure', name: 'Get Sunlight', description: 'Expose to morning light', icon: '🌞', duration: '15 min' },
      ],
      bad: [
        { id: 'no-snooze', name: 'No Snooze Button', description: 'Get up with first alarm', icon: '⏰', duration: 'Morning' },
        { id: 'no-late-sleep', name: 'No Late Sleep', description: 'Sleep before midnight', icon: '🛏️', duration: 'Evening' },
        { id: 'alarm-far-away', name: 'Alarm Across Room', description: 'Force yourself to get up', icon: '📱', duration: 'Bedtime' },
      ],
    },
  };

  return taskLibrary[category]?.[type] || [];
};
