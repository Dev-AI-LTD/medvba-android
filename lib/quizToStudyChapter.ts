import { STUDY_PILOT_MODULE_ID } from '@/constants/study';

export type StudyChapterTarget = {
  studyModuleId: string;
  studyChapterId: string;
};

const HEAD_NECK_STUDY_MODULE = 'head-neck';

/** Study summaries published under med-admission-barrons (see med-admission-manifest.json). */
const MED_ADMISSION_STUDY_CHAPTER_IDS = new Set([
  'intro-anat-phys',
  'chem-basics',
  'cell-biology',
  'tissues',
  'integumentary',
  'skeletal',
  'muscular',
  'nervous',
  'senses',
  'endocrine',
  'blood',
  'cardiovascular',
  'lymphatic',
  'respiratory',
  'digestive',
  'metabolism',
  'urinary',
  'repro-male',
  'repro-female',
  'embryology',
]);

function medAdmissionTarget(studyChapterId: string): StudyChapterTarget {
  return {
    studyModuleId: STUDY_PILOT_MODULE_ID,
    studyChapterId,
  };
}

function headNeckTarget(studyChapterId = 'head-neck-intro'): StudyChapterTarget {
  return {
    studyModuleId: HEAD_NECK_STUDY_MODULE,
    studyChapterId,
  };
}

const INTERNAL_ORGANS_TO_STUDY: Record<string, string> = {
  'internal-organs-intro': 'cardiovascular',
  'pulmonary-circulation': 'cardiovascular',
  'systemic-portal': 'cardiovascular',
  'fetal-circulation': 'cardiovascular',
  'microcirculation': 'cardiovascular',
  'hemodynamics': 'cardiovascular',
  'baroreflex': 'cardiovascular',
  'coronary-circulation': 'cardiovascular',
  'cerebral-autoregulation': 'cardiovascular',
  'heart-external': 'cardiovascular',
  'heart-vascularization': 'cardiovascular',
  'right-atrium': 'cardiovascular',
  'left-atrium': 'cardiovascular',
  'right-ventricle': 'cardiovascular',
  'left-ventricle': 'cardiovascular',
  'cardiac-plexuses': 'cardiovascular',
  'fibrous-pericardium': 'cardiovascular',
  'pericardial-sinuses': 'cardiovascular',
  'phrenic-nerves': 'nervous',
  'vagus-nerves-thorax': 'nervous',
  'thoracic-sympathetic': 'nervous',
  'celiac-plexus': 'nervous',
  'ascending-aorta': 'cardiovascular',
  'aortic-arch': 'cardiovascular',
  'descending-thoracic-aorta': 'cardiovascular',
  'internal-thoracic-vessels': 'cardiovascular',
  'brachiocephalic-veins-svc': 'cardiovascular',
  'inferior-vena-cava': 'cardiovascular',
  'azygos-veins': 'cardiovascular',
  'abdominal-aorta': 'cardiovascular',
  'celiac-trunk': 'cardiovascular',
  'hepatic-artery': 'cardiovascular',
  'portal-vein': 'cardiovascular',
  'splenic-vessels': 'cardiovascular',
  'superior-mesenteric-vessels': 'cardiovascular',
  'inferior-mesenteric-vessels': 'cardiovascular',
  'rectal-arteries': 'cardiovascular',
  'genital-vessels': 'cardiovascular',
  'internal-iliac-vessels': 'cardiovascular',
  'lymphatic-system': 'lymphatic',
  'thoracic-duct': 'lymphatic',
  'thoracic-trachea-bronchi': 'respiratory',
  'main-bronchi': 'respiratory',
  'lung-apex': 'respiratory',
  'lung-costal-surface': 'respiratory',
  'right-lung-mediastinal': 'respiratory',
  'left-lung-mediastinal': 'respiratory',
  'pleura-sinuses': 'respiratory',
  'pulmonary-pedicles': 'respiratory',
  'thoracic-cavity': 'respiratory',
  'mediastinum-compartments': 'respiratory',
  'anterior-mediastinum': 'respiratory',
  'posterior-mediastinum': 'respiratory',
  'thoracic-esophagus': 'digestive',
  'stomach-fixation': 'digestive',
  'stomach-external': 'digestive',
  'stomach-pedicles': 'digestive',
  'duodenum': 'digestive',
  'pancreas': 'digestive',
  'liver-external': 'digestive',
  'hepatic-pedicle': 'digestive',
  'liver-segmentation': 'digestive',
  'gallbladder': 'digestive',
  'extrahepatic-biliary': 'digestive',
  'spleen': 'digestive',
  'peritoneal-compartments': 'digestive',
  'greater-lesser-omentum': 'digestive',
  'gastric-lodge': 'digestive',
  'hepatic-lodge': 'digestive',
  'splenic-lodge': 'digestive',
  'jejuno-ileum': 'digestive',
  'mesentery': 'digestive',
  'cecum-appendix': 'digestive',
  'ascending-colon': 'digestive',
  'transverse-colon': 'digestive',
  'descending-colon': 'digestive',
  'sigmoid-colon': 'digestive',
  'sigmoid-meso-fossa': 'digestive',
  'pelvic-rectum': 'digestive',
  'rectal-lodge-female': 'digestive',
  'rectal-lodge-male': 'digestive',
  'renal-lodge-fascia': 'urinary',
  'right-kidney': 'urinary',
  'left-kidney': 'urinary',
  'right-renal-pedicle': 'urinary',
  'left-renal-pedicle': 'urinary',
  'urinary-excretory': 'urinary',
  'ureter': 'urinary',
  'adrenal-glands': 'endocrine',
  'urinary-bladder': 'urinary',
  'bladder-lodge': 'urinary',
  'male-urethra': 'urinary',
  'female-urethra': 'urinary',
  'testicle': 'repro-male',
  'scrotal-sac': 'repro-male',
  'epididymo-testicular': 'repro-male',
  'vas-deferens': 'repro-male',
  'prostate-seminal': 'repro-male',
  'penis': 'repro-male',
  'ovary': 'repro-female',
  'uterine-tube': 'repro-female',
  'uterus': 'repro-female',
  'broad-ligaments': 'repro-female',
  'vagina': 'repro-female',
  'vulva': 'repro-female',
  'bulbo-vaginal-glands': 'repro-female',
};

const UPPER_LOWER_SKELETAL = new Set([
  'general-vertebrae',
  'regional-vertebrae',
  'thoracic-vertebrae',
  'lumbar-vertebrae',
  'sacrum',
  'atlas-axis',
  'ribs',
  'sternum',
  'clavicle',
  'humerus',
  'radius-ulna',
  'carpal-bones',
  'hip-bone',
  'femur',
  'patella',
  'tibia',
  'fibula',
  'tibia-fibula',
  'talus',
  'calcaneus',
  'tarsal-bones',
  'upper-limb-bones',
  'shoulder-joint',
  'elbow-joint',
  'wrist-joint',
  'hip-joint',
  'knee-joint',
  'ankle-joint',
]);

const UPPER_LOWER_MUSCULAR = new Set([
  'shoulder-muscles',
  'arm-muscles',
  'forearm-muscles',
  'anterior-thigh',
  'hamstrings',
  'medial-thigh',
  'leg-muscles',
  'hallux-muscles',
  'midplantar-muscles',
]);

const UPPER_LOWER_NERVOUS = new Set([
  'median-nerve',
  'musculocutaneous-nerve',
  'radial-nerve',
  'brachial-plexus',
  'lumbar-plexus',
  'sacral-plexus',
  'sensory-innervation',
]);

const NEURO_SENSES = new Set([
  'orbit-walls',
  'eyelids-conjunctiva',
  'lacrimal-apparatus',
  'extraocular-muscles',
  'eye-anatomy',
  'external-ear',
  'middle-ear-contents',
  'middle-ear-walls',
  'auditory-tube',
  'inner-ear',
  'taste-receptors',
  'cn-vii-facial',
  'cn-viii-vestibulocochlear',
]);

const NEURO_ENDOCRINE = new Set([
  'hypothalamus',
  'pineal-gland',
  'pituitary-gland',
]);

function mapUpperLowerLimbs(quizChapterId: string): StudyChapterTarget | null {
  if (UPPER_LOWER_SKELETAL.has(quizChapterId)) {
    return medAdmissionTarget('skeletal');
  }
  if (UPPER_LOWER_MUSCULAR.has(quizChapterId)) {
    return medAdmissionTarget('muscular');
  }
  if (UPPER_LOWER_NERVOUS.has(quizChapterId)) {
    return medAdmissionTarget('nervous');
  }
  if (quizChapterId === 'brachial-artery') {
    return medAdmissionTarget('cardiovascular');
  }
  return null;
}

function mapNeuroanatomy(quizChapterId: string): StudyChapterTarget {
  if (NEURO_SENSES.has(quizChapterId)) {
    return medAdmissionTarget('senses');
  }
  if (NEURO_ENDOCRINE.has(quizChapterId)) {
    return medAdmissionTarget('endocrine');
  }
  return medAdmissionTarget('nervous');
}

export function resolveStudyChapterForQuiz(
  quizModuleId: string,
  quizChapterId: string,
): StudyChapterTarget | null {
  const chapterId = quizChapterId.trim();
  if (!quizModuleId || !chapterId) return null;

  if (quizModuleId === STUDY_PILOT_MODULE_ID) {
    if (MED_ADMISSION_STUDY_CHAPTER_IDS.has(chapterId)) {
      return medAdmissionTarget(chapterId);
    }
    return null;
  }

  if (quizModuleId === 'internal-organs') {
    const studyChapterId = INTERNAL_ORGANS_TO_STUDY[chapterId];
    return studyChapterId ? medAdmissionTarget(studyChapterId) : null;
  }

  if (quizModuleId === 'upper-lower-limbs') {
    return mapUpperLowerLimbs(chapterId);
  }

  if (quizModuleId === 'head-neck') {
    return headNeckTarget('head-neck-intro');
  }

  if (quizModuleId === 'neuroanatomy') {
    return mapNeuroanatomy(chapterId);
  }

  return null;
}

/** Parent Barron's chapter for a granular quiz chapter (breadcrumb + fallback). */
export function getParentStudyChapter(
  quizModuleId: string,
  quizChapterId: string,
): StudyChapterTarget | null {
  return resolveStudyChapterForQuiz(quizModuleId, quizChapterId);
}
