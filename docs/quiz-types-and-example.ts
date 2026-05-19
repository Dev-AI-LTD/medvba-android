/**
 * Excerpt: tipuri pentru întrebări + un quiz existent + config module.
 * Surse: mocks/questions.ts, mocks/questions_bones_axial.ts, mocks/chapters.ts
 */

// ============== 1. TIPURI (mocks/questions.ts) ==============

export interface Question {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  question_ro?: string;
  options: string[];
  options_ro?: string[];
  correctAnswer: number;
  explanation: string;
  explanation_ro?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  questionCount: number;
  completedCount: number;
}

// ============== 2. EXEMPLU QUIZ EXISTENT (2 întrebări din questions_bones_axial) ==============

export const generalVertebraeQuestionsExcerpt: Question[] = [
  {
    id: 'gv1',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which components are present in a typical vertebra?',
    question_ro: 'Care componente sunt prezente într-o vertebră tipică?',
    options: [
      'Vertebral body only',
      'Vertebral arch only',
      'Vertebral body and vertebral arch giving rise to several processes',
      'Only spinous and transverse processes',
      'Only articular processes and pedicles',
    ],
    options_ro: [
      'Doar corpul vertebral',
      'Doar arcul vertebral',
      'Corpul vertebral și arcul vertebral care dau naștere la mai multe procese',
      'Doar procesele spinoase și transversale',
      'Doar procesele articulare și pediculii',
    ],
    correctAnswer: 2,
    explanation:
      'A typical vertebra consists of a vertebral body anteriorly and a vertebral arch posteriorly, together forming the vertebral foramen and giving rise to multiple processes.',
    explanation_ro:
      'O vertebră tipică constă dintr-un corp vertebral anterior și un arc vertebral posterior, formând împreună foramenul vertebral și dând naștere la multiple procese.',
  },
  {
    id: 'gv2',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which structures form the vertebral arch of a typical vertebra?',
    question_ro: 'Care structuri formează arcul vertebral al unei vertebre tipice?',
    options: [
      'Pedicles and laminae',
      'Transverse and spinous processes',
      'Articular processes only',
      'Body and spinous process',
      'Intervertebral discs',
    ],
    options_ro: [
      'Pediculii și laminele',
      'Procesele transversale și spinoase',
      'Doar procesele articulare',
      'Corpul și procesul spinos',
      'Discurile intervertebrale',
    ],
    correctAnswer: 0,
    explanation:
      'The vertebral arch is formed by a pair of pedicles and a pair of laminae, projecting posteriorly from the vertebral body.',
    explanation_ro:
      'Arcul vertebral este format dintr-o pereche de pediculi și o pereche de lamine, care se proiectează posterior de la corpul vertebral.',
  },
];

// ============== 3. TIPURI ȘI CONFIG MODULE (mocks/chapters.ts) ==============

export interface Chapter {
  id: string;
  name: string;
  questions: Question[];
}

export interface ModuleChapters {
  moduleId: string;
  moduleName: string;
  chapters: Chapter[];
}

/** Exemplu config modul: un singur modul cu 2 capitole (folosind excerpt-ul de mai sus). */
export const upperLowerLimbsChaptersExcerpt: ModuleChapters = {
  moduleId: 'upper-lower-limbs',
  moduleName: 'Upper/Lower Limbs',
  chapters: [
    { id: 'general-vertebrae', name: 'Vertebre Generale', questions: generalVertebraeQuestionsExcerpt },
    {
      id: 'regional-vertebrae',
      name: 'Vertebre Regionale',
      questions: generalVertebraeQuestionsExcerpt,
    },
  ],
};

// ============== 4. CONFIG CATEGORII (mocks/questions.ts) – cum arată în app ==============

export const categoriesExcerpt: Category[] = [
  {
    id: 'upper-lower-limbs',
    name: 'Upper/Lower Limbs',
    icon: 'bone',
    color: '#FF6B6B',
    questionCount: 8200,
    completedCount: 1240,
  },
  {
    id: 'internal-organs',
    name: 'Internal Organs',
    icon: 'heart',
    color: '#4ECDC4',
    questionCount: 7500,
    completedCount: 980,
  },
  {
    id: 'head-neck',
    name: 'Head and Neck',
    icon: 'user',
    color: '#45B7D1',
    questionCount: 6800,
    completedCount: 720,
  },
  {
    id: 'neuroanatomy',
    name: 'Neuroanatomy',
    icon: 'brain',
    color: '#DDA0DD',
    questionCount: 5555,
    completedCount: 450,
  },
  {
    id: 'med-admission-barrons',
    name: 'Medical School Entrance Exam',
    icon: 'stethoscope',
    color: '#8E44AD',
    questionCount: 200,
    completedCount: 0,
  },
];

// ============== 5. MODUL ADMITERE (excerpt) ==============

/** Exemplu modul Medical School Entrance Exam – capitole cu cardiovascular populat. */
export const medAdmissionChaptersExcerpt: ModuleChapters = {
  moduleId: 'med-admission-barrons',
  moduleName: 'Medical School Entrance Exam',
  chapters: [
    { id: 'intro-anat-phys', name: 'Introducere în anatomie și fiziologie', questions: [] },
    { id: 'cardiovascular', name: 'Sistemul cardiovascular', questions: [] },
  ],
};
