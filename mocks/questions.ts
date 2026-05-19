import { getModuleQuestionCount } from './chapters';

import { 
  internalOrgansQuestions, 
  headNeckQuestions, 
  neuroanatomyQuestions,
  pulmonaryAndBronchialCirculationQuestions,
  systemicAndPortalCirculationQuestions,
  fetalCirculationQuestions,
  microcirculationAndCapillaryExchangeQuestions,
  hemodynamicsAndFlowQuestions,
  baroreflexChemoreflexAutoregulationQuestions,
  coronaryCirculationQuestions,
  cerebralAutoregulationAndBBBQuestions,
  lymphaticSystemOverviewQuestions
} from './questions_internal_organs';

import {
  perforatingAndWatershedQuestions
} from './questions_neuro';

import {
  spinalCordExternalQuestions,
  brainstemExternalQuestions,
  cerebellumExternalQuestions,
  cerebellumLobulationQuestions
} from './questions_neuro_spinal_brainstem';

import {
  thalamusExternalQuestions,
  thalamusNucleiQuestions,
  hypothalamusQuestions,
  epithalamMetathalamQuestions,
  pinealGlandQuestions,
  pituitaryGlandQuestions,
  perforatedSpacesQuestions
} from './questions_neuro_diencephalon';

import {
  cerebralHemisphereSulciGyriQuestions,
  inferiorSurfaceQuestions,
  lateralSurfaceQuestions,
  medialSurfaceQuestions,
  occipitalLobeQuestions,
  frontalLobeQuestions,
  parietalLobeQuestions,
  temporalLobeQuestions,
  orbitalLobeQuestions,
  temporoOccipitalLobeQuestions
} from './questions_neuro_cerebral_hemispheres';

import {
  sensoryCorticalAreasQuestions,
  motorCorticalAreasQuestions,
  somestheticAreasQuestions,
  basalNucleiQuestions,
  internalCapsuleQuestions,
  externalExtremeCapsuleQuestions,
  corpusCallosumQuestions,
  fornixQuestions,
  anteriorPosteriorCommissuresQuestions,
  hippocampalFormationQuestions
} from './questions_neuro_cortical_basal';

import {
  internalCarotidIntracranialQuestions,
  internalCarotidBranchesQuestions,
  vertebrobasilarTrunkQuestions,
  spinalCordVascularizationQuestions,
  cerebellumBrainstemVascularizationQuestions,
  diencephalonVascularizationQuestions,
  circleOfWillisQuestions,
  anteriorCerebralArteryQuestions,
  middleCerebralArteryQuestions,
  posteriorCerebralArteryQuestions
} from './questions_neuro_vascular';

import {
  duralVenousSinusesQuestions,
  greatCerebralVeinQuestions,
  spinalMeningesQuestions,
  sagittalDuralReflectionsQuestions,
  horizontalDuralReflectionsQuestions,
  arachnoidPiaMaterQuestions,
  csfCirculationQuestions,
  choroidPlexusQuestions
} from './questions_neuro_meninges_venous';

import {
  fourthVentricleRoofQuestions,
  fourthVentricleFloorQuestions,
  thirdVentricleRoofQuestions,
  thirdVentricleFloorQuestions,
  anteriorHornLateralVentricleQuestions,
  inferiorHornLateralVentricleQuestions,
  posteriorHornLateralVentricleQuestions
} from './questions_neuro_ventricular';

import {
  orbitWallsQuestions,
  eyelidsConjunctivaQuestions,
  lacrimalApparatusQuestions,
  extraocularMusclesQuestions,
  eyeAnatomyQuestions
} from './questions_neuro_eye_orbit';

import {
  externalEarQuestions,
  middleEarContentsQuestions,
  middleEarWallsQuestions,
  auditorTubeQuestions,
  innerEarQuestions,
  tasteReceptorsQuestions
} from './questions_neuro_ear';

import {
  generalVertebraeQuestions,
  regionalVertebraeQuestions,
  thoracicVertebraeQuestions,
  lumbarVertebraeQuestions,
  sacrumQuestions,
  atlasAxisVertebraeQuestions,
  ribsGeneralQuestions,
  sternumQuestions
} from './questions_bones_axial';

import {
  clavicleQuestions,
  humerusQuestions,
  radiusAndUlnaQuestions,
  carpalBonesQuestions,
  hipBoneQuestions,
  femurQuestions,
  patellaQuestions,
  tibiaQuestions,
  fibulaQuestions,
  tibiaFibulaQuestions,
  talusQuestions,
  calcaneusQuestions,
  tarsalBonesQuestions,
  upperLimbBonesQuestions
} from './questions_bones_appendicular';

import {
  shoulderMusclesQuestions,
  armMusclesQuestions,
  forearmMusclesQuestions,
  anteriorThighMusclesQuestions,
  hamstringMusclesQuestions,
  medialThighMusclesQuestions,
  legMusclesQuestions,
  halluxMusclesQuestions,
  midplantarMusclesQuestions
} from './questions_muscles';

import {
  brachialArteryQuestions
} from './questions_vessels';

import {
  medianNerveQuestions,
  musculocutaneousNerveQuestions,
  radialNerveQuestions
} from './questions_nerves';

import {
  brachialPlexusQuestions,
  lumbarPlexusQuestions,
  sacralPlexusQuestions,
  sensoryInnervationQuestions
} from './questions_plexuses';

import {
  shoulderJointQuestions,
  elbowJointQuestions,
  wristJointQuestions,
  hipJointQuestions,
  kneeJointQuestions,
  ankleJointQuestions
} from './questions_joints';

export type QuestionFormat = 'single' | 'multiple';

export interface Question {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  /** Defaults to single-choice when omitted. */
  format?: QuestionFormat;
  question: string;
  question_ro?: string;
  options: string[];
  options_ro?: string[];
  correctAnswer: number;
  /** Multi-select questions: all correct option indices (variable count). */
  correctAnswers?: number[];
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

export const categories: Category[] = [
  { id: 'upper-lower-limbs', name: 'Upper/Lower Limbs', icon: 'bone', color: '#FF6B6B', questionCount: 8200, completedCount: 1240 },
  { id: 'internal-organs', name: 'Internal Organs', icon: 'heart', color: '#4ECDC4', questionCount: 7500, completedCount: 980 },
  { id: 'head-neck', name: 'Head and Neck', icon: 'user', color: '#45B7D1', questionCount: getModuleQuestionCount('head-neck'), completedCount: 720 },
  { id: 'neuroanatomy', name: 'Neuroanatomy', icon: 'brain', color: '#DDA0DD', questionCount: 5555, completedCount: 450 },
  { id: 'med-admission-barrons', name: 'Medical School Entrance Exam', icon: 'stethoscope', color: '#8E44AD', questionCount: 200, completedCount: 0 },
];

export * from './questions_bones_axial';
export * from './questions_bones_appendicular';
export * from './questions_muscles';
export * from './questions_vessels';
export * from './questions_nerves';
export * from './questions_plexuses';
export * from './questions_joints';
export * from './questions_internal_organs';
export * from './questions_neuro';
export * from './questions_neuro_spinal_brainstem';
export * from './questions_neuro_diencephalon';
export * from './questions_neuro_cerebral_hemispheres';
export * from './questions_neuro_cortical_basal';
export * from './questions_neuro_vascular';
export * from './questions_neuro_meninges_venous';
export * from './questions_neuro_ventricular';
export * from './questions_neuro_eye_orbit';
export * from './questions_neuro_ear';
export * from './questions_med_admission';

export const sampleQuestions: Question[] = [
  // Axial skeleton
  ...generalVertebraeQuestions,
  ...regionalVertebraeQuestions,
  ...thoracicVertebraeQuestions,
  ...lumbarVertebraeQuestions,
  ...sacrumQuestions,
  ...atlasAxisVertebraeQuestions,
  ...ribsGeneralQuestions,
  ...sternumQuestions,
  // Appendicular skeleton
  ...clavicleQuestions,
  ...humerusQuestions,
  ...radiusAndUlnaQuestions,
  ...carpalBonesQuestions,
  ...hipBoneQuestions,
  ...femurQuestions,
  ...patellaQuestions,
  ...tibiaQuestions,
  ...fibulaQuestions,
  ...tibiaFibulaQuestions,
  ...talusQuestions,
  ...calcaneusQuestions,
  ...tarsalBonesQuestions,
  ...upperLimbBonesQuestions,
  // Muscles
  ...shoulderMusclesQuestions,
  ...armMusclesQuestions,
  ...forearmMusclesQuestions,
  ...anteriorThighMusclesQuestions,
  ...hamstringMusclesQuestions,
  ...medialThighMusclesQuestions,
  ...legMusclesQuestions,
  ...halluxMusclesQuestions,
  ...midplantarMusclesQuestions,
  // Vessels
  ...brachialArteryQuestions,
  // Nerves
  ...medianNerveQuestions,
  ...musculocutaneousNerveQuestions,
  ...radialNerveQuestions,
  // Plexuses (placeholders)
  ...brachialPlexusQuestions,
  ...lumbarPlexusQuestions,
  ...sacralPlexusQuestions,
  ...sensoryInnervationQuestions,
  // Joints (placeholders)
  ...shoulderJointQuestions,
  ...elbowJointQuestions,
  ...wristJointQuestions,
  ...hipJointQuestions,
  ...kneeJointQuestions,
  ...ankleJointQuestions,
  // Internal organs
  ...internalOrgansQuestions,
  ...headNeckQuestions,
  ...neuroanatomyQuestions,
  ...pulmonaryAndBronchialCirculationQuestions,
  ...systemicAndPortalCirculationQuestions,
  ...fetalCirculationQuestions,
  ...microcirculationAndCapillaryExchangeQuestions,
  ...hemodynamicsAndFlowQuestions,
  ...baroreflexChemoreflexAutoregulationQuestions,
  ...coronaryCirculationQuestions,
  ...cerebralAutoregulationAndBBBQuestions,
  ...lymphaticSystemOverviewQuestions,
  // Neuro-vasculature
  ...perforatingAndWatershedQuestions,
  // Neuroanatomy - Spinal cord & Brainstem
  ...spinalCordExternalQuestions,
  ...brainstemExternalQuestions,
  ...cerebellumExternalQuestions,
  ...cerebellumLobulationQuestions,
  // Neuroanatomy - Diencephalon
  ...thalamusExternalQuestions,
  ...thalamusNucleiQuestions,
  ...hypothalamusQuestions,
  ...epithalamMetathalamQuestions,
  ...pinealGlandQuestions,
  ...pituitaryGlandQuestions,
  ...perforatedSpacesQuestions,
  // Neuroanatomy - Cerebral Hemispheres
  ...cerebralHemisphereSulciGyriQuestions,
  ...inferiorSurfaceQuestions,
  ...lateralSurfaceQuestions,
  ...medialSurfaceQuestions,
  ...occipitalLobeQuestions,
  ...frontalLobeQuestions,
  ...parietalLobeQuestions,
  ...temporalLobeQuestions,
  ...orbitalLobeQuestions,
  ...temporoOccipitalLobeQuestions,
  // Neuroanatomy - Cortical & Basal
  ...sensoryCorticalAreasQuestions,
  ...motorCorticalAreasQuestions,
  ...somestheticAreasQuestions,
  ...basalNucleiQuestions,
  ...internalCapsuleQuestions,
  ...externalExtremeCapsuleQuestions,
  ...corpusCallosumQuestions,
  ...fornixQuestions,
  ...anteriorPosteriorCommissuresQuestions,
  ...hippocampalFormationQuestions,
  // Neuroanatomy - Vascular
  ...internalCarotidIntracranialQuestions,
  ...internalCarotidBranchesQuestions,
  ...vertebrobasilarTrunkQuestions,
  ...spinalCordVascularizationQuestions,
  ...cerebellumBrainstemVascularizationQuestions,
  ...diencephalonVascularizationQuestions,
  ...circleOfWillisQuestions,
  ...anteriorCerebralArteryQuestions,
  ...middleCerebralArteryQuestions,
  ...posteriorCerebralArteryQuestions,
  // Neuroanatomy - Meninges & Venous
  ...duralVenousSinusesQuestions,
  ...greatCerebralVeinQuestions,
  ...spinalMeningesQuestions,
  ...sagittalDuralReflectionsQuestions,
  ...horizontalDuralReflectionsQuestions,
  ...arachnoidPiaMaterQuestions,
  ...csfCirculationQuestions,
  ...choroidPlexusQuestions,
  // Neuroanatomy - Ventricular System
  ...fourthVentricleRoofQuestions,
  ...fourthVentricleFloorQuestions,
  ...thirdVentricleRoofQuestions,
  ...thirdVentricleFloorQuestions,
  ...anteriorHornLateralVentricleQuestions,
  ...inferiorHornLateralVentricleQuestions,
  ...posteriorHornLateralVentricleQuestions,
  // Neuroanatomy - Eye & Orbit
  ...orbitWallsQuestions,
  ...eyelidsConjunctivaQuestions,
  ...lacrimalApparatusQuestions,
  ...extraocularMusclesQuestions,
  ...eyeAnatomyQuestions,
  // Neuroanatomy - Ear & Taste
  ...externalEarQuestions,
  ...middleEarContentsQuestions,
  ...middleEarWallsQuestions,
  ...auditorTubeQuestions,
  ...innerEarQuestions,
  ...tasteReceptorsQuestions,
];
