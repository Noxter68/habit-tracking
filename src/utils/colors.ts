export interface ColorShade {
  light: string;
  DEFAULT: string;
  dark: string;
}

export interface BackgroundColors {
  light: string;
  DEFAULT: string;
  accent: string;
}

export interface TextColors {
  primary: string;
  secondary: string;
  light: string;
}

export interface AppColors {
  primary: ColorShade;
  secondary: ColorShade;
  background: BackgroundColors;
  text: TextColors;
}

export const colors: AppColors = {
  primary: {
    light: '#99F6E4', // teal-200
    DEFAULT: '#2DD4BF', // teal-400
    dark: '#14B8A6', // teal-500
  },
  secondary: {
    light: '#F1F5F9', // slate-100
    DEFAULT: '#64748B', // slate-500
    dark: '#475569', // slate-600
  },
  background: {
    light: '#F0F9FF', // sky-50
    DEFAULT: '#EFF6FF', // blue-50
    accent: '#DCFCE7', // green-100
  },
  text: {
    primary: '#334155', // slate-700
    secondary: '#64748B', // slate-500
    light: '#94A3B8', // slate-400
  },
};
