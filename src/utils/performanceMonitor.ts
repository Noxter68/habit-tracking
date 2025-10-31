import { useRef, useEffect, useCallback } from 'react';
import Logger from './logger';

/**
 * Performance monitoring utility that detects and reports optimization issues
 */
export class PerformanceMonitor {
  private static renderCounts = new Map<string, number>();
  private static renderTimes = new Map<string, number[]>();
  private static effectRuns = new Map<string, number>();
  private static warnings = new Set<string>();

  /**
   * Track component renders
   */
  static trackRender(componentName: string) {
    const count = (this.renderCounts.get(componentName) || 0) + 1;
    this.renderCounts.set(componentName, count);

    // Warn if component renders too frequently
    if (count > 10 && count % 10 === 0) {
      const warning = `⚠️ ${componentName} has rendered ${count} times - possible performance issue`;
      if (!this.warnings.has(warning)) {
        Logger.warn(warning);
        this.warnings.add(warning);
      }
    }
  }

  /**
   * Track effect executions
   */
  static trackEffect(effectName: string) {
    const count = (this.effectRuns.get(effectName) || 0) + 1;
    this.effectRuns.set(effectName, count);

    // Warn if effect runs too often
    if (count > 5 && count % 5 === 0) {
      Logger.warn(`⚠️ Effect "${effectName}" has run ${count} times - check dependencies`);
    }
  }

  /**
   * Track async operation time
   */
  static async trackAsync<T>(operationName: string, operation: () => Promise<T>, warningThreshold = 1000): Promise<T> {
    const start = performance.now();

    try {
      const result = await operation();
      const duration = performance.now() - start;

      // Store timing
      const times = this.renderTimes.get(operationName) || [];
      times.push(duration);
      if (times.length > 10) times.shift(); // Keep last 10
      this.renderTimes.set(operationName, times);

      // Warn if slow
      if (duration > warningThreshold) {
        Logger.warn(`🐌 Slow operation: ${operationName} took ${duration.toFixed(0)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      Logger.error(`❌ ${operationName} failed after ${duration.toFixed(0)}ms:`, error);
      throw error;
    }
  }

  /**
   * Get performance report
   */
  static getReport() {
    const report = {
      renders: Object.fromEntries(this.renderCounts),
      effects: Object.fromEntries(this.effectRuns),
      avgTimes: Object.fromEntries(Array.from(this.renderTimes.entries()).map(([key, times]) => [key, times.reduce((a, b) => a + b, 0) / times.length])),
    };

    console.table(report);
    return report;
  }

  /**
   * Reset all tracking
   */
  static reset() {
    this.renderCounts.clear();
    this.renderTimes.clear();
    this.effectRuns.clear();
    this.warnings.clear();
  }
}

/**
 * Hook to track component performance
 */
export const usePerformanceTracking = (componentName: string) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    PerformanceMonitor.trackRender(componentName);

    if (renderCount.current > 50) {
      Logger.error(`🔥 ${componentName} rendered ${renderCount.current} times - CRITICAL PERFORMANCE ISSUE`);
    }
  });

  return {
    trackEffect: (name: string) => PerformanceMonitor.trackEffect(`${componentName}.${name}`),
    trackAsync: <T>(name: string, fn: () => Promise<T>) => PerformanceMonitor.trackAsync(`${componentName}.${name}`, fn),
  };
};

/**
 * Hook to detect infinite loops in useEffect
 */
export const useLoopDetector = (effectName: string, dependencies: any[]) => {
  const runCount = useRef(0);
  const lastDeps = useRef<any[]>();
  const timer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    runCount.current++;

    // Reset counter after 1 second of no runs
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      runCount.current = 0;
    }, 1000);

    // Detect rapid re-runs
    if (runCount.current > 10) {
      Logger.error(`🚨 INFINITE LOOP DETECTED in ${effectName}!`);
      Logger.error('Dependencies:', dependencies);
      Logger.error('Previous deps:', lastDeps.current);

      // Find which dependency changed
      if (lastDeps.current) {
        dependencies.forEach((dep, i) => {
          if (dep !== lastDeps.current![i]) {
            Logger.error(`  Changed: [${i}]`, lastDeps.current![i], '→', dep);
          }
        });
      }
    }

    lastDeps.current = [...dependencies];

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, dependencies);
};
