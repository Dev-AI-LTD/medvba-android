import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { 
  Users, 
  Radio, 
  MessageCircle,
  Flame,
  Trophy,
  BookOpen,
  Star,
  Target,
  Calendar,
  Clock,
  X,
  Plus,
  MoreVertical,
  Ban,
  Flag,
  AlertTriangle,
  CheckCircle,
  User,
  EyeOff,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { TOUCH_TARGET_MIN } from '@/theme/paperTheme';
import { OfflineFeatureNotice } from '@/components/OfflineFeatureNotice';
import GlassCard from '@/components/GlassCard';
import RoomChat from '@/components/RoomChat';
import OnlineIndicator from '@/components/OnlineIndicator';
import {
  useStudyRooms,
  useCreateStudyRoom,
  useUpcomingSessions,
  useCreateSession,
  StudyRoom,
  StudySession,
  useAllRecentAchievements,
  RecentAchievementWithUser,
  AchievementType,
  useOnlineFriends,
  useFriendActivity,
  useActivityFeed,
} from '@/lib/supabase-hooks';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/providers/LanguageProvider';
import {
  loadBlockedUsersFromStorage,
  addBlockedUserEntry,
  type BlockedUser,
} from '@/lib/blocked-users-storage';
import { safeAvatarUri } from '@/lib/safe-image-uri';

const USER_REPORTS_KEY = '@medvba_user_reports';

interface UserReport {
  id: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: string;
  details?: string;
  reportedAt: string;
}

const getReportReasons = (t: (key: string) => string) => [
  { id: 'harassment', label: t('social.reportReasons.harassment'), icon: AlertTriangle },
  { id: 'inappropriate', label: t('social.reportReasons.inappropriate'), icon: Ban },
  { id: 'spam', label: t('social.reportReasons.spam'), icon: Flag },
  { id: 'other', label: t('social.reportReasons.other'), icon: Flag },
];

const activityIcons: Record<string, React.ComponentType<{ color: string; size: number }>> = {
  achievement: Trophy,
  streak: Flame,
  quiz_complete: BookOpen,
  exam_passed: Star,
  study_room: Users,
  milestone: Target,
  started_chat: MessageCircle,
  joined_room: Users,
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const formatCountdown = (scheduledFor: string): string => {
  const now = new Date();
  const scheduled = new Date(scheduledFor);
  const diff = scheduled.getTime() - now.getTime();
  
  if (diff <= 0) return 'Starting now';
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `in ${days}d ${hours % 24}h`;
  if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
  return `in ${minutes}m`;
};

const formatSessionTime = (scheduledFor: string): string => {
  const date = new Date(scheduledFor);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (date.toDateString() === today.toDateString()) {
    return `Today, ${timeStr}`;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${timeStr}`;
  }
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
};



export default function SocialScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t, getModuleName } = useLanguage();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [refreshing, setRefreshing] = useState(false);
  const [reactedActivities, setReactedActivities] = useState<Record<string, string>>({});
  const [localRoomUpdates, setLocalRoomUpdates] = useState<Record<string, Partial<StudyRoom>>>({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionDuration, setSessionDuration] = useState('60');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [, forceUpdate] = useState(0);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState('upper-lower-limbs');
  const [newRoomMaxParticipants, setNewRoomMaxParticipants] = useState('10');
  
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [showUserActionsModal, setShowUserActionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatRoom, setSelectedChatRoom] = useState<StudyRoom | null>(null);

  const loadBlockedUsers = useCallback(async () => {
    try {
      const list = await loadBlockedUsersFromStorage();
      setBlockedUsers(list);
    } catch (error) {
      console.error('Failed to load blocked users:', error);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    void loadBlockedUsers();
  }, [loadBlockedUsers]);

  useFocusEffect(
    useCallback(() => {
      void loadBlockedUsers();
    }, [loadBlockedUsers])
  );

  const handleBlockUser = (user: { id: string; name: string; avatar: string }) => {
    Alert.alert(
      t('social.blockUserTitle'),
      t('social.blockConfirmMessage').replace('{name}', user.name),
      [
        { text: t('social.cancel'), style: 'cancel' },
        {
          text: t('social.blockUser'),
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            try {
              const next = await addBlockedUserEntry({
                id: user.id,
                name: user.name,
                avatar: user.avatar,
              });
              setBlockedUsers(next);
            } catch (e) {
              console.error('Failed to block user:', e);
            }
            setShowUserActionsModal(false);
            setSelectedUser(null);
          },
        },
      ]
    );
  };

  const handleOpenReportModal = () => {
    setShowUserActionsModal(false);
    setSelectedReportReason('');
    setReportDetails('');
    setReportSubmitted(false);
    setTimeout(() => setShowReportModal(true), 300);
  };

  const handleSubmitReport = async () => {
    if (!selectedUser || !selectedReportReason) {
      Alert.alert(t('social.missingInfo'), t('social.selectReasonMessage'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const report: UserReport = {
      id: Date.now().toString(),
      reportedUserId: selectedUser.id,
      reportedUserName: selectedUser.name,
      reason: selectedReportReason,
      details: reportDetails || undefined,
      reportedAt: new Date().toISOString(),
    };

    try {
      const stored = await AsyncStorage.getItem(USER_REPORTS_KEY);
      const reports: UserReport[] = stored ? JSON.parse(stored) : [];
      reports.push(report);
      await AsyncStorage.setItem(USER_REPORTS_KEY, JSON.stringify(reports));

      // Sync report to backend
      await supabase.from('user_reports').insert({
        id: report.id,
        reporter_id: user?.id,
        reported_user_id: report.reportedUserId,
        reported_user_name: report.reportedUserName,
        reason: report.reason,
        details: report.details ?? null,
        reported_at: report.reportedAt,
      });
    } catch (error) {
      console.error('Failed to save report:', error);
    }

    setReportSubmitted(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setSelectedUser(null);
    setSelectedReportReason('');
    setReportDetails('');
    setReportSubmitted(false);
  };

  const handleOpenUserActions = (targetUser: { id: string; name: string; avatar: string }) => {
    if (targetUser.id === user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedUser(targetUser);
    setShowUserActionsModal(true);
  };

  const isUserBlocked = (userId: string) => blockedUsers.some(u => u.id === userId);

  useEffect(() => {
    if (!selectedChatRoom) return;
    if (blockedUsers.some((u) => u.id === selectedChatRoom.hostId)) {
      setShowChatModal(false);
      setSelectedChatRoom(null);
    }
  }, [blockedUsers, selectedChatRoom]);

  const isProfilePublic = profile?.isPublic !== false;

  const studyRoomsQuery = useStudyRooms();
  const upcomingSessionsQuery = useUpcomingSessions();
  const recentAchievementsQuery = useAllRecentAchievements(15);
  const presenceUserId = isProfilePublic ? user?.id : undefined;
  const onlineFriendsQuery = useOnlineFriends(presenceUserId);
  const friendActivityQuery = useFriendActivity(presenceUserId, 10);
  const activityFeedQuery = useActivityFeed(user?.id, 20);

  const studyRooms: StudyRoom[] = (studyRoomsQuery.data ?? []).map((room: any) => ({
    ...room,
    host: room.host,
    ...localRoomUpdates[room.id],
  }));

  const createSessionMutation = useCreateSession();

  const handleCreateSessionSuccess = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowScheduleModal(false);
    resetScheduleForm();
    upcomingSessionsQuery.refetch();
  }, [upcomingSessionsQuery]);

  const handleCreateSessionError = useCallback((error: any) => {
    console.error('Failed to create session:', error);
    Alert.alert(t('social.errorTitle'), t('social.scheduleError'));
  }, [t]);



  const createRoomMutation = useCreateStudyRoom();

  const handleCreateRoomSuccess = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowCreateRoomModal(false);
    resetCreateRoomForm();
    studyRoomsQuery.refetch();
  }, [studyRoomsQuery]);

  const handleCreateRoomError = useCallback((error: any) => {
    console.error('Failed to create study room:', error);
    Alert.alert(t('social.errorTitle'), t('social.createRoomError'));
  }, [t]);

  const resetCreateRoomForm = () => {
    setNewRoomName('');
    setNewRoomCategory('upper-lower-limbs');
    setNewRoomMaxParticipants('10');
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) {
      Alert.alert(t('social.missingInfo'), t('social.roomNameRequiredAlert'));
      return;
    }

    const maxParts = parseInt(newRoomMaxParticipants, 10);
    if (maxParts > 10) {
      Alert.alert(t('social.errorTitle'), t('social.maxParticipantsExceed'));
      return;
    }

    createRoomMutation.mutate(
      {
      name: newRoomName.trim(),
      hostId: user?.id || '',
      hostName: profile?.name || t('common.you'),
      hostAvatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.id}`,
      category: newRoomCategory,
        maxParticipants: maxParts,
      },
      {
        onSuccess: handleCreateRoomSuccess,
        onError: handleCreateRoomError,
      }
    );
  };

  const resetScheduleForm = () => {
    setSessionTitle('');
    setSessionDescription('');
    setSessionDuration('60');
    setSessionDate('');
    setSessionTime('');
    setMeetingUrl('');
    setSelectedRoom(null);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setLocalRoomUpdates({});
    Promise.all([
      studyRoomsQuery.refetch(),
      upcomingSessionsQuery.refetch(),
      recentAchievementsQuery.refetch(),
      onlineFriendsQuery.refetch(),
      friendActivityQuery.refetch(),
      activityFeedQuery.refetch(),
      loadBlockedUsers(),
    ]).finally(() => setRefreshing(false));
  }, [studyRoomsQuery, upcomingSessionsQuery, recentAchievementsQuery, onlineFriendsQuery, friendActivityQuery, activityFeedQuery, loadBlockedUsers]);

  const handleReaction = (activityId: string, emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReactedActivities(prev => ({
      ...prev,
      [activityId]: prev[activityId] === emoji ? '' : emoji
    }));
  };

  const handleScheduleSession = (room: StudyRoom) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRoom(room);
    setSessionTitle(`${room.name} Session`);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSessionDate(tomorrow.toISOString().split('T')[0]);
    setSessionTime('18:00');
    setShowScheduleModal(true);
  };

  const handleCreateSession = () => {
    if (!selectedRoom || !sessionTitle || !sessionDate || !sessionTime) {
      Alert.alert(t('social.missingInfo'), t('social.fillAllFields'));
      return;
    }

    const scheduledFor = new Date(`${sessionDate}T${sessionTime}:00`).toISOString();
    
    createSessionMutation.mutate(
      {
      roomId: selectedRoom.id,
      title: sessionTitle,
      description: sessionDescription || undefined,
      scheduledFor,
      durationMinutes: parseInt(sessionDuration, 10),
      hostId: user?.id || '',
      hostName: profile?.name || t('common.you'),
      hostAvatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.id}`,
        category: selectedRoom.category,
        meetingUrl: meetingUrl.trim() || undefined,
      },
      {
        onSuccess: handleCreateSessionSuccess,
        onError: handleCreateSessionError,
      }
    );
  };

  const isCurrentUserHost = (room: StudyRoom) => room.hostId === user?.id;
  const isSessionHost = (session: StudySession) => session.hostId === user?.id;

  const upcomingSessions: StudySession[] = upcomingSessionsQuery.data ?? [];
  const recentAchievements: RecentAchievementWithUser[] = recentAchievementsQuery.data ?? [];
  const onlineFriends = onlineFriendsQuery.data ?? [];
  const friendActivity = friendActivityQuery.data ?? [];
  const activityFeed = activityFeedQuery.data ?? [];

  const getAchievementTitle = (type: AchievementType): string => {
    const titles: Record<AchievementType, string> = {
      first_quiz: t('achievement.firstQuiz'),
      quiz_master: t('achievement.quizMaster'),
      quiz_completed_10: t('achievement.quizCompleted10'),
      perfect_score: t('achievement.perfectScore'),
      streak_7: t('achievement.weekStreak'),
      streak_30: t('achievement.monthStreak'),
      streak_100: t('achievement.grandMaster'),
      week_streak: t('achievement.weekStreak'),
      month_streak: t('achievement.monthStreak'),
      grand_master: t('achievement.grandMaster'),
      questions_100: t('achievement.hundredQuestions'),
      questions_500: t('achievement.fiveHundredQuestions'),
      questions_1000: t('achievement.thousandQuestions'),
      hundred_questions: t('achievement.hundredQuestions'),
      five_hundred_questions: t('achievement.fiveHundredQuestions'),
      thousand_questions: t('achievement.thousandQuestions'),
      anatomy_master: t('achievement.anatomyMaster'),
      speed_demon: t('achievement.speedDemon'),
      social_butterfly: t('achievement.socialButterfly'),
      helpful_tutor: t('achievement.helpfulTutor'),
      room_creator: t('achievement.roomCreator'),
      top_ten: t('achievement.topTen'),
      champion: t('achievement.champion'),
      early_bird: t('achievement.earlyBird'),
      night_owl: t('achievement.nightOwl'),
      weekend_warrior: t('achievement.weekendWarrior'),
    };
    return titles[type] || type;
  };

  const getAchievementDescription = (type: AchievementType): string => {
    const descriptions: Record<AchievementType, string> = {
      first_quiz: t('achievement.firstQuizDesc'),
      quiz_master: t('achievement.quizMasterDesc'),
      quiz_completed_10: t('achievement.quizCompleted10Desc'),
      perfect_score: t('achievement.perfectScoreDesc'),
      streak_7: t('achievement.weekStreakDesc'),
      streak_30: t('achievement.monthStreakDesc'),
      streak_100: t('achievement.grandMasterDesc'),
      week_streak: t('achievement.weekStreakDesc'),
      month_streak: t('achievement.monthStreakDesc'),
      grand_master: t('achievement.grandMasterDesc'),
      questions_100: t('achievement.hundredQuestionsDesc'),
      questions_500: t('achievement.fiveHundredQuestionsDesc'),
      questions_1000: t('achievement.thousandQuestionsDesc'),
      hundred_questions: t('achievement.hundredQuestionsDesc'),
      five_hundred_questions: t('achievement.fiveHundredQuestionsDesc'),
      thousand_questions: t('achievement.thousandQuestionsDesc'),
      anatomy_master: t('achievement.anatomyMasterDesc'),
      speed_demon: t('achievement.speedDemonDesc'),
      social_butterfly: t('achievement.socialButterflyDesc'),
      helpful_tutor: t('achievement.helpfulTutorDesc'),
      room_creator: t('achievement.roomCreatorDesc'),
      top_ten: t('achievement.topTenDesc'),
      champion: t('achievement.championDesc'),
      early_bird: t('achievement.earlyBirdDesc'),
      night_owl: t('achievement.nightOwlDesc'),
      weekend_warrior: t('achievement.weekendWarriorDesc'),
    };
    return descriptions[type] || t('social.achievementUnlocked');
  };
  
  const filteredStudyRooms = studyRooms.filter(room => !isUserBlocked(room.hostId));
  const filteredUpcomingSessions = upcomingSessions.filter(session => !isUserBlocked(session.hostId));
  const filteredAchievements = recentAchievements.filter(achievement => !isUserBlocked(achievement.userId));
  const filteredOnlineFriends = onlineFriends.filter((f) => !isUserBlocked(f.id));
  const filteredFriendActivity = friendActivity.filter((a) => !isUserBlocked(a.userId));
  const filteredActivityFeed = activityFeed.filter((a) => !isUserBlocked(a.actorId));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <OfflineFeatureNotice />
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title} numberOfLines={1}>{t('social.community')}</Text>
                <Text style={styles.subtitle}>{t('social.communitySubtitle')}</Text>
              </View>
              <TouchableOpacity
                style={styles.findPartnersButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/find-partners');
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.accent, colors.secondary]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <User color={colors.text} size={18} />
                <Text style={styles.findPartnersButtonText}>{t('social.findPartners')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Radio color={colors.error} size={18} />
              <Text style={styles.sectionTitle}>{t('social.liveStudyRooms')}</Text>
              <TouchableOpacity 
                style={styles.createRoomButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowCreateRoomModal(true);
                }}
              >
                <Plus color={colors.text} size={16} />
                <Text style={styles.createRoomButtonText}>{t('social.create')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.roomsScroll}
            >
              {filteredStudyRooms.map((room) => {
                const isHost = isCurrentUserHost(room);

                return (
                  <TouchableOpacity 
                    key={room.id} 
                    activeOpacity={0.9}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedChatRoom(room);
                      setShowChatModal(true);
                    }}
                  >
                    <GlassCard style={styles.roomCard} variant="light">
                      <View style={styles.roomAvatarContainer}>
                        <Image
                          source={{ uri: safeAvatarUri(room.hostAvatar, room.hostId) }}
                          style={styles.roomHostAvatar}
                        />
                        <OnlineIndicator 
                          isOnline={onlineFriends.some(f => f.id === room.hostId)} 
                          size={14}
                          style={styles.onlineIndicator}
                        />
                      </View>
                      <Text style={styles.roomName} numberOfLines={1}>{room.name}</Text>
                      <Text style={styles.roomHost}>
                        {isHost ? t('social.youAreHosting') : t('social.hostedBy').replace('{name}', room.host)}
                      </Text>
                      <View style={styles.roomFooter}>
                        <Users color={colors.textSecondary} size={14} />
                        <Text style={styles.roomParticipants}>
                          {room.participants}/{room.maxParticipants}
                        </Text>
                      </View>
                      
                      {!isHost && (
                        <TouchableOpacity
                          style={styles.userActionsButton}
                          onPress={() => handleOpenUserActions({
                            id: room.hostId,
                            name: room.host,
                            avatar: room.hostAvatar,
                          })}
                        >
                          <MoreVertical color={colors.textMuted} size={18} />
                        </TouchableOpacity>
                      )}
                      
                      <View style={styles.roomActions}>
                        <TouchableOpacity 
                          style={styles.chatButton}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedChatRoom(room);
                            setShowChatModal(true);
                          }}
                        >
                          <MessageCircle color={colors.primary} size={14} />
                          <Text style={styles.chatButtonText}>{t('social.chat')}</Text>
                        </TouchableOpacity>
                        
                        {isHost && (
                          <TouchableOpacity 
                            style={styles.scheduleButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleScheduleSession(room);
                            }}
                          >
                            <Calendar color={colors.primary} size={14} />
                            <Text style={styles.scheduleButtonText}>{t('social.schedule')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {filteredUpcomingSessions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Calendar color={colors.secondary} size={18} />
                <Text style={styles.sectionTitle}>{t('social.upcomingSessions')}</Text>
              </View>
              
              {filteredUpcomingSessions.map((session) => {
                const isHost = isSessionHost(session);
                
                return (
                  <GlassCard key={session.id} style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                      <Image
                        source={{ uri: safeAvatarUri(session.hostAvatar, session.hostId) }}
                        style={styles.sessionAvatar}
                      />
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
                        <Text style={styles.sessionHost}>
                          {isHost ? t('social.youAreHosting') : `${t('social.hostedBy').replace('Hosted by', '').trim()} ${session.hostName}`}
                        </Text>
                      </View>
                      {!isHost && (
                        <TouchableOpacity
                          style={styles.sessionUserActionsButton}
                          onPress={() => handleOpenUserActions({
                            id: session.hostId,
                            name: session.hostName,
                            avatar: session.hostAvatar,
                          })}
                        >
                          <MoreVertical color={colors.textMuted} size={18} />
                        </TouchableOpacity>
                      )}
                      <View style={styles.countdownBadge}>
                        <Clock color={colors.secondary} size={12} />
                        <Text style={styles.countdownText}>{formatCountdown(session.scheduledFor)}</Text>
                      </View>
                    </View>
                    
                    {session.description && (
                      <Text style={styles.sessionDescription} numberOfLines={2}>
                        {session.description}
                      </Text>
                    )}
                    
                    <View style={styles.sessionMeta}>
                      <View style={styles.sessionMetaItem}>
                        <Calendar color={colors.textMuted} size={14} />
                        <Text style={styles.sessionMetaText}>{formatSessionTime(session.scheduledFor)}</Text>
                      </View>
                      <View style={styles.sessionMetaItem}>
                        <Clock color={colors.textMuted} size={14} />
                        <Text style={styles.sessionMetaText}>{session.durationMinutes} {t('social.min')}</Text>
                      </View>
                      <View style={styles.sessionMetaItem}>
                        <Users color={colors.textMuted} size={14} />
                        <Text style={styles.sessionMetaText}>{session.attendees.length} {t('social.joined')}</Text>
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          )}

          {!isProfilePublic && (
            <GlassCard style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <View style={styles.activityTypeIcon}>
                  <EyeOff color={colors.textMuted} size={18} />
                </View>
                <View style={styles.activityUserInfo}>
                  <Text style={styles.activityUserName}>Private profile</Text>
                  <Text style={styles.activityTime}>Only you can see your activity</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                style={styles.joinButton}
              >
                <Text style={styles.joinButtonText}>Manage privacy</Text>
              </TouchableOpacity>
            </GlassCard>
          )}

          {isProfilePublic && filteredOnlineFriends.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Users color={colors.success} size={18} />
                <Text style={styles.sectionTitle}>{t('social.onlineFriends')}</Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.onlineFriendsScroll}
              >
                {filteredOnlineFriends.map((friend) => (
                  <TouchableOpacity key={friend.id} style={styles.onlineFriendCard}>
                    <View style={styles.onlineFriendAvatarContainer}>
                      <Image
                        source={{ uri: safeAvatarUri(friend.avatar, friend.id) }}
                        style={styles.onlineFriendAvatar}
                      />
                      <OnlineIndicator 
                        isOnline={true} 
                        size={14}
                        style={styles.onlineFriendIndicator}
                      />
                    </View>
                    <Text style={styles.onlineFriendName} numberOfLines={1}>{friend.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {isProfilePublic && filteredFriendActivity.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock color={colors.secondary} size={18} />
                <Text style={styles.sectionTitle}>{t('social.recentActivity')}</Text>
              </View>
              {filteredFriendActivity.map((activity) => (
                <GlassCard key={activity.id} style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <View style={styles.friendActivityAvatarContainer}>
                      <Image
                        source={{ uri: safeAvatarUri(activity.userAvatar, activity.userId) }}
                        style={styles.activityAvatar}
                      />
                      <OnlineIndicator 
                        isOnline={filteredOnlineFriends.some(f => f.id === activity.userId)} 
                        size={12}
                        style={styles.activityOnlineIndicator}
                      />
                    </View>
                    <View style={styles.activityUserInfo}>
                      <Text style={styles.activityUserName}>{activity.userName}</Text>
                      <Text style={styles.activityTime}>
                        {formatTimeAgo(new Date(activity.timestamp))}
                      </Text>
                    </View>
                    <View style={styles.activityTypeIcon}>
                      <Users color={colors.success} size={18} />
                    </View>
                  </View>
                  <Text style={styles.activityTitle}>{t('social.cameOnline')}</Text>
                </GlassCard>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MessageCircle color={colors.primary} size={18} />
              <Text style={styles.sectionTitle}>{t('social.activityFeed')}</Text>
            </View>
            
            {filteredAchievements.map((achievement) => (
              <GlassCard key={achievement.id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <Image
                    source={{ uri: safeAvatarUri(achievement.userAvatar, achievement.userId) }}
                    style={styles.activityAvatar}
                  />
                  <View style={styles.activityUserInfo}>
                    <Text style={styles.activityUserName}>{achievement.userName}</Text>
                    <Text style={styles.activityTime}>
                      {formatTimeAgo(new Date(achievement.earnedAt))}
                    </Text>
                  </View>
                  <View style={styles.activityTypeIcon}>
                    <Trophy color={colors.accent} size={18} />
                  </View>
                </View>
                
                <Text style={styles.activityTitle}>{getAchievementTitle(achievement.achievementType)}</Text>
                <Text style={styles.activityDescription}>
                  {getAchievementDescription(achievement.achievementType)}
                </Text>
                
                <View style={styles.achievementBadge}>
                  <Trophy color={colors.accent} size={14} />
                  <Text style={styles.achievementBadgeText}>{t('social.achievementUnlocked')}</Text>
                </View>
              </GlassCard>
            ))}
            
            {filteredActivityFeed.map((activity) => {
              const IconComponent = activityIcons[activity.type] || Star;
              const userReaction = reactedActivities[activity.id];

              const title = (() => {
                switch (activity.type) {
                  case 'achievement':
                    return t('social.achievementUnlocked');
                  case 'started_chat':
                    return t('social.startedChat');
                  case 'joined_room':
                    return t('social.joinedRoom');
                  case 'milestone':
                    return t('social.milestoneReached');
                  default:
                    return t('social.activity');
                }
              })();

              const description = (() => {
                if (activity.type === 'started_chat') {
                  return activity.payload?.title
                    ? `${t('social.chatTitle')}: ${activity.payload.title}`
                    : t('social.startedChatDesc');
                }
                if (activity.type === 'joined_room') {
                  return activity.payload?.roomName
                    ? `${t('social.room')}: ${activity.payload.roomName}`
                    : t('social.joinedRoomDesc');
                }
                if (activity.type === 'milestone') {
                  return activity.payload?.label || t('social.milestoneDesc');
                }
                return activity.payload?.description || '';
              })();

              return (
                <GlassCard key={activity.id} style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <Image
                      source={{ uri: safeAvatarUri(activity.actorAvatar, activity.actorId) }}
                      style={styles.activityAvatar}
                    />
                    <View style={styles.activityUserInfo}>
                      <Text style={styles.activityUserName}>{activity.actorName}</Text>
                      <Text style={styles.activityTime}>{formatTimeAgo(new Date(activity.createdAt))}</Text>
                    </View>
                    <View style={styles.activityTypeIcon}>
                      <IconComponent
                        color={activity.type === 'milestone' ? colors.streakOrange : colors.primary}
                        size={18}
                      />
                    </View>
                  </View>

                  <Text style={styles.activityTitle}>{title}</Text>
                  {description ? (
                    <Text style={styles.activityDescription}>{description}</Text>
                  ) : null}

                  <View style={styles.reactionsRow}>
                    {['👍', '🔥', '🎉'].map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        style={[
                          styles.reactionBadge,
                          userReaction === emoji && styles.reactionBadgeActive
                        ]}
                        onPress={() => handleReaction(activity.id, emoji)}
                      >
                        <Text style={styles.reactionEmoji}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GlassCard>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showScheduleModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <LinearGradient
              colors={[colors.cardBg, colors.background]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('social.scheduleSession')}</Text>
              <TouchableOpacity 
                style={styles.modalClose}
                onPress={() => {
                  setShowScheduleModal(false);
                  resetScheduleForm();
                }}
              >
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedRoom && (
                <View style={styles.selectedRoomBadge}>
                  <Text style={styles.selectedRoomLabel}>{t('social.room')}</Text>
                  <Text style={styles.selectedRoomName}>{selectedRoom.name}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('social.titleRequired')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={sessionTitle}
                  onChangeText={setSessionTitle}
                  placeholder={t('social.titlePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('social.description')}</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={sessionDescription}
                  onChangeText={setSessionDescription}
                  placeholder={t('social.descriptionPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>{t('social.dateRequired')}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={sessionDate}
                    onChangeText={setSessionDate}
                    placeholder={t('social.datePlaceholder')}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.inputLabel}>{t('social.timeRequired')}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={sessionTime}
                    onChangeText={setSessionTime}
                    placeholder={t('social.timePlaceholder')}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('social.durationLabel')}</Text>
                <View style={styles.durationOptions}>
                  {['30', '45', '60', '90', '120'].map(dur => (
                    <TouchableOpacity
                      key={dur}
                      style={[
                        styles.durationOption,
                        sessionDuration === dur && styles.durationOptionActive
                      ]}
                      onPress={() => setSessionDuration(dur)}
                    >
                      <Text style={[
                        styles.durationOptionText,
                        sessionDuration === dur && styles.durationOptionTextActive
                      ]}>
                        {dur}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('social.meetingUrlOptional')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={meetingUrl}
                  onChangeText={setMeetingUrl}
                  placeholder={t('social.meetingUrlPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <Text style={styles.inputHint}>{t('social.meetingUrlHint')}</Text>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { paddingBottom: Math.max(16, insets.bottom) }]}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowScheduleModal(false);
                  resetScheduleForm();
                }}
              >
                <Text style={styles.cancelButtonText}>{t('social.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.createButton, createSessionMutation.isPending && styles.buttonDisabled]}
                onPress={handleCreateSession}
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <Calendar color={colors.text} size={16} />
                    <Text style={styles.createButtonText}>{t('social.schedule')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showCreateRoomModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateRoomModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
            <LinearGradient
              colors={[colors.cardBg, colors.background]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('social.createStudyRoom')}</Text>
              <TouchableOpacity 
                style={styles.modalClose}
                onPress={() => {
                  setShowCreateRoomModal(false);
                  resetCreateRoomForm();
                }}
              >
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('social.roomNameRequired')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={newRoomName}
                  onChangeText={setNewRoomName}
                  placeholder={t('social.roomNamePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('social.category')}</Text>
                <View style={styles.categoryOptions}>
                  {[
                    { id: 'upper-lower-limbs', label: getModuleName('upper-lower-limbs') },
                    { id: 'internal-organs', label: getModuleName('internal-organs') },
                    { id: 'head-neck', label: getModuleName('head-neck') },
                    { id: 'neuroanatomy', label: getModuleName('neuroanatomy') },
                  ].map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        newRoomCategory === cat.id && styles.categoryOptionActive
                      ]}
                      onPress={() => setNewRoomCategory(cat.id)}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        newRoomCategory === cat.id && styles.categoryOptionTextActive
                      ]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('social.maxParticipants')} (Max: 10)</Text>
                <View style={styles.durationOptions}>
                  {['3', '5', '7', '10'].map(num => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.durationOption,
                        newRoomMaxParticipants === num && styles.durationOptionActive
                      ]}
                      onPress={() => setNewRoomMaxParticipants(num)}
                    >
                      <Text style={[
                        styles.durationOptionText,
                        newRoomMaxParticipants === num && styles.durationOptionTextActive
                      ]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { paddingBottom: Math.max(16, insets.bottom) }]}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateRoomModal(false);
                  resetCreateRoomForm();
                }}
              >
                <Text style={styles.cancelButtonText}>{t('social.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.createButton, createRoomMutation.isPending && styles.buttonDisabled]}
                onPress={handleCreateRoom}
                disabled={createRoomMutation.isPending}
              >
                {createRoomMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <Plus color={colors.text} size={16} />
                    <Text style={styles.createButtonText}>{t('social.createRoom')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showUserActionsModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowUserActionsModal(false)}
      >
        <TouchableOpacity 
          style={styles.userActionsOverlay}
          activeOpacity={1}
          onPress={() => setShowUserActionsModal(false)}
        >
          <View style={styles.userActionsContent}>
            <LinearGradient
              colors={[colors.cardBg, colors.background]}
              style={StyleSheet.absoluteFill}
            />
            {selectedUser && (
              <>
                <View style={styles.userActionsHeader}>
                  <Image
                    source={{ uri: safeAvatarUri(selectedUser.avatar, selectedUser.id) }}
                    style={styles.userActionsAvatar}
                  />
                  <Text style={styles.userActionsName}>{selectedUser.name}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.userActionItem}
                  onPress={() => handleBlockUser(selectedUser)}
                >
                  <View style={[styles.userActionIcon, { backgroundColor: 'rgba(255, 71, 87, 0.15)' }]}>
                    <Ban color={colors.error} size={20} />
                  </View>
                  <View style={styles.userActionTextContainer}>
                    <Text style={styles.userActionTitle}>{t('social.blockUserTitle')}</Text>
                    <Text style={styles.userActionSubtitle}>{t('social.blockUserSubtitle')}</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.userActionItem}
                  onPress={handleOpenReportModal}
                >
                  <View style={[styles.userActionIcon, { backgroundColor: 'rgba(255, 159, 67, 0.15)' }]}>
                    <Flag color={colors.warning} size={20} />
                  </View>
                  <View style={styles.userActionTextContainer}>
                    <Text style={styles.userActionTitle}>{t('social.reportUserTitle')}</Text>
                    <Text style={styles.userActionSubtitle}>{t('social.reportUserSubtitle')}</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.userActionCancelButton}
                  onPress={() => setShowUserActionsModal(false)}
                >
                  <Text style={styles.userActionCancelText}>{t('social.cancel')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseReportModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.reportModalContent}>
            <LinearGradient
              colors={[colors.cardBg, colors.background]}
              style={StyleSheet.absoluteFill}
            />
            
            {reportSubmitted ? (
              <View style={styles.reportSuccessContainer}>
                <View style={styles.reportSuccessIcon}>
                  <CheckCircle color={colors.success} size={48} />
                </View>
                <Text style={styles.reportSuccessTitle}>{t('social.reportSubmitted')}</Text>
                <Text style={styles.reportSuccessText}>
                  {t('social.reportSubmittedMessage')}
                </Text>
                <TouchableOpacity
                  style={styles.reportSuccessButton}
                  onPress={handleCloseReportModal}
                >
                  <Text style={styles.reportSuccessButtonText}>{t('social.done')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('social.reportUserTitle')}</Text>
                  <TouchableOpacity 
                    style={styles.modalClose}
                    onPress={handleCloseReportModal}
                  >
                    <X color={colors.textSecondary} size={24} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {selectedUser && (
                    <View style={styles.reportUserBadge}>
                      <Image
                        source={{ uri: safeAvatarUri(selectedUser.avatar, selectedUser.id) }}
                        style={styles.reportUserAvatar}
                      />
                      <Text style={styles.reportUserName}>{t('social.reportingUser').replace('{name}', selectedUser.name)}</Text>
                    </View>
                  )}

                  <Text style={styles.inputLabel}>{t('social.reasonForReport')}</Text>
                  <View style={styles.reportReasonsList}>
                    {getReportReasons(t).map((reason) => {
                      const IconComponent = reason.icon;
                      const isSelected = selectedReportReason === reason.id;
                      return (
                        <TouchableOpacity
                          key={reason.id}
                          style={[
                            styles.reportReasonItem,
                            isSelected && styles.reportReasonItemActive
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedReportReason(reason.id);
                          }}
                        >
                          <IconComponent 
                            color={isSelected ? colors.warning : colors.textSecondary} 
                            size={20} 
                          />
                          <Text style={[
                            styles.reportReasonText,
                            isSelected && styles.reportReasonTextActive
                          ]}>
                            {reason.label}
                          </Text>
                          {isSelected && (
                            <View style={styles.reportReasonCheck}>
                              <CheckCircle color={colors.warning} size={18} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('social.additionalDetails')}</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={reportDetails}
                      onChangeText={setReportDetails}
                      placeholder={t('social.additionalDetailsPlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                </ScrollView>

                <View style={[styles.modalFooter, { paddingBottom: Math.max(16, insets.bottom) }]}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={handleCloseReportModal}
                  >
                    <Text style={styles.cancelButtonText}>{t('social.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.submitReportButton,
                      !selectedReportReason && styles.submitReportButtonDisabled
                    ]}
                    onPress={handleSubmitReport}
                    disabled={!selectedReportReason}
                  >
                    <Flag color={colors.text} size={16} />
                    <Text style={styles.submitReportButtonText}>{t('social.submitReport')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showChatModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowChatModal(false);
          setSelectedChatRoom(null);
        }}
      >
        <View style={styles.chatModalContainer}>
          <SafeAreaView style={styles.chatSafeArea} edges={['top']}>
            <View style={styles.chatModalHeader}>
              <TouchableOpacity
                style={styles.chatCloseButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowChatModal(false);
                  setSelectedChatRoom(null);
                }}
              >
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
            {selectedChatRoom && (
              <RoomChat
                roomId={selectedChatRoom.id}
                roomName={selectedChatRoom.name}
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: typeof import('@/constants/colors').darkColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    marginBottom: 24,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  findPartnersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
    overflow: 'hidden',
    flexShrink: 0,
  },
  findPartnersButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    flex: 1,
  },
  createRoomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  createRoomButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  roomsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  roomCard: {
    width: 170,
    alignItems: 'center',
    paddingTop: 12,
  },
  roomHeader: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.error,
  },
  idleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  idleText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  roomHostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    marginTop: 8,
  },
  roomName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 10,
    textAlign: 'center',
  },
  roomHost: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  roomParticipants: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  joinButtonDisabled: {
    backgroundColor: colors.cardBgLight,
  },
  joinButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  joinButtonTextDisabled: {
    color: colors.textMuted,
  },
  hostButtons: {
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  hostActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    minWidth: 90,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  goLiveButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: 12,
    gap: 4,
  },
  scheduleButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  liveHostButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  hostJoinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  hostJoinButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  endButton: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.error,
  },
  endButtonText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  sessionCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  sessionHost: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sessionLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  sessionLiveText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.error,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(72, 202, 228, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.secondary,
  },
  sessionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  sessionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionMetaText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  sessionActions: {
    marginTop: 4,
  },
  sessionHostLiveButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  sessionOpenButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  sessionOpenButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  sessionEndButton: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
  },
  sessionEndButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  sessionStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  sessionStartButtonDisabled: {
    backgroundColor: colors.cardBgLight,
  },
  sessionStartButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  sessionStartButtonTextDisabled: {
    color: colors.textMuted,
  },
  sessionJoinButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sessionJoinButtonDisabled: {
    backgroundColor: colors.cardBgLight,
  },
  sessionJoinButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  sessionJoinButtonTextDisabled: {
    color: colors.textMuted,
  },
  activityCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  activityUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityUserName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  activityTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  activityTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBgLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBgLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  reactionBadgeActive: {
    backgroundColor: 'rgba(0, 180, 216, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  reactionCountActive: {
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBgLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  selectedRoomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBgLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  selectedRoomLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  selectedRoomName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.cardBgLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  durationOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.cardBgLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  durationOptionActive: {
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    borderColor: colors.primary,
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  durationOptionTextActive: {
    color: colors.primary,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.cardBgLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryOptionActive: {
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    borderColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  categoryOptionTextActive: {
    color: colors.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBgLight,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.cardBgLight,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  createButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    gap: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  userActionsButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionUserActionsButton: {
    width: TOUCH_TARGET_MIN,
    height: TOUCH_TARGET_MIN,
    borderRadius: TOUCH_TARGET_MIN / 2,
    backgroundColor: colors.cardBgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  userActionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  userActionsContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  userActionsHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  userActionsAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 10,
  },
  userActionsName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.text,
  },
  userActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  userActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userActionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  userActionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  userActionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userActionCancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  userActionCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  reportModalContent: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  reportUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBgLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  reportUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reportUserName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  reportReasonsList: {
    gap: 10,
    marginBottom: 20,
  },
  reportReasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.cardBgLight,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  reportReasonItemActive: {
    backgroundColor: 'rgba(255, 159, 67, 0.1)',
    borderColor: colors.warning,
  },
  reportReasonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  reportReasonTextActive: {
    color: colors.warning,
  },
  reportReasonCheck: {
    marginLeft: 'auto',
  },
  submitReportButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.warning,
    gap: 8,
  },
  submitReportButtonDisabled: {
    backgroundColor: colors.cardBgLight,
    opacity: 0.6,
  },
  submitReportButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  reportSuccessContainer: {
    alignItems: 'center',
    padding: 32,
  },
  reportSuccessIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46, 213, 115, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  reportSuccessTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  reportSuccessText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  reportSuccessButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  reportSuccessButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  roomActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    width: '100%',
    justifyContent: 'center',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  chatButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  chatModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatSafeArea: {
    flex: 1,
  },
  chatModalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBgLight,
  },
  chatCloseButton: {
    padding: 4,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  achievementBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  roomAvatarContainer: {
    position: 'relative',
    marginTop: 8,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  onlineFriendsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  onlineFriendCard: {
    alignItems: 'center',
    width: 70,
  },
  onlineFriendAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  onlineFriendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.success,
  },
  onlineFriendIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  onlineFriendName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
  },
  friendActivityAvatarContainer: {
    position: 'relative',
  },
  activityOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
