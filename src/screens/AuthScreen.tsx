import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring, withSequence, withRepeat, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import Svg, { Path, Circle } from 'react-native-svg';
import tw from 'twrnc';
import { useAuth } from '@/context/AuthContext';
import { OAuthButton } from '@/components/auth/OAuthButtons';

type AuthMode = 'signin' | 'signup' | 'reset';

// Icons
const EyeIcon = ({ visible, size = 20 }: { visible: boolean; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {visible ? (
      <>
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#64748b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="12" cy="12" r="3" stroke="#64748b" strokeWidth={2} />
      </>
    ) : (
      <>
        <Path
          d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
          stroke="#64748b"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M1 1l22 22" stroke="#64748b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
  </Svg>
);

const CheckIcon = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Floating gem images with levitation animations (NO ROTATION)
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
    // Vertical levitation
    translateY.value = withRepeat(withSequence(withTiming(25, { duration: 3500 + Math.random() * 1500 }), withTiming(-25, { duration: 3500 + Math.random() * 1500 })), -1, true);

    // Horizontal drift
    translateX.value = withRepeat(withSequence(withTiming(15, { duration: 4000 + Math.random() * 1000 }), withTiming(-15, { duration: 4000 + Math.random() * 1000 })), -1, true);

    // Gentle breathing scale
    scale.value = withRepeat(withSequence(withTiming(1.08, { duration: 2500 + Math.random() * 500 }), withTiming(0.92, { duration: 2500 + Math.random() * 500 })), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }, { scale: scale.value }],
    opacity: 0.1, // 10% opacity to see original gem colors
  }));

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(1200)} style={[tw`absolute`, { width: size, height: size, top, left }, animatedStyle]}>
      <Image source={gemSource} style={{ width: size, height: size }} contentFit="contain" transition={200} />
    </Animated.View>
  );
};

const AuthScreen: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, signInWithApple, resetPassword, loading } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Refs
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);

  // Animation values
  const formScale = useSharedValue(1);

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

  // Strength colors using your gem palette
  const getStrengthColor = (level: number) => {
    if (passwordStrength >= level) {
      if (passwordStrength === 5) return '#10b981'; // Jade
      if (passwordStrength >= 3) return '#8b5cf6'; // Amethyst
      if (passwordStrength >= 2) return '#ef4444'; // Ruby
      return '#60a5fa'; // Crystal
    }
    return '#e2e8f0';
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!email || (mode !== 'reset' && !password)) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Weak Password', 'Password must be at least 6 characters');
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
    Haptics.selectionAsync();
    formScale.value = withSequence(withSpring(0.95), withSpring(1));
    setMode(newMode);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setPasswordStrength(0);
  };

  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: formScale.value }],
  }));

  // Gem gradient based on mode
  const getModeGradient = () => {
    switch (mode) {
      case 'signup':
        return ['#10b981', '#059669', '#047857']; // Jade - Green
      case 'reset':
        return ['#ef4444', '#dc2626', '#991b1b']; // Ruby - Red
      default:
        return ['#10b981', '#059669', '#047857']; // Jade - Green for signin
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={tw`flex-1 bg-[#FAF9F7]`}>
        {/* Animated Gem Background with PNG Images at 10% opacity */}
        <LinearGradient colors={['#fafafa10', '#f5f5f510', '#f0f0f010']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`absolute inset-0 bg-[#FAF9F7]`}>
          {/* Ruby Gems */}
          <FloatingGemImage delay={0} gemSource={require('../../assets/interface/gems/ruby-gem.png')} size={150} top={80} left={-40} />
          <FloatingGemImage delay={350} gemSource={require('../../assets/interface/gems/ruby-gem.png')} size={110} top={500} left={250} />

          {/* Amethyst Gems */}
          <FloatingGemImage delay={150} gemSource={require('../../assets/interface/gems/amethyst-gem.png')} size={170} top={150} left={210} />
          <FloatingGemImage delay={500} gemSource={require('../../assets/interface/gems/amethyst-gem.png')} size={95} top={600} left={30} />

          {/* Jade Gems */}
          <FloatingGemImage delay={100} gemSource={require('../../assets/interface/gems/jade-gem.png')} size={130} top={400} left={-30} />
          <FloatingGemImage delay={450} gemSource={require('../../assets/interface/gems/jade-gem.png')} size={90} top={280} left={270} />

          {/* Crystal Gems */}
          <FloatingGemImage delay={250} gemSource={require('../../assets/interface/gems/crystal-gem.png')} size={120} top={50} left={130} />
          <FloatingGemImage delay={400} gemSource={require('../../assets/interface/gems/crystal-gem.png')} size={80} top={540} left={170} />
        </LinearGradient>

        <SafeAreaView style={tw`flex-1`}>
          <View style={tw`flex-1 px-6 justify-between py-6`}>
            {/* Gamified Header - NO ICON */}
            <Animated.View entering={FadeInDown.duration(800)} style={tw`items-center pt-2`}>
              {/* Gamified Title with Crystal Blue Gradient */}
              <View style={tw`items-center`}>
                <View style={tw`flex-row items-center gap-3 mb-2`}>
                  <LinearGradient colors={['#60a5fa', '#3b82f6', '#1d4ed8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`px-6 py-3 rounded-full shadow-lg`}>
                    <Text style={tw`text-white text-3xl font-black tracking-tight`}>Mindful Habits</Text>
                  </LinearGradient>
                </View>

                {/* Dynamic Level Badge */}
                <View style={tw`mt-2`}>
                  <LinearGradient colors={getModeGradient()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`px-5 py-1.5 rounded-full`}>
                    <Text style={tw`text-white text-xs font-black uppercase tracking-widest`}>{mode === 'signin' ? 'Continue Quest' : mode === 'signup' ? 'Begin Journey' : 'Recover Account'}</Text>
                  </LinearGradient>
                </View>
              </View>

              <Text style={tw`text-slate-600 text-sm text-center px-8 font-semibold mt-3`}>
                {mode === 'signin' ? 'Welcome back, Hero' : mode === 'signup' ? 'Your transformation awaits' : 'Reset your credentials'}
              </Text>
            </Animated.View>

            {/* Form Container with Glassmorphism */}
            <Animated.View entering={FadeInUp.delay(200).duration(800)} style={[tw`flex-1 justify-center`, formAnimatedStyle]}>
              <BlurView intensity={90} tint="light" style={tw`rounded-3xl overflow-hidden shadow-2xl`}>
                <LinearGradient colors={['#ffffff', '#fafafa']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={tw`p-5 rounded-3xl border border-white/60`}>
                  {/* Username (Signup only) */}
                  {mode === 'signup' && (
                    <View style={tw`mb-3`}>
                      <Text style={tw`text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider`}>Username (Optional)</Text>
                      <View style={[tw`bg-slate-50/80 rounded-2xl border-2 flex-row items-center px-4`, focusedInput === 'username' ? tw`border-purple-400 bg-purple-50/30` : tw`border-slate-200`]}>
                        <TextInput
                          ref={usernameRef}
                          style={tw`flex-1 py-3 text-base text-slate-800 font-medium`}
                          placeholder="johndoe"
                          placeholderTextColor="#94a3b8"
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
                    <Text style={tw`text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider`}>Email Address</Text>
                    <View style={[tw`bg-slate-50/80 rounded-2xl border-2 flex-row items-center px-4`, focusedInput === 'email' ? tw`border-emerald-400 bg-emerald-50/30` : tw`border-slate-200`]}>
                      <TextInput
                        ref={emailRef}
                        style={tw`flex-1 py-3 text-base text-slate-800 font-medium`}
                        placeholder="your@email.com"
                        placeholderTextColor="#94a3b8"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        returnKeyType="next"
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                        onSubmitEditing={() => mode !== 'reset' && passwordRef.current?.focus()}
                      />
                      {email && email.includes('@') && <CheckIcon />}
                    </View>
                  </View>

                  {/* Password */}
                  {mode !== 'reset' && (
                    <View style={tw`mb-3`}>
                      <Text style={tw`text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider`}>Password</Text>
                      <View style={[tw`bg-slate-50/80 rounded-2xl border-2 flex-row items-center px-4`, focusedInput === 'password' ? tw`border-blue-400 bg-blue-50/30` : tw`border-slate-200`]}>
                        <TextInput
                          ref={passwordRef}
                          style={tw`flex-1 py-3 text-base text-slate-800 font-medium`}
                          placeholder="••••••••"
                          placeholderTextColor="#94a3b8"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
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
                        <Pressable
                          onPress={() => {
                            Haptics.selectionAsync();
                            setShowPassword(!showPassword);
                          }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <EyeIcon visible={showPassword} />
                        </Pressable>
                      </View>

                      {/* Gem-Themed Password Strength - Compact */}
                      {mode === 'signup' && password && (
                        <View style={tw`mt-2`}>
                          <View style={tw`flex-row gap-1`}>
                            {[1, 2, 3, 4, 5].map((level) => (
                              <View key={level} style={[tw`flex-1 h-1 rounded-full`, { backgroundColor: getStrengthColor(level) }]} />
                            ))}
                          </View>
                          <Text style={tw`text-xs text-slate-600 mt-1 font-semibold`}>
                            {passwordStrength < 2 ? '💎 Crystal' : passwordStrength < 4 ? '💎 Ruby' : passwordStrength < 5 ? '💎 Amethyst' : '💎 Jade'}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Confirm Password */}
                  {mode === 'signup' && (
                    <View style={tw`mb-3`}>
                      <Text style={tw`text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider`}>Confirm Password</Text>
                      <View style={[tw`bg-slate-50/80 rounded-2xl border-2 flex-row items-center px-4`, focusedInput === 'confirm' ? tw`border-blue-400 bg-blue-50/30` : tw`border-slate-200`]}>
                        <TextInput
                          ref={confirmPasswordRef}
                          style={tw`flex-1 py-3 text-base text-slate-800 font-medium`}
                          placeholder="••••••••"
                          placeholderTextColor="#94a3b8"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showPassword}
                          autoComplete="new-password"
                          returnKeyType="done"
                          onFocus={() => setFocusedInput('confirm')}
                          onBlur={() => setFocusedInput(null)}
                          onSubmitEditing={handleSubmit}
                        />
                        {confirmPassword && password === confirmPassword && <CheckIcon />}
                      </View>
                    </View>
                  )}

                  {/* Gem Gradient Submit Button */}
                  <Pressable
                    onPress={handleSubmit}
                    disabled={loading}
                    style={({ pressed }) => [tw`mt-1 rounded-2xl overflow-hidden shadow-xl`, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                  >
                    <LinearGradient colors={getModeGradient()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`py-3.5 items-center`}>
                      {loading ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text style={tw`text-white font-black text-base tracking-wide`}>{mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}</Text>
                      )}
                    </LinearGradient>
                  </Pressable>

                  {/* Mode Switch */}
                  <View style={tw`flex-row justify-center items-center mt-3 gap-2`}>
                    {mode === 'signin' && (
                      <>
                        <Pressable onPress={() => switchMode('reset')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <Text style={tw`text-slate-600 text-xs font-bold`}>Forgot password?</Text>
                        </Pressable>
                        <Text style={tw`text-slate-400 font-bold`}>•</Text>
                      </>
                    )}
                    <Pressable onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={tw`text-slate-600 text-xs font-bold`}>{mode === 'signin' ? 'Create account' : mode === 'reset' ? 'Back to sign in' : 'Sign in instead'}</Text>
                    </Pressable>
                  </View>
                </LinearGradient>
              </BlurView>
            </Animated.View>

            {/* OAuth Section */}
            {mode !== 'reset' && (
              <Animated.View entering={FadeInUp.delay(400).duration(800)} style={tw`pb-2`}>
                <View style={tw`flex-row items-center mb-4`}>
                  <View style={tw`flex-1 h-px bg-slate-300`} />
                  <Text style={tw`mx-4 text-slate-500 text-xs font-black tracking-widest`}>OR CONTINUE WITH</Text>
                  <View style={tw`flex-1 h-px bg-slate-300`} />
                </View>

                <View style={tw`gap-3`}>
                  <OAuthButton provider="apple" onPress={signInWithApple} loading={loading} />
                  <OAuthButton provider="google" onPress={signInWithGoogle} loading={loading} />
                </View>
              </Animated.View>
            )}
          </View>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default AuthScreen;
