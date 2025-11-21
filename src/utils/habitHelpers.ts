/**
 * @file habitHelpers.ts
 * @description Utilitaires pour la gestion des habitudes, catégories et tâches.
 * Fournit les données de configuration pour le wizard de création d'habitudes,
 * les icônes de tâches et les traductions dynamiques via i18n.
 */

import { HabitType, Task } from '../types';
import i18n from '../i18n';
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
  Sun,
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
} from 'lucide-react-native';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Données d'un type d'habitude (bonne ou mauvaise).
 */
export interface HabitTypeData {
  /** Identifiant du type */
  id: HabitType;
  /** Titre affiché */
  title: string;
  /** Sous-titre descriptif */
  subtitle: string;
  /** Description détaillée */
  description: string;
  /** Couleurs du dégradé */
  gradient: [string, string];
}

/**
 * Données d'une catégorie d'habitude.
 */
export interface CategoryData {
  /** Identifiant de la catégorie */
  id: string;
  /** Libellé affiché */
  label: string;
  /** Description de la catégorie */
  description: string;
  /** Couleur associée */
  color: string;
}

// =============================================================================
// CONSTANTES - MAPPING DES ICÔNES DE TÂCHES
// =============================================================================

/**
 * Mapping statique des icônes pour chaque tâche par catégorie et type.
 * Les icônes ne changent pas selon la langue.
 */
const taskIcons: Record<string, Record<string, Record<string, any>>> = {
  fitness: {
    good: {
      'morning-run': User,
      'gym-workout': Dumbbell,
      'yoga-session': Flower2,
      'push-ups': Activity,
      'walk-10k': Footprints,
      stretching: Move,
    },
    bad: {
      'no-elevator': ArrowUpCircle,
      'no-couch': Armchair,
      'active-breaks': Timer,
    },
  },
  health: {
    good: {
      meditation: Stars,
      'deep-breathing': Wind,
      'cold-shower': Droplet,
      vitamins: Pill,
      skincare: Sparkle,
      'health-checkup': Stethoscope,
    },
    bad: {
      'no-stress': Smile,
      'no-late-nights': Moon,
      'no-overwork': Pause,
    },
  },
  nutrition: {
    good: {
      'healthy-breakfast': Sun,
      'fruit-serving': Apple,
      vegetables: Salad,
      'meal-prep': ChefHat,
      'protein-intake': Egg,
      'whole-grains': Wheat,
    },
    bad: {
      'no-fast-food': CircleSlash,
      'no-sugar': Candy,
      'no-late-snacks': Ban,
    },
  },
  learning: {
    good: {
      'read-book': BookOpen,
      'online-course': GraduationCap,
      'practice-skill': Target,
      'language-study': Languages,
      'write-journal': PenTool,
      'watch-tutorial': Video,
    },
    bad: {
      'no-distractions': Focus,
      'no-multitask': Brain,
      'no-cramming': CalendarCheck,
    },
  },
  productivity: {
    good: {
      'morning-routine': Sun,
      'time-blocking': CalendarDays,
      pomodoro: Clock,
      'daily-review': BarChart3,
      'priority-tasks': Star,
      'inbox-zero': Mail,
      'plan-day': CalendarCheck,
      'weekly-review': Calendar,
      'track-goals': Target,
    },
    bad: {
      'no-social-media': PhoneOff,
      'no-procrastination': Play,
      'no-perfectionism': CheckCheck,
    },
  },
  mindfulness: {
    good: {
      meditation: Stars,
      gratitude: Heart,
      breathing: Wind,
      'nature-walk': Trees,
      'body-scan': ScanFace,
      visualization: Eye,
    },
    bad: {
      'no-rushing': Turtle,
      'no-negativity': CloudSun,
      'no-overthinking': Brain,
    },
  },
  sleep: {
    good: {
      'bedtime-routine': BedDouble,
      'sleep-8hrs': Moon,
      'wake-same-time': AlarmClock,
      'bedroom-prep': Home,
    },
    bad: {
      'no-caffeine-pm': Coffee,
      'no-naps': BedSingle,
      'no-snooze': Clock3,
    },
  },
  hydration: {
    good: {
      'water-morning': Droplets,
      'water-8-glasses': Droplets,
      'herbal-tea': Coffee,
      'water-bottle': Droplet,
      'infused-water': Apple,
    },
    bad: {
      'no-soda': Wine,
      'no-alcohol': BeerOff,
      'no-energy-drinks': Zap,
    },
  },
  smoking: {
    good: {
      'breathing-exercises': Wind,
      'chew-gum': Candy,
      'stay-hydrated': Droplets,
    },
    bad: {
      'no-smoking': CigaretteOff,
      'avoid-triggers': AlertTriangle,
      'no-smoke-breaks': Footprints,
    },
  },
  'junk-food': {
    good: {
      'healthy-snacks': Carrot,
      'meal-planning': ClipboardList,
      'grocery-smart': ShoppingBasket,
    },
    bad: {
      'no-junk-food': Ban,
      'no-drive-thru': Car,
      'no-vending-machine': XCircle,
    },
  },
  shopping: {
    good: {
      'budget-tracking': Wallet,
      'shopping-list': ListChecks,
      'savings-goal': PiggyBank,
    },
    bad: {
      'no-impulse-buy': Clock,
      'unsubscribe-emails': MailX,
      'no-browsing': ShoppingBag,
    },
  },
  'screen-time': {
    good: {
      'read-physical-book': Book,
      'outdoor-activity': Trees,
      'face-to-face': Users,
    },
    bad: {
      'no-phone-bed': Smartphone,
      'limit-social-media': Smartphone,
      'no-binge-watching': Tv,
    },
  },
  procrastination: {
    good: {
      'start-immediately': Zap,
      'break-tasks-down': ListTree,
      'time-block': Calendar,
    },
    bad: {
      'no-delay': AlertCircle,
      'no-excuses': ShieldCheck,
      'no-distractions': Focus,
    },
  },
  'negative-thinking': {
    good: {
      'positive-affirmations': Stars,
      'gratitude-journal': NotebookPen,
      'reframe-thoughts': RefreshCw,
    },
    bad: {
      'no-complaining': MessageCircleOff,
      'no-self-criticism': HeartHandshake,
      'no-catastrophizing': ShieldAlert,
    },
  },
  alcohol: {
    good: {
      mocktails: Martini,
      'exercise-instead': Activity,
      'support-group': Users,
    },
    bad: {
      'no-alcohol': BeerOff,
      'avoid-bars': Store,
      'no-home-stocking': Home,
    },
  },
  oversleeping: {
    good: {
      'consistent-bedtime': MoonStar,
      'morning-routine': Sun,
      'sunlight-exposure': Sun,
    },
    bad: {
      'no-snooze': Clock3,
      'no-late-sleep': BedDouble,
      'alarm-far-away': Bell,
    },
  },
};

/**
 * Couleurs associées à chaque catégorie.
 */
const categoryColors: Record<string, string> = {
  fitness: '#ef4444',
  health: '#ec4899',
  nutrition: '#10b981',
  learning: '#8b5cf6',
  productivity: '#f59e0b',
  mindfulness: '#06b6d4',
  sleep: '#6366f1',
  hydration: '#3b82f6',
  smoking: '#dc2626',
  'junk-food': '#ea580c',
  shopping: '#f59e0b',
  'screen-time': '#8b5cf6',
  procrastination: '#06b6d4',
  'negative-thinking': '#ec4899',
  alcohol: '#7c3aed',
  oversleeping: '#6366f1',
};

// =============================================================================
// FONCTIONS - CITATIONS ET CONSEILS (DYNAMIQUES I18N)
// =============================================================================

/**
 * Récupère les citations motivationnelles traduites pour chaque étape du wizard.
 *
 * @returns Objet contenant les citations par étape
 */
export const getQuotes = () => ({
  start: i18n.t('habitHelpers.quotes.start', { returnObjects: true }),
  good: i18n.t('habitHelpers.quotes.good', { returnObjects: true }),
  bad: i18n.t('habitHelpers.quotes.bad', { returnObjects: true }),
  category: i18n.t('habitHelpers.quotes.category', { returnObjects: true }),
  tasks: i18n.t('habitHelpers.quotes.tasks', { returnObjects: true }),
  goal: i18n.t('habitHelpers.quotes.goal', { returnObjects: true }),
  frequency: i18n.t('habitHelpers.quotes.frequency', { returnObjects: true }),
  notification: i18n.t('habitHelpers.quotes.notification', { returnObjects: true }),
});

/** Citations exportées (cache initial) */
export const quotes = getQuotes();

/**
 * Récupère les conseils professionnels traduits pour chaque étape du wizard.
 *
 * @returns Objet contenant les conseils par étape
 */
export const getTips = () => ({
  habitType: i18n.t('habitHelpers.tips.habitType', { returnObjects: true }),
  category: i18n.t('habitHelpers.tips.category', { returnObjects: true }),
  tasks: i18n.t('habitHelpers.tips.tasks', { returnObjects: true }),
  goal: i18n.t('habitHelpers.tips.goal', { returnObjects: true }),
  frequency: i18n.t('habitHelpers.tips.frequency', { returnObjects: true }),
  notification: i18n.t('habitHelpers.tips.notification', { returnObjects: true }),
});

/** Conseils exportés (cache initial) */
export const tips = getTips();

// =============================================================================
// FONCTIONS - TYPES D'HABITUDES
// =============================================================================

/**
 * Récupère les données des types d'habitudes (bonne/mauvaise) avec traductions.
 *
 * @returns Tableau des types d'habitudes disponibles
 */
export const getHabitTypes = (): HabitTypeData[] => [
  {
    id: 'good',
    title: i18n.t('habitHelpers.habitTypes.good.title'),
    subtitle: i18n.t('habitHelpers.habitTypes.good.subtitle'),
    description: i18n.t('habitHelpers.habitTypes.good.description'),
    gradient: ['#10b981', '#059669'],
  },
  {
    id: 'bad',
    title: i18n.t('habitHelpers.habitTypes.bad.title'),
    subtitle: i18n.t('habitHelpers.habitTypes.bad.subtitle'),
    description: i18n.t('habitHelpers.habitTypes.bad.description'),
    gradient: ['#ef4444', '#dc2626'],
  },
];

/** Types d'habitudes exportés (cache initial) */
export const habitTypes = getHabitTypes();

// =============================================================================
// FONCTIONS - CATÉGORIES
// =============================================================================

/**
 * Récupère les catégories pour les bonnes habitudes avec traductions.
 *
 * @returns Tableau des catégories de bonnes habitudes
 */
export const getGoodCategories = (): CategoryData[] => {
  const categories = [
    'fitness',
    'health',
    'nutrition',
    'learning',
    'productivity',
    'mindfulness',
    'sleep',
    'hydration',
  ];

  return categories.map((id) => ({
    id,
    label: i18n.t(`habitHelpers.categories.good.${id}.label`),
    description: i18n.t(`habitHelpers.categories.good.${id}.description`),
    color: categoryColors[id],
  }));
};

/**
 * Récupère les catégories pour les mauvaises habitudes avec traductions.
 *
 * @returns Tableau des catégories de mauvaises habitudes
 */
export const getBadCategories = (): CategoryData[] => {
  const categories = [
    'smoking',
    'junk-food',
    'shopping',
    'screen-time',
    'procrastination',
    'negative-thinking',
    'alcohol',
    'oversleeping',
  ];

  return categories.map((id) => ({
    id,
    label: i18n.t(`habitHelpers.categories.bad.${id}.label`),
    description: i18n.t(`habitHelpers.categories.bad.${id}.description`),
    color: categoryColors[id],
  }));
};

/** Catégories de bonnes habitudes exportées (cache initial) */
export const goodCategories = getGoodCategories();

/** Catégories de mauvaises habitudes exportées (cache initial) */
export const badCategories = getBadCategories();

/**
 * Récupère les catégories selon le type d'habitude.
 *
 * @param type - Type d'habitude ('good' ou 'bad')
 * @returns Tableau des catégories correspondantes
 */
export const getCategories = (type: HabitType): CategoryData[] => {
  return type === 'good' ? getGoodCategories() : getBadCategories();
};

/**
 * Récupère le nom d'une habitude basé sur sa catégorie.
 *
 * @param category - Identifiant de la catégorie
 * @param type - Type d'habitude ('good' ou 'bad')
 * @returns Le nom traduit de l'habitude
 */
export const getCategoryName = (category: string, type: HabitType): string => {
  return i18n.t(`habitHelpers.categories.${type}.${category}.habitName`);
};

// =============================================================================
// FONCTIONS - TÂCHES
// =============================================================================

/**
 * Récupère les tâches disponibles pour une catégorie et un type d'habitude.
 * Combine les traductions dynamiques avec les icônes statiques.
 *
 * @param category - Identifiant de la catégorie
 * @param type - Type d'habitude ('good' ou 'bad')
 * @returns Tableau des tâches avec leurs détails et icônes
 *
 * @example
 * const tasks = getTasksForCategory('fitness', 'good');
 * // Retourne les tâches comme 'morning-run', 'gym-workout', etc.
 */
export const getTasksForCategory = (category: string, type: HabitType): Task[] => {
  const taskKeys = i18n.t(`habitHelpers.tasks.${category}.${type}`, {
    returnObjects: true,
  }) as Record<string, any>;

  if (!taskKeys || typeof taskKeys !== 'object') {
    return [];
  }

  return Object.entries(taskKeys).map(([id, data]: [string, any]) => ({
    id,
    name: data.name,
    description: data.description,
    duration: data.duration,
    // Récupération de l'icône depuis le mapping statique
    icon: taskIcons[category]?.[type]?.[id] || Activity,
  }));
};
