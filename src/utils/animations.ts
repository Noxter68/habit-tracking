import { Easing, WithTimingConfig } from 'react-native-reanimated';

export interface AnimationConfig {
  duration: number;
  easing: (value: number) => number;
}

export interface AnimationPresets {
  gentle: AnimationConfig;
  smooth: AnimationConfig;
  bounce: AnimationConfig;
}

export interface AnimationDelays {
  short: number;
  medium: number;
  long: number;
}

export const animationConfig: AnimationPresets = {
  gentle: {
    duration: 1200,
    easing: Easing.out(Easing.cubic),
  },
  smooth: {
    duration: 800,
    easing: Easing.inOut(Easing.ease),
  },
  bounce: {
    duration: 600,
    easing: Easing.out(Easing.back(1.5)),
  },
};

export const delays: AnimationDelays = {
  short: 200,
  medium: 500,
  long: 1000,
};

export const createTimingConfig = (preset: keyof AnimationPresets): WithTimingConfig => ({
  duration: animationConfig[preset].duration,
  easing: animationConfig[preset].easing,
});
