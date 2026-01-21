// src/screens/AuthScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import tw from 'twrnc';

type AuthMode = 'signin' | 'signup' | 'reset';

// Amethyst purple gradient
const amethystGradient: readonly [string, string, string] = ['#a78bfa', '#8b5cf6', '#7c3aed'];
const amethystAccent = '#8b5cf6';

// Check icon
const CheckIcon = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Eye icon
const EyeIcon = ({ visible, size = 20 }: { visible: boolean; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {visible ? (
      <>
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#64748b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="#64748b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : (
      <>
        <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="#64748b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M1 1l22 22" stroke="#64748b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
  </Svg>
);

// Duolingo-style button with 3D depth - White variant
const DuolingoButton: React.FC<{
  onPress: () => void;
  loading: boolean;
  label: string;
  icon?: React.ReactNode;
}> = ({ onPress, loading, label, icon }) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * 3 }],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      onPressIn={() => { pressed.value = withTiming(1, { duration: 100 }); }}
      onPressOut={() => { pressed.value = withTiming(0, { duration: 100 }); }}
      style={tw`mb-4`}
    >
      <Animated.View
        style={[
          tw`rounded-2xl overflow-hidden`,
          {
            backgroundColor: '#ffffff',
            borderBottomWidth: 4,
            borderBottomColor: '#e2e8f0',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
          },
          animatedStyle,
        ]}
      >
        <View style={tw`py-4 flex-row items-center justify-center gap-3`}>
          {icon}
          {loading ? (
            <ActivityIndicator color={amethystAccent} size="small" />
          ) : (
            <Text style={[tw`font-bold text-base`, { color: '#1e293b' }]}>{label}</Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

// Primary gradient button with amethyst texture
const GradientButton: React.FC<{
  onPress: () => void;
  loading: boolean;
  label: string;
}> = ({ onPress, loading, label }) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * 3 }],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      onPressIn={() => { pressed.value = withTiming(1, { duration: 100 }); }}
      onPressOut={() => { pressed.value = withTiming(0, { duration: 100 }); }}
      style={tw`mt-3 mb-4`}
    >
      <Animated.View
        style={[
          tw`rounded-2xl overflow-hidden`,
          {
            borderBottomWidth: 4,
            borderBottomColor: '#5b21b6',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 8,
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={amethystGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tw`relative`}
        >
          {/* Texture overlay */}
          <Image
            source={require('../../assets/interface/progressBar/amethyst-texture.png')}
            style={[tw`absolute inset-0 w-full h-full`, { opacity: 0.2 }]}
            contentFit="cover"
          />
          <View style={tw`py-4 items-center justify-center`}>
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={tw`font-bold text-base text-white`}>{label}</Text>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

// Minimalist Input Component with smooth animated focus
const AuthInput: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'username' | 'off';
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  rightIcon?: React.ReactNode;
}> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  showPasswordToggle,
  showPassword,
  onTogglePassword,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete = 'off',
  returnKeyType = 'next',
  onSubmitEditing,
  inputRef,
  rightIcon,
}) => {
  const focusAnim = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      ['#e2e8f0', amethystAccent]
    );
    return {
      borderColor,
      borderWidth: 1.5 + focusAnim.value * 0.5,
    };
  });

  const handleFocus = () => {
    focusAnim.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    focusAnim.value = withTiming(0, { duration: 200 });
  };

  return (
    <Animated.View
      style={[
        tw`flex-row items-center rounded-2xl px-5 mb-4`,
        {
          backgroundColor: '#ffffff',
          height: 56,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
        },
        animatedBorderStyle,
      ]}
    >
      <TextInput
        ref={inputRef as React.RefObject<TextInput>}
        style={[tw`flex-1 text-base`, { color: '#1e293b', height: '100%' }]}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !showPassword}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        returnKeyType={returnKeyType}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={onSubmitEditing}
      />
      {showPasswordToggle && (
        <Pressable onPress={onTogglePassword} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <EyeIcon visible={showPassword || false} />
        </Pressable>
      )}
      {rightIcon}
    </Animated.View>
  );
};

const AuthScreen: React.FC = () => {
  const { signIn, signUp, signInWithApple, resetPassword, loading } = useAuth();
  const { t } = useTranslation();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);

  // Animation for mode transition
  const formOpacity = useSharedValue(1);
  const formTranslateY = useSharedValue(0);

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  // Floating animation for logo
  const floatY = useSharedValue(0);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  useEffect(() => {
    // Small delay to ensure component is mounted
    const timer = setTimeout(() => {
      floatY.value = withRepeat(
        withTiming(-12, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        -1, // infinite
        true // reverse - smooth back and forth
      );
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mode === 'signup' && password) {
      let strength = 0;
      if (password.length >= 6) strength++;
      if (password.length >= 10) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [password, mode]);

  const getStrengthColor = (level: number) => {
    if (passwordStrength >= level) {
      if (passwordStrength === 5) return '#10b981';
      if (passwordStrength >= 3) return amethystAccent;
      if (passwordStrength >= 2) return '#f59e0b';
      return '#60a5fa';
    }
    return 'rgba(255,255,255,0.3)';
  };

  const handleSubmit = async () => {
    if (!email || (mode !== 'reset' && !password)) {
      Alert.alert(t('auth.missingInfo'), t('auth.fillFields'));
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        Alert.alert(t('auth.passwordMismatch'), t('auth.passwordsDontMatch'));
        return;
      }
      if (password.length < 6) {
        Alert.alert(t('auth.weakPassword'), t('auth.passwordMin6'));
        return;
      }
      await signUp(email, password, username);
    } else if (mode === 'signin') {
      await signIn(email, password);
    } else if (mode === 'reset') {
      await resetPassword(email);
      setMode('signin');
    }
  };

  const switchMode = (newMode: AuthMode) => {
    // Animate out
    formOpacity.value = withTiming(0, { duration: 150 });
    formTranslateY.value = withTiming(-10, { duration: 150 });

    // After fade out, change mode and animate in
    setTimeout(() => {
      setMode(newMode);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setUsername('');
      setPasswordStrength(0);

      // Reset position and animate in
      formTranslateY.value = 10;
      formOpacity.value = withTiming(1, { duration: 250 });
      formTranslateY.value = withTiming(0, { duration: 250 });
    }, 150);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={tw`flex-1`}>
        {/* Full screen gradient background */}
        <LinearGradient
          colors={amethystGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`absolute inset-0`}
        />
        {/* Background texture with more visibility */}
        <Image
          source={require('../../assets/interface/background-v3.png')}
          style={[tw`absolute inset-0 w-full h-full`, { opacity: 0.25 }]}
          contentFit="cover"
        />

        <StatusBar barStyle="light-content" />
        <SafeAreaView style={tw`flex-1`}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={tw`flex-1`}
          >
            <ScrollView
              contentContainerStyle={tw`flex-grow px-8`}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Logo at top - floating */}
              <Animated.View entering={FadeInDown.duration(800)} style={tw`items-center mt-6 mb-6`}>
                <Animated.View
                  style={[
                    {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 12 },
                      shadowOpacity: 0.3,
                      shadowRadius: 20,
                    },
                    floatingStyle,
                  ]}
                >
                  <Image
                    source={require('../../assets/icon/icon_app.png')}
                    style={{ width: 180, height: 180 }}
                    contentFit="contain"
                  />
                </Animated.View>

                {/* Tagline - subtle */}
                <Text style={[tw`mt-4 text-sm font-medium text-center`, { color: 'rgba(255,255,255,0.7)' }]}>
                  {t('auth.tagline')}
                </Text>
              </Animated.View>

              {/* Form section - clearly separated */}
              <Animated.View entering={FadeInUp.delay(200).duration(800)} style={[tw`flex-1 justify-center`, formAnimatedStyle]}>
                {/* Form Title */}
                <Text style={tw`text-white text-2xl font-bold text-center mb-6`}>
                  {mode === 'signin' ? t('auth.signIn') : mode === 'signup' ? t('auth.createAccount') : t('auth.resetPassword')}
                </Text>

                {/* Username (signup only) */}
                {mode === 'signup' && (
                  <AuthInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder={t('auth.usernamePlaceholder')}
                    autoComplete="username"
                    returnKeyType="next"
                    inputRef={usernameRef}
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                )}

                {/* Email */}
                <AuthInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.emailPlaceholder')}
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                  inputRef={emailRef}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />

                {/* Password */}
                {mode !== 'reset' && (
                  <>
                    <AuthInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder={t('auth.password')}
                      secureTextEntry
                      showPasswordToggle
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                      autoComplete="password"
                      returnKeyType={mode === 'signup' ? 'next' : 'done'}
                      inputRef={passwordRef}
                      onSubmitEditing={() => {
                        if (mode === 'signup') {
                          confirmPasswordRef.current?.focus();
                        } else {
                          handleSubmit();
                        }
                      }}
                    />

                    {/* Password Strength bars */}
                    {mode === 'signup' && password.length > 0 && (
                      <View style={tw`flex-row gap-1.5 px-1 -mt-2 mb-4`}>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <View
                            key={level}
                            style={{
                              flex: 1,
                              height: 4,
                              backgroundColor: getStrengthColor(level),
                              borderRadius: 2,
                            }}
                          />
                        ))}
                      </View>
                    )}
                  </>
                )}

                {/* Confirm Password */}
                {mode === 'signup' && (
                  <AuthInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={t('auth.confirmPassword')}
                    secureTextEntry
                    showPassword={showPassword}
                    autoComplete="password"
                    returnKeyType="done"
                    inputRef={confirmPasswordRef}
                    onSubmitEditing={handleSubmit}
                    rightIcon={confirmPassword && password === confirmPassword ? <CheckIcon /> : undefined}
                  />
                )}

                {/* Submit Button - Gradient for signin/signup, white for reset */}
                {mode === 'reset' ? (
                  <DuolingoButton
                    onPress={handleSubmit}
                    loading={loading}
                    label={t('auth.sendResetLink')}
                  />
                ) : (
                  <GradientButton
                    onPress={handleSubmit}
                    loading={loading}
                    label={mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
                  />
                )}

                {/* Links on same line: Forgot password - Create account */}
                <View style={tw`flex-row justify-center items-center mb-4`}>
                  {mode === 'signin' && (
                    <>
                      <Pressable
                        onPress={() => switchMode('reset')}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={[tw`text-sm`, { color: 'rgba(255,255,255,0.8)' }]}>
                          {t('auth.forgotPassword')}
                        </Text>
                      </Pressable>
                      <Text style={[tw`mx-3`, { color: 'rgba(255,255,255,0.5)' }]}>—</Text>
                      <Pressable
                        onPress={() => switchMode('signup')}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={[tw`text-sm font-semibold`, { color: '#ffffff' }]}>
                          {t('auth.createAccountLink')}
                        </Text>
                      </Pressable>
                    </>
                  )}
                  {mode === 'signup' && (
                    <Pressable
                      onPress={() => switchMode('signin')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={[tw`text-sm`, { color: 'rgba(255,255,255,0.9)' }]}>
                        {t('auth.signInInstead')}
                      </Text>
                    </Pressable>
                  )}
                  {mode === 'reset' && (
                    <Pressable
                      onPress={() => switchMode('signin')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={[tw`text-sm`, { color: 'rgba(255,255,255,0.9)' }]}>
                        {t('auth.backToSignIn')}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* OAuth Section - Only show on signin mode */}
                {mode === 'signin' && (
                  <Animated.View entering={FadeInUp.delay(400).duration(800)} style={tw`mt-4`}>
                    <View style={tw`flex-row items-center mb-5`}>
                      <View style={[tw`flex-1`, { height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                      <Text style={[tw`mx-4 text-xs font-medium`, { color: 'rgba(255,255,255,0.7)' }]}>
                        {t('auth.orContinueWith')}
                      </Text>
                      <View style={[tw`flex-1`, { height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                    </View>

                    <DuolingoButton
                      onPress={signInWithApple}
                      loading={loading}
                      label={t('auth.continueWithApple')}
                      icon={
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="#1e293b">
                          <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                        </Svg>
                      }
                    />
                  </Animated.View>
                )}
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default AuthScreen;
