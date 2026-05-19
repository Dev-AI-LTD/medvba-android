import type { Question } from '@/mocks/questions';
import { getAllQuestionsWithChapters, moduleChaptersMap } from '@/mocks/chapters';

export type QuestionChapterLink = {
  moduleId: string;
  chapterId: string;
  chapterName: string;
};

export type QuestionWithChapterLink = {
  question: Question;
  chapterId: string;
  chapterName: string;
  moduleId: string;
};

type TopicRule = {
  chapterId: string;
  patterns: RegExp[];
};

let questionChapterIndex: Map<string, QuestionChapterLink> | null = null;

function buildQuestionChapterIndex(): Map<string, QuestionChapterLink> {
  const index = new Map<string, QuestionChapterLink>();

  for (const moduleId of Object.keys(moduleChaptersMap)) {
    for (const { question, chapterId, chapterName } of getAllQuestionsWithChapters(moduleId)) {
      if (!index.has(question.id)) {
        index.set(question.id, { moduleId, chapterId, chapterName });
      }
    }
  }

  return index;
}

function getQuestionChapterIndex(): Map<string, QuestionChapterLink> {
  if (!questionChapterIndex) {
    questionChapterIndex = buildQuestionChapterIndex();
  }
  return questionChapterIndex;
}

function normalizeSearchText(question: Question): string {
  const parts = [
    question.question,
    question.question_ro,
    ...(question.options ?? []),
    ...(question.options_ro ?? []),
  ];
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ' ');
}

function matchTopicRules(text: string, rules: TopicRule[]): string | null {
  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return rule.chapterId;
    }
  }
  return null;
}

function chapterNameFor(moduleId: string, chapterId: string): string {
  const chapters = moduleChaptersMap[moduleId]?.chapters ?? [];
  return chapters.find((chapter) => chapter.id === chapterId)?.name ?? chapterId;
}

const HEAD_NECK_TOPIC_RULES: TopicRule[] = [
  { chapterId: 'ethmoid-bone', patterns: [/etmoid|ethmoid|crista galli|cribriform|lama cribriform/i] },
  {
    chapterId: 'sphenoid-bone',
    patterns: [/sfenoid|sphenoid|sella turcica|rotundum|foramen ovale|foramen spinosum|fisura orbitar/i],
  },
  {
    chapterId: 'temporal-bone',
    patterns: [/osul temporal|temporal bone|stilomastoid|meatul acustic|trompa lui eustachio|arcada zigomatic/i],
  },
  { chapterId: 'occipital-bone', patterns: [/occipital|foramen magnum|suboccipital|nervul occipital/i] },
  { chapterId: 'frontal-bone', patterns: [/osul frontal|frontal bone|neurocraniu|neurocranium|viscerocraniu/i] },
  {
    chapterId: 'mandibula',
    patterns: [/mandibul|temporo.?mandibular|atm\b|luxați|wharton|digastric|hioid|omohioid|sternohioid/i],
  },
  {
    chapterId: 'masticatory-muscles',
    patterns: [/maseter|masticator|pterigoidian|temporal(?! bone)|maseter\b/i],
  },
  { chapterId: 'facial-muscles', patterns: [/mimic|orbicular|paralizia bell|paralizia facial/i] },
  {
    chapterId: 'external-carotid-artery',
    patterns: [
      /carotid|carotida|facial[aă]|maxilar[aă]|temporal[aă] superficial|lingual[aă]|tiroidian|occipital[aă] artery|epistaxis|sfenopalatin/i,
    ],
  },
  {
    chapterId: 'subclavian-artery',
    patterns: [/subclav|vertebral|jugular|toracic duct|ductul toracic|triunghiul carotidian|ansa cervical/i],
  },
  {
    chapterId: 'orbit',
    patterns: [
      /orbit|oculomotor|trohlear|abducens|oftalmic|optic canal|sinus cavernos|inelului zinn|cornee|conjunctiv|lacrimal/i,
    ],
  },
  {
    chapterId: 'nasal-cavity',
    patterns: [/nazal|nasal cavity|fosa nazal|coan[aă]|sinus maxilar|meatus|cornet/i],
  },
  { chapterId: 'pterygopalatine-fossa', patterns: [/pterigopalatin|ganglion.*meckel|vidian|sfeno.?palatin/i] },
  { chapterId: 'infratemporal-fossa', patterns: [/infratemporal|fosa infratemporal/i] },
  { chapterId: 'maxilla', patterns: [/maxilar(?!.*arter)/i] },
  { chapterId: 'zigomatic-bone', patterns: [/zigomatic|zygomatic/i] },
  {
    chapterId: 'head-neck-intro',
    patterns: [
      /tiroid|laring|faring|parotid|glanda|nerv cranian|nervul [ivx]+|hipoglos|vag\b|frenic|waldeyer|esofag|trahe|zenker/i,
    ],
  },
];

const NEURO_TOPIC_RULES: TopicRule[] = [
  { chapterId: 'spinal-cord-external', patterns: [/măduv[aă] spin|spinal cord|radicular|con medular/i] },
  { chapterId: 'brainstem-external', patterns: [/bulb|pont|mezencefal|brainstem|trunchiului cerebral/i] },
  { chapterId: 'cerebellum-external', patterns: [/cerebel|vermis|hemisfer cerebel/i] },
  { chapterId: 'thalamus-external', patterns: [/talamus|thalamus/i] },
  { chapterId: 'thalamus-nuclei', patterns: [/nuclei talamici|nucleu talamic/i] },
  { chapterId: 'hypothalamus', patterns: [/hipotalamus|hypothalamus/i] },
  { chapterId: 'pituitary-gland', patterns: [/hipofiz|pituitar|sella turcica/i] },
  { chapterId: 'pineal-gland', patterns: [/pineal|epifiz/i] },
  { chapterId: 'basal-nuclei', patterns: [/nucleul lenticular|nuclei bazali|caudat|pallidus|striat/i] },
  { chapterId: 'internal-capsule', patterns: [/capsula intern|internal capsule/i] },
  { chapterId: 'corpus-callosum', patterns: [/corp calos|corpus callosum/i] },
  { chapterId: 'hippocampal-formation', patterns: [/hipocamp|hippocamp|fornix|dentat/i] },
  { chapterId: 'frontal-lobe', patterns: [/lob frontal|frontal lobe|precentral/i] },
  { chapterId: 'parietal-lobe', patterns: [/lob parietal|parietal lobe|postcentral/i] },
  { chapterId: 'temporal-lobe', patterns: [/lob temporal|temporal lobe/i] },
  { chapterId: 'occipital-lobe', patterns: [/lob occipital|occipital lobe|calcarin/i] },
  { chapterId: 'circle-of-willis', patterns: [/willis|poligon/i] },
  { chapterId: 'internal-carotid-intracranial', patterns: [/carotid[aă] intern|sinus cavernos|sifon carotidian/i] },
  { chapterId: 'vertebrobasilar', patterns: [/vertebro|bazilar|arter[aă] vertebral/i] },
  { chapterId: 'anterior-cerebral-artery', patterns: [/arter[aă] cerebral[aă] anterioar|anterior cerebral/i] },
  { chapterId: 'middle-cerebral-artery', patterns: [/arter[aă] cerebral[aă] mijloc|middle cerebral/i] },
  { chapterId: 'posterior-cerebral-artery', patterns: [/arter[aă] cerebral[aă] posterioar|posterior cerebral/i] },
  { chapterId: 'dural-venous-sinuses', patterns: [/sinus dur|sinus sagital|sigmoid|venos/i] },
  { chapterId: 'csf-circulation', patterns: [/lichor|csf|subarahnoid|ventricular/i] },
  { chapterId: 'choroid-plexus', patterns: [/plex coroid|choroid plex/i] },
  { chapterId: 'anterior-horn-lateral', patterns: [/corn anterior|anterior horn lateral/i] },
  { chapterId: 'third-ventricle-floor', patterns: [/al treilea ventric|third ventric/i] },
  { chapterId: 'fourth-ventricle-floor', patterns: [/al patrulea ventric|fourth ventric/i] },
  { chapterId: 'spinal-meninges', patterns: [/mening|dura mater|arahnoid|pia mater/i] },
  { chapterId: 'orbit-walls', patterns: [/orbit[aă]|fisura orbit/i] },
  { chapterId: 'eye-anatomy', patterns: [/glob ocular|retina|coroid|sclera/i] },
  { chapterId: 'cn-vii-facial', patterns: [/facial|nervul vii|coarda timpan/i] },
  { chapterId: 'cn-viii-vestibulocochlear', patterns: [/vestibulo|cochlear|nervul viii|auditiv/i] },
  { chapterId: 'inner-ear', patterns: [/ureche intern|cochlea|semicircular|labirint/i] },
  { chapterId: 'middle-ear-contents', patterns: [/ureche medie|timpan|etrier|ciocan/i] },
  { chapterId: 'external-ear', patterns: [/ureche extern|pavilion|tragus/i] },
  { chapterId: 'neuro-intro', patterns: [/dezvoltarea sistemului nervos|neuron|glia|sistem nervos/i] },
];

function resolveByTopicRules(question: Question, moduleId: string, rules: TopicRule[], fallbackChapterId: string): QuestionChapterLink {
  const text = normalizeSearchText(question);
  const chapterId = matchTopicRules(text, rules) ?? fallbackChapterId;
  return {
    moduleId,
    chapterId,
    chapterName: chapterNameFor(moduleId, chapterId),
  };
}

export function resolveQuestionChapterLink(
  question: Question,
  fallbackCategory?: string,
): QuestionChapterLink | null {
  const indexed = getQuestionChapterIndex().get(question.id);
  if (indexed) return indexed;

  const category = question.category || fallbackCategory;
  if (!category || category === 'mixed') return null;

  if (question.id.startsWith('hn-exam-') || question.id.startsWith('hn-home-')) {
    return resolveByTopicRules(question, 'head-neck', HEAD_NECK_TOPIC_RULES, 'head-neck-intro');
  }

  if (question.id.startsWith('neuro-exam-aff-')) {
    return resolveByTopicRules(question, 'neuroanatomy', NEURO_TOPIC_RULES, 'neuro-intro');
  }

  if (category === 'head-neck') {
    return resolveByTopicRules(question, 'head-neck', HEAD_NECK_TOPIC_RULES, 'head-neck-intro');
  }

  if (category === 'neuroanatomy') {
    return resolveByTopicRules(question, 'neuroanatomy', NEURO_TOPIC_RULES, 'neuro-intro');
  }

  if (moduleChaptersMap[category]) {
    const introByModule: Record<string, string> = {
      'med-admission-barrons': 'intro-anat-phys',
    };
    const chapterId = introByModule[category];
    if (chapterId) {
      return {
        moduleId: category,
        chapterId,
        chapterName: chapterNameFor(category, chapterId),
      };
    }
  }

  return null;
}

export function buildQuestionsWithChapters(
  questions: Question[],
  category: string,
): QuestionWithChapterLink[] {
  return questions.map((question) => {
    const link = resolveQuestionChapterLink(question, category);
    return {
      question,
      chapterId: link?.chapterId ?? '',
      chapterName: link?.chapterName ?? '',
      moduleId: link?.moduleId ?? category,
    };
  });
}
