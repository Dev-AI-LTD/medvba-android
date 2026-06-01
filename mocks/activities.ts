export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'achievement' | 'streak' | 'quiz_complete' | 'exam_passed' | 'study_room' | 'milestone';
  title: string;
  description: string;
  timestamp: Date;
  reactions: { emoji: string; count: number }[];
  category?: string;
}

export type SessionStatus = 'SCHEDULED' | 'LIVE' | 'ENDED';

export interface StudySession {
  id: string;
  roomId: string;
  title: string;
  description?: string;
  scheduledFor: string;
  durationMinutes: number;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  joinUrl?: string;
  startUrl?: string;
  status: SessionStatus;
  attendees: string[];
  category: string;
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
  joinUrl?: string;
  startUrl?: string;
}

export const activities: Activity[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Mihai D.',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    type: 'streak',
    title: '89 Day Streak!',
    description: 'Just hit 89 days of consecutive studying! The grind never stops.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    reactions: [{ emoji: '💪', count: 23 }, { emoji: '👏', count: 18 }],
  },
  {
    id: '2',
    userId: '2',
    userName: 'Elena R.',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    type: 'exam_passed',
    title: 'Anatomy Exam Simulation - 94%',
    description: 'Crushed the anatomy simulation! Those late nights are paying off 📚',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    reactions: [{ emoji: '🎉', count: 67 }, { emoji: '🧠', count: 34 }, { emoji: '⭐', count: 28 }],
    category: 'anatomy',
  },
  {
    id: '3',
    userId: '3',
    userName: 'Andrei P.',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    type: 'study_room',
    title: 'Hosting: Biochemistry Review',
    description: 'Join my study room! Reviewing metabolic pathways together 🧬',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    reactions: [{ emoji: '📖', count: 12 }, { emoji: '🤝', count: 8 }],
    category: 'biochemistry',
  },
  {
    id: '4',
    userId: '4',
    userName: 'Maria S.',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    type: 'milestone',
    title: '5,000 Questions Answered! 🏆',
    description: 'Finally hit this milestone! Every question brings me closer to my dream.',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    reactions: [{ emoji: '🏆', count: 89 }, { emoji: '💪', count: 56 }, { emoji: '🎯', count: 41 }],
  },
  {
    id: '5',
    userId: '5',
    userName: 'Cristian B.',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
    type: 'quiz_complete',
    title: 'Pharmacology Quiz - 88%',
    description: 'Getting better at drug mechanisms! Antibiotics chapter done ✅',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    reactions: [{ emoji: '💊', count: 23 }, { emoji: '👍', count: 15 }],
    category: 'pharmacology',
  },
  {
    id: '6',
    userId: '6',
    userName: 'Ioana T.',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop',
    type: 'achievement',
    title: 'Unlocked: Pathology Master 🎖️',
    description: 'Completed all pathology chapters with 80%+ accuracy!',
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    reactions: [{ emoji: '🎖️', count: 78 }, { emoji: '🔬', count: 45 }, { emoji: '🙌', count: 32 }],
    category: 'pathology',
  },
];

export let studySessions: StudySession[] = [
  {
    id: 'session_1',
    roomId: '1',
    title: 'Anatomy Review - Upper Limbs',
    description: 'Deep dive into brachial plexus and arm muscles',
    scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    hostId: 'user_3',
    hostName: 'Andrei P.',
    hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    status: 'SCHEDULED',
    attendees: ['user_1', 'user_2'],
    category: 'anatomy',
  },
  {
    id: 'session_2',
    roomId: '2',
    title: 'Biochemistry Crash Course',
    description: 'Metabolic pathways and enzyme kinetics',
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 90,
    hostId: 'user_2',
    hostName: 'Elena R.',
    hostAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    status: 'SCHEDULED',
    attendees: ['user_1'],
    category: 'biochemistry',
  },
];

export const studyRooms: StudyRoom[] = [
  { id: '1', name: 'Anatomy Night Owls', host: 'Andrei P.', hostId: 'user_3', hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', participants: 12, maxParticipants: 20, category: 'anatomy', isLive: false },
  { id: '2', name: 'Biochemistry Basics', host: 'Elena R.', hostId: 'user_2', hostAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop', participants: 8, maxParticipants: 15, category: 'biochemistry', isLive: false },
  { id: '3', name: 'Exam Prep Sprint', host: 'Mihai D.', hostId: 'current_user', hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', participants: 18, maxParticipants: 25, category: 'mixed', isLive: false },
];
