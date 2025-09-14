// src/screens/AuthScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import tw from '../lib/tailwind';
import { useAuth } from '../context/AuthContext';

const AuthScreen: React.FC = () => {
  const { signIn, signUp, resetPassword, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Please fill in all fields');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        Alert.alert('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Password must be at least 6 characters');
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

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1`}>
        <ScrollView contentContainerStyle={tw`flex-1 justify-center px-6`} showsVerticalScrollIndicator={false}>
          {/* Logo/Title */}
          <View style={tw`items-center mb-8`}>
            <Text style={tw`text-6xl mb-4`}>🌱</Text>
            <Text style={tw`text-3xl font-bold text-slate-800`}>Mindful</Text>
            <Text style={tw`text-slate-600 mt-2`}>{mode === 'signin' ? 'Welcome back!' : mode === 'signup' ? 'Start your journey' : 'Reset your password'}</Text>
          </View>

          {/* Form */}
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <View style={tw`bg-white rounded-2xl p-6 shadow-sm`}>
              {mode === 'signup' && (
                <View style={tw`mb-4`}>
                  <Text style={tw`text-sm font-medium text-slate-700 mb-2`}>Username (optional)</Text>
                  <TextInput style={tw`bg-slate-50 px-4 py-3 rounded-xl text-base`} placeholder="Choose a username" value={username} onChangeText={setUsername} autoCapitalize="none" />
                </View>
              )}

              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-medium text-slate-700 mb-2`}>Email</Text>
                <TextInput
                  style={tw`bg-slate-50 px-4 py-3 rounded-xl text-base`}
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              {mode !== 'reset' && (
                <View style={tw`mb-4`}>
                  <Text style={tw`text-sm font-medium text-slate-700 mb-2`}>Password</Text>
                  <TextInput
                    style={tw`bg-slate-50 px-4 py-3 rounded-xl text-base`}
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                </View>
              )}

              {mode === 'signup' && (
                <View style={tw`mb-6`}>
                  <Text style={tw`text-sm font-medium text-slate-700 mb-2`}>Confirm Password</Text>
                  <TextInput
                    style={tw`bg-slate-50 px-4 py-3 rounded-xl text-base`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoComplete="new-password"
                  />
                </View>
              )}

              {/* Submit Button */}
              <Pressable onPress={handleSubmit} disabled={loading} style={({ pressed }) => [tw`bg-teal-600 py-4 rounded-xl items-center mb-4`, pressed && tw`bg-teal-700`, loading && tw`opacity-50`]}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={tw`text-white font-semibold text-base`}>{mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}</Text>
                )}
              </Pressable>

              {/* Forgot Password Link */}
              {mode === 'signin' && (
                <Pressable onPress={() => setMode('reset')} style={tw`items-center mb-3`}>
                  <Text style={tw`text-teal-600 text-sm`}>Forgot password?</Text>
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* Toggle Mode */}
          <View style={tw`flex-row justify-center mt-6`}>
            <Text style={tw`text-slate-600`}>{mode === 'signin' ? "Don't have an account? " : mode === 'signup' ? 'Already have an account? ' : 'Remember your password? '}</Text>
            <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              <Text style={tw`text-teal-600 font-semibold`}>{mode === 'signin' ? 'Sign Up' : 'Sign In'}</Text>
            </Pressable>
          </View>

          {/* Social Login Options (Future) */}
          {mode !== 'reset' && (
            <View style={tw`mt-8`}>
              <View style={tw`flex-row items-center mb-4`}>
                <View style={tw`flex-1 h-px bg-slate-200`} />
                <Text style={tw`mx-4 text-slate-500 text-sm`}>OR</Text>
                <View style={tw`flex-1 h-px bg-slate-200`} />
              </View>

              <View style={tw`gap-3`}>
                <Pressable style={({ pressed }) => [tw`bg-white border border-slate-200 py-3 rounded-xl items-center flex-row justify-center`, pressed && tw`bg-slate-50`]} disabled={loading}>
                  <Text style={tw`text-2xl mr-2`}>🍎</Text>
                  <Text style={tw`text-slate-700 font-medium`}>Continue with Apple</Text>
                </Pressable>

                <Pressable style={({ pressed }) => [tw`bg-white border border-slate-200 py-3 rounded-xl items-center flex-row justify-center`, pressed && tw`bg-slate-50`]} disabled={loading}>
                  <Text style={tw`text-2xl mr-2`}>📧</Text>
                  <Text style={tw`text-slate-700 font-medium`}>Continue with Google</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthScreen;
