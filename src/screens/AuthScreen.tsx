import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, Platform, Keyboard, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../lib/tailwind';
import { useAuth } from '../context/AuthContext';
import { OAuthButton } from '../components/auth/OAuthButtons';
import { Image } from 'expo-image';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AuthScreen: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, signInWithApple, resetPassword, loading } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Refs for input fields
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
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

  const switchMode = (newMode: 'signin' | 'signup' | 'reset') => {
    setMode(newMode);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <LinearGradient colors={['#f0fdfa', '#e0f2fe', '#ddd6fe']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`flex-1`}>
        <SafeAreaView style={tw`flex-1`}>
          <View style={tw`flex-1 px-6 justify-between`}>
            {/* Logo Section - Fixed Size */}
            <View style={tw`items-center pt-4 pb-2`}>
              <Image source={require('../../assets/images/base-logo.png')} style={tw`w-30 h-30`} contentFit="cover" transition={200} />
              <Text style={tw`text-3xl font-bold text-slate-800 mt-2`}>Mindful Habits</Text>
              <Text style={tw`text-slate-600 text-sm mt-1 text-center`}>{mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'}</Text>
            </View>

            {/* Form Fields - Center */}
            <View style={tw`flex-1 justify-center`}>
              <View style={tw`bg-white/90 rounded-3xl p-5 shadow-sm`}>
                {mode === 'signup' && (
                  <View style={tw`mb-3`}>
                    <Text style={tw`text-xs font-semibold text-slate-700 mb-1.5`}>Username (optional)</Text>
                    <TextInput
                      ref={usernameRef}
                      style={tw`bg-slate-50 px-4 py-3 rounded-2xl text-sm border border-slate-200`}
                      placeholder="Choose a username"
                      placeholderTextColor="#94a3b8"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                    />
                  </View>
                )}

                <View style={tw`mb-3`}>
                  <Text style={tw`text-xs font-semibold text-slate-700 mb-1.5`}>Email Address</Text>
                  <TextInput
                    ref={emailRef}
                    style={tw`bg-slate-50 px-4 py-3 rounded-2xl text-sm border border-slate-200`}
                    placeholder="your@email.com"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="next"
                    onSubmitEditing={() => mode !== 'reset' && passwordRef.current?.focus()}
                  />
                </View>

                {mode !== 'reset' && (
                  <View style={tw`mb-3`}>
                    <Text style={tw`text-xs font-semibold text-slate-700 mb-1.5`}>Password</Text>
                    <View style={tw`relative`}>
                      <TextInput
                        ref={passwordRef}
                        style={tw`bg-slate-50 px-4 py-3 rounded-2xl text-sm border border-slate-200 pr-12`}
                        placeholder="Enter password"
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                        returnKeyType={mode === 'signup' ? 'next' : 'done'}
                        onSubmitEditing={() => {
                          if (mode === 'signup') {
                            confirmPasswordRef.current?.focus();
                          } else {
                            handleSubmit();
                          }
                        }}
                      />
                      <Pressable style={tw`absolute right-4 top-3`} onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={tw`text-xl`}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {mode === 'signup' && (
                  <View style={tw`mb-4`}>
                    <Text style={tw`text-xs font-semibold text-slate-700 mb-1.5`}>Confirm Password</Text>
                    <TextInput
                      ref={confirmPasswordRef}
                      style={tw`bg-slate-50 px-4 py-3 rounded-2xl text-sm border border-slate-200`}
                      placeholder="Confirm password"
                      placeholderTextColor="#94a3b8"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                  </View>
                )}

                {/* Submit Button */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={loading}
                  style={({ pressed }) => [tw`overflow-hidden rounded-2xl mt-1 mb-3`, tw`${pressed ? 'opacity-80' : 'opacity-100'}`, tw`${loading ? 'opacity-50' : 'opacity-100'}`]}
                >
                  <LinearGradient colors={['#14b8a6', '#06b6d4', '#6366f1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`py-3.5 px-6 items-center`}>
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={tw`text-white font-bold text-base`}>{mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}</Text>
                    )}
                  </LinearGradient>
                </Pressable>

                {/* Forgot Password / Mode Switch */}
                <View style={tw`flex-row justify-center items-center`}>
                  {mode === 'signin' && (
                    <>
                      <Pressable onPress={() => switchMode('reset')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={tw`text-indigo-600 text-xs font-medium`}>Forgot password?</Text>
                      </Pressable>
                      <Text style={tw`text-slate-400 mx-2`}>•</Text>
                    </>
                  )}
                  <Pressable onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={tw`text-indigo-600 text-xs font-medium`}>{mode === 'signin' ? 'Sign Up' : mode === 'reset' ? 'Back to Sign In' : 'Sign In'}</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* OAuth Buttons - Bottom */}
            {mode !== 'reset' && (
              <View style={tw`pb-4`}>
                <View style={tw`flex-row items-center mb-4`}>
                  <View style={tw`flex-1 h-px bg-slate-300`} />
                  <Text style={tw`mx-4 text-slate-500 text-xs font-medium`}>OR CONTINUE WITH</Text>
                  <View style={tw`flex-1 h-px bg-slate-300`} />
                </View>

                <View style={tw`gap-3`}>
                  <OAuthButton provider="apple" onPress={signInWithApple} loading={loading} />
                  <OAuthButton provider="google" onPress={signInWithGoogle} loading={loading} />
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

export default AuthScreen;
