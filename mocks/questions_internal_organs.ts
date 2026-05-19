import type { Question } from './questions';

export const internalOrgansQuestions: Question[] = [
  {
    id: 'io-001',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which organ is responsible for producing insulin?',
    question_ro: 'Care organ este responsabil pentru producerea insulinei?',
    options: ['Liver', 'Pancreas', 'Kidney', 'Spleen'],
    options_ro: ['Ficatul', 'Pancreasul', 'Rinichiul', 'Splina'],
    correctAnswer: 1,
    explanation: 'The pancreas produces insulin in the beta cells of the islets of Langerhans, which regulates blood glucose levels.',
    explanation_ro: 'Pancreasul produce insulină în celulele beta ale insulelor Langerhans, care reglează nivelurile de glucoză din sânge.',
  },
  {
    id: 'io-002',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'Where is the appendix located?',
    question_ro: 'Unde este localizat apendicele?',
    options: ['Upper left quadrant', 'Upper right quadrant', 'Lower left quadrant', 'Lower right quadrant'],
    options_ro: ['Cadranul superior stâng', 'Cadranul superior drept', 'Cadranul inferior stâng', 'Cadranul inferior drept'],
    correctAnswer: 3,
    explanation: 'The appendix is located in the lower right quadrant of the abdomen, attached to the cecum of the large intestine.',
    explanation_ro: 'Apendicele este localizat în cadranul inferior drept al abdomenului, atașat la cecum al intestinului gros.',
  },
];

export { headNeckHomeQuestions as headNeckQuestions } from './questions_head_neck_home';

export const neuroanatomyQuestions: Question[] = [
  {
    id: 'na-001',
    category: 'neuroanatomy',
    difficulty: 'hard',
    question: 'Which structure connects the two cerebral hemispheres?',
    question_ro: 'Care structură conectează cele două emisfere cerebrale?',
    options: ['Pons', 'Corpus callosum', 'Thalamus', 'Hypothalamus'],
    options_ro: ['Puntea', 'Corpul calos', 'Talamusul', 'Hipotalamusul'],
    correctAnswer: 1,
    explanation: 'The corpus callosum is the largest white matter structure in the brain, connecting the left and right cerebral hemispheres and facilitating interhemispheric communication.',
    explanation_ro: 'Corpul calos este cea mai mare structură de substanță albă din creier, conectând emisferele cerebrale stângă și dreaptă și facilitând comunicarea interhemisferică.',
  },
  {
    id: 'na-002',
    category: 'neuroanatomy',
    difficulty: 'hard',
    question: 'Which part of the brain is primarily responsible for motor coordination?',
    question_ro: 'Care parte a creierului este în principal responsabilă pentru coordonarea motorie?',
    options: ['Cerebrum', 'Cerebellum', 'Brainstem', 'Limbic system'],
    options_ro: ['Cerebrumul', 'Cerebel', 'Trunchiul cerebral', 'Sistemul limbic'],
    correctAnswer: 1,
    explanation: 'The cerebellum is responsible for coordinating voluntary movements, maintaining balance, and motor learning.',
    explanation_ro: 'Cerebelul este responsabil pentru coordonarea mișcărilor voluntare, menținerea echilibrului și învățarea motorie.',
  },
];

export const pulmonaryAndBronchialCirculationQuestions: Question[] = [
  {
    id: 'pc1',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'Which statement BEST distinguishes pulmonary from systemic circulation with respect to oxygen content in major vessels?',
    question_ro: 'Care afirmație diferențiază CEL MAI BINE circulația pulmonară de cea sistemică în ceea ce privește conținutul de oxigen în vasele majore?',
    options: [
      'Pulmonary arteries carry oxygenated blood to the lungs and pulmonary veins carry deoxygenated blood',
      'Pulmonary arteries and veins both carry deoxygenated blood',
      'Pulmonary arteries carry deoxygenated blood to the lungs and pulmonary veins carry oxygenated blood to the heart',
      'Pulmonary arteries carry mixed blood and pulmonary veins carry only deoxygenated blood',
      'Pulmonary circulation has no veins, only arteries and capillaries'
    ],
    options_ro: [
      'Arterele pulmonare transportă sânge oxigenat către plămâni și venele pulmonare transportă sânge dezoxigenat',
      'Arterele și venele pulmonare transportă ambele sânge dezoxigenat',
      'Arterele pulmonare transportă sânge dezoxigenat către plămâni și venele pulmonare transportă sânge oxigenat către inimă',
      'Arterele pulmonare transportă sânge mixt și venele pulmonare transportă doar sânge dezoxigenat',
      'Circulația pulmonară nu are vene, doar artere și capilare'
    ],
    correctAnswer: 2,
    explanation:
      'In pulmonary circulation, arteries leave the right ventricle carrying deoxygenated blood to the lungs, while pulmonary veins return oxygenated blood to the left atrium.[web:231][web:236][web:241]',
    explanation_ro:
      'În circulația pulmonară, arterele ies din ventriculul drept transportând sânge dezoxigenat către plămâni, în timp ce venele pulmonare returnează sânge oxigenat către atriul stâng.'
  },
  {
    id: 'pc2',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'How many pulmonary veins usually drain into the left atrium?',
    question_ro: 'Câte vene pulmonare se drenează de obicei în atriul stâng?',
    options: [
      'Two (one from each lung)',
      'Three (one from each lobe of the right lung)',
      'Four (two from each lung)',
      'Six (one from each lobe of both lungs)',
      'A single common pulmonary vein'
    ],
    options_ro: [
      'Două (una din fiecare plămân)',
      'Trei (una din fiecare lob al plămânului drept)',
      'Patru (două din fiecare plămân)',
      'Șase (una din fiecare lob al ambilor plămâni)',
      'O singură venă pulmonară comună'
    ],
    correctAnswer: 2,
    explanation:
      'Typically, four pulmonary veins (two from each lung) return oxygenated blood to the left atrium.[web:231][web:233][web:236]',
    explanation_ro:
      'De obicei, patru vene pulmonare (două din fiecare plămân) returnează sânge oxigenat către atriul stâng.'
  },
  {
    id: 'pc3',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which description BEST summarizes the dual arterial blood supply to the lungs?',
    question_ro: 'Care descriere rezumă CEL MAI BINE dubla aprovizionare arterială cu sânge a plămânilor?',
    options: [
      'Only pulmonary arteries supply the lungs',
      'Only bronchial arteries supply the lungs',
      'Pulmonary arteries provide low-pressure blood for gas exchange; bronchial arteries provide high-pressure systemic blood to conducting airways and supporting structures',
      'Bronchial arteries provide deoxygenated blood to the alveoli',
      'Pulmonary arteries and bronchial arteries both arise from the right ventricle'
    ],
    options_ro: [
      'Doar arterele pulmonare alimentează plămânii',
      'Doar arterele bronșice alimentează plămânii',
      'Arterele pulmonare furnizează sânge la presiune joasă pentru schimbul de gaze; arterele bronșice furnizează sânge sistemic la presiune înaltă către căile respiratorii conducătoare și structurile de susținere',
      'Arterele bronșice furnizează sânge dezoxigenat către alveole',
      'Arterele pulmonare și arterele bronșice provin ambele din ventriculul drept'
    ],
    correctAnswer: 2,
    explanation:
      'Pulmonary arteries (from the right ventricle) form a low-pressure circuit for gas exchange, while bronchial arteries (from the aorta) supply oxygenated systemic blood to bronchi, larger vessels and pleura.[web:232][web:237][web:243]',
    explanation_ro:
      'Arterele pulmonare (din ventriculul drept) formează un circuit la presiune joasă pentru schimbul de gaze, în timp ce arterele bronșice (din aortă) furnizează sânge sistemic oxigenat către bronhii, vasele mai mari și pleură.'
  },
  {
    id: 'pc4',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which structures are primarily supplied by the bronchial arteries rather than the pulmonary arteries?',
    question_ro: 'Care structuri sunt în principal alimentate de arterele bronșice în loc de arterele pulmonare?',
    options: [
      'Alveolar capillary beds only',
      'Respiratory bronchioles and alveoli only',
      'Conducting airways (bronchi and bronchioles), visceral pleura and walls of large pulmonary vessels',
      'Only the parietal pleura',
      'Only the right ventricle'
    ],
    options_ro: [
      'Doar paturile capilare alveolare',
      'Doar bronhiolele respiratorii și alveolele',
      'Căile respiratorii conducătoare (bronhii și bronhiole), pleura viscerală și pereții vaselor pulmonare mari',
      'Doar pleura parietală',
      'Doar ventriculul drept'
    ],
    correctAnswer: 2,
    explanation:
      'Bronchial arteries supply the bronchial tree down to the respiratory bronchioles, visceral pleura, hilar lymph nodes and walls of large pulmonary vessels.[web:235][web:240][web:243]',
    explanation_ro:
      'Arterele bronșice alimentează arborele bronșic până la bronhiolele respiratorii, pleura viscerală, ganglionii limfatici hilari și pereții vaselor pulmonare mari.'
  },
  {
    id: 'pc5',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which route BEST describes venous drainage of blood supplied by the bronchial arteries?',
    question_ro: 'Care cale descrie CEL MAI BINE drenajul venos al sângelui furnizat de arterele bronșice?',
    options: [
      'Entirely via bronchial veins into the azygos system',
      'Entirely via pulmonary veins to the left atrium',
      'Partly via bronchial veins to systemic veins and partly via anastomoses into pulmonary veins',
      'Exclusively via the inferior vena cava',
      'Exclusively via the portal venous system'
    ],
    options_ro: [
      'În întregime prin venele bronșice în sistemul azygos',
      'În întregime prin venele pulmonare către atriul stâng',
      'Parțial prin venele bronșice către venele sistemice și parțial prin anastomoze în venele pulmonare',
      'Exclusiv prin vena cavă inferioară',
      'Exclusiv prin sistemul venos portal'
    ],
    correctAnswer: 2,
    explanation:
      'Approximately one-third of bronchial arterial blood drains via bronchial veins to systemic veins (e.g. azygos), while the remainder enters pulmonary veins, creating a small physiological right-to-left shunt.[web:235][web:238][web:240]',
    explanation_ro:
      'Aproximativ o treime din sângele arterial bronșic se drenează prin venele bronșice către venele sistemice (ex. azygos), în timp ce restul intră în venele pulmonare, creând un mic șunt fiziologic dreapta-stânga.'
  },
  {
    id: 'pc6',
    category: 'internal-organs',
    difficulty: 'hard',
    question: 'Which hemodynamic feature is MOST characteristic of the pulmonary arterial system compared with systemic arteries?',
    question_ro: 'Care caracteristică hemodinamică este CEL MAI caracteristică sistemului arterial pulmonar comparativ cu arterele sistemice?',
    options: [
      'Higher resistance and thicker walls',
      'Lower resistance, thinner more compliant walls and larger total cross-sectional area',
      'Absence of smooth muscle in the pulmonary arterial wall',
      'Presence of valves throughout the pulmonary arteries',
      'Complete absence of elastic tissue'
    ],
    options_ro: [
      'Rezistență mai mare și pereți mai groși',
      'Rezistență mai mică, pereți mai subțiri mai complianți și arie transversală totală mai mare',
      'Absența mușchiului neted în peretele arterial pulmonar',
      'Prezența valvelor pe toată lungimea arterelor pulmonare',
      'Absența completă a țesutului elastic'
    ],
    correctAnswer: 1,
    explanation:
      'Pulmonary arteries are thinner-walled, more compliant and operate at lower pressures and resistance than systemic arteries, suited to receiving the entire cardiac output at low pressure.[web:239][web:242]',
    explanation_ro:
      'Arterele pulmonare au pereți mai subțiri, sunt mai compliante și funcționează la presiuni și rezistențe mai mici decât arterele sistemice, fiind adaptate să primească întregul debit cardiac la presiune joasă.'
  },
  {
    id: 'pc7',
    category: 'internal-organs',
    difficulty: 'hard',
    question: 'Which statement BEST explains why pulmonary edema may initially present as "peribronchial cuffing" on imaging?',
    question_ro: 'Care afirmație explică CEL MAI BINE de ce edemul pulmonar poate prezenta inițial „manchonare peribronșică” la imagistică?',
    options: [
      'Edema fluid accumulates first in the pleural space',
      'Bronchial arteries lack any lymphatic drainage',
      'Fluid tends to accumulate in peribronchovascular interstitial sheaths where pulmonary arteries, veins and bronchi run together',
      'Pulmonary capillaries do not accompany bronchi',
      'Only bronchial veins are affected in early edema'
    ],
    options_ro: [
      'Lichidul de edem se acumulează mai întâi în spațiul pleural',
      'Arterele bronșice nu au drenaj limfatic',
      'Lichidul tinde să se acumuleze în tecile interstițiale peribronchovasculare unde arterele pulmonare, venele și bronhiile circulă împreună',
      'Capilarele pulmonare nu însoțesc bronhiile',
      'Doar venele bronșice sunt afectate în edemul precoce'
    ],
    correctAnswer: 2,
    explanation:
      'Pulmonary arteries and veins travel with bronchi in bronchovascular bundles; interstitial fluid accumulation around these structures produces peribronchial "cuffing" on radiographs.[web:231][web:238][web:239]',
    explanation_ro:
      'Arterele și venele pulmonare circulă cu bronhiile în fascicule bronchovasculare; acumularea de lichid interstițial în jurul acestor structuri produce „manchonare” peribronșică la radiografii.'
  }
];

export const systemicAndPortalCirculationQuestions: Question[] = [
  {
    id: 'spc1',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'Which circuit carries oxygenated blood from the left ventricle to body tissues and returns deoxygenated blood to the right atrium?',
    options: [
      'Pulmonary circulation',
      'Portal circulation',
      'Systemic circulation',
      'Coronary circulation only',
      'Lymphatic circulation'
    ],
    correctAnswer: 2,
    explanation:
      'Systemic circulation delivers oxygenated blood from the left ventricle via the aorta to tissues and returns deoxygenated blood via the venae cavae to the right atrium.[web:244][web:241][web:250]'
  },
  {
    id: 'spc2',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'Which vessel is the main arterial outflow tract of the systemic circulation?',
    options: [
      'Pulmonary trunk',
      'Superior vena cava',
      'Inferior vena cava',
      'Aorta',
      'Hepatic portal vein'
    ],
    correctAnswer: 3,
    explanation:
      'The aorta is the principal systemic artery receiving blood from the left ventricle and distributing it to all body regions.[web:244][web:241][web:250]'
  },
  {
    id: 'spc3',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which sequence correctly describes the order of vessels as blood flows through the systemic circulation from the heart and back?',
    options: [
      'Left ventricle → venae cavae → aorta → right atrium',
      'Left ventricle → aorta → arteries → arterioles → capillaries → venules → veins → venae cavae → right atrium',
      'Right ventricle → pulmonary trunk → pulmonary veins → left atrium',
      'Left atrium → pulmonary veins → pulmonary arteries → right ventricle',
      'Right atrium → aorta → pulmonary veins → left ventricle'
    ],
    correctAnswer: 1,
    explanation:
      'In systemic circulation, blood flows from the left ventricle into the aorta, through arteries, arterioles, capillaries, venules and veins, then the venae cavae to the right atrium.[web:241][web:248][web:255]'
  },
  {
    id: 'spc4',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which statement BEST describes the hepatic portal venous system?',
    options: [
      'It carries oxygenated blood from the lungs directly to the heart',
      'It carries venous blood from the gastrointestinal tract and spleen to the liver before it returns to the systemic circulation',
      'It drains venous blood from the brain to the right atrium',
      'It is a system of arteries supplying the liver only',
      'It bypasses the liver, sending nutrients directly to the inferior vena cava'
    ],
    correctAnswer: 1,
    explanation:
      'The hepatic portal system carries nutrient-rich venous blood from stomach, intestines, pancreas and spleen to the liver for processing before it reaches the systemic circulation.[web:249][web:251][web:256]'
  },
  {
    id: 'spc5',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which veins usually unite to form the hepatic portal vein?',
    options: [
      'Superior vena cava and inferior vena cava',
      'Renal veins and hepatic veins',
      'Superior mesenteric vein and splenic vein',
      'Internal jugular vein and subclavian vein',
      'Common iliac veins'
    ],
    correctAnswer: 2,
    explanation:
      'The hepatic portal vein is typically formed by the convergence of the superior mesenteric vein and splenic vein at the splenic–mesenteric confluence.[web:249][web:251][web:253]'
  },
  {
    id: 'spc6',
    category: 'internal-organs',
    difficulty: 'hard',
    question: 'Which sequence BEST represents the path of blood through the hepatic portal system back to the systemic venous circulation?',
    options: [
      'Portal vein → hepatic sinusoids → central veins → hepatic veins → inferior vena cava',
      'Portal vein → hepatic arteries → coronary sinus → superior vena cava',
      'Portal vein → renal veins → inferior vena cava',
      'Portal vein → azygos vein → superior vena cava',
      'Portal vein → pulmonary veins → left atrium'
    ],
    correctAnswer: 0,
    explanation:
      'Portal venous blood enters liver sinusoids, drains into central veins, then hepatic veins, which finally empty into the inferior vena cava.[web:249][web:251][web:256]'
  },
  {
    id: 'spc7',
    category: 'internal-organs',
    difficulty: 'hard',
    question: 'Functionally, how does portal venous flow differ from typical systemic venous return?',
    options: [
      'Portal veins always carry oxygenated blood, unlike systemic veins',
      'Portal blood passes through two capillary beds in series (gut and liver) before returning to the heart',
      'Portal veins drain only the lungs',
      'Portal blood bypasses all capillary beds',
      'Portal veins contain many valves to prevent flow toward the liver'
    ],
    correctAnswer: 1,
    explanation:
      'In a portal system, venous blood from one capillary bed (gut) passes through a second capillary bed (liver sinusoids) before returning to the systemic circulation.[web:235][web:249][web:256]'
  }
];

export const fetalCirculationQuestions: Question[] = [
  {
    id: 'fc1',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'Which statement BEST describes the main purpose of fetal circulatory shunts?',
    options: [
      'To increase blood flow to the fetal lungs and liver',
      'To bypass the placenta and direct blood to the kidneys',
      'To bypass the non-functioning fetal lungs and partially bypass the liver while ensuring oxygenated blood reaches vital organs',
      'To mix maternal and fetal blood directly in the heart chambers',
      'To prevent blood from reaching the brain and myocardium'
    ],
    correctAnswer: 2,
    explanation:
      'Fetal shunts (ductus venosus, foramen ovale, ductus arteriosus) allow oxygenated placental blood to bypass lungs and partly the liver, prioritizing perfusion of heart and brain.[web:257][web:260][web:268]'
  },
  {
    id: 'fc2',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'Which combination correctly lists the three major fetal circulatory shunts?',
    options: [
      'Foramen ovale, ductus arteriosus, ductus venosus',
      'Foramen ovale, coronary sinus, ductus venosus',
      'Ductus arteriosus, azygos vein, ligamentum teres',
      'Ductus venosus, superior vena cava, umbilical vein',
      'Ligamentum arteriosum, ligamentum venosum, umbilical ligament'
    ],
    correctAnswer: 0,
    explanation:
      'The key fetal shunts are the foramen ovale (RA→LA), ductus arteriosus (pulmonary artery→aorta) and ductus venosus (umbilical vein→IVC, bypassing most of the liver).[web:258][web:260][web:261]'
  },
  {
    id: 'fc3',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'Which vessels in the umbilical cord carry oxygenated and deoxygenated blood in the fetus?',
    options: [
      'Two umbilical veins carry deoxygenated blood; one umbilical artery carries oxygenated blood',
      'Two umbilical arteries carry oxygenated blood; one umbilical vein carries deoxygenated blood',
      'Two umbilical arteries carry deoxygenated blood to the placenta; one umbilical vein carries oxygenated blood to the fetus',
      'All umbilical vessels carry fully mixed blood',
      'Only the umbilical arteries are present in the cord'
    ],
    correctAnswer: 2,
    explanation:
      'The umbilical cord normally has two umbilical arteries that return deoxygenated blood to the placenta and one umbilical vein that carries oxygenated blood from the placenta to the fetus.[web:260][web:266][web:269]'
  },
  {
    id: 'fc4',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'What is the primary role of the ductus venosus in fetal circulation?',
    options: [
      'To shunt blood from the pulmonary artery to the aorta',
      'To shunt blood from the right atrium to the left atrium',
      'To carry oxygenated blood from the umbilical vein directly to the inferior vena cava, bypassing most of the liver',
      'To drain deoxygenated blood from the brain',
      'To connect the superior vena cava to the left atrium'
    ],
    correctAnswer: 2,
    explanation:
      'The ductus venosus allows most highly oxygenated umbilical venous blood to bypass hepatic sinusoids and enter the inferior vena cava on its way to the right atrium.[web:260][web:261][web:267]'
  },
  {
    id: 'fc5',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which pressure relationship helps keep the foramen ovale functionally open during fetal life?',
    options: [
      'Left atrial pressure higher than right atrial pressure',
      'Right atrial pressure higher than left atrial pressure',
      'Equal pressures in both atria',
      'Higher left ventricular than right ventricular pressure',
      'Higher systemic than pulmonary arterial pressure'
    ],
    correctAnswer: 1,
    explanation:
      'In the fetus, high pulmonary vascular resistance keeps right atrial and right-sided pressures higher than left-sided pressures, promoting right-to-left shunting across the foramen ovale.[web:260][web:268][web:271]'
  },
  {
    id: 'fc6',
    category: 'internal-organs',
    difficulty: 'hard',
    question: 'Immediately after birth, which physiological changes MOST directly lead to functional closure of the foramen ovale?',
    options: [
      'Increase in umbilical venous flow and fall in left atrial pressure',
      'Persistent high pulmonary vascular resistance and increased right atrial pressure',
      'Loss of placental circulation, fall in pulmonary vascular resistance with lung expansion, increased pulmonary venous return raising left atrial pressure above right',
      'Constriction of the ductus arteriosus raising right atrial pressure',
      'Constriction of umbilical arteries causing right-to-left shunting across foramen ovale'
    ],
    correctAnswer: 2,
    explanation:
      'Clamping of the cord and lung expansion decrease pulmonary resistance and increase pulmonary venous return, raising left atrial pressure above right and pressing the septum primum against septum secundum, functionally closing the foramen ovale.[web:257][web:260][web:265]'
  },
  {
    id: 'fc7',
    category: 'internal-organs',
    difficulty: 'hard',
    question: 'Which postnatal remnants correctly correspond to the fetal ductus arteriosus and ductus venosus in a healthy term newborn?',
    options: [
      'Ductus arteriosus → ligamentum teres; ductus venosus → ligamentum arteriosum',
      'Ductus arteriosus → ligamentum arteriosum; ductus venosus → ligamentum venosum',
      'Ductus arteriosus → ligamentum venosum; ductus venosus → ligamentum arteriosum',
      'Both become part of the coronary sinus',
      'Both persist as patent vascular channels throughout life'
    ],
    correctAnswer: 1,
    explanation:
      'After closure, the ductus arteriosus forms the ligamentum arteriosum between the pulmonary trunk and aorta, while the ductus venosus becomes the ligamentum venosum in the liver.[web:260][web:266][web:262]'
  }
];

export const microcirculationAndCapillaryExchangeQuestions: Question[] = [
  {
    id: 'mc1',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'Which vessels are collectively referred to as the microcirculation?',
    options: [
      'Aorta and venae cavae',
      'Arteries and veins only',
      'Arterioles, capillaries and venules',
      'Only capillaries',
      'Only lymphatic vessels'
    ],
    correctAnswer: 2,
    explanation:
      'Microcirculation describes blood flow through arterioles, capillaries and venules within tissues.[web:248][web:273][web:283]'
  },
  {
    id: 'mc2',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'Which structural feature is MOST characteristic of capillaries?',
    options: [
      'Thick tunica media with multiple smooth muscle layers',
      'Complete three-layered wall (intima, media, externa)',
      'Single layer of endothelial cells and a thin basement membrane',
      'Valves throughout their length to prevent backflow',
      'Large elastic lamellae similar to the aorta'
    ],
    correctAnswer: 2,
    explanation:
      'Capillaries consist primarily of a single layer of endothelium and a thin basement membrane, optimizing diffusion and exchange.[web:248][web:272][web:278]'
  },
  {
    id: 'mc3',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which vessels act as the main "gatekeepers" that regulate blood flow into capillary beds?',
    options: [
      'Large elastic arteries',
      'Precapillary arterioles and precapillary sphincters',
      'Postcapillary venules',
      'Lymphatic capillaries',
      'Venae cavae'
    ],
    correctAnswer: 1,
    explanation:
      'Arterioles and precapillary sphincters control resistance and distribution of blood into capillary networks, matching flow to metabolic needs.[web:274][web:275][web:278]'
  },
  {
    id: 'mc4',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'In a typical systemic capillary, which pattern of fluid movement is MOST accurate along its length?',
    options: [
      'Reabsorption at the arteriolar end and filtration at the venular end',
      'Filtration throughout the entire length',
      'No net movement anywhere along the capillary',
      'Filtration predominates at the arteriolar end, while reabsorption predominates at the venular end',
      'Only lymphatics are responsible for filtration or reabsorption'
    ],
    correctAnswer: 3,
    explanation:
      'Higher hydrostatic pressure at the arteriolar end favors filtration, while lower hydrostatic and relatively higher oncotic pressure at the venular end favor reabsorption.[web:276][web:279][web:281]'
  },
  {
    id: 'mc5',
    category: 'internal-organs',
    difficulty: 'hard',
    question: 'Which combination lists the four classic Starling forces that govern capillary fluid exchange?',
    options: [
      'Capillary hydrostatic pressure, interstitial hydrostatic pressure, capillary oncotic pressure, interstitial oncotic pressure',
      'Capillary hydrostatic pressure, arterial pressure, venous pressure, lymphatic pressure',
      'Plasma osmolarity, interstitial osmolarity, heart rate, blood volume',
      'Capillary resistance, venous resistance, heart rate, stroke volume',
      'Red blood cell count, hematocrit, plasma viscosity, arterial pH'
    ],
    correctAnswer: 0,
    explanation:
      'Starling\'s hypothesis describes fluid movement as a balance between hydrostatic and oncotic pressures in capillary blood and interstitial fluid: Pc, Pi, πc and πi.[web:276][web:280][web:282]'
  },
  {
    id: 'mc6',
    category: 'internal-organs',
    difficulty: 'hard',
    question: 'Which change in Starling forces would MOST directly favor development of peripheral edema?',
    options: [
      'Decreased capillary hydrostatic pressure with increased plasma oncotic pressure',
      'Increased capillary hydrostatic pressure and/or decreased plasma oncotic pressure',
      'Decreased interstitial oncotic pressure and increased lymphatic drainage',
      'Mild reduction in capillary permeability',
      'Slight increase in interstitial hydrostatic pressure with normal oncotic pressures'
    ],
    correctAnswer: 1,
    explanation:
      'Edema is promoted when filtration exceeds lymphatic removal, commonly due to elevated capillary hydrostatic pressure (e.g. venous congestion) and/or reduced plasma oncotic pressure (e.g. hypoalbuminemia).[web:276][web:277][web:284]'
  }
];

export const hemodynamicsAndFlowQuestions: Question[] = [
  {
    id: 'hd1',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'According to Poiseuille\'s law, which factor has the GREATEST effect on vascular resistance in a single straight vessel?',
    options: [
      'Vessel length',
      'Blood viscosity',
      'Vessel radius',
      'Blood density',
      'Heart rate'
    ],
    correctAnswer: 2,
    explanation:
      'Poiseuille\'s relationship shows resistance is inversely proportional to the fourth power of vessel radius, making radius the dominant determinant of resistance.[web:286][web:287][web:288]'
  },
  {
    id: 'hd2',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'If the radius of an arteriole is reduced to half its original value, how does resistance to blood flow in that vessel change (assuming all other factors are constant)?',
    options: [
      'It decreases 2-fold',
      'It increases 2-fold',
      'It increases 4-fold',
      'It increases 16-fold',
      'It remains unchanged'
    ],
    correctAnswer: 3,
    explanation:
      'Resistance is proportional to 1/r⁴, so halving radius (r → r/2) increases resistance by 2⁴ = 16 times.[web:286][web:288][web:295]'
  },
  {
    id: 'hd3',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which description BEST differentiates laminar from turbulent blood flow?',
    options: [
      'Laminar flow is always pathological, turbulent flow is always normal',
      'Laminar flow has smooth, parallel layers with highest velocity in the center; turbulent flow is chaotic with eddies and vortices',
      'Laminar flow occurs only in veins, turbulent flow only in arteries',
      'Laminar flow is possible only in capillaries',
      'Turbulent flow has lower resistance than laminar flow'
    ],
    correctAnswer: 1,
    explanation:
      'Laminar flow consists of concentric layers with parabolic velocity profile, while turbulent flow is disordered with eddies, increasing resistance.[web:290][web:293][web:298]'
  },
  {
    id: 'hd4',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which set of conditions most strongly promotes turbulent blood flow according to the Reynolds number?',
    options: [
      'Low velocity, small vessel diameter and high viscosity',
      'High velocity, large vessel diameter and low viscosity',
      'Low velocity, low vessel density and high viscosity',
      'Small vessel diameter and low blood density',
      'High viscosity and low velocity'
    ],
    correctAnswer: 1,
    explanation:
      'Reynolds number increases with vessel diameter, flow velocity and fluid density, but decreases with viscosity; high Re favors turbulence.[web:290][web:293][web:296]'
  },
  {
    id: 'hd5',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'What is pulse pressure (PP) and which factors MOST directly influence it?',
    options: [
      'PP is mean arterial pressure minus central venous pressure; determined mainly by blood viscosity',
      'PP is systolic minus diastolic pressure; influenced by stroke volume and arterial compliance',
      'PP is diastolic minus systolic pressure; influenced by heart rate only',
      'PP is systolic plus diastolic pressure; influenced mainly by venous tone',
      'PP is mean arterial pressure; determined only by peripheral resistance'
    ],
    correctAnswer: 1,
    explanation:
      'Pulse pressure equals systolic minus diastolic pressure and is primarily determined by stroke volume and the compliance (stiffness) of the large arteries.[web:291][web:297][web:299]'
  },
  {
    id: 'hd6',
    category: 'internal-organs',
    difficulty: 'hard',
    question: 'Which combination BEST explains why arterial stiffening with aging leads to increased pulse pressure?',
    options: [
      'Increased arterial compliance reduces systolic pressure',
      'Stiff arteries accept a given stroke volume with a larger rise in systolic pressure and less diastolic recoil, widening pulse pressure',
      'Stiffer arteries reduce pulse wave velocity and thus lower systolic pressure',
      'Arterial stiffening primarily lowers stroke volume',
      'Stiff arteries increase venous capacitance, narrowing pulse pressure'
    ],
    correctAnswer: 1,
    explanation:
      'Reduced arterial compliance means a given stroke volume produces a larger systolic pressure rise, with diminished diastolic recoil, thereby increasing pulse pressure.[web:289][web:291][web:297]'
  }
];

export const baroreflexChemoreflexAutoregulationQuestions: Question[] = [
  {
    id: 'br1',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'Where are the main high-pressure arterial baroreceptors located?',
    options: [
      'Carotid sinus and aortic arch',
      'Right atrial appendage and coronary sinus',
      'Pulmonary trunk and pulmonary veins',
      'Renal arteries and hepatic artery',
      'Inferior vena cava and superior vena cava'
    ],
    correctAnswer: 0,
    explanation:
      'The principal arterial baroreceptors are stretch receptors in the walls of the carotid sinus and aortic arch.[web:300][web:301][web:303]'
  },
  {
    id: 'br2',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'An acute rise in arterial blood pressure will trigger which immediate baroreceptor-mediated response?',
    options: [
      'Increased sympathetic outflow, increased heart rate and vasoconstriction',
      'Decreased baroreceptor firing, increased heart rate and vasoconstriction',
      'Increased baroreceptor firing, increased vagal (parasympathetic) activity, decreased sympathetic tone',
      'Increased baroreceptor firing, increased sympathetic tone',
      'No change in autonomic outflow'
    ],
    correctAnswer: 2,
    explanation:
      'Increased arterial pressure stretches baroreceptors, increasing their firing to the NTS, which enhances vagal activity and inhibits sympathetic activity, reducing heart rate and vasoconstriction.[web:301][web:303][web:307]'
  },
  {
    id: 'br3',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which afferent nerves carry signals from carotid sinus and aortic arch baroreceptors to the brainstem?',
    options: [
      'Carotid sinus nerve (via glossopharyngeal nerve IX) and vagus nerve X',
      'Trigeminal nerve V and facial nerve VII',
      'Spinal accessory nerve XI and hypoglossal nerve XII',
      'Only the sympathetic chain',
      'Only the phrenic nerve'
    ],
    correctAnswer: 0,
    explanation:
      'Carotid sinus baroreceptor signals travel via the carotid sinus nerve to CN IX, while aortic arch baroreceptor signals travel via afferents that join the vagus nerve (CN X) to the medullary NTS.[web:300][web:301][web:307]'
  },
  {
    id: 'br4',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Peripheral chemoreceptors in the carotid and aortic bodies primarily respond to which changes in arterial blood?',
    options: [
      'Decreased PO₂, increased PCO₂ and decreased pH',
      'Increased PO₂ only',
      'Decreased blood volume only',
      'Changes in plasma oncotic pressure only',
      'Decreased potassium concentration only'
    ],
    correctAnswer: 0,
    explanation:
      'Carotid and aortic bodies sense decreases in arterial PO₂, increases in PCO₂ and falls in pH, triggering reflex increases in ventilation and secondary cardiovascular responses.[web:305][web:308][web:311]'
  },
  {
    id: 'br5',
    category: 'internal-organs',
    difficulty: 'hard',
    question: 'Which statement BEST defines local autoregulation of blood flow in an organ?',
    options: [
      'Central nervous system control of blood flow via sympathetic nerves',
      'The tendency for blood flow to remain relatively constant in a tissue despite changes in perfusion pressure, mediated by local mechanisms',
      'The ability of the heart to increase its own blood flow when heart rate increases',
      'The capacity of the lungs to match ventilation and perfusion',
      'Renal regulation of systemic blood volume'
    ],
    correctAnswer: 1,
    explanation:
      'Autoregulation describes a tissue\'s ability to maintain near-constant blood flow despite changes in arterial pressure, mediated by myogenic and metabolic mechanisms.[web:306][web:309][web:312]'
  },
  {
    id: 'br6',
    category: 'internal-organs',
    difficulty: 'hard',
    question: 'Which pair lists two key local mechanisms that contribute to autoregulation of blood flow in many vascular beds?',
    options: [
      'Myogenic response and metabolic (local vasodilator) response',
      'Baroreceptor reflex and chemoreceptor reflex',
      'Central chemoreceptors and limbic system input',
      'Hormonal control by aldosterone and cortisol',
      'Only parasympathetic innervation'
    ],
    correctAnswer: 0,
    explanation:
      'Autoregulation primarily involves a myogenic response (vessel constriction with increased pressure) and local metabolic vasodilator signals (e.g. from low O₂, high CO₂, adenosine). Together they stabilize flow.[web:306][web:309][web:312]'
  }
];

export const coronaryCirculationQuestions: Question[] = [
  {
    id: 'cc1',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'From which part of the aorta do the right and left coronary arteries typically arise?',
    options: [
      'Ascending aorta, from the anterior wall above the sinotubular junction',
      'Ascending aorta, from the left and right aortic (coronary) sinuses just above the aortic valve cusps',
      'Aortic arch, distal to the brachiocephalic trunk',
      'Descending thoracic aorta',
      'Pulmonary trunk'
    ],
    correctAnswer: 1,
    explanation:
      'The right and left coronary arteries originate from the right and left aortic sinuses of the ascending aorta, just superior to the aortic valve.[web:315][web:316][web:328]'
  },
  {
    id: 'cc2',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'Which major branches arise from the left coronary artery in most individuals?',
    options: [
      'Right marginal artery and posterior descending artery',
      'Left anterior descending (LAD) and left circumflex (LCx) arteries',
      'Conus branch and sinoatrial nodal branch',
      'Posterior interventricular and acute marginal arteries',
      'Anterior cardiac arteries and Thebesian arteries'
    ],
    correctAnswer: 1,
    explanation:
      'The left main coronary artery usually bifurcates into the left anterior descending (LAD) artery and the left circumflex (LCx) artery.[web:315][web:316][web:325]'
  },
  {
    id: 'cc3',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which coronary artery territory is MOST commonly affected in an "inferior wall" myocardial infarction in a right-dominant circulation?',
    options: [
      'Left anterior descending artery',
      'Left circumflex artery exclusively',
      'Right coronary artery giving rise to the posterior descending artery',
      'Left main coronary artery',
      'Obtuse marginal branch only'
    ],
    correctAnswer: 2,
    explanation:
      'In right-dominant circulation, the right coronary artery (RCA) gives rise to the posterior descending artery (PDA) supplying the inferior wall; occlusion often causes inferior MI.[web:321][web:322][web:328]'
  },
  {
    id: 'cc4',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'What does "right-dominant" coronary circulation mean?',
    options: [
      'The right ventricle receives most of the coronary blood flow',
      'The RCA is larger than the LCA in all segments',
      'The posterior descending artery (PDA) arises from the right coronary artery',
      'The RCA supplies the entire interventricular septum',
      'All individuals have right-dominant circulation'
    ],
    correctAnswer: 2,
    explanation:
      'Coronary dominance is defined by which artery gives rise to the PDA; in right-dominant hearts, the PDA originates from the RCA, supplying the inferior septum and wall.[web:321][web:324][web:327]'
  },
  {
    id: 'cc5',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which pathway BEST describes the major venous drainage of the myocardium?',
    options: [
      'Capillaries → cardiac veins → coronary sinus → right atrium',
      'Capillaries → coronary sinus → left atrium',
      'Capillaries → pulmonary veins → left atrium',
      'Capillaries → azygos vein → superior vena cava',
      'Capillaries → portal vein → liver'
    ],
    correctAnswer: 0,
    explanation:
      'Most coronary venous blood drains from capillaries into cardiac veins that converge on the coronary sinus, which empties into the right atrium.[web:316][web:319][web:325]'
  },
  {
    id: 'cc6',
    category: 'internal-organs',
    difficulty: 'hard',
    question: 'Which mechanism is MOST important for matching coronary blood flow to myocardial oxygen demand at the level of the microcirculation?',
    options: [
      'Direct sympathetic vasoconstriction of coronary arterioles only',
      'Central baroreceptor reflex acting on systemic resistance',
      'Local metabolic vasodilation in response to increased myocardial work (e.g. adenosine, low O₂, high CO₂, low pH)',
      'Changes in venous capacitance alone',
      'Primary control by carotid body chemoreceptors'
    ],
    correctAnswer: 2,
    explanation:
      'Coronary flow is tightly coupled to myocardial metabolism; local metabolites such as adenosine, reduced O₂, elevated CO₂, H⁺ and K⁺ cause vasodilation and increase flow.[web:320][web:323][web:326]'
  }
];

export const cerebralAutoregulationAndBBBQuestions: Question[] = [
  {
    id: 'cab1',
    category: 'neuro-vasculature',
    difficulty: 'easy',
    question: 'Within the normal autoregulatory range, how does the brain typically respond to changes in mean arterial pressure (MAP)?',
    options: [
      'Cerebral blood flow (CBF) increases linearly with MAP',
      'CBF remains relatively constant over a moderate range of MAP due to autoregulation',
      'CBF falls to zero when MAP drops slightly below normal',
      'CBF is unaffected by blood pressure and depends only on heart rate',
      'CBF depends only on intracranial pressure, not MAP'
    ],
    correctAnswer: 1,
    explanation:
      'Cerebral autoregulation maintains near-constant CBF across a range of MAP by adjusting cerebrovascular resistance via myogenic and metabolic mechanisms.[web:330][web:331]'
  },
  {
    id: 'cab2',
    category: 'neuro-vasculature',
    difficulty: 'easy',
    question: 'Which change in arterial blood gases produces the most potent and rapid increase in cerebral blood flow?',
    options: [
      'Mild decrease in arterial PCO₂',
      'Marked increase in arterial PCO₂ (hypercapnia)',
      'Mild increase in arterial PO₂ above normal',
      'Slight decrease in arterial PO₂ from 100 to 90 mmHg',
      'Small changes in arterial bicarbonate alone'
    ],
    correctAnswer: 1,
    explanation:
      'Hypercapnia is a strong vasodilator in cerebral vessels; CBF increases by roughly 3–4% per mmHg rise in PaCO₂ within physiological ranges.[web:330][web:331][web:333]'
  },
  {
    id: 'cab3',
    category: 'neuro-vasculature',
    difficulty: 'medium',
    question: 'Which triad of clinical findings characterizes the Cushing reflex in response to markedly raised intracranial pressure?',
    options: [
      'Hypotension, tachycardia and shallow breathing',
      'Hypertension with widened pulse pressure, bradycardia and irregular respirations',
      'Hypotension, bradycardia and tachypnea',
      'Hypertension, tachycardia and hyperventilation',
      'Normotension, bradycardia and normal respirations'
    ],
    correctAnswer: 1,
    explanation:
      'The Cushing reflex to acute elevated ICP produces Cushing\'s triad: increased systolic blood pressure with widened pulse pressure, bradycardia and abnormal respirations.[web:335][web:337][web:339]'
  },
  {
    id: 'cab4',
    category: 'neuro-vasculature',
    difficulty: 'medium',
    question: 'What is the physiological purpose of the marked systemic hypertension seen in the Cushing reflex?',
    options: [
      'To reduce cerebral perfusion pressure and protect the brain from hyperperfusion',
      'To maintain or restore cerebral perfusion pressure in the face of elevated intracranial pressure',
      'To lower intracranial pressure by forcing CSF into the spinal canal',
      'To trigger baroreceptor-mediated bradycardia that reduces brain metabolism',
      'To promote cerebral venous outflow only'
    ],
    correctAnswer: 1,
    explanation:
      'When ICP rises and threatens cerebral perfusion, the body increases systemic arterial pressure to maintain cerebral perfusion pressure (CPP = MAP − ICP).[[web:337][web:339][web:335]'
  },
  {
    id: 'cab5',
    category: 'neuro-vasculature',
    difficulty: 'medium',
    question: 'Which structural feature is MOST fundamental to the barrier function of the blood–brain barrier (BBB)?',
    options: [
      'Fenestrated capillary endothelium',
      'Loose junctions between endothelial cells',
      'Tight junctions between cerebral capillary endothelial cells forming a continuous seal',
      'Large pores between endothelial cells',
      'Absence of a basement membrane'
    ],
    correctAnswer: 2,
    explanation:
      'BBB endothelial cells are linked by complex tight junctions (claudins, occludin, ZO-1) that restrict paracellular diffusion and form the core of the barrier.[web:336][web:338][web:342]'
  },
  {
    id: 'cab6',
    category: 'neuro-vasculature',
    difficulty: 'hard',
    question: 'Which combination BEST describes the main cellular and structural components of the blood–brain barrier?',
    options: [
      'Fenestrated endothelial cells, Kupffer cells and chondrocytes',
      'Non-fenestrated endothelial cells with tight junctions, basement membrane, pericytes and astrocyte end-feet',
      'Loose endothelial cells without junctions, oligodendrocytes and neurons only',
      'Sinusoidal capillaries, hepatocytes and microglia',
      'Only astrocytes and neurons, without vascular elements'
    ],
    correctAnswer: 1,
    explanation:
      'The BBB consists of continuous non-fenestrated endothelial cells joined by tight junctions, supported by a basement membrane, pericytes and astrocyte end-feet.[web:336][web:340][web:344]'
  }
];

export const lymphaticSystemOverviewQuestions: Question[] = [
  {
    id: 'ls1',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'Which statement BEST describes the primary functions of the lymphatic system?',
    options: [
      'Transport of oxygen and carbon dioxide between lungs and tissues',
      'Maintenance of fluid balance, absorption of dietary fats and participation in immune defense',
      'Exclusive drainage of venous blood from the brain',
      'Production of red blood cells in adults',
      'Regulation of heart rate and blood pressure'
    ],
    correctAnswer: 1,
    explanation:
      'The lymphatic system returns excess interstitial fluid to the circulation, absorbs dietary fats via intestinal lacteals and supports immune function through lymphocyte transport and lymphoid organs.[web:345][web:349][web:354]'
  },
  {
    id: 'ls2',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'Which statement correctly defines lymph?',
    options: [
      'Plasma that remains inside capillaries',
      'Intracellular fluid from within cells',
      'Interstitial (tissue) fluid that has entered lymphatic capillaries',
      'Synovial fluid from joints',
      'Amniotic fluid surrounding the fetus'
    ],
    correctAnswer: 2,
    explanation:
      'Lymph is formed when excess interstitial fluid enters lymphatic capillaries and is then transported through lymphatic vessels and nodes back to the venous circulation.[web:345][web:347][web:357]'
  },
  {
    id: 'ls3',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which regions of the body are drained by the right lymphatic duct?',
    options: [
      'Entire body below the diaphragm only',
      'Left side of head and neck, left upper limb and left thorax',
      'Right side of head and neck, right upper limb and right thorax',
      'Both lower limbs and pelvis only',
      'All abdominal organs and intestines'
    ],
    correctAnswer: 2,
    explanation:
      'The right lymphatic duct drains lymph from the right side of the head and neck, right upper limb and right side of the thorax (right upper quadrant of the body).[[web:348][web:350][web:356]'
  },
  {
    id: 'ls4',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Into which veins do the major lymphatic ducts empty lymph back into the bloodstream?',
    options: [
      'Internal carotid arteries',
      'Femoral veins',
      'Right and left subclavian veins at their junctions with the internal jugular veins',
      'Portal vein and hepatic veins',
      'Renal veins'
    ],
    correctAnswer: 2,
    explanation:
      'The right lymphatic duct and thoracic duct drain into the venous system at the jugulovenous angles, where the subclavian and internal jugular veins meet.[web:347][web:349][web:358]'
  },
  {
    id: 'ls5',
    category: 'internal-organs',
    difficulty: 'hard',
    question: 'Which statement BEST describes how lymphatic vessels contribute to overall fluid balance?',
    options: [
      'They prevent any fluid from leaving blood capillaries',
      'They absorb all capillary filtrate, with veins playing no role',
      'They return excess capillary filtrate and macromolecules that cannot be reabsorbed by venules back to the bloodstream',
      'They only transport immune cells and do not carry fluid',
      'They drain only cerebrospinal fluid from the brain'
    ],
    correctAnswer: 2,
    explanation:
      'Because venous reabsorption cannot recover all filtered fluid and proteins, lymphatic vessels are required to remove excess interstitial fluid and macromolecules and return them to the venous circulation, preventing edema.[web:345][web:351][web:354]'
  }
];

export const lymphaticPathologyQuestions: Question[] = [
  {
    id: 'lp1',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'Which statement BEST defines lymphedema?',
    options: [
      'Acute inflammation of lymphatic vessels with red streaks on the skin',
      'Localized tissue swelling due to venous thrombosis',
      'Chronic accumulation of protein-rich lymphatic fluid in the interstitium with tissue swelling and fibrosis',
      'Generalized edema due to heart failure',
      'Acute enlargement of lymph nodes due to malignancy'
    ],
    correctAnswer: 2,
    explanation:
      'Lymphedema is a chronic disorder in which impaired lymphatic transport leads to accumulation of protein-rich fluid and progressive fibroadipose tissue changes.[web:362][web:370][web:373]'
  },
  {
    id: 'lp2',
    category: 'internal-organs',
    difficulty: 'easy',
    question: 'Which clinical feature is most typical of acute lymphangitis?',
    options: [
      'Non-tender, rubbery lymph nodes without systemic symptoms',
      'Erythematous, warm, tender linear streaks extending proximally from a skin infection toward regional lymph nodes',
      'Painless generalized lymph node enlargement without skin changes',
      'Isolated pitting edema of both legs without redness',
      'White, depigmented streaks on the skin'
    ],
    correctAnswer: 1,
    explanation:
      'Acute lymphangitis presents with tender, red, warm streaks tracking along lymphatic vessels from a peripheral infection toward draining lymph nodes, often with systemic symptoms.[web:368][web:371][web:374]'
  },
  {
    id: 'lp3',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Which statement correctly distinguishes primary from secondary lymphedema?',
    options: [
      'Primary lymphedema is always bilateral; secondary is always unilateral',
      'Primary lymphedema results from intrinsic (usually genetic) abnormalities of lymphatic development, whereas secondary lymphedema results from acquired damage or obstruction of lymphatics',
      'Primary lymphedema occurs only after cancer surgery; secondary only in children',
      'Primary lymphedema is always painful; secondary is painless',
      'There is no clinical difference between the two forms'
    ],
    correctAnswer: 1,
    explanation:
      'Primary lymphedema is due to congenital or genetic defects of lymphatic development, while secondary lymphedema is acquired after trauma, surgery, infection, malignancy or radiation.[web:362][web:367][web:373]'
  },
  {
    id: 'lp4',
    category: 'internal-organs',
    difficulty: 'medium',
    question: 'Chylothorax is BEST defined as:',
    options: [
      'Accumulation of serous transudate in the pleural space due to heart failure',
      'Purulent pleural effusion due to bacterial pneumonia',
      'Accumulation of chyle in the pleural space due to disruption or obstruction of the thoracic duct',
      'Air in the pleural space after trauma',
      'Blood in the pleural space after chest injury'
    ],
    correctAnswer: 2,
    explanation:
      'Chylothorax is the presence of chyle in the pleural cavity, most often due to traumatic, surgical or malignant injury or obstruction of the thoracic duct.[web:366][web:369][web:372]'
  },
  {
    id: 'lp5',
    category: 'internal-organs',
    difficulty: 'hard',
    question: 'Which combination of findings MOST strongly suggests acute bacterial lymphangitis rather than simple cellulitis?',
    options: [
      'Diffuse erythema without clear streaks, no lymph node tenderness and afebrile',
      'Localized warmth and swelling only at the site of trauma, no systemic symptoms',
      'Linear, tender, erythematous streaks extending proximally from a skin lesion toward regional lymph nodes, with tender lymphadenopathy and systemic symptoms',
      'Pitting edema of a limb without skin color changes or pain',
      'Isolated enlargement of deep abdominal lymph nodes on imaging'
    ],
    correctAnswer: 2,
    explanation:
      'Acute lymphangitis is recognized by tender linear red streaks advancing toward regional nodes, often with tender lymphadenopathy, fever, chills and malaise.[web:368][web:365][web:374]'
  }
];
