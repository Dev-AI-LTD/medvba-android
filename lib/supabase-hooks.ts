import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { queryKeys } from './query-keys';
import { supabase } from './supabase';
import type { UserAccount } from '@/types/user';
import { getMergedExpoExtra } from '@/lib/expo-public-extra';

/** Profile “Zoom session requests” poll (`zoom_requests`). Off by default — no Supabase round-trip or console noise. */
function fetchProfileZoomRequestsEnabled(): boolean {
  const v = String(getMergedExpoExtra().EXPO_PUBLIC_FETCH_ZOOM_REQUESTS ?? '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

/** Maps file extensions to MIME types for profile photo uploads. Module-level to avoid per-call allocation. */
const EXT_MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', gif: 'image/gif', heic: 'image/jpeg', heif: 'image/jpeg',
};

function isHttpUri(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const bin = globalThis.atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function mimeFromUri(uri: string): string {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  return (ext && EXT_MIME_MAP[ext]) ? EXT_MIME_MAP[ext] : 'image/jpeg';
}

/** Read image bytes for upload. RN fetch() often fails on file:// / content://; use native read there. */
async function profilePhotoUriToArrayBuffer(uri: string): Promise<{ arrayBuffer: ArrayBuffer; mimeType: string }> {
  if (isHttpUri(uri)) {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const blob = await response.blob();
    let mimeType = blob.type && blob.type !== 'application/octet-stream' ? blob.type : '';
    if (!mimeType) mimeType = mimeFromUri(uri);
    return { arrayBuffer: await blob.arrayBuffer(), mimeType };
  }

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const blob = await response.blob();
    let mimeType = blob.type && blob.type !== 'application/octet-stream' ? blob.type : mimeFromUri(uri);
    return { arrayBuffer: await blob.arrayBuffer(), mimeType };
  }

  const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
  return { arrayBuffer: base64ToArrayBuffer(base64), mimeType: mimeFromUri(uri) };
}

export interface StudyRoom {
  id: string;
  name: string;
  host: string;
  hostId: string;
  hostAvatar: string;
  participants: number;
  maxParticipants: number;
  category: string;
  isLive: boolean;
  meetingUrl?: string;
  created_at?: string;
}

export interface StudySession {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  description?: string;
  scheduledFor: string;
  durationMinutes: number;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  category: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  meetingUrl?: string;
  attendees: string[];
  created_at?: string;
}

export function useStudyRooms() {
  return useQuery({
    queryKey: queryKeys.studyRoomsList(),
    queryFn: async () => {
      console.log('[Supabase] Fetching study rooms...');
      const { data, error } = await supabase
        .from('study_rooms')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('[Supabase] Error fetching study rooms:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        return [];
      }

      console.log('[Supabase] Fetched', data?.length || 0, 'study rooms');

      return (data || []).map((room: any) => ({
        id: room.id,
        name: room.name,
        host: `User ${room.host_id.substring(0, 8)}`,
        hostId: room.host_id,
        hostAvatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${room.host_id}`,
        participants: room.participants || 0,
        maxParticipants: room.max_participants || 20,
        category: room.category || 'general',
        isLive: !!room.meeting_url,
        meetingUrl: room.meeting_url,
        created_at: room.created_at,
      })) as StudyRoom[];
    },
    staleTime: 30000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useCreateStudyRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      hostId: string;
      hostName: string;
      hostAvatar: string;
      category: string;
      maxParticipants: number;
    }) => {
      console.log('[Supabase] Creating study room:', input.name);
      
      const { data, error } = await supabase
        .from('study_rooms')
        .insert({
          name: input.name,
          host_id: input.hostId,
          category: input.category,
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error creating study room:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      console.log('[Supabase] Study room created:', data.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studyRoomsList() });
    },
  });
}

export function useUpdateStudyRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      roomId: string;
      meetingUrl?: string;
    }) => {
      console.log('[Supabase] Updating study room:', input.roomId);

      const updateData: any = {};
      if (input.meetingUrl !== undefined) updateData.meeting_url = input.meetingUrl;

      const { data, error } = await supabase
        .from('study_rooms')
        .update(updateData)
        .eq('id', input.roomId)
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error updating study room:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      console.log('[Supabase] Study room updated:', data.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studyRoomsList() });
    },
  });
}

export function useUpcomingSessions() {
  return useQuery({
    queryKey: ['upcomingSessions'],
    queryFn: async () => {
      console.log('[Supabase] Fetching upcoming sessions...');
      
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .gte('scheduled_for', now)
        .order('scheduled_for', { ascending: true })
        .limit(20);

      if (error) {
        console.error('[Supabase] Error fetching sessions:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        return [];
      }

      console.log('[Supabase] Fetched', data?.length || 0, 'upcoming sessions');

      return (data || []).map((session: any) => ({
        id: session.id,
        roomId: session.room_id,
        roomName: session.room_name,
        title: session.title,
        description: session.description,
        scheduledFor: session.scheduled_for,
        durationMinutes: session.duration_minutes,
        hostId: session.host_id,
        hostName: session.host_name,
        hostAvatar: session.host_avatar,
        category: session.category,
        status: session.status,
        meetingUrl: session.meeting_url,
        attendees: session.attendees || [],
        created_at: session.created_at,
      })) as StudySession[];
    },
    staleTime: 30000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      roomId: string;
      title: string;
      description?: string;
      scheduledFor: string;
      durationMinutes: number;
      hostId: string;
      hostName: string;
      hostAvatar: string;
      category: string;
      meetingUrl?: string;
    }) => {
      console.log('[Supabase] Creating session:', input.title);

      const { data: roomData } = await supabase
        .from('study_rooms')
        .select('name')
        .eq('id', input.roomId)
        .single();

      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          room_id: input.roomId,
          room_name: roomData?.name || '',
          title: input.title,
          description: input.description,
          scheduled_for: input.scheduledFor,
          duration_minutes: input.durationMinutes,
          host_id: input.hostId,
          host_name: input.hostName,
          host_avatar: input.hostAvatar,
          category: input.category,
          status: 'SCHEDULED',
          attendees: [],
          meeting_url: input.meetingUrl,
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error creating session:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      console.log('[Supabase] Session created:', data.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcomingSessions'] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      sessionId: string;
      status?: 'SCHEDULED' | 'LIVE' | 'ENDED';
      meetingUrl?: string;
    }) => {
      console.log('[Supabase] Updating session:', input.sessionId);

      const updateData: any = {};
      if (input.status !== undefined) updateData.status = input.status;
      if (input.meetingUrl !== undefined) updateData.meeting_url = input.meetingUrl;

      const { data, error } = await supabase
        .from('study_sessions')
        .update(updateData)
        .eq('id', input.sessionId)
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error updating session:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      console.log('[Supabase] Session updated:', data.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcomingSessions'] });
    },
  });
}

export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  createdAt: string;
}

export function useRoomMessages(roomId: string) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const fetchMessages = async () => {
      console.log('[Supabase] Fetching messages for room:', roomId);
      setIsLoading(true);

      const { data: messagesData, error: messagesError } = await supabase
        .from('room_messages')
        .select('id, room_id, user_id, message, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (messagesError) {
        console.error('[Supabase] Error fetching messages:', JSON.stringify({ message: messagesError.message, code: messagesError.code, details: messagesError.details }));
        setIsLoading(false);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        setIsLoading(false);
        console.log('[Supabase] No messages found');
        return;
      }

      const userIds = [...new Set(messagesData.map(msg => msg.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', userIds);

      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile])
      );

      const formattedMessages: RoomMessage[] = messagesData.map((msg: any) => {
        const profile = profilesMap.get(msg.user_id);
        return {
          id: msg.id,
          roomId: msg.room_id,
          userId: msg.user_id,
          userName: profile?.name || 'Anonymous',
          userAvatar: profile?.avatar || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + msg.user_id,
          message: msg.message,
          createdAt: msg.created_at,
        };
      });

      setMessages(formattedMessages);
      setIsLoading(false);
      console.log('[Supabase] Loaded', formattedMessages.length, 'messages');
    };

    fetchMessages();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('[Supabase] New message received:', payload);
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar')
            .eq('id', payload.new.user_id)
            .single();
          
          const newMessage: RoomMessage = {
            id: payload.new.id,
            roomId: payload.new.room_id,
            userId: payload.new.user_id,
            userName: profile?.name || 'Anonymous',
            userAvatar: profile?.avatar || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + payload.new.user_id,
            message: payload.new.message,
            createdAt: payload.new.created_at,
          };
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      console.log('[Supabase] Unsubscribing from room:', roomId);
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { messages, isLoading };
}

export function useSendMessage() {
  return useMutation({
    mutationFn: async (input: {
      roomId: string;
      userId: string;
      message: string;
    }) => {
      console.log('[Supabase] Sending message to room:', input.roomId);

      const { data, error } = await supabase
        .from('room_messages')
        .insert({
          room_id: input.roomId,
          user_id: input.userId,
          message: input.message,
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error sending message:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      console.log('[Supabase] Message sent:', data.id);
      return data;
    },
  });
}

export interface ZoomRequest {
  id: string;
  userId: string;
  studyTopic: string;
  preferredDate: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export function useZoomRequests(userId: string | undefined) {
  return useQuery({
    queryKey: ['zoomRequests', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('zoom_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase] Error fetching zoom requests:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      return (data || []).map((req: any) => ({
        id: req.id.toString(),
        userId: req.user_id,
        studyTopic: req.study_topic,
        preferredDate: req.preferred_date,
        status: req.status as 'pending' | 'approved' | 'rejected',
        createdAt: req.created_at,
      })) as ZoomRequest[];
    },
    enabled: !!userId && fetchProfileZoomRequestsEnabled(),
  });
}

export function useCreateZoomRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      userId: string;
      studyTopic: string;
      preferredDate: string;
    }) => {
      console.log('[Supabase] Creating zoom request:', input.studyTopic);

      const { data, error } = await supabase
        .from('zoom_requests')
        .insert({
          user_id: input.userId,
          study_topic: input.studyTopic,
          preferred_date: input.preferredDate,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error creating zoom request:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      console.log('[Supabase] Zoom request created:', data.id);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['zoomRequests', variables.userId] });
    },
  });
}

export function useStudyPartners(filters?: {
  city?: string;
  university?: string;
  searchQuery?: string;
}) {
  return useQuery({
    queryKey: ['studyPartners', filters],
    queryFn: async () => {
      console.log('[Supabase] Fetching study partners with filters:', filters);
      
      let query = supabase
        .from('profiles')
        .select('*');

      if (filters?.city) {
        query = query.eq('city', filters.city);
      }

      if (filters?.university) {
        query = query.eq('university', filters.university);
      }

      if (filters?.searchQuery) {
        // Escape LIKE wildcards (%, _, \) so user input is treated literally
        const escaped = String(filters.searchQuery)
          .replace(/\\/g, '\\\\')
          .replace(/%/g, '\\%')
          .replace(/_/g, '\\_');
        query = query.or(`name.ilike.%${escaped}%,bio.ilike.%${escaped}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[Supabase] Error fetching study partners:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      console.log('[Supabase] Fetched', data?.length || 0, 'study partners');

      return (data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name || 'Student',
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user.id}`,
        city: user.city,
        university: user.university,
        year_of_study: user.year_of_study,
        bio: user.bio,
        is_public: user.is_public ?? true,
        profile_photo_url: user.profile_photo_url,
        created_at: user.created_at,
      })) as UserAccount[];
    },
  });
}

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!userId) return null;

      console.log('[Supabase] Fetching user profile:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Supabase] Error fetching user profile:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name || 'Student',
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${data.id}`,
        city: data.city,
        university: data.university,
        year_of_study: data.year_of_study,
        bio: data.bio,
        is_public: data.is_public ?? true,
        profile_photo_url: data.profile_photo_url,
        created_at: data.created_at,
      } as UserAccount;
    },
    enabled: !!userId,
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      userId: string;
      name?: string;
      city?: string;
      university?: string;
      year_of_study?: number;
      bio?: string;
      is_public?: boolean;
      profile_photo_url?: string;
    }) => {
      console.log('[Supabase] Updating user profile:', input.userId);

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.city !== undefined) updateData.city = input.city;
      if (input.university !== undefined) updateData.university = input.university;
      if (input.year_of_study !== undefined) updateData.year_of_study = input.year_of_study;
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.is_public !== undefined) updateData.is_public = input.is_public;
      if (input.profile_photo_url !== undefined) {
        updateData.profile_photo_url = input.profile_photo_url;
        // Keep legacy `avatar` in sync so Home tab and older queries show the same photo URL.
        updateData.avatar = input.profile_photo_url;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', input.userId)
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error updating user profile:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      console.log('[Supabase] User profile updated');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['studyPartners'] });
    },
  });
}

export async function uploadProfilePhoto(userId: string, uri: string): Promise<string> {
  try {
    console.log('[Supabase] Uploading profile photo for user:', userId);

    const { arrayBuffer, mimeType: rawMime } = await profilePhotoUriToArrayBuffer(uri);
    let mimeType = rawMime;
    const extFromMime = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const fileName = `${userId}-${Date.now()}.${extFromMime}`;
    const filePath = `${userId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[Supabase] Error uploading photo:', JSON.stringify({ message: uploadError.message, code: (uploadError as any).statusCode }));
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('[Supabase] Photo uploaded, path:', uploadData.path);
    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl.split('?')[0];
    console.log('[Supabase] Photo uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('[Supabase] Error in uploadProfilePhoto:', JSON.stringify({ message: error?.message, stack: error?.stack }));
    throw error;
  }
}

export interface UserProgressData {
  id: string;
  userId: string;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  studyTimeSeconds: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyProgressData {
  id: string;
  userId: string;
  date: string;
  questionsAnswered: number;
  correctAnswers: number;
  studyTimeSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export function useUserProgress(userId: string | undefined) {
  return useQuery({
    queryKey: ['userProgress', userId],
    queryFn: async () => {
      if (!userId) return null;

      console.log('[Supabase] Fetching user progress for:', userId);
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('[Supabase] No user progress found, will create on first update');
          return null;
        }
        // Fail gracefully: app continues with local data (no throw = no red error overlay)
        console.warn('[Supabase] Error fetching user progress (using local data):', error.message);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        totalQuestionsAnswered: data.total_questions_answered,
        correctAnswers: data.correct_answers,
        studyTimeSeconds: data.study_time_seconds,
        currentStreak: data.current_streak,
        longestStreak: data.longest_streak,
        lastActivityDate: data.last_activity_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as UserProgressData;
    },
    enabled: !!userId,
    staleTime: 60000,
    gcTime: 300000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useUpsertUserProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      userId: string;
      totalQuestionsAnswered: number;
      correctAnswers: number;
      studyTimeSeconds: number;
      currentStreak: number;
      longestStreak: number;
      lastActivityDate: string | null;
    }) => {
      console.log('[Supabase] Upserting user progress for:', input.userId);

      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: input.userId,
          total_questions_answered: input.totalQuestionsAnswered,
          correct_answers: input.correctAnswers,
          study_time_seconds: input.studyTimeSeconds,
          current_streak: input.currentStreak,
          longest_streak: input.longestStreak,
          last_activity_date: input.lastActivityDate,
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error upserting user progress:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      console.log('[Supabase] User progress upserted successfully');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userProgress', variables.userId] });
    },
  });
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  points: number;
  streak: number;
  rank: number;
}

export function useLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'allTime', limit = 20) {
  return useQuery({
    queryKey: ['leaderboard', period, limit],
    queryFn: async () => {
      console.log('[Supabase] Fetching leaderboard:', period);
      const { data, error } = await supabase.rpc('get_leaderboard', {
        p_period: period,
        p_limit: limit,
      });

      if (error) {
        console.error('[Supabase] Error fetching leaderboard:', JSON.stringify({ message: error.message, code: error.code }));
        return [];
      }

      return (data || []).map((row: { id: string; name: string; avatar: string; points: number; streak: number; rank: number }) => ({
        id: row.id,
        name: row.name || 'Student',
        avatar: row.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${row.id}`,
        points: Number(row.points) || 0,
        streak: Number(row.streak) || 0,
        rank: Number(row.rank) || 0,
      })) as LeaderboardUser[];
    },
    staleTime: 60000,
    gcTime: 300000,
    retry: 1,
  });
}

export function useDailyProgress(userId: string | undefined, date: string) {
  return useQuery({
    queryKey: ['dailyProgress', userId, date],
    queryFn: async () => {
      if (!userId) return null;

      console.log('[Supabase] Fetching daily progress for:', userId, date);
      const { data, error } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('[Supabase] No daily progress found for date:', date);
          return null;
        }
        console.error('[Supabase] Error fetching daily progress:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        date: data.date,
        questionsAnswered: data.questions_answered,
        correctAnswers: data.correct_answers,
        studyTimeSeconds: data.study_time_seconds,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as DailyProgressData;
    },
    enabled: !!userId && !!date,
  });
}

export function useWeeklyProgress(userId: string | undefined, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['weeklyProgress', userId, startDate, endDate],
    queryFn: async () => {
      if (!userId) return [];

      console.log('[Supabase] Fetching weekly progress for:', userId, startDate, 'to', endDate);
      
      const { data, error } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('[Supabase] Error fetching weekly progress:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      console.log('[Supabase] Fetched', data?.length || 0, 'daily records');

      return (data || []).map((day: any) => ({
        id: day.id,
        userId: day.user_id,
        date: day.date,
        questionsAnswered: day.questions_answered,
        correctAnswers: day.correct_answers,
        studyTimeSeconds: day.study_time_seconds,
        createdAt: day.created_at,
        updatedAt: day.updated_at,
      })) as DailyProgressData[];
    },
    enabled: !!userId && !!startDate && !!endDate,
    staleTime: 60000,
    gcTime: 300000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useUpsertDailyProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      userId: string;
      date: string;
      questionsAnswered: number;
      correctAnswers: number;
      studyTimeSeconds: number;
    }) => {
      console.log('[Supabase] Upserting daily progress for:', input.userId, input.date);

      const { data, error } = await supabase
        .from('daily_progress')
        .upsert({
          user_id: input.userId,
          date: input.date,
          questions_answered: input.questionsAnswered,
          correct_answers: input.correctAnswers,
          study_time_seconds: input.studyTimeSeconds,
        }, {
          onConflict: 'user_id,date',
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error upserting daily progress:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      console.log('[Supabase] Daily progress upserted successfully');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dailyProgress', variables.userId, variables.date] });
      queryClient.invalidateQueries({ queryKey: ['weeklyProgress', variables.userId] });
    },
  });
}

export type AchievementType =
  | 'first_quiz'
  | 'quiz_master'
  | 'quiz_completed_10'
  | 'perfect_score'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'week_streak'
  | 'month_streak'
  | 'grand_master'
  | 'questions_100'
  | 'questions_500'
  | 'questions_1000'
  | 'hundred_questions'
  | 'five_hundred_questions'
  | 'thousand_questions'
  | 'anatomy_master'
  | 'speed_demon'
  | 'social_butterfly'
  | 'helpful_tutor'
  | 'room_creator'
  | 'top_ten'
  | 'champion'
  | 'early_bird'
  | 'night_owl'
  | 'weekend_warrior';

export interface UserAchievement {
  id: string;
  userId: string;
  achievementType: AchievementType;
  earnedAt: string;
  metadata: Record<string, any>;
}

export interface UserAchievementRow {
  id: string;
  user_id: string;
  achievement_type: AchievementType;
  metadata: Record<string, any> | null;
  earned_at: string;
}

export function useUserAchievements(userId: string | undefined) {
  return useQuery({
    queryKey: ['userAchievements', userId],
    queryFn: async () => {
      if (!userId) return [];

      console.log('[Supabase] Fetching achievements for user:', userId);
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) {
        console.error('[Supabase] Error fetching user achievements:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      console.log('[Supabase] Fetched', data?.length || 0, 'achievements');

      return (data || []).map((achievement: any) => ({
        id: achievement.id,
        userId: achievement.user_id,
        achievementType: achievement.achievement_type as AchievementType,
        earnedAt: achievement.earned_at,
        metadata: achievement.metadata || {},
      })) as UserAchievement[];
    },
    enabled: !!userId,
  });
}

export interface RecentAchievementWithUser extends UserAchievement {
  userName: string;
  userAvatar: string;
}

export function useAllRecentAchievements(limit: number = 20) {
  return useQuery({
    queryKey: ['recentAchievements', limit],
    queryFn: async () => {
      console.log('[Supabase] Fetching recent achievements from all users with user info');
      
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .order('earned_at', { ascending: false })
        .limit(limit);

      if (achievementsError) {
        console.error('[Supabase] Error fetching recent achievements:', JSON.stringify({ message: achievementsError.message, code: achievementsError.code, details: achievementsError.details }));
        throw achievementsError;
      }

      if (!achievementsData || achievementsData.length === 0) {
        console.log('[Supabase] No achievements found');
        return [];
      }

      const userIds = [...new Set(achievementsData.map((a: any) => a.user_id))];
      
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', userIds);

      if (usersError) {
        console.error('[Supabase] Error fetching user info:', JSON.stringify({ message: usersError.message, code: usersError.code, details: usersError.details }));
      }

      const usersMap = new Map(
        (usersData || []).map((user: any) => [
          user.id,
          {
            name: user.name || 'Student',
            avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user.id}`,
          },
        ])
      );

      console.log('[Supabase] Fetched', achievementsData.length, 'recent achievements with user info');

      return achievementsData.map((achievement: any) => {
        const userInfo = usersMap.get(achievement.user_id) || {
          name: 'Student',
          avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${achievement.user_id}`,
        };

        return {
          id: achievement.id,
          userId: achievement.user_id,
          achievementType: achievement.achievement_type as AchievementType,
          earnedAt: achievement.earned_at,
          metadata: achievement.metadata || {},
          userName: userInfo.name,
          userAvatar: userInfo.avatar,
        };
      }) as RecentAchievementWithUser[];
    },
    staleTime: 60000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Grants an achievement for the current user.
 * Resolves to true when a row is returned; false on error or null data.
 */
export function useGrantAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (achievementId: AchievementType): Promise<boolean> => {
      console.log('[Supabase] Granting achievement:', achievementId, 'for current user');

      const { data, error } = await supabase.rpc('grant_my_achievement', {
        p_achievement: achievementId,
      });

      if (error) {
        const errorDetails = {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        };

        if (error.message?.includes('Not authenticated')) {
          console.warn('[Supabase] grant_my_achievement not authenticated:', JSON.stringify(errorDetails, null, 2));
          return false;
        }

        console.error('[Supabase] grant_my_achievement error:', JSON.stringify(errorDetails, null, 2));
        return false;
      }

      if (!data) {
        console.warn('[Supabase] grant_my_achievement returned no data');
        return false;
      }

      console.log('[Supabase] Achievement granted:', data);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAchievements'] });
      queryClient.invalidateQueries({ queryKey: ['recentAchievements'] });
    },
  });
}

export interface AchievementCheckResult {
  earned: AchievementType[];
  progress: Record<AchievementType, { current: number; required: number }>;
}

export function useCheckAchievements(userId: string | undefined) {
  return useQuery({
    queryKey: ['checkAchievements', userId],
    queryFn: async (): Promise<AchievementCheckResult> => {
      if (!userId) {
        return { earned: [], progress: {} as Record<AchievementType, { current: number; required: number }> };
      }

      console.log('[Supabase] Checking achievements for user:', userId);

      const [userProgressResult, achievementsResult] = await Promise.all([
        supabase.from('user_progress').select('*').eq('user_id', userId).single(),
        supabase.from('user_achievements').select('achievement_type').eq('user_id', userId),
      ]);

      if (userProgressResult.error && userProgressResult.error.code !== 'PGRST116') {
        console.error('[Supabase] Error fetching user progress:', JSON.stringify({ message: userProgressResult.error.message, code: userProgressResult.error.code, details: userProgressResult.error.details }));
        throw userProgressResult.error;
      }

      if (achievementsResult.error) {
        console.error('[Supabase] Error fetching achievements:', JSON.stringify({ message: achievementsResult.error.message, code: achievementsResult.error.code, details: achievementsResult.error.details }));
        throw achievementsResult.error;
      }

      const progress = userProgressResult.data;
      const earnedAchievements = new Set(
        (achievementsResult.data || []).map((a: any) => a.achievement_type as AchievementType)
      );

      const totalQuestions = progress?.total_questions_answered || 0;
      const currentStreak = progress?.current_streak || 0;

      const earned: AchievementType[] = [];
      const progressMap: Record<string, { current: number; required: number }> = {};

      if (totalQuestions >= 1 && !earnedAchievements.has('first_quiz')) {
        earned.push('first_quiz');
      }

      if (totalQuestions >= 10) {
        progressMap['quiz_completed_10'] = { current: totalQuestions, required: 10 };
        if (!earnedAchievements.has('quiz_completed_10')) earned.push('quiz_completed_10');
      } else {
        progressMap['quiz_completed_10'] = { current: totalQuestions, required: 10 };
      }

      if (totalQuestions >= 100) {
        progressMap['hundred_questions'] = { current: totalQuestions, required: 100 };
        if (!earnedAchievements.has('hundred_questions')) earned.push('hundred_questions');
      } else {
        progressMap['hundred_questions'] = { current: totalQuestions, required: 100 };
      }

      if (totalQuestions >= 500) {
        progressMap['five_hundred_questions'] = { current: totalQuestions, required: 500 };
        if (!earnedAchievements.has('five_hundred_questions')) earned.push('five_hundred_questions');
      } else {
        progressMap['five_hundred_questions'] = { current: totalQuestions, required: 500 };
      }

      if (totalQuestions >= 1000) {
        progressMap['thousand_questions'] = { current: totalQuestions, required: 1000 };
        if (!earnedAchievements.has('thousand_questions')) earned.push('thousand_questions');
      } else {
        progressMap['thousand_questions'] = { current: totalQuestions, required: 1000 };
      }

      if (currentStreak >= 7) {
        progressMap['week_streak'] = { current: currentStreak, required: 7 };
        if (!earnedAchievements.has('week_streak')) earned.push('week_streak');
      } else {
        progressMap['week_streak'] = { current: currentStreak, required: 7 };
      }

      if (currentStreak >= 30) {
        progressMap['month_streak'] = { current: currentStreak, required: 30 };
        if (!earnedAchievements.has('month_streak')) earned.push('month_streak');
      } else {
        progressMap['month_streak'] = { current: currentStreak, required: 30 };
      }

      if (currentStreak >= 100) {
        progressMap['grand_master'] = { current: currentStreak, required: 100 };
        if (!earnedAchievements.has('grand_master')) earned.push('grand_master');
      } else {
        progressMap['grand_master'] = { current: currentStreak, required: 100 };
      }

      console.log('[Supabase] Achievement check complete:', earned.length, 'new achievements earned');
      
      return {
        earned,
        progress: progressMap as Record<AchievementType, { current: number; required: number }>,
      };
    },
    enabled: !!userId,
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export interface DirectChat {
  id: string;
  isGroup: boolean;
  title?: string;
  createdBy: string;
  createdAt: string;
  participants: UserAccount[];
}

export interface DirectChatMessage {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export function useDirectChats(userId: string | undefined) {
  return useQuery({
    queryKey: ['directChats', userId],
    queryFn: async () => {
      if (!userId) return [];

      console.log('[Supabase] Fetching direct chats for user:', userId);
      
      const { data, error } = await supabase
        .from('direct_chat_participants')
        .select(`
          chat_id,
          direct_chats!inner (
            id,
            is_group,
            title,
            created_by,
            created_at
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('[Supabase] Error fetching direct chats:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        return [];
      }

      console.log('[Supabase] Fetched', data?.length || 0, 'chats');

      return (data || []).map((item: any) => ({
        id: item.direct_chats.id,
        isGroup: item.direct_chats.is_group,
        title: item.direct_chats.title,
        createdBy: item.direct_chats.created_by,
        createdAt: item.direct_chats.created_at,
        participants: [],
      })) as DirectChat[];
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}

export function useCreateDirectChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      createdBy: string;
      participantIds: string[];
      title?: string;
      showInFeed: boolean;
    }) => {
      console.log('[Supabase] Creating direct chat with participants:', input.participantIds.length);

      const isGroup = input.participantIds.length > 1;
      
      const { data: chatData, error: chatError } = await supabase
        .from('direct_chats')
        .insert({
          is_group: isGroup,
          title: input.title,
          created_by: input.createdBy,
        })
        .select()
        .single();

      if (chatError) {
        console.error('[Supabase] Error creating chat:', JSON.stringify({ message: chatError.message, code: chatError.code, details: chatError.details }));
        throw chatError;
      }

      const allParticipants = [input.createdBy, ...input.participantIds];
      const participantRecords = allParticipants.map((userId, index) => ({
        chat_id: chatData.id,
        user_id: userId,
        role: index === 0 ? 'owner' : 'member',
      }));

      const { error: participantsError } = await supabase
        .from('direct_chat_participants')
        .insert(participantRecords);

      if (participantsError) {
        console.error('[Supabase] Error adding participants:', JSON.stringify({ message: participantsError.message, code: participantsError.code, details: participantsError.details }));
        throw participantsError;
      }

      if (input.showInFeed) {
        const { error: feedError } = await supabase
          .from('activity_feed')
          .insert({
            actor_id: input.createdBy,
            type: 'started_chat',
            chat_id: chatData.id,
            payload: {
              chatId: chatData.id,
              participantCount: allParticipants.length,
              title: input.title,
              isGroup,
            },
          });

        if (feedError) {
          console.error('[Supabase] Error creating feed item:', JSON.stringify({ message: feedError.message, code: feedError.code, details: feedError.details }));
        }
      }

      console.log('[Supabase] Direct chat created:', chatData.id);
      return chatData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['directChats', variables.createdBy] });
      queryClient.invalidateQueries({ queryKey: ['activityFeed'] });
    },
  });
}

export function useGetOrCreateDirectChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      currentUserId: string;
      otherUserId: string;
    }) => {
      console.log('[Supabase] Getting or creating 1-on-1 chat between:', input.currentUserId, 'and', input.otherUserId);

      const { data: existingChats, error: searchError } = await supabase
        .from('direct_chat_participants')
        .select(`
          chat_id,
          direct_chats!inner (
            id,
            is_group,
            created_at
          )
        `)
        .eq('user_id', input.currentUserId);

      if (searchError) {
        console.error('[Supabase] Error searching for existing chat:', JSON.stringify({ message: searchError.message, code: searchError.code, details: searchError.details }));
        throw searchError;
      }

      if (existingChats && existingChats.length > 0) {
        for (const chat of existingChats) {
          const chatId = (chat as any).direct_chats.id;
          const isGroup = (chat as any).direct_chats.is_group;
          
          if (!isGroup) {
            const { data: participants, error: participantsError } = await supabase
              .from('direct_chat_participants')
              .select('user_id')
              .eq('chat_id', chatId);

            if (!participantsError && participants && participants.length === 2) {
              const userIds = participants.map((p: any) => p.user_id);
              if (userIds.includes(input.currentUserId) && userIds.includes(input.otherUserId)) {
                console.log('[Supabase] Found existing 1-on-1 chat:', chatId);
                return { id: chatId, created: false };
              }
            }
          }
        }
      }

      console.log('[Supabase] No existing chat found, creating new one');
      const { data: newChat, error: createError } = await supabase
        .from('direct_chats')
        .insert({
          is_group: false,
          title: null,
          created_by: input.currentUserId,
        })
        .select()
        .single();

      if (createError) {
        console.error('[Supabase] Error creating new chat:', JSON.stringify({ message: createError.message, code: createError.code, details: createError.details }));
        throw createError;
      }

      const { error: participantsError } = await supabase
        .from('direct_chat_participants')
        .insert([
          { chat_id: newChat.id, user_id: input.currentUserId, role: 'owner' },
          { chat_id: newChat.id, user_id: input.otherUserId, role: 'member' },
        ]);

      if (participantsError) {
        console.error('[Supabase] Error adding participants:', JSON.stringify({ message: participantsError.message, code: participantsError.code, details: participantsError.details }));
        throw participantsError;
      }

      console.log('[Supabase] Created new 1-on-1 chat:', newChat.id);
      return { id: newChat.id, created: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['directChats', variables.currentUserId] });
    },
  });
}

export function useDirectChatMessages(chatId: string | undefined) {
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const fetchMessages = async () => {
      console.log('[Supabase] Fetching messages for chat:', chatId);
      setIsLoading(true);

      const { data, error } = await supabase
        .from('direct_chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('[Supabase] Error fetching chat messages:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        setIsLoading(false);
        return;
      }

      const formattedMessages: DirectChatMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        chatId: msg.chat_id,
        userId: msg.user_id,
        userName: 'User',
        userAvatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${msg.user_id}`,
        content: msg.content,
        createdAt: msg.created_at,
      }));

      setMessages(formattedMessages);
      setIsLoading(false);
      console.log('[Supabase] Loaded', formattedMessages.length, 'chat messages');
    };

    fetchMessages();

    const channel = supabase
      .channel(`direct-chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          console.log('[Supabase] New chat message received:', payload);
          
          const newMessage: DirectChatMessage = {
            id: payload.new.id,
            chatId: payload.new.chat_id,
            userId: payload.new.user_id,
            userName: 'User',
            userAvatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${payload.new.user_id}`,
            content: payload.new.content,
            createdAt: payload.new.created_at,
          };
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      console.log('[Supabase] Unsubscribing from chat:', chatId);
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  return { messages, isLoading };
}

export function useSendDirectMessage() {
  return useMutation({
    mutationFn: async (input: {
      chatId: string;
      userId: string;
      content: string;
    }) => {
      console.log('[Supabase] Sending message to chat:', input.chatId);

      const { data, error } = await supabase
        .from('direct_chat_messages')
        .insert({
          chat_id: input.chatId,
          user_id: input.userId,
          content: input.content,
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error sending chat message:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      console.log('[Supabase] Chat message sent:', data.id);
      return data;
    },
  });
}

export type ActivityFeedType = 'achievement' | 'started_chat' | 'joined_room' | 'milestone';

export interface ActivityFeedItem {
  id: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  type: ActivityFeedType;
  chatId?: string;
  payload: Record<string, any>;
  createdAt: string;
}

export function useActivityFeed(userId?: string, limit = 20) {
  return useQuery({
    queryKey: ['activityFeed', userId, limit],
    queryFn: async () => {
      console.log('[Supabase] Fetching activity feed...');
      const { data, error } = await supabase
        .from('activity_feed')
        .select('id, actor_id, type, payload, created_at, chat_id')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[Supabase] Error fetching activity feed:', JSON.stringify({
          message: error.message, code: error.code, details: error.details
        }));
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      const actorIds = [...new Set(data.map(item => item.actor_id))];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', actorIds);

      if (profilesError) {
        console.error('[Supabase] Error fetching activity actor profiles:', JSON.stringify({
          message: profilesError.message, code: profilesError.code, details: profilesError.details
        }));
      }

      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile])
      );

      return data.map((item: any) => {
        const profile = profilesMap.get(item.actor_id);
        return {
          id: item.id,
          actorId: item.actor_id,
          actorName: profile?.name || (item.actor_id === userId ? 'You' : 'Student'),
          actorAvatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${item.actor_id}`,
          type: item.type as ActivityFeedType,
          chatId: item.chat_id,
          createdAt: item.created_at,
          payload: item.payload || {},
        } as ActivityFeedItem;
      });
    },
    enabled: true,
    staleTime: 60000,
    refetchInterval: 60000,
    retry: false,
  });
}

export type SubscriptionStatus = 'free' | 'premium' | 'trial';
export type SubscriptionType = 'monthly' | 'yearly' | null;

export interface UserSubscription {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  type: SubscriptionType;
  startedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionStatusResult {
  isPremium: boolean;
  status: SubscriptionStatus;
  type: SubscriptionType;
  expiresAt: string | null;
}

export function useSubscriptionStatus(userId: string | undefined) {
  return useQuery({
    queryKey: ['subscription', userId],
    queryFn: async (): Promise<SubscriptionStatusResult> => {
      if (!userId) {
        return {
          isPremium: false,
          status: 'free',
          type: null,
          expiresAt: null,
        };
      }

      console.log('[Supabase] Fetching subscription for user:', userId);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('[Supabase] No subscription found, returning free status');
          return {
            isPremium: false,
            status: 'free',
            type: null,
            expiresAt: null,
          };
        }
        console.error('[Supabase] Error fetching subscription:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      const status = data.status as SubscriptionStatus;
      const isPremium = status === 'premium' || status === 'trial';

      if (isPremium && data.expires_at) {
        const expiresAt = new Date(data.expires_at);
        const now = new Date();
        if (expiresAt < now) {
          console.log('[Supabase] Subscription expired, treating as free');
          return {
            isPremium: false,
            status: 'free',
            type: null,
            expiresAt: data.expires_at,
          };
        }
      }

      console.log('[Supabase] Subscription status:', status, 'isPremium:', isPremium);
      
      return {
        isPremium,
        status,
        type: data.type as SubscriptionType,
        expiresAt: data.expires_at,
      };
    },
    enabled: !!userId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      userId: string;
      status: SubscriptionStatus;
      type?: SubscriptionType;
      expiresAt?: string | null;
    }) => {
      console.log('[Supabase] Updating subscription for user:', input.userId, 'to status:', input.status);

      const updateData: any = {
        status: input.status,
      };

      if (input.type !== undefined) {
        updateData.type = input.type;
      }

      if (input.expiresAt !== undefined) {
        updateData.expires_at = input.expiresAt;
      }

      if (input.status === 'premium' || input.status === 'trial') {
        updateData.started_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: input.userId,
          ...updateData,
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error updating subscription:', JSON.stringify({ message: error.message, code: error.code, details: error.details }));
        throw error;
      }

      console.log('[Supabase] Subscription updated successfully');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.userId] });
    },
  });
}

export function useUserPresence(userId?: string) {
  return useQuery({
    queryKey: ['userPresence', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      console.log('[Supabase] Fetching user presence:', userId);
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('[Supabase] Error fetching user presence:', error);
        return null;
      }

      const now = new Date();
      const lastSeen = new Date(data.last_seen);
      const minutesAgo = (now.getTime() - lastSeen.getTime()) / 60000;
      
      return {
        userId: data.user_id,
        isOnline: minutesAgo < 5,
        lastSeen: data.last_seen,
        status: minutesAgo < 5 ? 'online' : 'offline',
      };
    },
    enabled: !!userId,
    staleTime: 30000,
    refetchInterval: 30000,
  });
}

export function useUpdatePresence() {
  return useMutation({
    mutationFn: async (userId: string) => {
      console.log('[Supabase] Updating presence for:', userId);
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          last_seen: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('[Supabase] Error updating presence:', error);
        throw error;
      }
    },
  });
}

export function useOnlineFriends(userId?: string) {
  return useQuery({
    queryKey: ['onlineFriends', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('[Supabase] Fetching online friends for:', userId);
      
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
      
      const { data: presenceData, error: presenceError } = await supabase
        .from('user_presence')
        .select('user_id, last_seen')
        .gte('last_seen', fiveMinutesAgo.toISOString())
        .neq('user_id', userId);

      if (presenceError) {
        const isAbortError = 
          presenceError.name === 'AbortError' ||
          presenceError.code === 'ABORT_ERR' ||
          (presenceError.message && (presenceError.message.includes('abort') || presenceError.message.includes('signal is aborted')));
        
        if (isAbortError) {
          console.log('[Supabase] Online friends query cancelled (component unmounted)');
          return [];
        }
        console.error('[Supabase] Error fetching online friends:', JSON.stringify({ message: presenceError.message, code: presenceError.code, details: presenceError.details }));
        return [];
      }

      if (!presenceData || presenceData.length === 0) {
        return [];
      }

      const userIds = presenceData.map((p: any) => p.user_id);
      
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', userIds);

      if (usersError) {
        const isAbortError = 
          usersError.name === 'AbortError' ||
          usersError.code === 'ABORT_ERR' ||
          (usersError.message && (usersError.message.includes('abort') || usersError.message.includes('signal is aborted')));
        
        if (isAbortError) {
          console.log('[Supabase] Online friends user data query cancelled');
          return [];
        }
        console.error('[Supabase] Error fetching user data for online friends:', JSON.stringify({ message: usersError.message, code: usersError.code, details: usersError.details }));
        return [];
      }

      const presenceMap = new Map(
        presenceData.map((p: any) => [p.user_id, p.last_seen])
      );

      return (usersData || [])
        .map((user: any) => ({
          id: user.id,
          name: user.name || 'Student',
          avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user.id}`,
          lastSeen: presenceMap.get(user.id),
          isOnline: true,
        }));
    },
    enabled: !!userId,
    staleTime: 30000,
    refetchInterval: 30000,
    retry: false,
  });
}

export function useFriendActivity(userId?: string, limit = 20) {
  return useQuery({
    queryKey: ['friendActivity', userId, limit],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('[Supabase] Fetching friend activity...');
      
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
      
      const { data: presenceData, error: presenceError } = await supabase
        .from('user_presence')
        .select('user_id, last_seen')
        .gte('last_seen', thirtyMinutesAgo.toISOString())
        .neq('user_id', userId)
        .order('last_seen', { ascending: false })
        .limit(limit);

      if (presenceError) {
        const isAbortError = 
          presenceError.name === 'AbortError' ||
          presenceError.code === 'ABORT_ERR' ||
          (presenceError.message && (presenceError.message.includes('abort') || presenceError.message.includes('signal is aborted')));
        
        if (isAbortError) {
          console.log('[Supabase] Friend activity query cancelled');
          return [];
        }
        console.error('[Supabase] Error fetching friend activity:', JSON.stringify({ message: presenceError.message, code: presenceError.code, details: presenceError.details }));
        return [];
      }

      if (!presenceData || presenceData.length === 0) {
        return [];
      }

      const userIds = presenceData.map((p: any) => p.user_id);
      
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', userIds);

      if (usersError) {
        const isAbortError = 
          usersError.name === 'AbortError' ||
          usersError.code === 'ABORT_ERR' ||
          (usersError.message && (usersError.message.includes('abort') || usersError.message.includes('signal is aborted')));
        
        if (isAbortError) {
          console.log('[Supabase] Friend activity user data query cancelled');
          return [];
        }
        console.error('[Supabase] Error fetching user data for friend activity:', JSON.stringify({ message: usersError.message, code: usersError.code, details: usersError.details }));
        return [];
      }

      const usersMap = new Map(
        (usersData || []).map((user: any) => [
          user.id,
          {
            name: user.name || 'Student',
            avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user.id}`,
          },
        ])
      );

      return presenceData.map((item: any, index: number) => {
        const userInfo = usersMap.get(item.user_id) || {
          name: 'Student',
          avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${item.user_id}`,
        };

        return {
          id: `activity_${item.user_id}_${index}`,
          userId: item.user_id,
          userName: userInfo.name,
          userAvatar: userInfo.avatar,
          activityType: 'came_online' as const,
          timestamp: item.last_seen,
          metadata: {},
        };
      });
    },
    enabled: !!userId,
    staleTime: 60000,
    refetchInterval: 60000,
    retry: false,
  });
}

export function usePresenceSubscription(userId?: string, onPresenceChange?: (presence: any) => void) {
  useEffect(() => {
    if (!userId || !onPresenceChange) return;

    console.log('[Supabase] Setting up presence subscription...');
    
    const channel = supabase
      .channel('presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        (payload) => {
          console.log('[Supabase] Presence change:', payload);
          onPresenceChange(payload);
        }
      )
      .subscribe();

    return () => {
      console.log('[Supabase] Cleaning up presence subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, onPresenceChange]);
}
