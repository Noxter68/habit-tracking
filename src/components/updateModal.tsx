import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { ChevronRight, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import tw from 'twrnc';
import { UpdateModalTexts, UpdateItem } from '../utils/updateContent';
import { HapticFeedback } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 48; // 24px padding on each side

// Amethyst gradient (same as AuthScreen)
const amethystGradient: readonly [string, string, string] = ['#a78bfa', '#8b5cf6', '#7c3aed'];

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  version: string;
  updates: UpdateItem[];
  texts: UpdateModalTexts;
}

// Stepper dots component
const StepperDots: React.FC<{ total: number; current: number }> = ({ total, current }) => {
  return (
    <View style={styles.stepperContainer}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.stepperDot,
            index === current ? styles.stepperDotActive : styles.stepperDotInactive,
          ]}
        />
      ))}
    </View>
  );
};

// Duolingo-style button
const DuolingoButton: React.FC<{
  onPress: () => void;
  label: string;
  variant?: 'primary' | 'secondary';
}> = ({ onPress, label, variant = 'primary' }) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * 3 }],
  }));

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 100 });
  };

  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={() => {
        HapticFeedback.light();
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.button,
          isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
          animatedStyle,
        ]}
      >
        <Text style={[styles.buttonText, isPrimary ? styles.buttonTextPrimary : styles.buttonTextSecondary]}>
          {label}
        </Text>
        {isPrimary && <ChevronRight size={20} color="#7c3aed" strokeWidth={2.5} />}
      </Animated.View>
    </Pressable>
  );
};

// Single slide component
const UpdateSlide: React.FC<{
  item: UpdateItem;
  onLinkPress?: (screen: string) => void;
}> = ({ item, onLinkPress }) => {
  // Parse description for **bold** text
  const renderDescription = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <Text key={index} style={styles.boldText}>
            {boldText}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <View style={[styles.slide, { width: SLIDE_WIDTH }]}>
      {/* Content */}
      <View style={styles.slideContent}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{renderDescription(item.description)}</Text>

        {/* Internal link button */}
        {item.link && onLinkPress && (
          <Pressable
            onPress={() => onLinkPress(item.link!.screen)}
            style={styles.linkButton}
          >
            <Text style={styles.linkButtonText}>{item.link.label}</Text>
            <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        )}
      </View>

      {/* Image - below text with border radius */}
      {item.image && (
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <Image source={item.image} style={styles.slideImage} resizeMode="contain" />
          </View>
        </View>
      )}
    </View>
  );
};

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  onClose,
  version,
  updates,
  texts,
}) => {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Reset to first slide when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      // Also scroll FlatList back to start
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [visible]);

  const isLastSlide = currentIndex === updates.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onClose();
    } else {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  const handleLinkPress = (screen: string) => {
    onClose();
    // Small delay to let modal close animation complete
    setTimeout(() => {
      navigation.navigate(screen as never);
    }, 300);
  };

  const handleClose = () => {
    HapticFeedback.light();
    onClose();
  };

  if (updates.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay}>
        {/* Full screen gradient background */}
        <LinearGradient
          colors={amethystGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Background texture */}
        <ExpoImage
          source={require('../../assets/interface/background-v3.png')}
          style={[StyleSheet.absoluteFill, { opacity: 0.2 }]}
          contentFit="cover"
        />

        {/* Close button */}
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <X size={24} color="rgba(255,255,255,0.8)" strokeWidth={2} />
        </Pressable>

        {/* Content */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{texts.title}</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>Version {version}</Text>
            </View>
          </View>

          {/* Slides */}
          <View style={styles.slidesContainer}>
            <Text style={styles.whatsNew}>{texts.whatsNew}</Text>

            <FlatList
              ref={flatListRef}
              data={updates}
              horizontal
              pagingEnabled={false}
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <UpdateSlide item={item} onLinkPress={handleLinkPress} />
              )}
              getItemLayout={(_, index) => ({
                length: SLIDE_WIDTH + 16,
                offset: (SLIDE_WIDTH + 16) * index,
                index,
              })}
              ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
            />

            {/* Stepper dots */}
            {updates.length > 1 && (
              <StepperDots total={updates.length} current={currentIndex} />
            )}
          </View>

          {/* Footer button */}
          <View style={styles.footer}>
            <DuolingoButton
              onPress={handleNext}
              label={isLastSlide ? texts.getStarted : 'Next'}
              variant="primary"
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingTop: 120,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  versionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  versionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  slidesContainer: {
    flex: 1,
  },
  whatsNew: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  flatListContent: {
    paddingHorizontal: 24,
  },
  slide: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  imageContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    alignItems: 'center',
  },
  imageWrapper: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  slideImage: {
    width: SLIDE_WIDTH - 28,
    height: 320,
  },
  slideContent: {
    padding: 20,
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  slideDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 4,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  stepperDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepperDotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  stepperDotInactive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 4,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextPrimary: {
    color: '#7c3aed',
  },
  buttonTextSecondary: {
    color: '#FFFFFF',
  },
});
