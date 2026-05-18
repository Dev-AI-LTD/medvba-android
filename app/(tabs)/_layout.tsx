import { Tabs } from "expo-router";
import { Home, BookOpen, MessagesSquare, MessageCircle, User } from "lucide-react-native";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { AppOfflineBanner } from "@/components/AppOfflineBanner";
import { iconXl, space, touchTargetMin } from "@/theme/iosDesign";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const { t, currentLanguage } = useLanguage();

  return (
    <View style={{ flex: 1 }}>
      <AppOfflineBanner />
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
          paddingTop: space.space2,
          minHeight: touchTargetMin + space.space2 + insets.bottom,
        },
        tabBarItemStyle: {
          paddingVertical: space.space1,
          minHeight: touchTargetMin,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
        },
        tabBarIconStyle: {
          marginBottom: space.space1,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color }) => (
            <Home color={color} size={iconXl} accessibilityLabel={t("tabs.homeIconA11y")} />
          ),
          tabBarAccessibilityLabel: t("tabs.home"),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: t("tabs.quiz"),
          tabBarIcon: ({ color }) => (
            <BookOpen color={color} size={iconXl} accessibilityLabel={t("tabs.quizIconA11y")} />
          ),
          tabBarAccessibilityLabel: t("tabs.quiz"),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: t("tabs.social"),
          tabBarIcon: ({ color }) => (
            <MessagesSquare color={color} size={iconXl} accessibilityLabel={t("tabs.socialIconA11y")} />
          ),
          tabBarAccessibilityLabel: t("tabs.social"),
        }}
      />
      <Tabs.Screen
        name="tutor"
        options={{
          title: t("tabs.tutor"),
          tabBarIcon: ({ color }) => (
            <MessageCircle
              color={color}
              size={iconXl}
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
          tabBarIcon: ({ color }) => (
            <User color={color} size={iconXl} accessibilityLabel={t("tabs.profileIconA11y")} />
          ),
          tabBarAccessibilityLabel: t("tabs.profile"),
        }}
      />
    </Tabs>
    </View>
  );
}
