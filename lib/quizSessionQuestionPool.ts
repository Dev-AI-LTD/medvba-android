/**
 * Single source for question arrays used by {@link app/quiz-session.tsx} selection
 * and canonical-id lookup (must match quiz session logic).
 */
import type { Question } from '@/mocks/questions';

import {
  generalVertebraeQuestions,
  regionalVertebraeQuestions,
  thoracicVertebraeQuestions,
  lumbarVertebraeQuestions,
  sacrumQuestions,
  atlasAxisVertebraeQuestions,
  ribsGeneralQuestions,
  sternumQuestions,
} from '@/mocks/questions_bones_axial';

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
  upperLimbBonesQuestions,
} from '@/mocks/questions_bones_appendicular';

import {
  shoulderMusclesQuestions,
  armMusclesQuestions,
  forearmMusclesQuestions,
  anteriorThighMusclesQuestions,
  hamstringMusclesQuestions,
  medialThighMusclesQuestions,
  legMusclesQuestions,
  halluxMusclesQuestions,
  midplantarMusclesQuestions,
} from '@/mocks/questions_muscles';

import { brachialArteryQuestions } from '@/mocks/questions_vessels';

import {
  medianNerveQuestions,
  musculocutaneousNerveQuestions,
  radialNerveQuestions,
} from '@/mocks/questions_nerves';

import {
  brachialPlexusQuestions,
  lumbarPlexusQuestions,
  sacralPlexusQuestions,
  sensoryInnervationQuestions,
} from '@/mocks/questions_plexuses';

import {
  shoulderJointQuestions,
  elbowJointQuestions,
  wristJointQuestions,
  hipJointQuestions,
  kneeJointQuestions,
  ankleJointQuestions,
} from '@/mocks/questions_joints';

import {
  internalOrgansQuestions,
  headNeckQuestions,
  pulmonaryAndBronchialCirculationQuestions,
  systemicAndPortalCirculationQuestions,
  fetalCirculationQuestions,
  microcirculationAndCapillaryExchangeQuestions,
  hemodynamicsAndFlowQuestions,
  baroreflexChemoreflexAutoregulationQuestions,
  coronaryCirculationQuestions,
  cerebralAutoregulationAndBBBQuestions,
  lymphaticSystemOverviewQuestions,
} from '@/mocks/questions_internal_organs';

import { neuroanatomyQuestionBank } from '@/mocks/neuroanatomyQuestionBank';

import {
  cardioAdmissionSet1,
  bloodAdmissionSet1,
  respiratoryAdmissionSet1,
  metabolismNutritionAdmissionSet1,
  digestiveAdmissionSet1,
  nervousAdmissionSet1,
  introAnatPhysAdmissionSet1,
  chemBasicsAdmissionSet1,
  cellBiologyAdmissionSet1,
  tissuesAdmissionSet1,
  integumentaryAdmissionSet1,
  skeletalAdmissionSet1,
  muscularAdmissionSet1,
  sensesAdmissionSet1,
  endocrineAdmissionSet1,
  lymphaticAdmissionSet1,
  urinaryAdmissionSet1,
  reproMaleAdmissionSet1,
  reproFemaleAdmissionSet1,
  embryologyAdmissionSet1,
} from '@/mocks/questions_med_admission';

const bonesQuestions: Question[] = [
  ...generalVertebraeQuestions,
  ...regionalVertebraeQuestions,
  ...thoracicVertebraeQuestions,
  ...lumbarVertebraeQuestions,
  ...sacrumQuestions,
  ...atlasAxisVertebraeQuestions,
  ...ribsGeneralQuestions,
  ...sternumQuestions,
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
];

const musclesQuestions: Question[] = [
  ...shoulderMusclesQuestions,
  ...armMusclesQuestions,
  ...forearmMusclesQuestions,
  ...anteriorThighMusclesQuestions,
  ...hamstringMusclesQuestions,
  ...medialThighMusclesQuestions,
  ...legMusclesQuestions,
  ...halluxMusclesQuestions,
  ...midplantarMusclesQuestions,
];

const vesselsQuestions: Question[] = [...brachialArteryQuestions];

const nervesQuestions: Question[] = [
  ...medianNerveQuestions,
  ...musculocutaneousNerveQuestions,
  ...radialNerveQuestions,
];

const plexusesQuestions: Question[] = [
  ...brachialPlexusQuestions,
  ...lumbarPlexusQuestions,
  ...sacralPlexusQuestions,
  ...sensoryInnervationQuestions,
];

const jointsQuestions: Question[] = [
  ...shoulderJointQuestions,
  ...elbowJointQuestions,
  ...wristJointQuestions,
  ...hipJointQuestions,
  ...kneeJointQuestions,
  ...ankleJointQuestions,
];

export const internalOrgansAllQuestions: Question[] = [
  ...internalOrgansQuestions,
  ...pulmonaryAndBronchialCirculationQuestions,
  ...systemicAndPortalCirculationQuestions,
  ...fetalCirculationQuestions,
  ...microcirculationAndCapillaryExchangeQuestions,
  ...hemodynamicsAndFlowQuestions,
  ...baroreflexChemoreflexAutoregulationQuestions,
  ...coronaryCirculationQuestions,
  ...cerebralAutoregulationAndBBBQuestions,
  ...lymphaticSystemOverviewQuestions,
];

export const headNeckAllQuestions: Question[] = [...headNeckQuestions];

export const neuroanatomyAllQuestions: Question[] = neuroanatomyQuestionBank;

export const medAdmissionAllQuestions: Question[] = [
  ...introAnatPhysAdmissionSet1,
  ...chemBasicsAdmissionSet1,
  ...cellBiologyAdmissionSet1,
  ...tissuesAdmissionSet1,
  ...integumentaryAdmissionSet1,
  ...skeletalAdmissionSet1,
  ...muscularAdmissionSet1,
  ...nervousAdmissionSet1,
  ...sensesAdmissionSet1,
  ...endocrineAdmissionSet1,
  ...bloodAdmissionSet1,
  ...cardioAdmissionSet1,
  ...lymphaticAdmissionSet1,
  ...respiratoryAdmissionSet1,
  ...digestiveAdmissionSet1,
  ...metabolismNutritionAdmissionSet1,
  ...urinaryAdmissionSet1,
  ...reproMaleAdmissionSet1,
  ...reproFemaleAdmissionSet1,
  ...embryologyAdmissionSet1,
];

export const upperLowerLimbsSubcategories = {
  bones: bonesQuestions,
  muscles: musclesQuestions,
  vessels: vesselsQuestions,
  nerves: nervesQuestions,
  plexuses: plexusesQuestions,
  joints: jointsQuestions,
};

export const allUpperLowerLimbsQuestions: Question[] = [
  ...bonesQuestions,
  ...musclesQuestions,
  ...vesselsQuestions,
  ...nervesQuestions,
  ...plexusesQuestions,
  ...jointsQuestions,
];

/** Full pool used for canonical lookup and mixed-category selection in quiz session. */
export const allQuestions: Question[] = [
  ...allUpperLowerLimbsQuestions,
  ...internalOrgansAllQuestions,
  ...headNeckAllQuestions,
  ...neuroanatomyAllQuestions,
  ...medAdmissionAllQuestions,
];
