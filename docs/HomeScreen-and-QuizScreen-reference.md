# HomeScreen + QuizScreen – referință lipită

Acest fișier conține codul complet din `app/(tabs)/index.tsx` (HomeScreen) și `app/(tabs)/quiz.tsx` (QuizScreen), doar pentru referință. Aplicația folosește în continuare fișierele originale din `app/(tabs)/`.

---

## 1. HomeScreen (`app/(tabs)/index.tsx`)

```tsx
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, TrendingUp, Target, Clock, ChevronRight, Bone, Heart, User, Brain, Stethoscope, Sparkles, Lock, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Card, Button } from 'react-native-paper';
import { UIButton } from '@/ui';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import ProgressRing from '@/components/ProgressRing';
import PremiumBadge from '@/components/PremiumBadge';
import { categories } from '@/mocks/questions';
import { useQuizProgress } from '@/providers/QuizProgressProvider';
import { FREE_QUIZ_ANSWER_LIMIT } from '@/constants/subscription';
import { SPACING } from '@/theme/paperTheme';

export default function HomeScreen() {
  const router = useRouter();
  const { t, getModuleName } = useLanguage();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { isPremium, isPaywallEnabled } = useSubscription();
  const { dailyProgress, hasActiveSession, sessionState, lastSessionInfo, accuracy, formattedQuestionsCount, formattedStudyTime } = useQuizProgress();
  // ... (restul logicii – vezi fișierul original pentru cod complet)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header, hero card, stats, progress, category list */}
    </View>
  );
}

const styles = StyleSheet.create({ /* ... */ });
```

**Locație reală:** `app/(tabs)/index.tsx`

---

## 2. QuizScreen (`app/(tabs)/quiz.tsx`)

```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bone, Heart, User, Brain, Stethoscope,
  Clock, Zap, Trophy, ChevronRight, Crown, Lock
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import GlassCard from '@/components/GlassCard';
import { categories } from '@/mocks/questions';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useQuizProgress } from '@/providers/QuizProgressProvider';

const categoryIcons: Record<string, React.ComponentType<{ color: string; size: number }>> = {
  'upper-lower-limbs': Bone,
  'internal-organs': Heart,
  'head-neck': User,
  'neuroanatomy': Brain,
  'med-admission-barrons': Stethoscope,
};

type QuizMode = 'practice' | 'exam' | 'quick';

export default function QuizScreen() {
  const router = useRouter();
  const { t, getModuleName } = useLanguage();
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { isPremium, isPaywallEnabled, canStartQuiz, incrementQuizCount, getRemainingQuizzes, FREE_QUIZ_LIMIT } = useSubscription();
  const { hasActiveSession, sessionState, clearSessionState } = useQuizProgress();
  // ... (restul logicii – vezi fișierul original)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header, free limit banner, quiz modes (Quick / Practice / Exam), categories grid, stats card */}
    </View>
  );
}

const styles = StyleSheet.create({ /* ... */ });
```

**Locație reală:** `app/(tabs)/quiz.tsx`

---

## Rezumat

| Componentă   | Fișier              | Tab / rută   |
|-------------|---------------------|--------------|
| HomeScreen  | `app/(tabs)/index.tsx` | Tab Acasă   |
| QuizScreen  | `app/(tabs)/quiz.tsx`  | Tab Quiz    |

Ambele sunt încărcate prin `app/(tabs)/_layout.tsx` ca tab-uri. Pentru codul complet (inclusiv JSX și `StyleSheet`), deschide direct fișierele de mai sus.
