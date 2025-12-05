/**
 * useNetworkStatus.ts
 *
 * Hook pour surveiller l'état de la connexion réseau
 * Utilise @react-native-community/netinfo
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

export interface NetworkStatus {
  /** true si connecté à un réseau (wifi, cellular, etc.) */
  isConnected: boolean;
  /** true si internet est accessible (pas seulement connecté au réseau) */
  isInternetReachable: boolean | null;
  /** Type de connexion (wifi, cellular, none, etc.) */
  connectionType: NetInfoStateType;
  /** true si on a un problème de connexion */
  hasConnectionIssue: boolean;
}

/**
 * Hook pour surveiller l'état de la connexion réseau
 * @returns NetworkStatus avec isConnected, isInternetReachable, connectionType, hasConnectionIssue
 */
export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    connectionType: NetInfoStateType.unknown,
    hasConnectionIssue: false,
  });

  const handleNetworkChange = useCallback((state: NetInfoState) => {
    const isConnected = state.isConnected ?? false;
    const isInternetReachable = state.isInternetReachable;

    setNetworkStatus({
      isConnected,
      isInternetReachable,
      connectionType: state.type,
      // Problème si pas connecté OU si internet n'est pas accessible
      hasConnectionIssue: !isConnected || isInternetReachable === false,
    });
  }, []);

  useEffect(() => {
    // Récupérer l'état initial
    NetInfo.fetch().then(handleNetworkChange);

    // S'abonner aux changements
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      unsubscribe();
    };
  }, [handleNetworkChange]);

  return networkStatus;
}

/**
 * Vérifie une seule fois l'état de la connexion
 * @returns Promise<NetworkStatus>
 */
export async function checkNetworkStatus(): Promise<NetworkStatus> {
  const state = await NetInfo.fetch();
  const isConnected = state.isConnected ?? false;
  const isInternetReachable = state.isInternetReachable;

  return {
    isConnected,
    isInternetReachable,
    connectionType: state.type,
    hasConnectionIssue: !isConnected || isInternetReachable === false,
  };
}
