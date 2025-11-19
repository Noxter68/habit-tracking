/**
 * @file logger.ts
 * @description Service de logging centralisé pour l'application.
 * Permet de contrôler les logs en développement et de les désactiver en production.
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Niveaux de log disponibles.
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** État d'activation du logger (activé par défaut en dev) */
let enabled = __DEV__;

// =============================================================================
// CLASSE LOGGER
// =============================================================================

/**
 * Service de logging centralisé.
 * Permet de logger des messages avec différents niveaux de sévérité.
 *
 * @example
 * // Configuration au démarrage
 * Logger.configure({ enabled: __DEV__ });
 *
 * // Utilisation
 * Logger.debug('Variable:', myVar);
 * Logger.info('Application démarrée');
 * Logger.warn('Attention: limite atteinte');
 * Logger.error('Erreur critique', error);
 * Logger.success('Opération réussie');
 */
class Logger {
  /**
   * Vérifie si le logger doit afficher les messages.
   *
   * @param _level - Niveau de log (non utilisé actuellement)
   * @returns true si le logging est activé
   */
  private static shouldLog(_level: LogLevel): boolean {
    return enabled;
  }

  /**
   * Configure le logger.
   * Doit être appelé une fois au démarrage de l'application.
   *
   * @param opts - Options de configuration
   * @param opts.enabled - Active ou désactive le logging
   *
   * @example
   * // Dans App.tsx ou l'entry point
   * Logger.configure({ enabled: __DEV__ });
   */
  static configure(opts: { enabled: boolean }): void {
    enabled = opts.enabled;

    // Silence total si désactivé (monkey-patch pour les performances)
    if (!enabled) {
      (Logger as any).debug = () => {};
      (Logger as any).info = () => {};
      (Logger as any).warn = () => {};
      (Logger as any).error = () => {};
      (Logger as any).success = () => {};
    }
  }

  /**
   * Log de debug pour le développement.
   *
   * @param message - Message principal
   * @param args - Arguments additionnels à afficher
   */
  static debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log d'information générale.
   *
   * @param message - Message principal
   * @param args - Arguments additionnels à afficher
   */
  static info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log d'avertissement.
   *
   * @param message - Message principal
   * @param args - Arguments additionnels à afficher
   */
  static warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Log d'erreur.
   *
   * @param message - Message principal
   * @param error - Objet erreur optionnel
   */
  static error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error);
    }
  }

  /**
   * Log de succès (utilise le niveau info).
   *
   * @param message - Message principal
   * @param args - Arguments additionnels à afficher
   */
  static success(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(`[SUCCESS] ${message}`, ...args);
    }
  }
}

export default Logger;
