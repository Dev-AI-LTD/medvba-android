import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, Redirect } from 'expo-router';
import { ChevronLeft, Download, AlertCircle, CheckCircle } from 'lucide-react-native';
import {
  batchTranslateQuestions,
  dedupeQuizPoolQuestions,
  generateTranslationFile,
  questionNeedsTargetLanguage,
  translateSpecificCategory,
  TranslationProgress,
  TranslationResult,
} from '@/lib/batch-translate';
import { allQuestions } from '@/lib/quizSessionQuestionPool';

export default function BatchTranslateScreen() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!__DEV__) {
    return <Redirect href="/(tabs)" />;
  }

  const pool = dedupeQuizPoolQuestions(allQuestions);
  const categories = Array.from(new Set(pool.map((q) => q.category)));

  const untranslatedCountES = pool.filter((q) => questionNeedsTargetLanguage(q, 'es')).length;
  const untranslatedCountPT = pool.filter((q) => questionNeedsTargetLanguage(q, 'pt')).length;
  const untranslatedCountRO = pool.filter((q) => questionNeedsTargetLanguage(q, 'ro')).length;

  const categoryStats = categories.map((cat) => ({
    name: cat,
    total: pool.filter((q) => q.category === cat).length,
    untranslatedES: pool.filter(
      (q) => q.category === cat && questionNeedsTargetLanguage(q, 'es'),
    ).length,
    untranslatedPT: pool.filter(
      (q) => q.category === cat && questionNeedsTargetLanguage(q, 'pt'),
    ).length,
    untranslatedRO: pool.filter(
      (q) => q.category === cat && questionNeedsTargetLanguage(q, 'ro'),
    ).length,
  }));

  const handleTranslateAll = async () => {
    setIsTranslating(true);
    setProgress(null);
    setResult(null);

    try {
      const translations = await batchTranslateQuestions(['es', 'pt'], (p) => setProgress(p));
      setResult(translations);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateAllRo = async () => {
    setIsTranslating(true);
    setProgress(null);
    setResult(null);

    try {
      const translations = await batchTranslateQuestions(['ro'], (p) => setProgress(p));
      setResult(translations);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateCategory = async (category: string) => {
    setIsTranslating(true);
    setProgress(null);
    setResult(null);
    setSelectedCategory(category);

    const stats = categoryStats.find((c) => c.name === category);
    const langs: ('ro' | 'es' | 'pt')[] = [];
    if (stats && (stats.untranslatedES > 0 || stats.untranslatedPT > 0)) {
      langs.push('es', 'pt');
    }
    if (stats && stats.untranslatedRO > 0) {
      langs.push('ro');
    }

    try {
      if (langs.length === 0) return;
      const translations = await translateSpecificCategory(category, langs, (p) => setProgress(p));
      setResult(translations);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
      setSelectedCategory(null);
    }
  };

  const handleDownload = async () => {
    if (!result) return;

    const fileContent = generateTranslationFile(result);

    if (Platform.OS === 'web') {
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questionTranslations.ts';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      try {
        await Share.share({
          message: fileContent,
          title: 'Question Translations',
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Batch Translation',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ChevronLeft size={24} color="#333" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Translation status (quiz pool)</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total questions (deduped):</Text>
            <Text style={styles.statsValue}>{pool.length}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Romanian incomplete:</Text>
            <Text style={styles.statsValueWarning}>{untranslatedCountRO}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Spanish missing:</Text>
            <Text style={styles.statsValueWarning}>{untranslatedCountES}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Portuguese missing:</Text>
            <Text style={styles.statsValueWarning}>{untranslatedCountPT}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (isTranslating || (untranslatedCountRO === 0)) && styles.buttonDisabled,
          ]}
          onPress={handleTranslateAllRo}
          disabled={isTranslating || untranslatedCountRO === 0}
        >
          {isTranslating && !selectedCategory ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Download size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Translate all missing RO</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (isTranslating || (untranslatedCountES === 0 && untranslatedCountPT === 0)) &&
              styles.buttonDisabled,
            { marginTop: 10, backgroundColor: '#5a6570' },
          ]}
          onPress={handleTranslateAll}
          disabled={isTranslating || (untranslatedCountES === 0 && untranslatedCountPT === 0)}
        >
          <>
            <Download size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Translate all ES / PT</Text>
          </>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Translate by Category</Text>

        {categoryStats.map((cat) => (
          <TouchableOpacity
            key={cat.name}
            style={[
              styles.categoryCard,
              cat.untranslatedES === 0 &&
                cat.untranslatedPT === 0 &&
                cat.untranslatedRO === 0 &&
                styles.categoryCardComplete,
              isTranslating && styles.buttonDisabled,
            ]}
            onPress={() => handleTranslateCategory(cat.name)}
            disabled={
              isTranslating ||
              (cat.untranslatedES === 0 &&
                cat.untranslatedPT === 0 &&
                cat.untranslatedRO === 0)
            }
          >
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>{cat.name}</Text>
              {cat.untranslatedES === 0 &&
                cat.untranslatedPT === 0 &&
                cat.untranslatedRO === 0 && (
                <CheckCircle size={20} color="#4CAF50" />
              )}
            </View>
            <View style={styles.categoryStats}>
              <Text style={styles.categoryStatsText}>Total: {cat.total}</Text>
              <Text style={styles.categoryStatsText}>
                RO: {cat.untranslatedRO} | ES: {cat.untranslatedES} | PT: {cat.untranslatedPT}
              </Text>
            </View>
            {isTranslating && selectedCategory === cat.name && (
              <ActivityIndicator color="#007AFF" style={styles.categoryLoader} />
            )}
          </TouchableOpacity>
        ))}

        {progress && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Translation Progress</Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${(progress.completed / progress.total) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress.completed} / {progress.total} questions
            </Text>
            <Text style={styles.progressStatus}>{progress.current}</Text>
            {progress.errors.length > 0 && (
              <View style={styles.errorsContainer}>
                <AlertCircle size={16} color="#F44336" />
                <Text style={styles.errorsTitle}>
                  {progress.errors.length} error(s)
                </Text>
              </View>
            )}
          </View>
        )}

        {result && (
          <View style={styles.resultCard}>
            <CheckCircle size={32} color="#4CAF50" />
            <Text style={styles.resultTitle}>Translation Complete!</Text>
            <Text style={styles.resultText}>
              Successfully translated questions
            </Text>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownload}
            >
              <Download size={20} color="#007AFF" />
              <Text style={styles.downloadButtonText}>
                Download Translation File
              </Text>
            </TouchableOpacity>
            <Text style={styles.resultNote}>
              Copy this file to locales/questionTranslations.ts
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statsValueSuccess: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  statsValueWarning: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryCardComplete: {
    backgroundColor: '#F1F8F4',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryStats: {
    flexDirection: 'row',
    gap: 16,
  },
  categoryStatsText: {
    fontSize: 14,
    color: '#666',
  },
  categoryLoader: {
    marginTop: 8,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  progressStatus: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  errorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  errorsTitle: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  downloadButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  downloadButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
  },
});
