// src/screens/DiagnosticScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { HealthCheckService } from '@/utils/healthCheck';
import { useAuth } from '@/context/AuthContext';
import Logger from '@/utils/logger';

export default function DiagnosticScreen() {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const runHealthCheck = async () => {
    if (!user?.id) return;

    setLoading(true);
    setResults([]);
    setTestResult(null);

    try {
      const diagnosticResults = await HealthCheckService.runFullDiagnostic(user.id);
      setResults(diagnosticResults);
    } catch (error) {
      Logger.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const testDailyChallenge = async () => {
    if (!user?.id) return;

    setLoading(true);
    setTestResult(null);

    try {
      const result = await HealthCheckService.testDailyChallengeCollection(user.id);
      setTestResult(result);
    } catch (error) {
      Logger.error('Test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '❓';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>System Diagnostics</Text>
          <Text style={styles.subtitle}>Check the health of your app's services</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={runHealthCheck} disabled={loading || !user} style={[styles.button, styles.primaryButton, (loading || !user) && styles.buttonDisabled]}>
            <Text style={styles.buttonText}>{loading ? 'Running...' : '🏥 Run Full Health Check'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={testDailyChallenge} disabled={loading || !user} style={[styles.button, styles.secondaryButton, (loading || !user) && styles.buttonDisabled]}>
            <Text style={styles.buttonText}>{loading ? 'Testing...' : '🧪 Test Daily Challenge Collection'}</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Running diagnostics...</Text>
          </View>
        )}

        {/* Health Check Results */}
        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>📊 Health Check Results</Text>

            {results.map((result, index) => (
              <View key={index} style={[styles.resultCard, { borderLeftColor: getStatusColor(result.status) }]}>
                <View style={styles.resultHeader}>
                  <Text style={styles.statusIcon}>{getStatusIcon(result.status)}</Text>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultCategory}>{result.category}</Text>
                    <Text style={styles.resultMessage}>{result.message}</Text>
                  </View>
                </View>

                {result.details && (
                  <View style={styles.detailsContainer}>
                    <Text style={styles.detailsText}>{JSON.stringify(result.details, null, 2)}</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryStats}>
                <View style={styles.statBadge}>
                  <Text style={styles.statTextGreen}>✅ {results.filter((r) => r.status === 'ok').length} OK</Text>
                </View>
                <View style={styles.statBadge}>
                  <Text style={styles.statTextYellow}>⚠️ {results.filter((r) => r.status === 'warning').length} Warnings</Text>
                </View>
                <View style={styles.statBadge}>
                  <Text style={styles.statTextRed}>❌ {results.filter((r) => r.status === 'error').length} Errors</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Test Result */}
        {testResult && (
          <View style={styles.testResultContainer}>
            <Text style={styles.sectionTitle}>🧪 Daily Challenge Test Result</Text>

            <View style={[styles.testResultCard, testResult.success ? styles.testResultSuccess : styles.testResultError]}>
              <Text style={styles.testResultIcon}>{testResult.success ? '✅' : '❌'}</Text>
              <Text style={[styles.testResultMessage, testResult.success ? styles.testResultTextSuccess : styles.testResultTextError]}>{testResult.message}</Text>

              {testResult.details && (
                <View style={styles.testDetailsContainer}>
                  <Text style={styles.testDetailsTitle}>Details:</Text>
                  <Text style={styles.testDetailsText}>{JSON.stringify(testResult.details, null, 2)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* User Info */}
        {user && (
          <View style={styles.userInfoContainer}>
            <Text style={styles.userInfoTitle}>User Info</Text>
            <Text style={styles.userInfoId}>ID: {user.id.slice(0, 20)}...</Text>
            <Text style={styles.userInfoEmail}>Email: {user.email}</Text>
          </View>
        )}

        {!user && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningTitle}>⚠️ Not logged in</Text>
            <Text style={styles.warningText}>Please log in to run diagnostics</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  buttonsContainer: {
    marginBottom: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    backgroundColor: '#7c3aed',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: '#6b7280',
    marginTop: 16,
  },
  resultsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultCategory: {
    fontWeight: '600',
    color: '#111827',
    fontSize: 16,
    marginBottom: 4,
  },
  resultMessage: {
    color: '#6b7280',
    fontSize: 14,
  },
  detailsContainer: {
    marginTop: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  detailsText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#374151',
  },
  summaryContainer: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  summaryTitle: {
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  summaryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  statTextGreen: {
    color: '#15803d',
    fontWeight: '600',
  },
  statTextYellow: {
    color: '#a16207',
    fontWeight: '600',
  },
  statTextRed: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  testResultContainer: {
    marginBottom: 24,
  },
  testResultCard: {
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
  },
  testResultSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  testResultError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  testResultIcon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 12,
  },
  testResultMessage: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  testResultTextSuccess: {
    color: '#14532d',
  },
  testResultTextError: {
    color: '#7f1d1d',
  },
  testDetailsContainer: {
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  testDetailsTitle: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  testDetailsText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#374151',
  },
  userInfoContainer: {
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  userInfoTitle: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  userInfoId: {
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  userInfoEmail: {
    color: '#6b7280',
    fontSize: 14,
  },
  warningContainer: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 16,
  },
  warningTitle: {
    color: '#78350f',
    fontWeight: '600',
  },
  warningText: {
    color: '#92400e',
    marginTop: 4,
  },
});
