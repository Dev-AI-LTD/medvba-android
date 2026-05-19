import type { Question } from './questions';

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
  facialNerveQuestions,
  vestibulocochlearNerveQuestions
} from './questions_cranial_nerves';

import {
  thoracicTracheaBronchiQuestions,
  mainBronchiQuestions,
  lungApexRelationsQuestions,
  lungCostalSurfaceQuestions,
  rightLungMediastinalQuestions,
  leftLungMediastinalQuestions,
  pleuraGeneralSinusesQuestions,
  pulmonaryPediclesQuestions
} from './questions_respiratory';

import {
  heartExternalAnatomyQuestions,
  heartVascularizationQuestions,
  rightAtriumQuestions,
  leftAtriumQuestions,
  rightVentricleQuestions,
  leftVentricleQuestions,
  cardiacPlexusesQuestions,
  fibrousPericardiumQuestions,
  pericardialSinusesQuestions
} from './questions_cardiovascular';

import {
  phrenicNervesQuestions,
  vagusNervesThoraxQuestions,
  thoracicSympatheticChainQuestions,
  celiacPlexusQuestions
} from './questions_thoracic_nerves';

import {
  thoracicCavityCompartmentsQuestions,
  mediastinumCompartmentsQuestions,
  anteriorMediastinumQuestions,
  posteriorMediastinumQuestions,
  thoracicEsophagusQuestions
} from './questions_mediastinum';

import {
  ascendingAortaQuestions,
  aorticArchQuestions,
  descendingThoracicAortaQuestions,
  internalThoracicVesselsQuestions,
  brachiocephalicVeinsSVCQuestions,
  inferiorVenaCavaQuestions,
  azygosVeinsQuestions,
  thoracicDuctQuestions
} from './questions_thoracic_vessels';

import {
  stomachFixationRelationsQuestions,
  stomachExternalConfigQuestions,
  stomachVasculonervousPediclesQuestions,
  duodenumQuestions,
  pancreasQuestions
} from './questions_digestive_upper';

import {
  liverExternalConfigQuestions,
  hepaticPedicleQuestions,
  liverSegmentationQuestions,
  gallbladderQuestions,
  extrahepaticBiliaryTractQuestions,
  spleenQuestions
} from './questions_liver_biliary';

import {
  peritonealCavityCompartmentsQuestions,
  greaterLesserOmentumQuestions,
  gastricLodgeQuestions,
  hepaticLodgeQuestions,
  splenicLodgeQuestions
} from './questions_peritoneum';

import {
  abdominalAortaQuestions,
  celiacTrunkQuestions,
  hepaticArteryQuestions,
  portalVeinQuestions,
  splenicVesselsQuestions,
  superiorMesentericVesselsQuestions,
  inferiorMesentericVesselsQuestions,
  rectalArteriesQuestions
} from './questions_abdominal_vessels';

import {
  jejunoIleumQuestions,
  mesenteryQuestions,
  cecumAppendixQuestions,
  ascendingColonQuestions,
  transverseColonMesocolonQuestions,
  descendingColonQuestions,
  sigmoidColonQuestions,
  sigmoidMesoFossaQuestions,
  pelvicRectumQuestions,
  rectalLodgeFemaleQuestions,
  rectalLodgeMaleQuestions
} from './questions_intestines';

import {
  renalLodgeFasciaQuestions,
  rightKidneyQuestions,
  leftKidneyQuestions,
  rightRenalPedicleQuestions,
  leftRenalPedicleQuestions,
  urinaryExcretoryPathwaysQuestions,
  ureterQuestions,
  adrenalGlandsQuestions,
  urinaryBladderQuestions,
  bladderLodgeQuestions,
  maleUrethraQuestions,
  femaleUrethraQuestions
} from './questions_urinary';

import {
  testicleQuestions,
  scrotalSacQuestions,
  epididymoTesticularComplexQuestions,
  vasDeferensEjaculatoryDuctQuestions,
  prostateSeminalVesiclesQuestions,
  penisQuestions
} from './questions_male_genital';

import {
  ovaryQuestions,
  uterineTubeQuestions,
  uterusQuestions,
  broadLigamentsQuestions,
  vaginaQuestions,
  vulvaQuestions,
  bulboVaginalUrethralGlandsQuestions
} from './questions_female_genital';

import {
  genitalVesselsQuestions,
  internalIliacVesselsQuestions
} from './questions_pelvic_vessels';

import {
  frontalBoneQuestions,
  parietalBoneQuestions,
  temporalBoneQuestions,
  occipitalBoneQuestions,
  sphenoidBoneQuestions,
  ethmoidBoneQuestions,
  maxillaQuestions,
  mandibulaQuestions,
  zigomaticBoneQuestions,
  palatineBoneQuestions,
  lacrimalBoneQuestions,
  vomerQuestions,
  inferiorNasalConchaQuestions
} from './questions_head_neck';

import {
  nasalBoneQuestions,
  subclavianArteryQuestions,
  nasalCavityQuestions,
  orbitQuestions,
  infratemporalFossaQuestions,
  pterygopalatineFossaQuestions,
  externalCarotidArteryQuestions,
  facialMusclesQuestions,
  masticatoryMusclesQuestions
} from './questions_head_neck_continued';

import {
  cardioAdmissionSet1,
  cardioAdmissionSet2,
  cardioAdmissionSet3,
  cardioAdmissionSet4,
  cardioAdmissionSet5,
  cardioAdmissionSet6,
  cardioAdmissionSet7,
  cardioAdmissionSet8,
  cardioAdmissionSet9,
  cardioAdmissionSet10,
  bloodAdmissionSet1,
  bloodAdmissionSet2,
  bloodAdmissionSet3,
  bloodAdmissionSet4,
  bloodAdmissionSet5,
  bloodAdmissionSet6,
  bloodAdmissionSet7,
  bloodAdmissionSet8,
  bloodAdmissionSet9,
  bloodAdmissionSet10,
  respiratoryAdmissionSet1,
  respiratoryAdmissionSet2,
  respiratoryAdmissionSet3,
  respiratoryAdmissionSet4,
  respiratoryAdmissionSet5,
  respiratoryAdmissionSet6,
  respiratoryAdmissionSet7,
  respiratoryAdmissionSet8,
  respiratoryAdmissionSet9,
  respiratoryAdmissionSet10,
  metabolismNutritionAdmissionSet1,
  metabolismNutritionAdmissionSet2,
  metabolismNutritionAdmissionSet3,
  metabolismNutritionAdmissionSet4,
  metabolismNutritionAdmissionSet5,
  metabolismNutritionAdmissionSet6,
  metabolismNutritionAdmissionSet7,
  metabolismNutritionAdmissionSet8,
  metabolismNutritionAdmissionSet9,
  metabolismNutritionAdmissionSet10,
  digestiveAdmissionSet1,
  digestiveAdmissionSet2,
  digestiveAdmissionSet3,
  digestiveAdmissionSet4,
  digestiveAdmissionSet5,
  digestiveAdmissionSet6,
  digestiveAdmissionSet7,
  digestiveAdmissionSet8,
  digestiveAdmissionSet9,
  digestiveAdmissionSet10,
  nervousAdmissionSet1,
  introAnatPhysAdmissionSet1,
  introAnatPhysAdmissionSet2,
  introAnatPhysAdmissionSet3,
  introAnatPhysAdmissionSet4,
  introAnatPhysAdmissionSet5,
  introAnatPhysAdmissionSet6,
  introAnatPhysAdmissionSet7,
  introAnatPhysAdmissionSet8,
  introAnatPhysAdmissionSet9,
  introAnatPhysAdmissionSet10,
  chemBasicsAdmissionSet1,
  chemBasicsAdmissionSet2,
  chemBasicsAdmissionSet3,
  chemBasicsAdmissionSet4,
  chemBasicsAdmissionSet5,
  chemBasicsAdmissionSet6,
  chemBasicsAdmissionSet7,
  chemBasicsAdmissionSet8,
  chemBasicsAdmissionSet9,
  chemBasicsAdmissionSet10,
  cellBiologyAdmissionSet1,
  cellBiologyAdmissionSet2,
  cellBiologyAdmissionSet3,
  cellBiologyAdmissionSet4,
  cellBiologyAdmissionSet5,
  cellBiologyAdmissionSet6,
  cellBiologyAdmissionSet7,
  cellBiologyAdmissionSet8,
  cellBiologyAdmissionSet9,
  cellBiologyAdmissionSet10,
  tissuesAdmissionSet1,
  tissuesAdmissionSet2,
  tissuesAdmissionSet3,
  tissuesAdmissionSet4,
  tissuesAdmissionSet5,
  tissuesAdmissionSet6,
  tissuesAdmissionSet7,
  tissuesAdmissionSet8,
  tissuesAdmissionSet9,
  tissuesAdmissionSet10,
  integumentaryAdmissionSet1,
  integumentaryAdmissionSet2,
  integumentaryAdmissionSet3,
  integumentaryAdmissionSet4,
  integumentaryAdmissionSet5,
  integumentaryAdmissionSet6,
  integumentaryAdmissionSet7,
  integumentaryAdmissionSet8,
  integumentaryAdmissionSet9,
  integumentaryAdmissionSet10,
  skeletalAdmissionSet1,
  skeletalAdmissionSet2,
  skeletalAdmissionSet3,
  skeletalAdmissionSet4,
  skeletalAdmissionSet5,
  skeletalAdmissionSet6,
  skeletalAdmissionSet7,
  skeletalAdmissionSet8,
  skeletalAdmissionSet9,
  skeletalAdmissionSet10,
  muscularAdmissionSet1,
  muscularAdmissionSet2,
  muscularAdmissionSet3,
  muscularAdmissionSet4,
  muscularAdmissionSet5,
  muscularAdmissionSet6,
  muscularAdmissionSet7,
  muscularAdmissionSet8,
  muscularAdmissionSet9,
  muscularAdmissionSet10,
  nervousAdmissionSet2,
  nervousAdmissionSet3,
  nervousAdmissionSet4,
  nervousAdmissionSet5,
  nervousAdmissionSet6,
  nervousAdmissionSet7,
  nervousAdmissionSet8,
  nervousAdmissionSet9,
  nervousAdmissionSet10,
  sensesAdmissionSet1,
  sensesAdmissionSet2,
  sensesAdmissionSet3,
  sensesAdmissionSet4,
  sensesAdmissionSet5,
  sensesAdmissionSet6,
  sensesAdmissionSet7,
  sensesAdmissionSet8,
  sensesAdmissionSet9,
  sensesAdmissionSet10,
  endocrineAdmissionSet1,
  endocrineAdmissionSet2,
  endocrineAdmissionSet3,
  endocrineAdmissionSet4,
  endocrineAdmissionSet5,
  endocrineAdmissionSet6,
  endocrineAdmissionSet7,
  endocrineAdmissionSet8,
  endocrineAdmissionSet9,
  endocrineAdmissionSet10,
  lymphaticAdmissionSet1,
  lymphaticAdmissionSet2,
  lymphaticAdmissionSet3,
  lymphaticAdmissionSet4,
  lymphaticAdmissionSet5,
  lymphaticAdmissionSet6,
  lymphaticAdmissionSet7,
  lymphaticAdmissionSet8,
  lymphaticAdmissionSet9,
  lymphaticAdmissionSet10,
  urinaryAdmissionSet1,
  urinaryAdmissionSet2,
  urinaryAdmissionSet3,
  urinaryAdmissionSet4,
  urinaryAdmissionSet5,
  urinaryAdmissionSet6,
  urinaryAdmissionSet7,
  urinaryAdmissionSet8,
  urinaryAdmissionSet9,
  urinaryAdmissionSet10,
  reproMaleAdmissionSet1,
  reproMaleAdmissionSet2,
  reproMaleAdmissionSet3,
  reproMaleAdmissionSet4,
  reproMaleAdmissionSet5,
  reproMaleAdmissionSet6,
  reproMaleAdmissionSet7,
  reproMaleAdmissionSet8,
  reproMaleAdmissionSet9,
  reproMaleAdmissionSet10,
  reproFemaleAdmissionSet1,
  reproFemaleAdmissionSet2,
  reproFemaleAdmissionSet3,
  reproFemaleAdmissionSet4,
  reproFemaleAdmissionSet5,
  reproFemaleAdmissionSet6,
  reproFemaleAdmissionSet7,
  reproFemaleAdmissionSet8,
  reproFemaleAdmissionSet9,
  reproFemaleAdmissionSet10,
  embryologyAdmissionSet1,
  embryologyAdmissionSet2,
  embryologyAdmissionSet3,
  embryologyAdmissionSet4,
  embryologyAdmissionSet5,
  embryologyAdmissionSet6,
  embryologyAdmissionSet7,
  embryologyAdmissionSet8,
  embryologyAdmissionSet9,
  embryologyAdmissionSet10,
} from './questions_med_admission';

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

export const upperLowerLimbsChapters: ModuleChapters = {
  moduleId: 'upper-lower-limbs',
  moduleName: 'Upper/Lower Limbs',
  chapters: [
    { id: 'general-vertebrae', name: 'Vertebre Generale', questions: generalVertebraeQuestions },
    { id: 'regional-vertebrae', name: 'Vertebre Regionale', questions: regionalVertebraeQuestions },
    { id: 'thoracic-vertebrae', name: 'Vertebre Toracice', questions: thoracicVertebraeQuestions },
    { id: 'lumbar-vertebrae', name: 'Vertebre Lombare', questions: lumbarVertebraeQuestions },
    { id: 'sacrum', name: 'Sacrum', questions: sacrumQuestions },
    { id: 'atlas-axis', name: 'Atlas și Axis', questions: atlasAxisVertebraeQuestions },
    { id: 'ribs', name: 'Coaste', questions: ribsGeneralQuestions },
    { id: 'sternum', name: 'Stern', questions: sternumQuestions },
    { id: 'clavicle', name: 'Clavicula', questions: clavicleQuestions },
    { id: 'humerus', name: 'Humerus', questions: humerusQuestions },
    { id: 'radius-ulna', name: 'Radius și Ulna', questions: radiusAndUlnaQuestions },
    { id: 'carpal-bones', name: 'Oase Carpiene', questions: carpalBonesQuestions },
    { id: 'hip-bone', name: 'Osul Coxal', questions: hipBoneQuestions },
    { id: 'femur', name: 'Femur', questions: femurQuestions },
    { id: 'patella', name: 'Patela', questions: patellaQuestions },
    { id: 'tibia', name: 'Tibia', questions: tibiaQuestions },
    { id: 'fibula', name: 'Fibula', questions: fibulaQuestions },
    { id: 'tibia-fibula', name: 'Tibia și Fibula', questions: tibiaFibulaQuestions },
    { id: 'talus', name: 'Talus', questions: talusQuestions },
    { id: 'calcaneus', name: 'Calcaneu', questions: calcaneusQuestions },
    { id: 'tarsal-bones', name: 'Oase Tarsiene', questions: tarsalBonesQuestions },
    { id: 'upper-limb-bones', name: 'Oase Membru Superior', questions: upperLimbBonesQuestions },
    { id: 'shoulder-muscles', name: 'Mușchi Umăr', questions: shoulderMusclesQuestions },
    { id: 'arm-muscles', name: 'Mușchi Braț', questions: armMusclesQuestions },
    { id: 'forearm-muscles', name: 'Mușchi Antebraț', questions: forearmMusclesQuestions },
    { id: 'anterior-thigh', name: 'Mușchi Coapsă Anterioară', questions: anteriorThighMusclesQuestions },
    { id: 'hamstrings', name: 'Mușchi Ischiogambieri', questions: hamstringMusclesQuestions },
    { id: 'medial-thigh', name: 'Mușchi Coapsă Medială', questions: medialThighMusclesQuestions },
    { id: 'leg-muscles', name: 'Mușchi Gambă', questions: legMusclesQuestions },
    { id: 'hallux-muscles', name: 'Mușchi Halux', questions: halluxMusclesQuestions },
    { id: 'midplantar-muscles', name: 'Mușchi Medioplantar', questions: midplantarMusclesQuestions },
    { id: 'brachial-artery', name: 'Artera Brahială', questions: brachialArteryQuestions },
    { id: 'median-nerve', name: 'Nervul Median', questions: medianNerveQuestions },
    { id: 'musculocutaneous-nerve', name: 'Nervul Musculocutanat', questions: musculocutaneousNerveQuestions },
    { id: 'radial-nerve', name: 'Nervul Radial', questions: radialNerveQuestions },
    { id: 'brachial-plexus', name: 'Plexul Brahial', questions: brachialPlexusQuestions },
    { id: 'lumbar-plexus', name: 'Plexul Lombar', questions: lumbarPlexusQuestions },
    { id: 'sacral-plexus', name: 'Plexul Sacral', questions: sacralPlexusQuestions },
    { id: 'sensory-innervation', name: 'Inervație Senzitivă', questions: sensoryInnervationQuestions },
    { id: 'shoulder-joint', name: 'Articulația Umărului', questions: shoulderJointQuestions },
    { id: 'elbow-joint', name: 'Articulația Cotului', questions: elbowJointQuestions },
    { id: 'wrist-joint', name: 'Articulația Pumnului', questions: wristJointQuestions },
    { id: 'hip-joint', name: 'Articulația Șoldului', questions: hipJointQuestions },
    { id: 'knee-joint', name: 'Articulația Genunchiului', questions: kneeJointQuestions },
    { id: 'ankle-joint', name: 'Articulația Gleznei', questions: ankleJointQuestions },
  ]
};

export const internalOrgansChapters: ModuleChapters = {
  moduleId: 'internal-organs',
  moduleName: 'Internal Organs',
  chapters: [
    { id: 'internal-organs-intro', name: 'Organe Interne - Introducere', questions: internalOrgansQuestions },
    { id: 'pulmonary-circulation', name: 'Circulația Pulmonară', questions: pulmonaryAndBronchialCirculationQuestions },
    { id: 'systemic-portal', name: 'Circulația Sistemică și Portală', questions: systemicAndPortalCirculationQuestions },
    { id: 'fetal-circulation', name: 'Circulația Fetală', questions: fetalCirculationQuestions },
    { id: 'microcirculation', name: 'Microcirculație', questions: microcirculationAndCapillaryExchangeQuestions },
    { id: 'hemodynamics', name: 'Hemodinamică', questions: hemodynamicsAndFlowQuestions },
    { id: 'baroreflex', name: 'Baroreflexe și Chemoreflexe', questions: baroreflexChemoreflexAutoregulationQuestions },
    { id: 'coronary-circulation', name: 'Circulația Coronariană', questions: coronaryCirculationQuestions },
    { id: 'cerebral-autoregulation', name: 'Autoreglare Cerebrală', questions: cerebralAutoregulationAndBBBQuestions },
    { id: 'lymphatic-system', name: 'Sistemul Limfatic', questions: lymphaticSystemOverviewQuestions },
    { id: 'thoracic-trachea-bronchi', name: 'Trahee și Bronhii Toracice', questions: thoracicTracheaBronchiQuestions },
    { id: 'main-bronchi', name: 'Bronhii Principale', questions: mainBronchiQuestions },
    { id: 'lung-apex', name: 'Raporturile Vârfului Pulmonar', questions: lungApexRelationsQuestions },
    { id: 'lung-costal-surface', name: 'Fața Costală Pulmonară', questions: lungCostalSurfaceQuestions },
    { id: 'right-lung-mediastinal', name: 'Plămân Drept - Mediastinal', questions: rightLungMediastinalQuestions },
    { id: 'left-lung-mediastinal', name: 'Plămân Stâng - Mediastinal', questions: leftLungMediastinalQuestions },
    { id: 'pleura-sinuses', name: 'Pleura și Sinusuri', questions: pleuraGeneralSinusesQuestions },
    { id: 'pulmonary-pedicles', name: 'Pediculii Pulmonari', questions: pulmonaryPediclesQuestions },
    { id: 'heart-external', name: 'Inima - Anatomie Externă', questions: heartExternalAnatomyQuestions },
    { id: 'heart-vascularization', name: 'Vascularizația Cordului', questions: heartVascularizationQuestions },
    { id: 'right-atrium', name: 'Atriul Drept', questions: rightAtriumQuestions },
    { id: 'left-atrium', name: 'Atriul Stâng', questions: leftAtriumQuestions },
    { id: 'right-ventricle', name: 'Ventriculul Drept', questions: rightVentricleQuestions },
    { id: 'left-ventricle', name: 'Ventriculul Stâng', questions: leftVentricleQuestions },
    { id: 'cardiac-plexuses', name: 'Plexuri Cardiace', questions: cardiacPlexusesQuestions },
    { id: 'fibrous-pericardium', name: 'Pericardul Fibros', questions: fibrousPericardiumQuestions },
    { id: 'pericardial-sinuses', name: 'Sinusuri Pericardice', questions: pericardialSinusesQuestions },
    { id: 'phrenic-nerves', name: 'Nervii Frenici', questions: phrenicNervesQuestions },
    { id: 'vagus-nerves-thorax', name: 'Nervii Vagi în Torace', questions: vagusNervesThoraxQuestions },
    { id: 'thoracic-sympathetic', name: 'Lanțul Simpatic Toracic', questions: thoracicSympatheticChainQuestions },
    { id: 'celiac-plexus', name: 'Plexul Celiac', questions: celiacPlexusQuestions },
    { id: 'thoracic-cavity', name: 'Cavitatea Toracică', questions: thoracicCavityCompartmentsQuestions },
    { id: 'mediastinum-compartments', name: 'Compartimente Mediastin', questions: mediastinumCompartmentsQuestions },
    { id: 'anterior-mediastinum', name: 'Mediastin Anterior', questions: anteriorMediastinumQuestions },
    { id: 'posterior-mediastinum', name: 'Mediastin Posterior', questions: posteriorMediastinumQuestions },
    { id: 'thoracic-esophagus', name: 'Esofagul Toracic', questions: thoracicEsophagusQuestions },
    { id: 'ascending-aorta', name: 'Aorta Ascendentă', questions: ascendingAortaQuestions },
    { id: 'aortic-arch', name: 'Arcul Aortic', questions: aorticArchQuestions },
    { id: 'descending-thoracic-aorta', name: 'Aorta Descendentă Toracică', questions: descendingThoracicAortaQuestions },
    { id: 'internal-thoracic-vessels', name: 'Vase Toracice Interne', questions: internalThoracicVesselsQuestions },
    { id: 'brachiocephalic-veins-svc', name: 'Vene Brahiocefalice și VCS', questions: brachiocephalicVeinsSVCQuestions },
    { id: 'inferior-vena-cava', name: 'Vena Cavă Inferioară', questions: inferiorVenaCavaQuestions },
    { id: 'azygos-veins', name: 'Venele Azygos', questions: azygosVeinsQuestions },
    { id: 'thoracic-duct', name: 'Ductul Toracic', questions: thoracicDuctQuestions },
    { id: 'stomach-fixation', name: 'Stomac - Fixare și Raporturi', questions: stomachFixationRelationsQuestions },
    { id: 'stomach-external', name: 'Stomac - Config. Externă', questions: stomachExternalConfigQuestions },
    { id: 'stomach-pedicles', name: 'Stomac - Pediculi', questions: stomachVasculonervousPediclesQuestions },
    { id: 'duodenum', name: 'Duodenul', questions: duodenumQuestions },
    { id: 'pancreas', name: 'Pancreasul', questions: pancreasQuestions },
    { id: 'liver-external', name: 'Ficatul - Config. Externă', questions: liverExternalConfigQuestions },
    { id: 'hepatic-pedicle', name: 'Pediculul Hepatic', questions: hepaticPedicleQuestions },
    { id: 'liver-segmentation', name: 'Segmentare Hepatică', questions: liverSegmentationQuestions },
    { id: 'gallbladder', name: 'Vezica Biliară', questions: gallbladderQuestions },
    { id: 'extrahepatic-biliary', name: 'Căi Biliare Extrahepatice', questions: extrahepaticBiliaryTractQuestions },
    { id: 'spleen', name: 'Splina', questions: spleenQuestions },
    { id: 'peritoneal-compartments', name: 'Compartimente Peritoneale', questions: peritonealCavityCompartmentsQuestions },
    { id: 'greater-lesser-omentum', name: 'Epiploanele', questions: greaterLesserOmentumQuestions },
    { id: 'gastric-lodge', name: 'Loja Gastrică', questions: gastricLodgeQuestions },
    { id: 'hepatic-lodge', name: 'Loja Hepatică', questions: hepaticLodgeQuestions },
    { id: 'splenic-lodge', name: 'Loja Splenică', questions: splenicLodgeQuestions },
    { id: 'abdominal-aorta', name: 'Aorta Abdominală', questions: abdominalAortaQuestions },
    { id: 'celiac-trunk', name: 'Trunchiul Celiac', questions: celiacTrunkQuestions },
    { id: 'hepatic-artery', name: 'Artera Hepatică', questions: hepaticArteryQuestions },
    { id: 'portal-vein', name: 'Vena Portă', questions: portalVeinQuestions },
    { id: 'splenic-vessels', name: 'Vase Splenice', questions: splenicVesselsQuestions },
    { id: 'superior-mesenteric-vessels', name: 'Vase Mezenterice Sup.', questions: superiorMesentericVesselsQuestions },
    { id: 'inferior-mesenteric-vessels', name: 'Vase Mezenterice Inf.', questions: inferiorMesentericVesselsQuestions },
    { id: 'rectal-arteries', name: 'Artere Rectale', questions: rectalArteriesQuestions },
    { id: 'jejuno-ileum', name: 'Jejun și Ileon', questions: jejunoIleumQuestions },
    { id: 'mesentery', name: 'Mezenterul', questions: mesenteryQuestions },
    { id: 'cecum-appendix', name: 'Cec și Apendice', questions: cecumAppendixQuestions },
    { id: 'ascending-colon', name: 'Colonul Ascendent', questions: ascendingColonQuestions },
    { id: 'transverse-colon', name: 'Colonul Transvers', questions: transverseColonMesocolonQuestions },
    { id: 'descending-colon', name: 'Colonul Descendent', questions: descendingColonQuestions },
    { id: 'sigmoid-colon', name: 'Colonul Sigmoid', questions: sigmoidColonQuestions },
    { id: 'sigmoid-meso-fossa', name: 'Mezosigmoid și Fose', questions: sigmoidMesoFossaQuestions },
    { id: 'pelvic-rectum', name: 'Rectul Pelvin', questions: pelvicRectumQuestions },
    { id: 'rectal-lodge-female', name: 'Loja Rectală Feminin', questions: rectalLodgeFemaleQuestions },
    { id: 'rectal-lodge-male', name: 'Loja Rectală Masculin', questions: rectalLodgeMaleQuestions },
    { id: 'renal-lodge-fascia', name: 'Loja și Fascia Renală', questions: renalLodgeFasciaQuestions },
    { id: 'right-kidney', name: 'Rinichiul Drept', questions: rightKidneyQuestions },
    { id: 'left-kidney', name: 'Rinichiul Stâng', questions: leftKidneyQuestions },
    { id: 'right-renal-pedicle', name: 'Pediculul Renal Drept', questions: rightRenalPedicleQuestions },
    { id: 'left-renal-pedicle', name: 'Pediculul Renal Stâng', questions: leftRenalPedicleQuestions },
    { id: 'urinary-excretory', name: 'Căi Urinare Excretorii', questions: urinaryExcretoryPathwaysQuestions },
    { id: 'ureter', name: 'Ureterul', questions: ureterQuestions },
    { id: 'adrenal-glands', name: 'Glandele Suprarenale', questions: adrenalGlandsQuestions },
    { id: 'urinary-bladder', name: 'Vezica Urinară', questions: urinaryBladderQuestions },
    { id: 'bladder-lodge', name: 'Loja Vezicală', questions: bladderLodgeQuestions },
    { id: 'male-urethra', name: 'Uretra Masculină', questions: maleUrethraQuestions },
    { id: 'female-urethra', name: 'Uretra Feminină', questions: femaleUrethraQuestions },
    { id: 'testicle', name: 'Testiculul', questions: testicleQuestions },
    { id: 'scrotal-sac', name: 'Sacul Scrotal', questions: scrotalSacQuestions },
    { id: 'epididymo-testicular', name: 'Complex Epididimo-Testicular', questions: epididymoTesticularComplexQuestions },
    { id: 'vas-deferens', name: 'Duct Deferent și Ejaculator', questions: vasDeferensEjaculatoryDuctQuestions },
    { id: 'prostate-seminal', name: 'Prostată și Vezicule Seminale', questions: prostateSeminalVesiclesQuestions },
    { id: 'penis', name: 'Penisul', questions: penisQuestions },
    { id: 'ovary', name: 'Ovarul', questions: ovaryQuestions },
    { id: 'uterine-tube', name: 'Trompa Uterină', questions: uterineTubeQuestions },
    { id: 'uterus', name: 'Uterul', questions: uterusQuestions },
    { id: 'broad-ligaments', name: 'Ligamentele Largi', questions: broadLigamentsQuestions },
    { id: 'vagina', name: 'Vaginul', questions: vaginaQuestions },
    { id: 'vulva', name: 'Vulva', questions: vulvaQuestions },
    { id: 'bulbo-vaginal-glands', name: 'Glande Bulbo-Vaginale', questions: bulboVaginalUrethralGlandsQuestions },
    { id: 'genital-vessels', name: 'Vase Genitale', questions: genitalVesselsQuestions },
    { id: 'internal-iliac-vessels', name: 'Vase Iliace Interne', questions: internalIliacVesselsQuestions },
  ]
};

export const headNeckChapters: ModuleChapters = {
  moduleId: 'head-neck',
  moduleName: 'Head and Neck',
  chapters: [
    { id: 'head-neck-intro', name: 'Cap și Gât - Introducere', questions: headNeckQuestions },
    { id: 'frontal-bone', name: 'Osul Frontal', questions: frontalBoneQuestions },
    { id: 'parietal-bone', name: 'Osul Parietal', questions: parietalBoneQuestions },
    { id: 'temporal-bone', name: 'Osul Temporal', questions: temporalBoneQuestions },
    { id: 'occipital-bone', name: 'Osul Occipital', questions: occipitalBoneQuestions },
    { id: 'sphenoid-bone', name: 'Osul Sfenoid', questions: sphenoidBoneQuestions },
    { id: 'ethmoid-bone', name: 'Osul Etmoid', questions: ethmoidBoneQuestions },
    { id: 'maxilla', name: 'Maxila', questions: maxillaQuestions },
    { id: 'mandibula', name: 'Mandibula', questions: mandibulaQuestions },
    { id: 'nasal-bone', name: 'Osul Nazal', questions: nasalBoneQuestions },
    { id: 'zigomatic-bone', name: 'Osul Zigomatic', questions: zigomaticBoneQuestions },
    { id: 'palatine-bone', name: 'Osul Palatin', questions: palatineBoneQuestions },
    { id: 'lacrimal-bone', name: 'Osul Lacrimal', questions: lacrimalBoneQuestions },
    { id: 'vomer', name: 'Vomerul', questions: vomerQuestions },
    { id: 'inferior-nasal-concha', name: 'Cornete Nazale Inferioare', questions: inferiorNasalConchaQuestions },
    { id: 'subclavian-artery', name: 'Artera Subclavie', questions: subclavianArteryQuestions },
    { id: 'nasal-cavity', name: 'Cavitatea Nazală', questions: nasalCavityQuestions },
    { id: 'orbit', name: 'Orbita', questions: orbitQuestions },
    { id: 'infratemporal-fossa', name: 'Fosa Infratemporală', questions: infratemporalFossaQuestions },
    { id: 'pterygopalatine-fossa', name: 'Fosa Pterigopalatină', questions: pterygopalatineFossaQuestions },
    { id: 'external-carotid-artery', name: 'Artera Carotidă Externă', questions: externalCarotidArteryQuestions },
    { id: 'facial-muscles', name: 'Mușchi Faciali', questions: facialMusclesQuestions },
    { id: 'masticatory-muscles', name: 'Mușchi Masticatori', questions: masticatoryMusclesQuestions },
  ]
};

export const neuroanatomyChapters: ModuleChapters = {
  moduleId: 'neuroanatomy',
  moduleName: 'Neuroanatomy',
  chapters: [
    { id: 'neuro-intro', name: 'Neuroanatomy – Introduction', questions: neuroanatomyQuestions },
    { id: 'perforating-watershed', name: 'Perforating arteries', questions: perforatingAndWatershedQuestions },
    { id: 'spinal-cord-external', name: 'Spinal cord – external configuration and relations', questions: spinalCordExternalQuestions },
    { id: 'brainstem-external', name: 'Brainstem – external configuration and relations', questions: brainstemExternalQuestions },
    { id: 'cerebellum-external', name: 'Cerebellum – external configuration and relations', questions: cerebellumExternalQuestions },
    { id: 'cerebellum-lobulation', name: 'Cerebellar lobulation', questions: cerebellumLobulationQuestions },
    { id: 'thalamus-external', name: 'Thalamus – external morphology and relations', questions: thalamusExternalQuestions },
    { id: 'thalamus-nuclei', name: 'Thalamic nuclei – topographic classification', questions: thalamusNucleiQuestions },
    { id: 'hypothalamus', name: 'Hypothalamus – external morphology and relations', questions: hypothalamusQuestions },
    { id: 'epithalamus-metathalamus', name: 'Epithalamus and metathalamus', questions: epithalamMetathalamQuestions },
    { id: 'pineal-gland', name: 'Pineal gland (epiphysis)', questions: pinealGlandQuestions },
    { id: 'pituitary-gland', name: 'Pituitary gland (hypophysis) – external morphology and relations', questions: pituitaryGlandQuestions },
    { id: 'perforated-spaces', name: 'Anterior and posterior perforated substances', questions: perforatedSpacesQuestions },
    { id: 'cerebral-sulci-gyri', name: 'Cerebral hemispheres – sulci and gyri', questions: cerebralHemisphereSulciGyriQuestions },
    { id: 'inferior-surface', name: 'Cerebral hemispheres – inferior surface', questions: inferiorSurfaceQuestions },
    { id: 'lateral-surface', name: 'Cerebral hemispheres – lateral surface', questions: lateralSurfaceQuestions },
    { id: 'medial-surface', name: 'Cerebral hemispheres – medial surface', questions: medialSurfaceQuestions },
    { id: 'occipital-lobe', name: 'Occipital lobe', questions: occipitalLobeQuestions },
    { id: 'frontal-lobe', name: 'Frontal lobe', questions: frontalLobeQuestions },
    { id: 'parietal-lobe', name: 'Parietal lobe', questions: parietalLobeQuestions },
    { id: 'temporal-lobe', name: 'Temporal lobe', questions: temporalLobeQuestions },
    { id: 'orbital-lobe', name: 'Orbital lobe (orbital surface of frontal lobe)', questions: orbitalLobeQuestions },
    { id: 'temporo-occipital', name: 'Temporo-occipital region', questions: temporoOccipitalLobeQuestions },
    { id: 'sensory-cortical', name: 'Primary sensory cortical areas', questions: sensoryCorticalAreasQuestions },
    { id: 'motor-cortical', name: 'Primary motor and premotor cortical areas', questions: motorCorticalAreasQuestions },
    { id: 'somesthetic-areas', name: 'Somatosensory cortical areas', questions: somestheticAreasQuestions },
    { id: 'basal-nuclei', name: 'Basal nuclei', questions: basalNucleiQuestions },
    { id: 'internal-capsule', name: 'Internal capsule', questions: internalCapsuleQuestions },
    { id: 'external-extreme-capsule', name: 'External and extreme capsules', questions: externalExtremeCapsuleQuestions },
    { id: 'corpus-callosum', name: 'Corpus callosum', questions: corpusCallosumQuestions },
    { id: 'fornix', name: 'Cerebral trigone (trigonum cerebrale)', questions: fornixQuestions },
    { id: 'anterior-posterior-commissures', name: 'Anterior and posterior white commissures', questions: anteriorPosteriorCommissuresQuestions },
    { id: 'hippocampal-formation', name: 'Cornu Ammonis (hippocampus), fimbria and dentate gyrus', questions: hippocampalFormationQuestions },
    { id: 'internal-carotid-intracranial', name: 'Internal carotid artery – intracranial segment', questions: internalCarotidIntracranialQuestions },
    { id: 'internal-carotid-branches', name: 'Internal carotid artery – collateral branches', questions: internalCarotidBranchesQuestions },
    { id: 'vertebrobasilar', name: 'Vertebrobasilar arterial trunk', questions: vertebrobasilarTrunkQuestions },
    { id: 'spinal-cord-vascular', name: 'Blood supply of the spinal cord', questions: spinalCordVascularizationQuestions },
    { id: 'cerebellum-brainstem-vascular', name: 'Blood supply of the cerebellum and brainstem', questions: cerebellumBrainstemVascularizationQuestions },
    { id: 'diencephalon-vascular', name: 'Blood supply of the diencephalon', questions: diencephalonVascularizationQuestions },
    { id: 'circle-of-willis', name: 'Circle of Willis (cerebral arterial circle)', questions: circleOfWillisQuestions },
    { id: 'anterior-cerebral-artery', name: 'Anterior cerebral artery', questions: anteriorCerebralArteryQuestions },
    { id: 'middle-cerebral-artery', name: 'Middle cerebral artery', questions: middleCerebralArteryQuestions },
    { id: 'posterior-cerebral-artery', name: 'Posterior cerebral artery', questions: posteriorCerebralArteryQuestions },
    { id: 'dural-venous-sinuses', name: 'Dural venous sinuses of the cranial cavity', questions: duralVenousSinusesQuestions },
    { id: 'great-cerebral-vein', name: 'Great cerebral vein (vein of Galen)', questions: greatCerebralVeinQuestions },
    { id: 'spinal-meninges', name: 'Spinal meninges', questions: spinalMeningesQuestions },
    { id: 'sagittal-dural', name: 'Cranial dura mater – sagittal folds (septa)', questions: sagittalDuralReflectionsQuestions },
    { id: 'horizontal-dural', name: 'Cranial dura mater – horizontal folds (septa)', questions: horizontalDuralReflectionsQuestions },
    { id: 'arachnoid-pia', name: 'Cranial arachnoid and pia mater', questions: arachnoidPiaMaterQuestions },
    { id: 'csf-circulation', name: 'Cerebrospinal fluid circulation', questions: csfCirculationQuestions },
    { id: 'choroid-plexus', name: 'Choroid plexuses of the ventricular system', questions: choroidPlexusQuestions },
    { id: 'fourth-ventricle-roof', name: 'Roof of the fourth ventricle', questions: fourthVentricleRoofQuestions },
    { id: 'fourth-ventricle-floor', name: 'Floor of the fourth ventricle', questions: fourthVentricleFloorQuestions },
    { id: 'third-ventricle-roof', name: 'Roof of the third ventricle', questions: thirdVentricleRoofQuestions },
    { id: 'third-ventricle-floor', name: 'Floor of the third ventricle', questions: thirdVentricleFloorQuestions },
    { id: 'anterior-horn-lateral', name: 'Anterior horn of the lateral ventricles', questions: anteriorHornLateralVentricleQuestions },
    { id: 'inferior-horn-lateral', name: 'Inferior horn of the lateral ventricles', questions: inferiorHornLateralVentricleQuestions },
    { id: 'posterior-horn-lateral', name: 'Posterior horn of the lateral ventricles', questions: posteriorHornLateralVentricleQuestions },
    { id: 'orbit-walls', name: 'Orbit – walls', questions: orbitWallsQuestions },
    { id: 'eyelids-conjunctiva', name: 'Eyelids and conjunctiva', questions: eyelidsConjunctivaQuestions },
    { id: 'lacrimal-apparatus', name: 'Lacrimal apparatus', questions: lacrimalApparatusQuestions },
    { id: 'extraocular-muscles', name: 'Extraocular muscles of the eyeball', questions: extraocularMusclesQuestions },
    { id: 'eye-anatomy', name: 'Eye anatomy (tunics, media, vessels)', questions: eyeAnatomyQuestions },
    { id: 'external-ear', name: 'External ear', questions: externalEarQuestions },
    { id: 'middle-ear-contents', name: 'Middle ear – contents', questions: middleEarContentsQuestions },
    { id: 'middle-ear-walls', name: 'Middle ear – walls', questions: middleEarWallsQuestions },
    { id: 'auditory-tube', name: 'Auditory (pharyngotympanic) tube', questions: auditorTubeQuestions },
    { id: 'inner-ear', name: 'Inner ear (vestibule, cochlea, semicircular canals)', questions: innerEarQuestions },
    { id: 'taste-receptors', name: 'Gustatory receptors and mucosa', questions: tasteReceptorsQuestions },
    { id: 'cn-vii-facial', name: 'CN VII – Facial nerve', questions: facialNerveQuestions },
    { id: 'cn-viii-vestibulocochlear', name: 'CN VIII – Vestibulocochlear nerve', questions: vestibulocochlearNerveQuestions },
  ]
};

export const medAdmissionChapters: ModuleChapters = {
  moduleId: 'med-admission-barrons',
  moduleName: '', // Display name comes from getModuleName() / locales
  chapters: [
    { id: 'intro-anat-phys', name: 'Introducere în anatomie și fiziologie', questions: [...introAnatPhysAdmissionSet1, ...introAnatPhysAdmissionSet2, ...introAnatPhysAdmissionSet3, ...introAnatPhysAdmissionSet4, ...introAnatPhysAdmissionSet5, ...introAnatPhysAdmissionSet6, ...introAnatPhysAdmissionSet7, ...introAnatPhysAdmissionSet8, ...introAnatPhysAdmissionSet9, ...introAnatPhysAdmissionSet10] },
    { id: 'chem-basics', name: 'Bazele chimice ale corpului uman', questions: [...chemBasicsAdmissionSet1, ...chemBasicsAdmissionSet2, ...chemBasicsAdmissionSet3, ...chemBasicsAdmissionSet4, ...chemBasicsAdmissionSet5, ...chemBasicsAdmissionSet6, ...chemBasicsAdmissionSet7, ...chemBasicsAdmissionSet8, ...chemBasicsAdmissionSet9, ...chemBasicsAdmissionSet10] },
    { id: 'cell-biology', name: 'Celula și fiziologia celulară', questions: [...cellBiologyAdmissionSet1, ...cellBiologyAdmissionSet2, ...cellBiologyAdmissionSet3, ...cellBiologyAdmissionSet4, ...cellBiologyAdmissionSet5, ...cellBiologyAdmissionSet6, ...cellBiologyAdmissionSet7, ...cellBiologyAdmissionSet8, ...cellBiologyAdmissionSet9, ...cellBiologyAdmissionSet10] },
    { id: 'tissues', name: 'Țesuturile', questions: [...tissuesAdmissionSet1, ...tissuesAdmissionSet2, ...tissuesAdmissionSet3, ...tissuesAdmissionSet4, ...tissuesAdmissionSet5, ...tissuesAdmissionSet6, ...tissuesAdmissionSet7, ...tissuesAdmissionSet8, ...tissuesAdmissionSet9, ...tissuesAdmissionSet10] },
    { id: 'integumentary', name: 'Sistemul tegumentar', questions: [...integumentaryAdmissionSet1, ...integumentaryAdmissionSet2, ...integumentaryAdmissionSet3, ...integumentaryAdmissionSet4, ...integumentaryAdmissionSet5, ...integumentaryAdmissionSet6, ...integumentaryAdmissionSet7, ...integumentaryAdmissionSet8, ...integumentaryAdmissionSet9, ...integumentaryAdmissionSet10] },
    { id: 'skeletal', name: 'Oasele și articulațiile', questions: [...skeletalAdmissionSet1, ...skeletalAdmissionSet2, ...skeletalAdmissionSet3, ...skeletalAdmissionSet4, ...skeletalAdmissionSet5, ...skeletalAdmissionSet6, ...skeletalAdmissionSet7, ...skeletalAdmissionSet8, ...skeletalAdmissionSet9, ...skeletalAdmissionSet10] },
    { id: 'muscular', name: 'Sistemul muscular', questions: [...muscularAdmissionSet1, ...muscularAdmissionSet2, ...muscularAdmissionSet3, ...muscularAdmissionSet4, ...muscularAdmissionSet5, ...muscularAdmissionSet6, ...muscularAdmissionSet7, ...muscularAdmissionSet8, ...muscularAdmissionSet9, ...muscularAdmissionSet10] },
    { id: 'nervous', name: 'Sistemul nervos', questions: [...nervousAdmissionSet1, ...nervousAdmissionSet2, ...nervousAdmissionSet3, ...nervousAdmissionSet4, ...nervousAdmissionSet5, ...nervousAdmissionSet6, ...nervousAdmissionSet7, ...nervousAdmissionSet8, ...nervousAdmissionSet9, ...nervousAdmissionSet10] },
    { id: 'senses', name: 'Organele de simț', questions: [...sensesAdmissionSet1, ...sensesAdmissionSet2, ...sensesAdmissionSet3, ...sensesAdmissionSet4, ...sensesAdmissionSet5, ...sensesAdmissionSet6, ...sensesAdmissionSet7, ...sensesAdmissionSet8, ...sensesAdmissionSet9, ...sensesAdmissionSet10] },
    { id: 'endocrine', name: 'Sistemul endocrin', questions: [...endocrineAdmissionSet1, ...endocrineAdmissionSet2, ...endocrineAdmissionSet3, ...endocrineAdmissionSet4, ...endocrineAdmissionSet5, ...endocrineAdmissionSet6, ...endocrineAdmissionSet7, ...endocrineAdmissionSet8, ...endocrineAdmissionSet9, ...endocrineAdmissionSet10] },
    { id: 'blood', name: 'Sângele', questions: [...bloodAdmissionSet1, ...bloodAdmissionSet2, ...bloodAdmissionSet3, ...bloodAdmissionSet4, ...bloodAdmissionSet5, ...bloodAdmissionSet6, ...bloodAdmissionSet7, ...bloodAdmissionSet8, ...bloodAdmissionSet9, ...bloodAdmissionSet10] },
    { id: 'cardiovascular', name: 'Sistemul cardiovascular', questions: [...cardioAdmissionSet1, ...cardioAdmissionSet2, ...cardioAdmissionSet3, ...cardioAdmissionSet4, ...cardioAdmissionSet5, ...cardioAdmissionSet6, ...cardioAdmissionSet7, ...cardioAdmissionSet8, ...cardioAdmissionSet9, ...cardioAdmissionSet10] },
    { id: 'lymphatic', name: 'Sistemul limfatic și imunitatea', questions: [...lymphaticAdmissionSet1, ...lymphaticAdmissionSet2, ...lymphaticAdmissionSet3, ...lymphaticAdmissionSet4, ...lymphaticAdmissionSet5, ...lymphaticAdmissionSet6, ...lymphaticAdmissionSet7, ...lymphaticAdmissionSet8, ...lymphaticAdmissionSet9, ...lymphaticAdmissionSet10] },
    { id: 'respiratory', name: 'Sistemul respirator', questions: [...respiratoryAdmissionSet1, ...respiratoryAdmissionSet2, ...respiratoryAdmissionSet3, ...respiratoryAdmissionSet4, ...respiratoryAdmissionSet5, ...respiratoryAdmissionSet6, ...respiratoryAdmissionSet7, ...respiratoryAdmissionSet8, ...respiratoryAdmissionSet9, ...respiratoryAdmissionSet10] },
    { id: 'digestive', name: 'Sistemul digestiv', questions: [...digestiveAdmissionSet1, ...digestiveAdmissionSet2, ...digestiveAdmissionSet3, ...digestiveAdmissionSet4, ...digestiveAdmissionSet5, ...digestiveAdmissionSet6, ...digestiveAdmissionSet7, ...digestiveAdmissionSet8, ...digestiveAdmissionSet9, ...digestiveAdmissionSet10] },
    { id: 'metabolism', name: 'Metabolism și nutriție', questions: [...metabolismNutritionAdmissionSet1, ...metabolismNutritionAdmissionSet2, ...metabolismNutritionAdmissionSet3, ...metabolismNutritionAdmissionSet4, ...metabolismNutritionAdmissionSet5, ...metabolismNutritionAdmissionSet6, ...metabolismNutritionAdmissionSet7, ...metabolismNutritionAdmissionSet8, ...metabolismNutritionAdmissionSet9, ...metabolismNutritionAdmissionSet10] },
    { id: 'urinary', name: 'Sistemul urinar', questions: [...urinaryAdmissionSet1, ...urinaryAdmissionSet2, ...urinaryAdmissionSet3, ...urinaryAdmissionSet4, ...urinaryAdmissionSet5, ...urinaryAdmissionSet6, ...urinaryAdmissionSet7, ...urinaryAdmissionSet8, ...urinaryAdmissionSet9, ...urinaryAdmissionSet10] },
    { id: 'repro-male', name: 'Sistemul reproducător masculin', questions: [...reproMaleAdmissionSet1, ...reproMaleAdmissionSet2, ...reproMaleAdmissionSet3, ...reproMaleAdmissionSet4, ...reproMaleAdmissionSet5, ...reproMaleAdmissionSet6, ...reproMaleAdmissionSet7, ...reproMaleAdmissionSet8, ...reproMaleAdmissionSet9, ...reproMaleAdmissionSet10] },
    { id: 'repro-female', name: 'Sistemul reproducător feminin', questions: [...reproFemaleAdmissionSet1, ...reproFemaleAdmissionSet2, ...reproFemaleAdmissionSet3, ...reproFemaleAdmissionSet4, ...reproFemaleAdmissionSet5, ...reproFemaleAdmissionSet6, ...reproFemaleAdmissionSet7, ...reproFemaleAdmissionSet8, ...reproFemaleAdmissionSet9, ...reproFemaleAdmissionSet10] },
    { id: 'embryology', name: 'Sarcina și dezvoltarea timpurie', questions: [...embryologyAdmissionSet1, ...embryologyAdmissionSet2, ...embryologyAdmissionSet3, ...embryologyAdmissionSet4, ...embryologyAdmissionSet5, ...embryologyAdmissionSet6, ...embryologyAdmissionSet7, ...embryologyAdmissionSet8, ...embryologyAdmissionSet9, ...embryologyAdmissionSet10] },
  ],
};

export const moduleChaptersMap: Record<string, ModuleChapters> = {
  'upper-lower-limbs': upperLowerLimbsChapters,
  'internal-organs': internalOrgansChapters,
  'head-neck': headNeckChapters,
  'neuroanatomy': neuroanatomyChapters,
  'med-admission-barrons': medAdmissionChapters,
};

export function getChaptersForModule(moduleId: string): Chapter[] {
  const moduleChapters = moduleChaptersMap[moduleId];
  return moduleChapters ? moduleChapters.chapters : [];
}

export function getModuleQuestionCount(moduleId: string): number {
  return getChaptersForModule(moduleId).reduce(
    (sum, chapter) => sum + chapter.questions.length,
    0,
  );
}

export function getAllQuestionsWithChapters(moduleId: string): { question: Question; chapterId: string; chapterName: string }[] {
  const chapters = getChaptersForModule(moduleId);
  const result: { question: Question; chapterId: string; chapterName: string }[] = [];
  
  for (const chapter of chapters) {
    for (const question of chapter.questions) {
      result.push({ question, chapterId: chapter.id, chapterName: chapter.name });
    }
  }
  
  return result;
}
