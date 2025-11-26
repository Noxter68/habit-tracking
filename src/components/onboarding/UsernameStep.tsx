/**
 * Composant UsernameStep
 *
 * Étape de l'onboarding permettant à l'utilisateur de créer son pseudo.
 * Gère la validation en temps réel et la vérification de l'unicité du pseudo.
 *
 * Règles de validation :
 * - Longueur : 3 à 20 caractères
 * - Caractères autorisés : Lettres uniquement (y compris accentuées comme ø, é, à, etc.)
 * - Caractères interdits : Points, tirets, underscores et autres symboles
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSequence
} from 'react-native-reanimated';
import { User, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '../../lib/tailwind';
import { supabase } from '@/lib/supabase';
import Logger from '@/utils/logger';

interface UsernameStepProps {
  gradient: string[];
  onUsernameChange: (username: string, isValid: boolean) => void;
  onKeyboardVisibilityChange?: (isVisible: boolean) => void;
}

/**
 * Valider le format du pseudo selon les règles strictes
 *
 * @param username - Le pseudo à valider
 * @returns true si le pseudo respecte le format requis
 *
 * Règles :
 * - Seulement des lettres (incluant les caractères Unicode)
 * - Pas de chiffres, pas de symboles (., -, _, etc.)
 * - Les caractères accentués sont autorisés (ø, é, à, ü, etc.)
 */
const validateUsernameFormat = (username: string): boolean => {
  // Regex pour n'accepter QUE des lettres Unicode (incluant les accents)
  // \p{L} = n'importe quelle lettre dans n'importe quel alphabet Unicode
  // Pas de \d (chiffres), pas de symboles
  const lettersOnlyRegex = /^[\p{L}]+$/u;
  return lettersOnlyRegex.test(username);
};

/**
 * Vérifier si le pseudo est disponible dans la base de données
 *
 * @param username - Le pseudo à vérifier
 * @returns true si le pseudo est disponible, false sinon
 */
const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      Logger.error('Error checking username availability:', error);
      return false;
    }

    // Si data est null, le pseudo est disponible
    return data === null;
  } catch (error) {
    Logger.error('Exception checking username availability:', error);
    return false;
  }
};

const UsernameStep: React.FC<UsernameStepProps> = ({
  gradient,
  onUsernameChange,
  onKeyboardVisibilityChange
}) => {
  const { t } = useTranslation();

  // États locaux pour gérer le pseudo et sa validation
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // États pour les règles de validation (mis à jour uniquement après vérification complète)
  const [validatedLength, setValidatedLength] = useState<boolean | null>(null);
  const [validatedFormat, setValidatedFormat] = useState<boolean | null>(null);

  // Valeurs partagées pour les animations
  const opacity = useSharedValue(0);
  const shakeTranslateX = useSharedValue(0);
  const headerOpacity = useSharedValue(1);
  const headerScale = useSharedValue(1);
  const contentTranslateY = useSharedValue(0);

  // Animation d'apparition initiale
  useEffect(() => {
    opacity.value = withDelay(200, withTiming(1, { duration: 600 }));
  }, []);

  // Gérer l'apparition/disparition du clavier avec animations fluides
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setIsKeyboardVisible(true);
        onKeyboardVisibilityChange?.(true);

        // Remonter tout le contenu en haut de l'écran au-dessus du clavier
        // On utilise une valeur importante pour bien positionner le contenu visible
        const moveUpDistance = Platform.OS === 'ios' ? -200 : -180;

        // Faire disparaître l'en-tête progressivement
        headerOpacity.value = withTiming(0, { duration: 300 });
        headerScale.value = withTiming(0.8, { duration: 300 });

        // Remonter tout le contenu vers le haut avec une animation fluide
        contentTranslateY.value = withTiming(moveUpDistance, { duration: 400 });
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        onKeyboardVisibilityChange?.(false);

        // Faire réapparaître l'en-tête
        headerOpacity.value = withTiming(1, { duration: 300 });
        headerScale.value = withTiming(1, { duration: 300 });

        // Ramener le contenu à sa position initiale
        contentTranslateY.value = withTiming(0, { duration: 400 });
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [onKeyboardVisibilityChange]);

  /**
   * Effet pour gérer la validation en temps réel du pseudo
   * S'exécute à chaque changement du champ username
   *
   * Utilise un debounce pour attendre que l'utilisateur arrête de taper
   * avant de lancer la vérification complète (format + disponibilité)
   */
  useEffect(() => {
    const trimmedUsername = username.trim();

    // Réinitialiser les états si le champ est vide
    if (!trimmedUsername) {
      setValidationError(null);
      setIsAvailable(null);
      setIsChecking(false);
      setValidatedLength(null);
      setValidatedFormat(null);
      onUsernameChange('', false);
      return;
    }

    // Réinitialiser uniquement les anciens résultats (pas le loader ni les règles visuelles)
    setValidationError(null);
    setIsAvailable(null);

    // Attendre que l'utilisateur arrête de taper avant de commencer la validation
    const timeoutId = setTimeout(async () => {
      // Vérifier que le username n'a pas changé pendant le debounce
      if (username.trim() !== trimmedUsername) {
        return;
      }

      // Afficher le loader maintenant que l'utilisateur a arrêté de taper
      setIsChecking(true);

      // ÉTAPE 1 : Vérifier la longueur (3 à 20 caractères)
      const lengthValid = trimmedUsername.length >= 3 && trimmedUsername.length <= 20;
      if (!lengthValid) {
        const errorMsg = trimmedUsername.length < 3
          ? t('onboarding.username.errors.tooShort')
          : t('onboarding.username.errors.tooLong');

        setValidationError(errorMsg);
        setIsAvailable(null);
        setIsChecking(false);
        setValidatedLength(false);
        setValidatedFormat(null);
        onUsernameChange(trimmedUsername, false);
        return;
      }

      // ÉTAPE 2 : Valider le format (uniquement des lettres)
      const formatValid = validateUsernameFormat(trimmedUsername);
      if (!formatValid) {
        setValidationError(t('onboarding.username.errors.invalidChars'));
        setIsAvailable(null);
        setIsChecking(false);
        setValidatedLength(true);
        setValidatedFormat(false);
        onUsernameChange(trimmedUsername, false);

        // Déclencher une animation de shake pour indiquer l'erreur visuellement
        shakeTranslateX.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        return;
      }

      // ÉTAPE 3 : Vérifier la disponibilité en base de données
      const available = await checkUsernameAvailability(trimmedUsername);

      // Vérifier une dernière fois que le username n'a pas changé pendant la requête
      if (username.trim() === trimmedUsername) {
        setIsChecking(false);
        setIsAvailable(available);
        setValidatedLength(true);
        setValidatedFormat(true);

        if (!available) {
          setValidationError(t('onboarding.username.errors.taken'));
          onUsernameChange(trimmedUsername, false);
        } else {
          onUsernameChange(trimmedUsername, true);
        }
      } else {
        setIsChecking(false);
      }
    }, 600); // Debounce de 600ms : le loader n'apparaît qu'après que l'utilisateur arrête de taper

    return () => {
      clearTimeout(timeoutId);
      setIsChecking(false);
    };
  }, [username, onUsernameChange, t]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const animatedShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeTranslateX.value }],
  }));

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  /**
   * Déterminer l'icône de statut à afficher à droite de l'input
   * Affiche un loader, une erreur ou une validation selon l'état actuel
   */
  const renderStatusIcon = () => {
    // Afficher un indicateur de chargement pendant la vérification en DB
    if (isChecking) {
      return <ActivityIndicator size="small" color="white" />;
    }

    // Afficher une icône d'erreur si la validation a échoué
    if (validationError) {
      return <AlertCircle size={20} color="#ef4444" strokeWidth={2} />;
    }

    // Afficher une icône de succès si le pseudo est valide et disponible
    if (isAvailable && username.trim().length >= 3) {
      return <CheckCircle2 size={20} color="#10b981" strokeWidth={2} />;
    }

    return null;
  };

  return (
    <Animated.View style={[animatedContentStyle, tw`items-center gap-8 flex-1`]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={tw`flex-1 w-full items-center gap-8`}>
          {/* En-tête - disparaît quand le clavier apparaît */}
          <Animated.View style={[animatedHeaderStyle, tw`items-center gap-3`]}>
            <Text style={tw`text-4xl font-black text-white text-center`}>
              {t('onboarding.username.title')}
            </Text>
            <Text style={tw`text-lg text-white/80 text-center leading-7 max-w-[320px]`}>
              {t('onboarding.username.subtitle')}
            </Text>
          </Animated.View>

      {/* Input du pseudo */}
      <Animated.View style={[animatedShakeStyle, tw`w-full max-w-[340px]`]}>
        <View
          style={[
            tw`flex-row items-center px-5 py-4 rounded-2xl`,
            { backgroundColor: 'rgba(255, 255, 255, 0.15)' }
          ]}
        >
          <User size={22} color="white" strokeWidth={2} style={tw`mr-3`} />

          <TextInput
            style={tw`flex-1 text-lg font-semibold text-white`}
            value={username}
            onChangeText={setUsername}
            placeholder={t('onboarding.username.placeholder')}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            maxLength={20}
          />

          {/* Afficher l'icône de statut à droite de l'input */}
          <View style={tw`ml-2`}>
            {renderStatusIcon()}
          </View>
        </View>

        {/* Afficher soit le message d'erreur, soit le compteur de caractères */}
        <View style={tw`mt-2 px-2`}>
          {validationError ? (
            <Text style={tw`text-sm text-red-400 font-medium`}>
              {validationError}
            </Text>
          ) : (
            <Text style={tw`text-sm text-white/60`}>
              {t('onboarding.username.characterCount', {
                count: username.trim().length,
                max: 20
              })}
            </Text>
          )}
        </View>
      </Animated.View>

          {/* Liste des règles de validation avec indicateurs visuels */}
          <View style={tw`gap-3 mt-2 w-full max-w-[340px]`}>
            <ValidationRule
              isValid={validatedLength === true}
              text={t('onboarding.username.rules.length')}
              delay={400}
            />
            <ValidationRule
              isValid={validatedFormat === true}
              text={t('onboarding.username.rules.lettersOnly')}
              delay={500}
            />
            <ValidationRule
              isValid={isAvailable === true}
              text={t('onboarding.username.rules.available')}
              delay={600}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

/**
 * Composant ValidationRule
 *
 * Affiche une règle de validation avec une icône et un texte
 * Change de couleur selon que la règle est respectée ou non
 */
interface ValidationRuleProps {
  isValid: boolean;
  text: string;
  delay: number;
}

const ValidationRule: React.FC<ValidationRuleProps> = ({ isValid, text, delay }) => {
  const opacity = useSharedValue(0);

  // Animation d'apparition progressive avec délai
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, tw`flex-row items-center gap-2`]}>
      {/* Cercle indicateur avec icône de validation si la règle est respectée */}
      <View
        style={[
          tw`w-5 h-5 rounded-full items-center justify-center`,
          {
            backgroundColor: isValid
              ? 'rgba(16, 185, 129, 0.3)'
              : 'rgba(255, 255, 255, 0.15)'
          }
        ]}
      >
        {isValid && <CheckCircle2 size={14} color="#10b981" strokeWidth={2.5} />}
      </View>
      {/* Texte de la règle, en vert si validée, en blanc transparent sinon */}
      <Text
        style={[
          tw`text-sm font-medium`,
          { color: isValid ? '#10b981' : 'rgba(255, 255, 255, 0.7)' }
        ]}
      >
        {text}
      </Text>
    </Animated.View>
  );
};

export default UsernameStep;
