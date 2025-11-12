// src/screens/AuthScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, TouchableWithoutFeedback, Keyboard, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import tw from 'twrnc';

type AuthMode = 'signin' | 'signup' | 'reset';

// Check icon
const CheckIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Apple OAuth Button
const AppleOAuthButton: React.FC<{ onPress: () => void; loading: boolean; label: string }> = ({ onPress, loading, label }) => (
  <Pressable
    onPress={onPress}
    disabled={loading}
    style={({ pressed }) => [
      tw`rounded-2xl overflow-hidden border-2`,
      {
        borderColor: 'rgba(139, 92, 246, 0.3)',
        opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      },
    ]}
  >
    <LinearGradient colors={['#1a1625', '#2d1b3d', '#4338ca']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`py-3.5 flex-row items-center justify-center gap-3`}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
        <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </Svg>
      <Text style={tw`text-white font-bold text-base`}>{label}</Text>
    </LinearGradient>
  </Pressable>
);

// Floating gem images with levitation animations
const FloatingGemImage: React.FC<{
  delay: number;
  gemSource: any;
  size: number;
  top: number;
  left: number;
}> = ({ delay, gemSource, size, top, left }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withRepeat(withSequence(withTiming(25, { duration: 3500 + Math.random() * 1500 }), withTiming(-25, { duration: 3500 + Math.random() * 1500 })), -1, true);

    translateX.value = withRepeat(withSequence(withTiming(15, { duration: 4000 + Math.random() * 1000 }), withTiming(-15, { duration: 4000 + Math.random() * 1000 })), -1, true);

    scale.value = withRepeat(withSequence(withTiming(1.08, { duration: 2500 + Math.random() * 500 }), withTiming(0.92, { duration: 2500 + Math.random() * 500 })), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }, { scale: scale.value }],
    opacity: 0.1,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(1200)} style={[tw`absolute`, { width: size, height: size, top, left }, animatedStyle]}>
      <Image source={gemSource} style={{ width: size, height: size }} contentFit="contain" transition={200} />
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
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);

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
      if (passwordStrength >= 3) return '#8b5cf6';
      if (passwordStrength >= 2) return '#ef4444';
      return '#60a5fa';
    }
    return '#e2e8f0';
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
    setMode(newMode);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setPasswordStrength(0);
  };

  // Obsidian gradient
  const obsidianGradient = ['#1a1625', '#2d1b3d', '#4338ca', '#6366f1'];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={tw`flex-1 bg-[#FAF9F7]`}>
        {/* Animated Gem Background */}
        <LinearGradient colors={['#fafafa10', '#f5f5f510', '#f0f0f010']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`absolute inset-0 bg-[#FAF9F7]`}>
          <FloatingGemImage delay={0} gemSource={require('../../assets/interface/gems/ruby-gem.png')} size={150} top={80} left={-40} />
          <FloatingGemImage delay={350} gemSource={require('../../assets/interface/gems/ruby-gem.png')} size={110} top={500} left={250} />
          <FloatingGemImage delay={150} gemSource={require('../../assets/interface/gems/amethyst-gem.png')} size={170} top={150} left={210} />
          <FloatingGemImage delay={500} gemSource={require('../../assets/interface/gems/amethyst-gem.png')} size={95} top={600} left={30} />
          <FloatingGemImage delay={100} gemSource={require('../../assets/interface/gems/jade-gem.png')} size={130} top={400} left={-30} />
          <FloatingGemImage delay={450} gemSource={require('../../assets/interface/gems/jade-gem.png')} size={90} top={280} left={270} />
          <FloatingGemImage delay={250} gemSource={require('../../assets/interface/gems/crystal-gem.png')} size={120} top={50} left={130} />
          <FloatingGemImage delay={400} gemSource={require('../../assets/interface/gems/crystal-gem.png')} size={80} top={540} left={170} />
        </LinearGradient>

        <SafeAreaView style={tw`flex-1`}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1`}>
            <ScrollView contentContainerStyle={tw`px-6 py-4`} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Header with Large Icon */}
              <Animated.View entering={FadeInDown.duration(800)} style={tw`items-center mb-6`}>
                {/* App Icon - Much Larger */}
                <View
                  style={{
                    marginBottom: 16,
                    shadowColor: '#8b5cf6',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.25,
                    shadowRadius: 20,
                  }}
                >
                  <Image source={require('../../assets/icon/icon_app.png')} style={{ width: 120, height: 120 }} contentFit="contain" transition={200} />
                </View>

                {/* Nuvoria Title with Obsidian Gradient */}
                <LinearGradient colors={obsidianGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`px-6 py-2.5 rounded-full shadow-lg mb-3`}>
                  <Text style={[tw`text-center font-black`, { fontSize: 32, letterSpacing: -1, color: '#fff' }]}>Nuvoria</Text>
                </LinearGradient>

                {/* Tagline */}
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    backgroundColor: 'rgba(139, 92, 246, 0.08)',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(139, 92, 246, 0.12)',
                  }}
                >
                  <Text
                    style={[
                      tw`text-xs font-semibold text-center`,
                      {
                        color: '#4338ca',
                        letterSpacing: 0.5,
                      },
                    ]}
                  >
                    {t('auth.tagline')}
                  </Text>
                </View>
              </Animated.View>

              {/* Form */}
              <Animated.View entering={FadeInUp.delay(200).duration(800)}>
                <BlurView intensity={20} tint="light" style={tw`rounded-2xl overflow-hidden`}>
                  <LinearGradient colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']} style={tw`p-6`}>
                    {/* Mode Badge */}
                    <View style={tw`items-center mb-4`}>
                      <LinearGradient colors={obsidianGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`px-4 py-1.5 rounded-full`}>
                        <Text style={tw`text-white text-xs font-black uppercase tracking-widest`}>
                          {mode === 'signin' ? t('auth.signIn') : mode === 'signup' ? t('auth.createAccount') : t('auth.resetPassword')}
                        </Text>
                      </LinearGradient>
                    </View>

                    {/* Username (signup only) */}
                    {mode === 'signup' && (
                      <View style={tw`mb-3`}>
                        <Text style={[tw`text-xs font-extrabold mb-1.5 uppercase tracking-wider`, { color: '#1a1625' }]}>{t('auth.username')}</Text>
                        <View
                          style={[
                            tw`rounded-2xl border-2 flex-row items-center px-4`,
                            {
                              backgroundColor: focusedInput === 'username' ? 'rgba(67, 56, 202, 0.05)' : 'rgba(26, 22, 37, 0.03)',
                              borderColor: focusedInput === 'username' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(26, 22, 37, 0.15)',
                            },
                          ]}
                        >
                          <TextInput
                            ref={usernameRef}
                            style={[tw`flex-1 py-3 text-base font-medium`, { color: '#1a1625' }]}
                            placeholder={t('auth.usernamePlaceholder')}
                            placeholderTextColor="rgba(26, 22, 37, 0.4)"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            returnKeyType="next"
                            onFocus={() => setFocusedInput('username')}
                            onBlur={() => setFocusedInput(null)}
                            onSubmitEditing={() => emailRef.current?.focus()}
                          />
                        </View>
                      </View>
                    )}

                    {/* Email */}
                    <View style={tw`mb-3`}>
                      <Text style={[tw`text-xs font-extrabold mb-1.5 uppercase tracking-wider`, { color: '#1a1625' }]}>{t('auth.email')}</Text>
                      <View
                        style={[
                          tw`rounded-2xl border-2 flex-row items-center px-4`,
                          {
                            backgroundColor: focusedInput === 'email' ? 'rgba(67, 56, 202, 0.05)' : 'rgba(26, 22, 37, 0.03)',
                            borderColor: focusedInput === 'email' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(26, 22, 37, 0.15)',
                          },
                        ]}
                      >
                        <TextInput
                          ref={emailRef}
                          style={[tw`flex-1 py-3 text-base font-medium`, { color: '#1a1625' }]}
                          placeholder={t('auth.emailPlaceholder')}
                          placeholderTextColor="rgba(26, 22, 37, 0.4)"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          returnKeyType="next"
                          onFocus={() => setFocusedInput('email')}
                          onBlur={() => setFocusedInput(null)}
                          onSubmitEditing={() => passwordRef.current?.focus()}
                        />
                      </View>
                    </View>

                    {/* Password */}
                    {mode !== 'reset' && (
                      <View style={tw`mb-3`}>
                        <Text style={[tw`text-xs font-extrabold mb-1.5 uppercase tracking-wider`, { color: '#1a1625' }]}>{t('auth.password')}</Text>
                        <View
                          style={[
                            tw`rounded-2xl border-2 flex-row items-center px-4`,
                            {
                              backgroundColor: focusedInput === 'password' ? 'rgba(67, 56, 202, 0.05)' : 'rgba(26, 22, 37, 0.03)',
                              borderColor: focusedInput === 'password' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(26, 22, 37, 0.15)',
                            },
                          ]}
                        >
                          <TextInput
                            ref={passwordRef}
                            style={[tw`flex-1 py-3 text-base font-medium`, { color: '#1a1625' }]}
                            placeholder="••••••••"
                            placeholderTextColor="rgba(26, 22, 37, 0.4)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoComplete="password"
                            returnKeyType={mode === 'signup' ? 'next' : 'done'}
                            onFocus={() => setFocusedInput('password')}
                            onBlur={() => setFocusedInput(null)}
                            onSubmitEditing={() => {
                              if (mode === 'signup') {
                                confirmPasswordRef.current?.focus();
                              } else {
                                handleSubmit();
                              }
                            }}
                          />
                          <Pressable onPress={() => setShowPassword(!showPassword)}>
                            <Text style={[tw`text-xs font-bold`, { color: '#4338ca' }]}>{showPassword ? t('auth.hide') : t('auth.show')}</Text>
                          </Pressable>
                        </View>

                        {/* Password Strength */}
                        {mode === 'signup' && password && (
                          <View style={tw`mt-2`}>
                            <View style={tw`flex-row gap-2 mb-1.5`}>
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
                            <Text style={[tw`text-xs font-bold`, { color: '#1a1625' }]}>
                              {passwordStrength < 2 ? '💎 Crystal' : passwordStrength < 4 ? '💎 Ruby' : passwordStrength < 5 ? '💎 Amethyst' : '💎 Jade'}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Confirm Password */}
                    {mode === 'signup' && (
                      <View style={tw`mb-3`}>
                        <Text style={[tw`text-xs font-extrabold mb-1.5 uppercase tracking-wider`, { color: '#1a1625' }]}>{t('auth.confirmPassword')}</Text>
                        <View
                          style={[
                            tw`rounded-2xl border-2 flex-row items-center px-4`,
                            {
                              backgroundColor: focusedInput === 'confirm' ? 'rgba(67, 56, 202, 0.05)' : 'rgba(26, 22, 37, 0.03)',
                              borderColor: focusedInput === 'confirm' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(26, 22, 37, 0.15)',
                            },
                          ]}
                        >
                          <TextInput
                            ref={confirmPasswordRef}
                            style={[tw`flex-1 py-3 text-base font-medium`, { color: '#1a1625' }]}
                            placeholder="••••••••"
                            placeholderTextColor="rgba(26, 22, 37, 0.4)"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                            autoComplete="password"
                            returnKeyType="done"
                            onFocus={() => setFocusedInput('confirm')}
                            onBlur={() => setFocusedInput(null)}
                            onSubmitEditing={handleSubmit}
                          />
                          {confirmPassword && password === confirmPassword && <CheckIcon />}
                        </View>
                      </View>
                    )}

                    {/* Submit Button */}
                    <Pressable
                      onPress={handleSubmit}
                      disabled={loading}
                      style={({ pressed }) => [tw`mt-1 rounded-2xl overflow-hidden shadow-xl`, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                    >
                      <LinearGradient colors={obsidianGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`py-3.5 items-center`}>
                        {loading ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text style={tw`text-white font-black text-base tracking-wide`}>
                            {mode === 'signin' ? t('auth.signIn') : mode === 'signup' ? t('auth.createAccount') : t('auth.sendResetLink')}
                          </Text>
                        )}
                      </LinearGradient>
                    </Pressable>

                    {/* Mode Switch */}
                    <View style={tw`flex-row justify-center items-center mt-5 gap-2`}>
                      {mode === 'signin' && (
                        <>
                          <Pressable onPress={() => switchMode('reset')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Text style={[tw`text-xs font-bold`, { color: '#2d1b3d' }]}>{t('auth.forgotPassword')}</Text>
                          </Pressable>
                          <Text style={[tw`font-bold`, { color: 'rgba(26, 22, 37, 0.3)' }]}>•</Text>
                        </>
                      )}
                      <Pressable onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={[tw`text-xs font-bold`, { color: '#2d1b3d' }]}>
                          {mode === 'signin' ? t('auth.createAccountLink') : mode === 'reset' ? t('auth.backToSignIn') : t('auth.signInInstead')}
                        </Text>
                      </Pressable>
                    </View>
                  </LinearGradient>
                </BlurView>
              </Animated.View>

              {/* OAuth Section - ONLY APPLE */}
              {mode !== 'reset' && (
                <Animated.View entering={FadeInUp.delay(400).duration(800)} style={tw`mt-4 mb-4`}>
                  <View style={tw`flex-row items-center mb-4`}>
                    <View style={[tw`flex-1`, { height: 1, backgroundColor: 'rgba(26, 22, 37, 0.15)' }]} />
                    <Text style={[tw`mx-4 text-xs font-black tracking-widest`, { color: '#2d1b3d' }]}>{t('auth.orContinueWith')}</Text>
                    <View style={[tw`flex-1`, { height: 1, backgroundColor: 'rgba(26, 22, 37, 0.15)' }]} />
                  </View>

                  <AppleOAuthButton onPress={signInWithApple} loading={loading} label={t('auth.continueWithApple')} />
                </Animated.View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default AuthScreen;
