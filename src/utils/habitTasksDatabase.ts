// src/utils/habitTasksDatabase.ts
import {
  User,
  Dumbbell,
  Flower2,
  Activity,
  Footprints,
  Move,
  ArrowUpCircle,
  Armchair,
  Timer,
  Stars,
  Wind,
  Droplet,
  Pill,
  Sparkle,
  Stethoscope,
  Smile,
  Moon,
  Pause,
  Apple,
  Salad,
  ChefHat,
  Egg,
  Wheat,
  CircleSlash,
  Candy,
  Ban,
  BookOpen,
  GraduationCap,
  Target,
  Languages,
  PenTool,
  Video,
  Focus,
  Brain,
  CalendarCheck,
  CalendarDays,
  Clock,
  BarChart3,
  Star,
  Mail,
  Smartphone,
  Play,
  CheckCheck,
  Heart,
  Trees,
  ScanFace,
  Eye,
  Turtle,
  CloudSun,
  BedDouble,
  AlarmClock,
  Home,
  Coffee,
  BedSingle,
  Clock3,
  Droplets,
  Wine,
  BeerOff,
  Zap,
  CigaretteOff,
  AlertTriangle,
  Carrot,
  ClipboardList,
  ShoppingBasket,
  Car,
  XCircle,
  Wallet,
  ListChecks,
  PiggyBank,
  MailX,
  ShoppingBag,
  Book,
  Users,
  Tv,
  ListTree,
  Calendar,
  AlertCircle,
  ShieldCheck,
  NotebookPen,
  RefreshCw,
  MessageCircleOff,
  HeartHandshake,
  ShieldAlert,
  Martini,
  Store,
  MoonStar,
  Bell,
  PhoneOff,
  Sun,
} from 'lucide-react-native';

export interface TaskDefinition {
  id: string;
  icon: any;
  translationKey: string; // Clé pour i18n: habitHelpers.tasks.{category}.{type}.{taskId}
}

export interface CategoryTasksDefinition {
  category: string;
  good: TaskDefinition[];
  bad: TaskDefinition[];
}

/**
 * Base de données statique de toutes les tâches par catégorie
 * Les traductions sont chargées dynamiquement via i18n
 */
export const HABIT_TASKS_DATABASE: CategoryTasksDefinition[] = [
  // FITNESS
  {
    category: 'fitness',
    good: [
      { id: 'morning-run', icon: User, translationKey: 'morning-run' },
      { id: 'gym-workout', icon: Dumbbell, translationKey: 'gym-workout' },
      { id: 'yoga-session', icon: Flower2, translationKey: 'yoga-session' },
      { id: 'push-ups', icon: Activity, translationKey: 'push-ups' },
      { id: 'walk-10k', icon: Footprints, translationKey: 'walk-10k' },
      { id: 'stretching', icon: Move, translationKey: 'stretching' },
    ],
    bad: [
      { id: 'no-elevator', icon: ArrowUpCircle, translationKey: 'no-elevator' },
      { id: 'no-couch', icon: Armchair, translationKey: 'no-couch' },
      { id: 'active-breaks', icon: Timer, translationKey: 'active-breaks' },
    ],
  },

  // HEALTH
  {
    category: 'health',
    good: [
      { id: 'meditation', icon: Stars, translationKey: 'meditation' },
      { id: 'deep-breathing', icon: Wind, translationKey: 'deep-breathing' },
      { id: 'cold-shower', icon: Droplet, translationKey: 'cold-shower' },
      { id: 'vitamins', icon: Pill, translationKey: 'vitamins' },
      { id: 'skincare', icon: Sparkle, translationKey: 'skincare' },
      { id: 'health-checkup', icon: Stethoscope, translationKey: 'health-checkup' },
    ],
    bad: [
      { id: 'no-stress', icon: Smile, translationKey: 'no-stress' },
      { id: 'no-late-nights', icon: Moon, translationKey: 'no-late-nights' },
      { id: 'no-overwork', icon: Pause, translationKey: 'no-overwork' },
    ],
  },

  // NUTRITION
  {
    category: 'nutrition',
    good: [
      { id: 'healthy-breakfast', icon: Sun, translationKey: 'healthy-breakfast' },
      { id: 'fruit-serving', icon: Apple, translationKey: 'fruit-serving' },
      { id: 'vegetables', icon: Salad, translationKey: 'vegetables' },
      { id: 'meal-prep', icon: ChefHat, translationKey: 'meal-prep' },
      { id: 'protein-intake', icon: Egg, translationKey: 'protein-intake' },
      { id: 'whole-grains', icon: Wheat, translationKey: 'whole-grains' },
    ],
    bad: [
      { id: 'no-fast-food', icon: CircleSlash, translationKey: 'no-fast-food' },
      { id: 'no-sugar', icon: Candy, translationKey: 'no-sugar' },
      { id: 'no-snacking', icon: Ban, translationKey: 'no-snacking' },
    ],
  },

  // LEARNING
  {
    category: 'learning',
    good: [
      { id: 'read-book', icon: BookOpen, translationKey: 'read-book' },
      { id: 'online-course', icon: GraduationCap, translationKey: 'online-course' },
      { id: 'practice-skill', icon: Target, translationKey: 'practice-skill' },
      { id: 'language-study', icon: Languages, translationKey: 'language-study' },
      { id: 'journal-writing', icon: PenTool, translationKey: 'journal-writing' },
      { id: 'watch-tutorial', icon: Video, translationKey: 'watch-tutorial' },
    ],
    bad: [
      { id: 'no-distractions', icon: Focus, translationKey: 'no-distractions' },
      { id: 'limit-social-media', icon: Smartphone, translationKey: 'limit-social-media' },
      { id: 'no-multitasking', icon: Brain, translationKey: 'no-multitasking' },
    ],
  },

  // PRODUCTIVITY
  {
    category: 'productivity',
    good: [
      { id: 'morning-routine', icon: Sun, translationKey: 'morning-routine' },
      { id: 'time-blocking', icon: Clock, translationKey: 'time-blocking' },
      { id: 'pomodoro', icon: Timer, translationKey: 'pomodoro' },
      { id: 'daily-review', icon: BarChart3, translationKey: 'daily-review' },
      { id: 'priority-tasks', icon: Star, translationKey: 'priority-tasks' },
      { id: 'inbox-zero', icon: Mail, translationKey: 'inbox-zero' },
      { id: 'plan-day', icon: CalendarCheck, translationKey: 'plan-day' },
      { id: 'weekly-review', icon: CalendarDays, translationKey: 'weekly-review' },
      { id: 'track-goals', icon: Target, translationKey: 'track-goals' },
    ],
    bad: [
      { id: 'no-social-media', icon: Smartphone, translationKey: 'no-social-media' },
      { id: 'no-procrastination', icon: Play, translationKey: 'no-procrastination' },
      { id: 'no-perfectionism', icon: CheckCheck, translationKey: 'no-perfectionism' },
    ],
  },

  // MINDFULNESS
  {
    category: 'mindfulness',
    good: [
      { id: 'meditation', icon: Stars, translationKey: 'meditation' },
      { id: 'gratitude', icon: Heart, translationKey: 'gratitude' },
      { id: 'breathing', icon: Wind, translationKey: 'breathing' },
      { id: 'nature-walk', icon: Trees, translationKey: 'nature-walk' },
      { id: 'body-scan', icon: ScanFace, translationKey: 'body-scan' },
      { id: 'visualization', icon: Eye, translationKey: 'visualization' },
    ],
    bad: [
      { id: 'no-rushing', icon: Turtle, translationKey: 'no-rushing' },
      { id: 'no-negativity', icon: CloudSun, translationKey: 'no-negativity' },
      { id: 'no-overthinking', icon: Brain, translationKey: 'no-overthinking' },
    ],
  },

  // SLEEP
  {
    category: 'sleep',
    good: [
      { id: 'consistent-bedtime', icon: Moon, translationKey: 'consistent-bedtime' },
      { id: 'sleep-routine', icon: BedDouble, translationKey: 'sleep-routine' },
      { id: 'dark-room', icon: MoonStar, translationKey: 'dark-room' },
      { id: 'wake-same-time', icon: AlarmClock, translationKey: 'wake-same-time' },
      { id: 'bedroom-cool', icon: Home, translationKey: 'bedroom-cool' },
      { id: 'no-caffeine-evening', icon: Coffee, translationKey: 'no-caffeine-evening' },
    ],
    bad: [
      { id: 'no-screens-bed', icon: Smartphone, translationKey: 'no-screens-bed' },
      { id: 'no-napping', icon: BedSingle, translationKey: 'no-napping' },
      { id: 'no-late-meals', icon: Clock3, translationKey: 'no-late-meals' },
    ],
  },

  // HYDRATION
  {
    category: 'hydration',
    good: [
      { id: 'water-wakeup', icon: Droplets, translationKey: 'water-wakeup' },
      { id: 'water-tracker', icon: CheckCheck, translationKey: 'water-tracker' },
      { id: 'herbal-tea', icon: Coffee, translationKey: 'herbal-tea' },
      { id: 'water-meals', icon: Droplet, translationKey: 'water-meals' },
      { id: 'infused-water', icon: Apple, translationKey: 'infused-water' },
      { id: 'bottle-carry', icon: Droplets, translationKey: 'bottle-carry' },
    ],
    bad: [
      { id: 'no-soda', icon: Ban, translationKey: 'no-soda' },
      { id: 'limit-alcohol', icon: Wine, translationKey: 'limit-alcohol' },
      { id: 'no-energy-drinks', icon: BeerOff, translationKey: 'no-energy-drinks' },
    ],
  },

  // SMOKING (BAD HABIT)
  {
    category: 'smoking',
    good: [],
    bad: [
      { id: 'track-cravings', icon: AlertTriangle, translationKey: 'track-cravings' },
      { id: 'avoid-triggers', icon: ShieldAlert, translationKey: 'avoid-triggers' },
      { id: 'nicotine-replacement', icon: Pill, translationKey: 'nicotine-replacement' },
      { id: 'no-smoking-areas', icon: CigaretteOff, translationKey: 'no-smoking-areas' },
      { id: 'distraction-technique', icon: Brain, translationKey: 'distraction-technique' },
      { id: 'support-group', icon: Users, translationKey: 'support-group' },
    ],
  },

  // JUNK FOOD (BAD HABIT)
  {
    category: 'junk-food',
    good: [],
    bad: [
      { id: 'meal-planning', icon: ClipboardList, translationKey: 'meal-planning' },
      { id: 'healthy-snacks', icon: Carrot, translationKey: 'healthy-snacks' },
      { id: 'no-fast-food', icon: Ban, translationKey: 'no-fast-food' },
      { id: 'grocery-list', icon: ShoppingBasket, translationKey: 'grocery-list' },
      { id: 'cook-home', icon: ChefHat, translationKey: 'cook-home' },
      { id: 'read-labels', icon: Eye, translationKey: 'read-labels' },
    ],
  },

  // SHOPPING (BAD HABIT)
  {
    category: 'shopping',
    good: [],
    bad: [
      { id: 'budget-tracking', icon: Wallet, translationKey: 'budget-tracking' },
      { id: 'shopping-list', icon: ListChecks, translationKey: 'shopping-list' },
      { id: 'waiting-period', icon: Clock, translationKey: 'waiting-period' },
      { id: 'unsubscribe-emails', icon: MailX, translationKey: 'unsubscribe-emails' },
      { id: 'cash-only', icon: PiggyBank, translationKey: 'cash-only' },
      { id: 'avoid-malls', icon: Store, translationKey: 'avoid-malls' },
    ],
  },

  // SCREEN TIME (BAD HABIT)
  {
    category: 'screen-time',
    good: [],
    bad: [
      { id: 'screen-time-limit', icon: Clock, translationKey: 'screen-time-limit' },
      { id: 'no-phone-bedroom', icon: PhoneOff, translationKey: 'no-phone-bedroom' },
      { id: 'app-limits', icon: Smartphone, translationKey: 'app-limits' },
      { id: 'tech-free-meals', icon: Ban, translationKey: 'tech-free-meals' },
      { id: 'grayscale-mode', icon: Eye, translationKey: 'grayscale-mode' },
      { id: 'notification-management', icon: Bell, translationKey: 'notification-management' },
    ],
  },

  // PROCRASTINATION (BAD HABIT)
  {
    category: 'procrastination',
    good: [],
    bad: [
      { id: 'two-minute-rule', icon: Clock, translationKey: 'two-minute-rule' },
      { id: 'pomodoro-technique', icon: Timer, translationKey: 'pomodoro-technique' },
      { id: 'break-tasks', icon: ListTree, translationKey: 'break-tasks' },
      { id: 'accountability-partner', icon: Users, translationKey: 'accountability-partner' },
      { id: 'deadline-setting', icon: Calendar, translationKey: 'deadline-setting' },
      { id: 'eliminate-distractions', icon: Focus, translationKey: 'eliminate-distractions' },
    ],
  },

  // NEGATIVE THINKING (BAD HABIT)
  {
    category: 'negative-thinking',
    good: [],
    bad: [
      { id: 'gratitude-journal', icon: NotebookPen, translationKey: 'gratitude-journal' },
      { id: 'positive-affirmations', icon: Heart, translationKey: 'positive-affirmations' },
      { id: 'reframe-thoughts', icon: RefreshCw, translationKey: 'reframe-thoughts' },
      { id: 'limit-complaining', icon: MessageCircleOff, translationKey: 'limit-complaining' },
      { id: 'celebrate-wins', icon: Star, translationKey: 'celebrate-wins' },
      { id: 'mindfulness-practice', icon: Brain, translationKey: 'mindfulness-practice' },
    ],
  },

  // ALCOHOL (BAD HABIT)
  {
    category: 'alcohol',
    good: [],
    bad: [
      { id: 'track-drinks', icon: ListChecks, translationKey: 'track-drinks' },
      { id: 'alcohol-free-days', icon: Calendar, translationKey: 'alcohol-free-days' },
      { id: 'alternative-drinks', icon: Coffee, translationKey: 'alternative-drinks' },
      { id: 'avoid-triggers', icon: ShieldCheck, translationKey: 'avoid-triggers' },
      { id: 'social-support', icon: HeartHandshake, translationKey: 'social-support' },
      { id: 'mocktail-recipes', icon: Martini, translationKey: 'mocktail-recipes' },
    ],
  },

  // OVERSLEEPING (BAD HABIT)
  {
    category: 'oversleeping',
    good: [],
    bad: [
      { id: 'consistent-wakeup', icon: AlarmClock, translationKey: 'consistent-wakeup' },
      { id: 'alarm-across-room', icon: Bell, translationKey: 'alarm-across-room' },
      { id: 'morning-sunlight', icon: Sun, translationKey: 'morning-sunlight' },
      { id: 'sleep-schedule', icon: Calendar, translationKey: 'sleep-schedule' },
      { id: 'no-snooze', icon: XCircle, translationKey: 'no-snooze' },
      { id: 'morning-routine', icon: CheckCheck, translationKey: 'morning-routine' },
    ],
  },
];

/**
 * Helper pour récupérer les tâches d'une catégorie
 */
export const getTaskDefinitions = (category: string, type: 'good' | 'bad'): TaskDefinition[] => {
  const categoryData = HABIT_TASKS_DATABASE.find((c) => c.category === category);
  if (!categoryData) {
    console.warn(`⚠️ Category "${category}" not found in HABIT_TASKS_DATABASE`);
    return [];
  }
  return categoryData[type];
};
