// src/utils/images.ts
import { ImageSourcePropType } from 'react-native';

// Define all your images here
export const Images = {
  streak: require('../../assets/interface/streak.png'),
  active: require('../../assets/interface/quest.png'),
  // Add all your images here
} as const;

export type ImageName = keyof typeof Images;

export const getImage = (name: string): ImageSourcePropType | null => {
  const cleanName = name.replace(/\.(png|jpg|jpeg)$/i, '');
  if (cleanName in Images) {
    return Images[cleanName as ImageName];
  }
  return null;
};
