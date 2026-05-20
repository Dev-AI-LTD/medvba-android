export type TopicSeedEn = {
  chapterId: string;
  title: string;
  parentChapterId: string;
  learn: string;
  concepts: string[];
  clinical: string[];
  pitfalls: string[];
  mini: string;
};

export function mdEn(seed: TopicSeedEn): string {
  const concepts = seed.concepts.map((c) => `- ${c}`).join("\n");
  const clinical = seed.clinical.map((c) => `- ${c}`).join("\n");
  const pitfalls = seed.pitfalls.map((c) => `- ${c}`).join("\n");
  return `## What you learn in this chapter

${seed.learn}

## Key concepts

${concepts}

## Clinical and exam connections

${clinical}

## Common exam pitfalls

${pitfalls}

## Mini-summary

${seed.mini}`;
}

export const PILOT_EN: TopicSeedEn[] = [
  {
    chapterId: "internal-organs-intro",
    title: "Internal Organs - Introduction",
    parentChapterId: "cardiovascular",
    learn:
      "This chapter introduces the organization of the thoracic and abdominal cavities and how organs, vessels, and supporting structures relate to one another. It is the foundation for detailed chapters on the heart, lungs, and great vessels.",
    concepts: [
      "**Thoracic cavity**: contains the heart, lungs, thoracic trachea, esophagus, and great vessels.",
      "**Abdominal cavity**: digestive organs, spleen, kidneys, and abdominal vessels.",
      "**Mediastinum**: central compartment between the lungs (anterior, middle, posterior).",
      "**Peritoneum**: serous membrane lining abdominal organs and forming the mesentery.",
      "**Anatomical relations**: an organ's position relative to neighbors is essential on exams.",
    ],
    clinical: [
      "**Imaging**: compartments explain lesion location on CT/X-ray.",
      "**Surgery**: incisions follow anatomical layers and lodges.",
    ],
    pitfalls: [
      "Confusing **mediastinum** (space) with **pericardium** (heart sac).",
      "Mixing abdominal and pelvic cavities for inferior genital organs.",
    ],
    mini:
      "The introduction sets the topographic frame: thorax for circulation and respiration, abdomen for digestion and vessels. Mediastinum and peritoneum organize relations used in all Internal Organs sub-chapters.",
  },
  {
    chapterId: "heart-external",
    title: "Heart - External Anatomy",
    parentChapterId: "cardiovascular",
    learn:
      "You study the external shape of the heart, its surfaces and borders, and relations to the lungs, diaphragm, and great vessels. These landmarks guide clinical and imaging orientation.",
    concepts: [
      "**Shape and orientation**: ovoid pyramid; base superior and broad; apex left-anterior-inferior.",
      "**Surfaces**: sternocostal (anterior), diaphragmatic (inferior), left and right pulmonary.",
      "**Left border**: mainly left ventricle; right border mainly right atrium.",
      "**Coronary sulcus**: groove between atria and ventricles; contains coronary vessels.",
      "**Apex of heart**: 5th left intercostal space, midclavicular line.",
      "**Relations**: posterior to esophagus and aorta; lateral to lungs; inferior to diaphragm.",
    ],
    clinical: [
      "**Auscultation**: surfaces and valves match listening areas.",
      "**Chest imaging**: cardiac silhouette and apex on radiographs.",
    ],
    pitfalls: [
      "Confusing **apex** (left ventricle) with **base** (atria and great vessels).",
      "Assuming the right border is formed by the right ventricle (right atrium predominates).",
    ],
    mini:
      "External heart anatomy provides topographic landmarks: apex, base, surfaces, and coronary sulcus. Relations to lungs and diaphragm explain clinical projection. Master orientation before chambers and valves.",
  },
  {
    chapterId: "heart-vascularization",
    title: "Heart Vascularization",
    parentChapterId: "cardiovascular",
    learn:
      "Heart vascularization covers coronary arteries and cardiac veins supplying the myocardium. You learn origin, main course, and ischemic risk zones.",
    concepts: [
      "**Coronary arteries**: right (usually from right aortic sinus) and left (circumflex and LAD branches).",
      "**Dominance**: right, left, or codominant — posterior descending vs circumflex relationship.",
      "**Cardiac veins**: small (myocardial) and great (coronary sinus → right atrium).",
      "**Coronary sinus**: collects most coronary venous blood.",
      "**Watershed zones**: border territories between arterial supplies, prone to ischemia.",
    ],
    clinical: [
      "**Myocardial infarction**: territory depends on occluded artery (LAD, CX, RCA).",
      "**CABG**: surgical targets follow coronary anatomy.",
    ],
    pitfalls: [
      "Treating the **left main** as two separate arterial origins from the aorta.",
      "Confusing **pulmonary veins** (oxygenated to left heart) with coronary veins.",
    ],
    mini:
      "Coronary circulation perfuses the myocardium via arteries and cardiac veins. Dominance and LAD/CX/RCA branches define ischemic territories. The coronary sinus drains most venous blood from the wall.",
  },
  {
    chapterId: "right-atrium",
    title: "Right Atrium",
    parentChapterId: "cardiovascular",
    learn:
      "The right atrium receives systemic venous blood and directs it to the right ventricle. Internal structures (tricuspid valve, crista terminalis, venous openings) are common exam topics.",
    concepts: [
      "**Venous inflow**: superior and inferior vena cava plus coronary sinus.",
      "**Tricuspid valve**: at right AV orifice; prevents systolic reflux into the atrium.",
      "**Crista terminalis**: separates smooth (sinus venarum) from rough (auricle) parts.",
      "**Fossa ovalis**: remnant of fetal foramen ovale in the interatrial septum.",
      "**SA node**: in right atrial wall near the SVC opening — primary pacemaker.",
    ],
    clinical: [
      "**Atrial fibrillation**: often involves right and left atrial tissue.",
      "**ASD**: patent foramen or communication through fossa ovalis.",
    ],
    pitfalls: [
      "Confusing **coronary sinus** (vein) with an arterial structure.",
      "Placing the **SA node** in the left atrium.",
    ],
    mini:
      "The right atrium collects systemic venous blood and passes it through the tricuspid valve. Crista terminalis and fossa ovalis are septal landmarks. The SA node in the right wall initiates cardiac rhythm.",
  },
  {
    chapterId: "left-atrium",
    title: "Left Atrium",
    parentChapterId: "cardiovascular",
    learn:
      "The left atrium receives oxygenated blood from the lungs and sends it to the left ventricle. Pulmonary venous anatomy and mitral valve relations are essential.",
    concepts: [
      "**Pulmonary veins**: typically four openings in the posterior wall.",
      "**Mitral valve**: two cusps; controls flow to the left ventricle.",
      "**Posterior wall**: thin; related to esophagus (transesophageal echo).",
      "**Left auricle**: anterior extension; common site of thrombus in AF.",
      "**Interatrial septum**: separates atria; pathologic shunts may occur.",
    ],
    clinical: [
      "**Mitral stenosis**: left atrial dilation and embolic risk.",
      "**Echo**: left atrial size is prognostic in heart failure.",
    ],
    pitfalls: [
      "Assuming **two pulmonary veins** instead of four typical openings.",
      "Believing the mitral valve has three cusps (it is bicuspid).",
    ],
    mini:
      "The left atrium receives oxygenated blood via pulmonary veins and passes it through the mitral valve. The posterior wall and auricle matter in arrhythmia and embolism.",
  },
  {
    chapterId: "right-ventricle",
    title: "Right Ventricle",
    parentChapterId: "cardiovascular",
    learn:
      "The right ventricle pumps blood to the lungs via the pulmonary artery. Trabeculae, septomarginal band, and pulmonary valve distinguish the right heart.",
    concepts: [
      "**Trabeculae carneae**: muscular ridges aiding ejection.",
      "**Septomarginal band**: carries conduction tissue; links septum to wall.",
      "**Pulmonary valve**: three semilunar cusps to pulmonary trunk.",
      "**Pulmonary infundibulum**: muscular outflow tract to pulmonary artery.",
      "**Anterior wall**: thin; related to sternum (penetrating trauma).",
    ],
    clinical: [
      "**Pulmonary hypertension**: RV hypertrophy and dilation.",
      "**Bundle branch block**: septomarginal band contains conduction tissue.",
    ],
    pitfalls: [
      "Confusing **right ventricle** with **right atrium** for tricuspid location.",
      "Mixing **pulmonary artery** (deoxygenated) with the aorta.",
    ],
    mini:
      "The right ventricle ejects deoxygenated blood to the lungs. Trabeculae, septomarginal band, and pulmonary valve are internal landmarks. The thin anterior wall is trauma-prone.",
  },
  {
    chapterId: "left-ventricle",
    title: "Left Ventricle",
    parentChapterId: "cardiovascular",
    learn:
      "The left ventricle generates systemic pressure and pumps blood into the aorta. Thick myocardium and the aortic valve define systemic pumping.",
    concepts: [
      "**Thick wall**: adapted for high pressure; conical toward apex.",
      "**Aortic valve**: three semilunar cusps; prevents diastolic reflux.",
      "**Interventricular septum**: separates ventricles; membranous superior part.",
      "**Papillary muscles and chordae**: anchor mitral cusps during systole.",
      "**Aortic orifice**: posterior and right of the mitral orifice.",
    ],
    clinical: [
      "**Anterior infarction**: often affects LV wall.",
      "**Aortic regurgitation**: compensatory LV dilation.",
    ],
    pitfalls: [
      "Forgetting the **LV wall is much thicker** than the RV.",
      "Assuming the aortic valve is normally bicuspid.",
    ],
    mini:
      "The left ventricle is the systemic pumping chamber with a thick wall and aortic valve. Papillary muscles support the mitral valve. The interventricular septum separates it from the right ventricle.",
  },
  {
    chapterId: "coronary-circulation",
    title: "Coronary Circulation",
    parentChapterId: "cardiovascular",
    learn:
      "Coronary circulation describes arterial and venous flow feeding the myocardium, including cycle-dependent perfusion and factors affecting coronary flow.",
    concepts: [
      "**Diastolic perfusion**: coronary arteries fill mainly in diastole.",
      "**Autoregulation**: maintains flow across perfusion pressure ranges.",
      "**Myocardial metabolism**: high O₂ demand; high oxygen extraction.",
      "**Collateral vessels**: develop slowly in chronic obstruction.",
      "**Aortic sinuses**: typical origin of right and left coronaries.",
    ],
    clinical: [
      "**Angina**: supply–demand mismatch.",
      "**Tachycardia**: shortens diastole and may reduce coronary filling.",
    ],
    pitfalls: [
      "Assuming significant **systolic** coronary filling (mainly diastolic).",
      "Ignoring **coronary dominance** when interpreting territories.",
    ],
    mini:
      "Coronary circulation oxygenates the myocardium with diastolic filling and autoregulation. Aortic sinus origins and cardiac veins complete the circuit. Ischemia appears with demand or tachycardia.",
  },
  {
    chapterId: "pulmonary-circulation",
    title: "Pulmonary Circulation",
    parentChapterId: "cardiovascular",
    learn:
      "Pulmonary circulation carries deoxygenated blood from the right ventricle to the lungs and returns oxygenated blood to the left atrium. Pressures are low compared with the systemic circuit.",
    concepts: [
      "**Pulmonary trunk**: exits RV; bifurcates into right and left pulmonary arteries.",
      "**Pulmonary arterioles**: carry deoxygenated blood to alveolar capillaries.",
      "**Pulmonary capillaries**: site of gas exchange.",
      "**Pulmonary veins**: carry oxygenated blood to the left atrium.",
      "**Low-pressure bed**: adapted for gas exchange, not high systemic pressure.",
    ],
    clinical: [
      "**Pulmonary embolism**: acute arterial obstruction.",
      "**Pulmonary hypertension**: vascular remodeling and RV strain.",
    ],
    pitfalls: [
      "Confusing **pulmonary artery** (deoxygenated) with the **aorta**.",
      "Treating pulmonary veins like systemic veins.",
    ],
    mini:
      "Pulmonary circulation oxygenates blood between the right ventricle and left atrium. Pulmonary arteries carry deoxygenated blood; pulmonary veins return oxygenated blood. Low pressure is characteristic.",
  },
  {
    chapterId: "systemic-portal",
    title: "Systemic and Portal Circulation",
    parentChapterId: "cardiovascular",
    learn:
      "Systemic circulation distributes oxygenated blood from the left ventricle to tissues. Portal circulation routes gastrointestinal blood through the liver before the caval system.",
    concepts: [
      "**Aorta**: LV outflow; arch, thoracic, and abdominal segments with major branches.",
      "**Systemic circuit**: arteries → capillaries → veins → right atrium.",
      "**Portal circuit**: portal vein links gut capillaries to hepatic sinusoids.",
      "**SVC and IVC**: systemic venous return to the right atrium.",
      "**Portosystemic anastomoses**: open when portal pressure rises.",
    ],
    clinical: [
      "**Esophageal varices**: portosystemic shunting.",
      "**Shock**: systemic flow redistribution affects organ perfusion.",
    ],
    pitfalls: [
      "Confusing **portal** (two capillary beds) with **systemic** (one).",
      "Mixing **portal vein** origin with caval veins.",
    ],
    mini:
      "Systemic circulation delivers oxygen and nutrients, then returns blood to the right atrium. Portal circulation filters intestinal blood in the liver. Both explain cirrhosis and varices.",
  },
  {
    chapterId: "fetal-circulation",
    title: "Fetal Circulation",
    parentChapterId: "cardiovascular",
    learn:
      "Fetal circulation bypasses unventilated lungs via shunts (foramen ovale, ductus arteriosus) and uses the placenta for gas exchange.",
    concepts: [
      "**Foramen ovale**: right-to-left atrial flow driven by pressures.",
      "**Ductus arteriosus**: pulmonary trunk to aorta; bypasses lungs.",
      "**Ductus venosus**: partial hepatic bypass from umbilical vein.",
      "**Placenta**: fetal gas and nutrient exchange organ.",
      "**Birth transition**: shunt closure and rising pulmonary vascular resistance.",
    ],
    clinical: [
      "**PDA**: persistent left-to-right shunt after birth.",
      "**Neonatal cyanosis**: right-to-left shunt lesions.",
    ],
    pitfalls: [
      "Reversing **foramen ovale** fetal direction (right → left).",
      "Assuming fetal lungs are fully perfused like adult lungs.",
    ],
    mini:
      "The fetus bypasses lungs via foramen ovale and ductus arteriosus; the placenta oxygenates blood. At birth, shunts close and pulmonary circulation becomes functional. Persistent shunts cause neonatal cyanosis or PDA.",
  },
  {
    chapterId: "microcirculation",
    title: "Microcirculation",
    parentChapterId: "cardiovascular",
    learn:
      "Microcirculation includes arterioles, capillaries, and venules where tissue exchange occurs. Local mechanisms regulate flow and permeability.",
    concepts: [
      "**Capillaries**: small-diameter exchange network.",
      "**Precapillary arterioles**: muscular tone controls flow.",
      "**Starling filtration**: hydrostatic vs oncotic balance.",
      "**Venules**: collect blood; high venous capacitance.",
      "**Local autoregulation**: metabolites, hypoxia, mechanical stimuli.",
    ],
    clinical: [
      "**Edema**: capillary filtration imbalance.",
      "**Shock**: microcirculatory flow redistribution.",
    ],
    pitfalls: [
      "Assigning **exchange** to veins instead of capillaries.",
      "Ignoring **precapillary tone** in flow control.",
    ],
    mini:
      "Microcirculation is where tissue exchange occurs via capillaries and precapillary control. Starling forces explain edema. Local autoregulation matches flow to metabolic need.",
  },
  {
    chapterId: "hemodynamics",
    title: "Hemodynamics",
    parentChapterId: "cardiovascular",
    learn:
      "Hemodynamics relates pressure, flow, and vascular resistance. Continuity and arterial pressure regulation are central to admission exams.",
    concepts: [
      "**Cardiac output**: volume per minute; heart rate × stroke volume.",
      "**Vascular resistance**: opposes flow; set by arteriolar tone.",
      "**Arterial pressure**: depends on output and peripheral resistance.",
      "**Continuity**: serial segments share flow (except shunts).",
      "**Flow distribution**: organs receive variable fractions of output.",
    ],
    clinical: [
      "**Hypotension**: low output or mismatched resistance.",
      "**Antihypertensives**: act on resistance or volume.",
    ],
    pitfalls: [
      "Equating **pressure** with **flow** (they can diverge).",
      "Assuming resistance is fixed (it varies with tone).",
    ],
    mini:
      "Hemodynamics links output, resistance, and arterial pressure. Cardiac output and arteriolar tone are key regulators. This explains shock, hypertension, and drug effects.",
  },
  {
    chapterId: "ascending-aorta",
    title: "Ascending Aorta",
    parentChapterId: "cardiovascular",
    learn:
      "The ascending aorta leaves the left ventricle and continues as the aortic arch. Coronary origins and cardiac relations are high-yield.",
    concepts: [
      "**Origin**: from aortic orifice just above the aortic valve.",
      "**Relations**: anterior to heart, lateral to lungs, posterior to left atrium.",
      "**Coronary arteries**: usually from sinuses in the proximal segment.",
      "**Pericardium**: ascending aorta lies within pericardial reflection.",
      "**Extent**: to manubrium level where the arch begins.",
    ],
    clinical: [
      "**Type A dissection**: may start in ascending aorta.",
      "**Imaging**: aortic contour on chest radiographs.",
    ],
    pitfalls: [
      "Confusing **ascending aorta** with **pulmonary trunk**.",
      "Placing coronary origins at the mitral valve.",
    ],
    mini:
      "The ascending aorta is the initial post-valvular segment with coronary sinus origins. Relations to heart and pericardium matter clinically. It continues cranially as the arch.",
  },
  {
    chapterId: "aortic-arch",
    title: "Aortic Arch",
    parentChapterId: "cardiovascular",
    learn:
      "The aortic arch curves superiorly and gives supra-aortic branches supplying the head, neck, and upper limbs.",
    concepts: [
      "**Brachiocephalic trunk**: splits into right common carotid and right subclavian.",
      "**Left common carotid**: direct arch branch in most individuals.",
      "**Left subclavian**: last major arch branch.",
      "**Ligamentum arteriosum**: fetal ductus arteriosus remnant.",
      "**Relations**: trachea and esophagus posteriorly; left recurrent laryngeal under arch.",
    ],
    clinical: [
      "**Arch pathology**: assessed by CT angiography and ultrasound.",
      "**Recurrent laryngeal**: arch anatomy explains its course.",
    ],
    pitfalls: [
      "Assuming **symmetric** bilateral origins from the arch (brachiocephalic is right-only).",
      "Confusing left and right **common carotid** origins.",
    ],
    mini:
      "The arch gives brachiocephalic trunk, left common carotid, and left subclavian. The ligamentum arteriosum marks the fetal ductus. Relations to trachea and recurrent laryngeal nerve are surgically important.",
  },
];
