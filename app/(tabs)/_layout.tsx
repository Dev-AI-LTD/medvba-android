import { Tabs } from "expo-router";
import { Home, BookOpen, Users, MessageCircle, User } from "lucide-react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const { t, currentLanguage } = useLanguage();

  return (
    <Tabs
      key={`${colorScheme}-${currentLanguage}`}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.backgroundLight,
          borderTopColor: colors.glassBorder,
          borderTopWidth: 1,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} accessibilityLabel={t("tabs.homeIconA11y")} />
          ),
          tabBarAccessibilityLabel: t("tabs.home"),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: t("tabs.quiz"),
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} accessibilityLabel={t("tabs.quizIconA11y")} />
          ),
          tabBarAccessibilityLabel: t("tabs.quiz"),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: t("tabs.social"),
          tabBarIcon: ({ color, size }) => (
            <Users color={color} size={size} accessibilityLabel={t("tabs.socialIconA11y")} />
          ),
          tabBarAccessibilityLabel: t("tabs.social"),
        }}
      />
      <Tabs.Screen
        name="tutor"
        options={{
          title: t("tabs.tutor"),
          tabBarIcon: ({ color, size }) => (
            <MessageCircle
              color={color}
              size={size}
              strokeWidth={2}
              accessibilityLabel={t("tabs.tutorIconA11y")}
            />
          ),
          tabBarAccessibilityLabel: t("tabs.tutor"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} accessibilityLabel={t("tabs.profileIconA11y")} />
          ),
          tabBarAccessibilityLabel: t("tabs.profile"),
        }}
      />
    </Tabs>
  );
}
