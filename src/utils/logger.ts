// src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

let enabled = __DEV__; // valeur par défaut

class Logger {
  private static shouldLog(_level: LogLevel): boolean {
    return enabled;
  }

  /** À appeler une fois au boot (dans l'entry) */
  static configure(opts: { enabled: boolean }) {
    enabled = opts.enabled;

    // Silence total si désactivé (monkey-patch)
    if (!enabled) {
      (Logger as any).debug = () => {};
      (Logger as any).info = () => {};
      (Logger as any).warn = () => {};
      (Logger as any).error = () => {};
      (Logger as any).success = () => {};
    }
  }

  static debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) console.debug(`🔍 [DEBUG] ${message}`, ...args);
  }
  static info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) console.info(`ℹ️ [INFO] ${message}`, ...args);
  }
  static warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) console.warn(`⚠️ [WARN] ${message}`, ...args);
  }
  static error(message: string, error?: any) {
    if (this.shouldLog('error')) console.error(`❌ [ERROR] ${message}`, error);
  }
  static success(message: string, ...args: any[]) {
    if (this.shouldLog('info')) console.log(`✅ [SUCCESS] ${message}`, ...args);
  }
}

export default Logger;
