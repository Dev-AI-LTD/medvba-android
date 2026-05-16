export interface QuestionTranslation {
  question: string;
  options: string[];
  explanation: string;
  /** When options order differs from source, override the correct answer index (0-based). */
  correctAnswer?: number;
}

export const questionTranslations: Record<string, Record<string, QuestionTranslation>> = {
  'gv1': {
    ro: {
      question: 'Care componente sunt prezente într-o vertebră tipică?',
      options: [
        'Doar corpul vertebral',
        'Doar arcul vertebral',
        'Corpul vertebral și arcul vertebral care dau naștere la mai multe procese',
        'Doar procesele spinoase și transversale',
        'Doar procesele articulare și pediculii'
      ],
      explanation: 'O vertebră tipică constă dintr-un corp vertebral anterior și un arc vertebral posterior, formând împreună foramenul vertebral și dând naștere la multiple procese.[web:606][web:608][web:619]'
    },
    es: {
      question: '¿Qué componentes están presentes en una vértebra típica?',
      options: [
        'Solo el cuerpo vertebral',
        'Solo el arco vertebral',
        'El cuerpo vertebral y el arco vertebral que dan lugar a múltiples procesos',
        'Solo los procesos espinosos y transversos',
        'Solo los procesos articulares y los pedículos'
      ],
      explanation: 'Una vértebra típica consta de un cuerpo vertebral anterior y un arco vertebral posterior, que juntos forman el foramen vertebral y dan lugar a múltiples procesos.[web:606][web:608][web:619]'
    },
    pt: {
      question: 'Que componentes estão presentes numa vértebra típica?',
      options: [
        'Apenas o corpo vertebral',
        'Apenas o arco vertebral',
        'O corpo vertebral e o arco vertebral que dão origem a múltiplos processos',
        'Apenas os processos espinhosos e transversos',
        'Apenas os processos articulares e os pedículos'
      ],
      explanation: 'Uma vértebra típica consiste num corpo vertebral anterior e num arco vertebral posterior, formando juntos o forâmen vertebral e dando origem a múltiplos processos.[web:606][web:608][web:619]'
    }
  },
  'gv2': {
    ro: {
      question: 'Care structuri formează arcul vertebral al unei vertebre tipice?',
      options: [
        'Pediculii și laminele',
        'Procesele transversale și spinoase',
        'Doar procesele articulare',
        'Corpul și procesul spinos',
        'Discurile intervertebrale'
      ],
      explanation: 'Arcul vertebral este format dintr-o pereche de pediculi și o pereche de lamine, care se proiectează posterior de la corpul vertebral.[web:609][web:610][web:619]'
    },
    es: {
      question: '¿Qué estructuras forman el arco vertebral de una vértebra típica?',
      options: [
        'Los pedículos y las láminas',
        'Los procesos transversos y espinosos',
        'Solo los procesos articulares',
        'El cuerpo y el proceso espinoso',
        'Los discos intervertebrales'
      ],
      explanation: 'El arco vertebral está formado por un par de pedículos y un par de láminas, que se proyectan posteriormente desde el cuerpo vertebral.[web:609][web:610][web:619]'
    },
    pt: {
      question: 'Que estruturas formam o arco vertebral de uma vértebra típica?',
      options: [
        'Os pedículos e as lâminas',
        'Os processos transversos e espinhosos',
        'Apenas os processos articulares',
        'O corpo e o processo espinhoso',
        'Os discos intervertebrais'
      ],
      explanation: 'O arco vertebral é formado por um par de pedículos e um par de lâminas, que se projetam posteriormente a partir do corpo vertebral.[web:609][web:610][web:619]'
    }
  },
  'gv3': {
    ro: {
      question: 'Câte procese apar de obicei din arcul vertebral al unei vertebre tipice și care sunt acestea?',
      options: [
        'Patru procese: două transversale și două spinoase',
        'Cinci procese: unul spinos, două transversale și două articulare',
        'Șapte procese: unul spinos, două transversale și patru articulare (două superioare, două inferioare)',
        'Opt procese: două spinoase, două transversale și patru articulare',
        'Trei procese: unul spinos și două articulare'
      ],
      explanation: 'Un arc vertebral tipic susține șapte procese: unul spinos, două transversale și patru procese articulare (perechi superioare și inferioare).[web:609][web:610][web:619]'
    },
    es: {
      question: '¿Cuántos procesos surgen típicamente del arco vertebral de una vértebra típica y cuáles son?',
      options: [
        'Cuatro procesos: dos transversos y dos espinosos',
        'Cinco procesos: uno espinoso, dos transversos y dos articulares',
        'Siete procesos: uno espinoso, dos transversos y cuatro articulares (dos superiores, dos inferiores)',
        'Ocho procesos: dos espinosos, dos transversos y cuatro articulares',
        'Tres procesos: uno espinoso y dos articulares'
      ],
      explanation: 'Un arco vertebral típico sostiene siete procesos: uno espinoso, dos transversos y cuatro procesos articulares (pares superior e inferior).[web:609][web:610][web:619]'
    },
    pt: {
      question: 'Quantos processos surgem tipicamente do arco vertebral de uma vértebra típica e quais são?',
      options: [
        'Quatro processos: dois transversos e dois espinhosos',
        'Cinco processos: um espinhoso, dois transversos e dois articulares',
        'Sete processos: um espinhoso, dois transversos e quatro articulares (dois superiores, dois inferiores)',
        'Oito processos: dois espinhosos, dois transversos e quatro articulares',
        'Três processos: um espinhoso e dois articulares'
      ],
      explanation: 'Um arco vertebral típico suporta sete processos: um espinhoso, dois transversos e quatro processos articulares (pares superior e inferior).[web:609][web:610][web:619]'
    }
  },
  'gv4': {
    ro: {
      question: 'Care este funcția principală a pediculilor într-o vertebră?',
      options: [
        'Protejează măduva spinării',
        'Conectează corpul vertebral la arcul vertebral',
        'Formează articulația cu coasta',
        'Susțin greutatea corpului',
        'Permit mișcarea între vertebre'
      ],
      explanation: 'Pediculii conectează corpul vertebral la restul arcului vertebral și formează pereții laterali ai foramenului vertebral.'
    },
    es: {
      question: '¿Cuál es la función principal de los pedículos en una vértebra?',
      options: [
        'Protegen la médula espinal',
        'Conectan el cuerpo vertebral con el arco vertebral',
        'Forman la articulación con la costilla',
        'Soportan el peso corporal',
        'Permiten el movimiento entre vértebras'
      ],
      explanation: 'Los pedículos conectan el cuerpo vertebral con el resto del arco vertebral y forman las paredes laterales del foramen vertebral.'
    },
    pt: {
      question: 'Qual é a função principal dos pedículos numa vértebra?',
      options: [
        'Protegem a medula espinal',
        'Conectam o corpo vertebral ao arco vertebral',
        'Formam a articulação com a costela',
        'Suportam o peso corporal',
        'Permitem o movimento entre vértebras'
      ],
      explanation: 'Os pedículos conectam o corpo vertebral ao resto do arco vertebral e formam as paredes laterais do forame vertebral.'
    }
  },
  'gv5': {
    ro: {
      question: 'Ce structură trece prin foramenul vertebral?',
      options: [
        'Nervii spinali',
        'Măduva spinării',
        'Vasele sangvine vertebrale',
        'Lichidul cefalorahidian',
        'Țesutul adipos'
      ],
      explanation: 'Măduva spinării trece prin foramenul vertebral, care este format din corpul vertebral anterior și arcul vertebral posterior.'
    },
    es: {
      question: '¿Qué estructura pasa a través del foramen vertebral?',
      options: [
        'Los nervios espinales',
        'La médula espinal',
        'Los vasos sanguíneos vertebrales',
        'El líquido cefalorraquídeo',
        'El tejido adiposo'
      ],
      explanation: 'La médula espinal pasa a través del foramen vertebral, que está formado por el cuerpo vertebral anterior y el arco vertebral posterior.'
    },
    pt: {
      question: 'Que estrutura passa através do forame vertebral?',
      options: [
        'Os nervos espinais',
        'A medula espinal',
        'Os vasos sanguíneos vertebrais',
        'O líquido cefalorraquidiano',
        'O tecido adiposo'
      ],
      explanation: 'A medula espinal passa através do forame vertebral, que é formado pelo corpo vertebral anterior e o arco vertebral posterior.'
    }
  },
  'cl1': {
    ro: {
      question: 'Care dintre următoarele descrie cel mai bine forma claviculei?',
      options: [
        'Dreaptă pe toată lungimea',
        'Curbată în formă de S',
        'Curbată uniform convex',
        'Curbată uniform concav',
        'În formă de spirală'
      ],
      explanation: 'Clavicula are o curbură în formă de S - convexă anterior la jumătatea medială și concavă anterior la jumătatea laterală.'
    },
    es: {
      question: '¿Cuál de las siguientes describe mejor la forma de la clavícula?',
      options: [
        'Recta en toda su longitud',
        'Curvada en forma de S',
        'Curvada uniformemente convexa',
        'Curvada uniformemente cóncava',
        'En forma de espiral'
      ],
      explanation: 'La clavícula tiene una curvatura en forma de S - convexa anteriormente en su mitad medial y cóncava anteriormente en su mitad lateral.'
    },
    pt: {
      question: 'Qual das seguintes descreve melhor a forma da clavícula?',
      options: [
        'Reta em todo o comprimento',
        'Curvada em forma de S',
        'Curvada uniformemente convexa',
        'Curvada uniformemente côncava',
        'Em forma de espiral'
      ],
      explanation: 'A clavícula tem uma curvatura em forma de S - convexa anteriormente na sua metade medial e côncava anteriormente na sua metade lateral.'
    }
  },
  'hum1': {
    ro: {
      question: 'Care este poziția tubercului mare al humerusului?',
      options: [
        'Anterior',
        'Posterior',
        'Lateral',
        'Medial',
        'Superior'
      ],
      explanation: 'Tubercul mare al humerusului este poziționat lateral la capătul proximal al humerusului și servește drept punct de inserție pentru mușchii rotatori.'
    },
    es: {
      question: '¿Cuál es la posición del tubérculo mayor del húmero?',
      options: [
        'Anterior',
        'Posterior',
        'Lateral',
        'Medial',
        'Superior'
      ],
      explanation: 'El tubérculo mayor del húmero está posicionado lateralmente en el extremo proximal del húmero y sirve como punto de inserción para los músculos rotadores.'
    },
    pt: {
      question: 'Qual é a posição do tubérculo maior do úmero?',
      options: [
        'Anterior',
        'Posterior',
        'Lateral',
        'Medial',
        'Superior'
      ],
      explanation: 'O tubérculo maior do úmero está posicionado lateralmente na extremidade proximal do úmero e serve como ponto de inserção para os músculos rotadores.'
    }
  },
  'cl2': {
    ro: {
      question: 'Două treimi mediale ale tijei claviculare sunt de obicei:',
      options: [
        'Concave anterior și aplatizate',
        'Convex anterior și mai robuste',
        'Convex posterior și subțiri',
        'Complet drepte, fără curbură',
        'Concave superior doar'
      ],
      explanation:
        'Privită de deasupra, treimea medială a claviculei este convexă anterior, iar treimea laterală este concavă anterior, conferind osului forma caracteristică în S.[web:405][web:408][web:411]'
    }
  },
  'cl3': {
    ro: {
      question:
        'Care suprafață și margine ale claviculei laterale dau inserție mușchilor deltoid și, respectiv, trapez?',
      options: [
        'Deltoid la marginea posterioară; trapez la marginea anterioară',
        'Deltoid la suprafața superioară; trapez la suprafața inferioară',
        'Deltoid la marginea anterioară; trapez la marginea posterioară',
        'Deltoid la suprafața inferioară; trapez doar la suprafața superioară',
        'Ambii mușchi se atașează doar la extremitatea sternală'
      ],
      explanation:
        'Pe treimea laterală a claviculei, marginea anterioară dă originea mușchiului deltoid, iar marginea posterioară servește ca punct de inserție pentru mușchiul trapez.[web:404][web:406][web:416]'
    }
  },
  'cl4': {
    ro: {
      question:
        'Care formațiuni proeminente de pe fața inferioară a claviculei sunt importante pentru atașamentele ligamentare către prima coastă și scapulă?',
      options: [
        'Spina și fosa glenoidă',
        'Tuberculul conoid și linia trapezoidală, și tuberozitatea costală',
        'Procesul coracoid și acromionul',
        'Tuberozitatea deltoidiană și șanțul radial',
        'Linea aspera și fosa intercondiliană'
      ],
      explanation:
        'Fața inferioară prezintă tuberozitatea costală pentru ligamentul costoclavicular medial și tuberculul conoid cu linia trapezoidală lateral pentru ligamentele coracoclaviculare (conoid și trapezoid).[web:404][web:406][web:408]'
    }
  },
  'cl5': {
    ro: {
      question: 'În care articulații participă direct clavicula?',
      options: [
        'Articulația glenohumerală și scapulotoracică',
        'Articulația sternoclaviculară și acromioclaviculară',
        'Articulațiile costovertebrale și manubriosternală',
        'Doar articulația acromioclaviculară',
        'Doar articulația sternocostală'
      ],
      explanation:
        'Clavicula articulează medial cu manubriul sternului la articulația sternoclaviculară și lateral cu acromionul scapulei la articulația acromioclaviculară.[web:405][web:409][web:418]'
    }
  },
  'cl6': {
    ro: {
      question: 'Care grup enumeră principalii mușchi atașați la treimea medială a claviculei?',
      options: [
        'Deltoid și trapez',
        'Pectoral mic, rotund mare și latissimus dorsi',
        'Sternocleidomastoidian, pectoral mare și sternohioid/subclavian',
        'Supra și infraspinos',
        'Biceps brahial și coracobrahial'
      ],
      explanation:
        'Porțiunea medială a claviculei oferă inserții pentru sternocleidomastoidian (superior/posterior), pectoral mare (anterior) și sternohioid și subclavian inferior.[web:406][web:407][web:413]'
    }
  },
  'cl7': {
    ro: {
      question: 'Care afirmație rezumă cel mai bine tiparul de osificare al claviculei?',
      options: [
        'Este ultimul os care începe osificarea și primul care o finalizează',
        'Osifică integral prin osificare endocondrală de la un singur centru',
        'Este primul os care începe osificarea in utero, cu componente intramembranoase și endocondrale, și printre ultimele care finalizează fuziunea epifizară',
        'Nu dezvoltă niciodată centru secundar de osificare',
        'Osifică doar după naștere'
      ],
      explanation:
        'Clavicula începe devreme osificarea prin două centre primare intramembranoase în tijă și dezvoltă ulterior un centru endocondral la extremitatea sternală, fuziunea finalizându-se la începutul adultului tânăr.[web:408][web:411][web:414]'
    }
  },
  'hu2': {
    ro: {
      question:
        'Care structură a humerusului proximal articulează cu fosa glenoidă a scapulei?',
      options: [
        'Tubercul mare',
        'Tubercul mic',
        'Capul humerusului',
        'Gâtul anatomic',
        'Gâtul chirurgical'
      ],
      explanation:
        'Capul hemisferic neted al humerusului articulează cu fosa glenoidă a scapulei, formând articulația glenohumerală.[web:434][web:436][web:443]'
    }
  },
  'hu3': {
    ro: {
      question:
        'Care afirmație deosebește cel mai bine gâtul anatomic de gâtul chirurgical al humerusului?',
      options: [
        'Gâtul anatomic se află între cap și tuberculi; gâtul chirurgical este distal de tuberculi și este loc frecvent de fractură',
        'Gâtul anatomic este distal de tuberozitatea deltoidiană; gâtul chirurgical este proximal de cap',
        'Ambii termeni desemnează aceeași regiune îngustată',
        'Gâtul chirurgical face parte doar din humerusul distal',
        'Gâtul anatomic este prezent doar la copii'
      ],
      explanation:
        'Gâtul anatomic înconjoară capul, separându-l de tuberculi, în timp ce gâtul chirurgical este îngustarea mai distală sub tuberculi, frecvent fracturată.[web:435][web:438][web:443]'
    }
  },
  'hu4': {
    ro: {
      question:
        'Care element de pe fața laterală a tijei humerale servește ca punct de inserție pentru mușchiul deltoid?',
      options: [
        'Tubercul mare',
        'Tubercul mic',
        'Tuberozitatea deltoidiană',
        'Șanțul radial',
        'Creta supracondiliană medială'
      ],
      explanation:
        'Tuberozitatea deltoidiană este o proeminență triunghiulară rugoasă pe aspectul lateral al tijei humerale unde se inserează deltoidul.[web:435][web:436][web:441]'
    }
  },
  'hu5': {
    ro: {
      question:
        'Șanțul radial (spiral) de pe humerusul posterior este clinic important deoarece transmite care structuri neurovasculare?',
      options: [
        'Nervul axilar și artera humerală circumflexă posterioară',
        'Nervul radial și artera brahială profundă (profunda brachii)',
        'Nervul median și artera brahială',
        'Nervul ulnar și artera colaterală ulnară superioară',
        'Nervul musculocutanat și artera radială'
      ],
      explanation:
        'Șanțul radial de pe tijă găzduiește nervul radial și artera brahială profundă, vulnerabile la fracturile de mijloc de tijă.[web:435][web:436][web:441]'
    }
  },
  'hu6': {
    ro: {
      question: 'Care nerv este cel mai expus riscului la o fractură a gâtului chirurgical al humerusului?',
      options: [
        'Nervul radial',
        'Nervul median',
        'Nervul ulnar',
        'Nervul axilar',
        'Nervul musculocutanat'
      ],
      explanation:
        'Nervul axilar și artera humerală circumflexă posterioară ocolesc gâtul chirurgical al humerusului și sunt puse în pericol la fracturi în acest nivel.[web:435][web:441][web:446]'
    }
  },
  'hu7': {
    ro: {
      question:
        'Care nerv este cel mai frecvent lezat în asociere cu o fractură diafizară (de mijloc de tijă) a humerusului care implică șanțul radial?',
      options: [
        'Nervul axilar',
        'Nervul radial',
        'Nervul median',
        'Nervul ulnar',
        'Nervul toracic lung'
      ],
      explanation:
        'Fracturile diafizare ale humerusului pot leza nervul radial în timp ce acesta parcurge șanțul radial, ducând la „căderea” pumnului și deficit senzorial pe dosul mâinii.[web:435][web:442][web:445]'
    }
  },
  'ru1': {
    ro: {
      question:
        'Care afirmație descrie cel mai bine poziția relativă a radiusului și ulnei în poziția anatomică?',
      options: [
        'Radiusul este medial, iar ulna lateral în antebraț',
        'Radiusul este lateral, iar ulna medial în antebraț',
        'Ambele oase sunt direct unul în fața celuilalt',
        'Ambele oase sunt direct unul în spatele celuilalt',
        'Radiusul se află în întregime proximal față de ulna'
      ],
      explanation:
        'În poziția anatomică, radiusul este pe partea laterală (degetul mare) a antebrațului, iar ulna medial.[web:448][web:449][web:451]'
    }
  },
  'ru2': {
    ro: {
      question:
        'Care descriere contrastează corect extremitățile proximală și distală ale radiusului și ulnei?',
      options: [
        'Radiusul are extremitatea proximală mare și pe cea distală mică; ulna are extremitatea proximală mică și pe cea distală largă',
        'Radiusul are extremitatea proximală mică și pe cea distală largă; ulna are extremitatea proximală mare și pe cea distală mică',
        'Ambele oase au dimensiuni identice proximal și distal',
        'Ambele au extremități proximale late și distale înguste',
        'Ambele au extremități proximale înguste și distale late'
      ],
      explanation:
        'Radiusul este mai mic proximal (cap, gât) și lat distal la încheietură, pe când ulna este mare proximal (olecran, incizură trohleară) și se subțiază distal.[web:448][web:452][web:456]'
    }
  },
  'ru3': {
    ro: {
      question: 'Care repere se găsesc la extremitatea proximală a radiusului?',
      options: [
        'Olecranul, procesul coroid și incizura trohleară',
        'Capul, gâtul și tuberozitatea radială',
        'Procesul stiloid și tuberculul lui Lister',
        'Incizura ulnară și procesul stiloid radial',
        'Capitulumul și trohleea'
      ],
      explanation:
        'Radiusul proximal cuprinde capul în formă de disc, un gât îngust și tuberozitatea radială, punct de inserție pentru tendonul bicepsului brahial.[web:449][web:455][web:458]'
    }
  },
  'ru4': {
    ro: {
      question:
        'Care structură pe radiusul distal articulează cu oasele carpiene, formând o parte a articulației încheieturii?',
      options: [
        'Tuberozitatea radială',
        'Capul radial',
        'Suprafața articulară distală pentru scafoid și semilunar',
        'Incizura ulnară',
        'Procesul coroid'
      ],
      explanation:
        'Suprafața articulară distală a radiusului articulează lateral cu scafoidul și medial cu semilunarul, formând articulația radiocarpiană.[web:451][web:452][web:461]'
    }
  },
  'ru5': {
    ro: {
      question: 'Care repere caracterizează ulna proximală la articulația cotului?',
      options: [
        'Capul ulnei și procesul stiloid',
        'Capul radial și incizura radială',
        'Olecranul, procesul coroid și incizura trohleară',
        'Incizura ulnară și tuberculul dorsal',
        'Capitulumul și trohleea'
      ],
      explanation:
        'Ulna proximală prezintă olecranul și procesul coroid, care împreună formează incizura trohleară ce articulează cu trohleea humerusului la cot.[web:448][web:453][web:456]'
    }
  },
  'ru6': {
    ro: {
      question:
        'Care tipare eponimice de fractură implică leziune combinată a radiusului/ulnei și luxație la o articulație radioulnară?',
      options: [
        'Fracturile Colles și Smith',
        'Fractura Monteggia (fractură de ulna proximală cu luxația capului radial) și fractura Galeazzi (fractură de radius distal cu luxația articulației radioulnare distale)',
        'Fracturile Pott și Jones',
        'Fracturile în verde și în torus',
        'Fracturile supracondiliene și intercondiliene'
      ],
      explanation:
        'Fractura Monteggia constă din fractură de ulna proximală cu luxația capului radial, iar fractura Galeazzi implică fractură de tijă radială distală cu luxația articulației radioulnare distale.[web:448][web:454][web:457]'
    }
  },
  'ru7': {
    ro: {
      question: 'Care este semnificația funcțională a membranei interosoase între radius și ulna?',
      options: [
        'Împiedică pronosupinația antebrațului',
        'Transmite forțe de la ulna la radius și oferă suprafață suplimentară pentru inserții musculare, stabilizând cele două oase',
        'Formează suprafața articulară pentru humerus',
        'Adăpostește nervul radial în interiorul ei',
        'Separă complet mușchii flexori de cei extensori'
      ],
      explanation:
        'Membrana interosoasă leagă radiusul de ulna, distribuie sarcinile (în special de la mână spre ulna prin radius) și dă inserție mușchilor profunzi ai antebrațului.[web:448][web:454][web:458]'
    }
  },
  'carp1': {
    ro: {
      question: 'Câte oase carpiene sunt într-o încheietură și cum sunt aranjate?',
      options: [
        'Șase oase carpiene într-un singur rând',
        'Șapte oase carpiene într-o singură arcadă',
        'Opt oase carpiene în două rânduri a câte patru',
        'Nouă oase carpiene în trei rânduri a câte trei',
        'Zece oase carpiene aranjate aleator'
      ],
      explanation:
        'Fiecare încheietură conține opt oase carpiene organizate într-un rând proximal și unul distal, fiecare cu patru oase.[web:463][web:465][web:467]'
    }
  },
  'carp2': {
    ro: {
      question:
        'Care enumerare denumește corect oasele carpiene ale rândului proximal de la lateral (radial) la medial (ulnar)?',
      options: [
        'Trapez, trapezoid, capitat, hamat',
        'Scafoid, semilunar, triquetrum, pisiform',
        'Scafoid, semilunar, capitat, hamat',
        'Pisiform, triquetrum, semilunar, scafoid',
        'Hamat, capitat, trapezoid, trapez'
      ],
      explanation:
        'Rândul proximal carpian de la radial spre ulnar este: scafoid, semilunar, triquetrum și pisiform.[web:463][web:464][web:470]'
    }
  },
  'carp3': {
    ro: {
      question:
        'Care os carpian este cel mai frecvent fracturat și se află în podeaua „snuffbox”-ului anatomic?',
      options: ['Semilunarul', 'Pisiformul', 'Scafoidul', 'Hamatul', 'Capitatul'],
      explanation:
        'Scafoidul este cel mai frecvent fracturat os carpian și participă la formarea podelei „snuffbox”-ului anatomic.[web:463][web:469][web:472]'
    }
  },
  'carp4': {
    ro: {
      question:
        'Care oase carpiene articulează direct cu radiusul distal la articulația radiocarpiană (încheietura mâinii)?',
      options: [
        'Scafoidul și semilunarul',
        'Doar semilunarul și triquetrumul',
        'Toate cele patru oase ale rândului proximal',
        'Trapezul și trapezoidul',
        'Capitatul și hamatul'
      ],
      explanation:
        'Articulația radiocarpiană se formează în principal între radiusul distal și scafoid și semilunar; triquetrumul poate articula printr-un disc articular pe partea ulnară.[web:465][web:467][web:470]'
    }
  },
  'carp5': {
    ro: {
      question:
        'Care os carpian are un cârlig proeminent (hamulus) pe fața palmară și contribuie la marginea ulnară a tunelului carpian?',
      options: ['Trapezul', 'Capitatul', 'Hamatul', 'Pisiformul', 'Scafoidul'],
      explanation:
        'Hamatul prezintă o proiecție palmară numită cârligul hamatului, care contribuie la limita medială a tunelului carpian și la canalul lui Guyon.[web:463][web:468][web:470]'
    }
  },
  'carp6': {
    ro: {
      question:
        'Care os carpian este sesamoid în tendonul flexorului carpian ulnar și articulează în principal cu triquetrumul?',
      options: ['Pisiformul', 'Semilunarul', 'Capitatul', 'Trapezoidul', 'Scafoidul'],
      explanation:
        'Pisiformul este un os sesamoid în formă de mazăre, inclus în tendonul flexorului carpian ulnar, și articulează cu fața palmară a triquetrumului.[web:463][web:467][web:468]'
    }
  },
  'carp7': {
    ro: {
      question:
        'Care os carpian articulează cu primul metacarpian, formând articulația de tip șa responsabilă de opusul policelui?',
      options: ['Trapezoidul', 'Trapezul', 'Capitatul', 'Hamatul', 'Scafoidul'],
      explanation:
        'Trapezul articulează cu baza primului metacarpian, formând o articulație carpometacarpiană de tip șa, esențială pentru opusul policelui.[web:463][web:465][web:470]'
    }
  },
  'hip1': {
    ro: {
      question: 'Care oase fuzionează pentru a forma un singur os coxal (os coxae) la adult?',
      options: [
        'Ilionul, sacrul și coccisul',
        'Ilionul, ischionul și pubisul',
        'Sacrul, coccisul și pubisul',
        'Femurul, ilionul și ischionul',
        'Ischionul, pubisul și sacrul'
      ],
      explanation:
        'Fiecare os coxal se dezvoltă din trei părți — ilion, ischion și pubis — inițial separate prin cartilaj triradiat, care fuzionează ulterior în osul coxal.[web:478][web:479][web:496]'
    }
  },
  'hip2': {
    ro: {
      question:
        'Care reper de pe fața laterală a osului coxal articulează cu capul femural?',
      options: [
        'Foramenul obturator',
        'Fosa ilionului',
        'Acetabulul',
        'Incizura sciatică mare',
        'Fața auriculară'
      ],
      explanation:
        'Acetabulul este o cavitate adâncă, în formă de cupă, pe osul coxal lateral, care primește capul femurului și formează articulația șoldului.[web:479][web:493][web:496]'
    }
  },
  'hip3': {
    ro: {
      question:
        'Care componentă a osului coxal formează partea cea mai superioară și contribuie la creasta ilionului și fosa ilionului?',
      options: ['Ilionul', 'Ischionul', 'Pubisul', 'Sacrul', 'Coccisul'],
      explanation:
        'Ilionul este partea largă, superioară a osului coxal; formează creasta ilionului și găzduiește fosa ilionului pe fața sa medială.[web:479][web:491][web:500]'
    }
  },
  'hip4': {
    ro: {
      question:
        'Care set împerechează corect spinele iliace proeminente cu reperele de suprafață uzuale?',
      options: [
        'IASP și IPSP se află ambele pe fața medială a ilionului',
        'IASP este o proiecție anterioară palpabilă la capătul crestei iliace; IPSP se află posterior și corespunde unor adâncituri cutanate deasupra regiunii sacroiliace',
        'IPSP se află anterior lângă creasta pubiană, iar IASP posterior lângă sacru',
        'AIIS și PIIS formează creasta ilionului',
        'Doar IPSP face parte din creasta ilionului'
      ],
      explanation:
        'Spina iliacă antero-superioară (IASP) marchează capătul anterior al crestei iliace și este ușor palpabilă; spina iliacă postero-superioară (IPSP) marchează capătul posterior și dă adânciturile caracteristice deasupra zonei sacroiliace.[web:493][web:497][web:500]'
    }
  },
  'hip5': {
    ro: {
      question: 'Care descriere caracterizează cel mai bine foramenul obturator al osului coxal?',
      options: [
        'O deschidere între ilion și sacru, prin care trece nervul femural',
        'O deschidere mare anteroinferioară, mărginită de ischion și pubis, în mare parte acoperită de o membrană',
        'O incizură pe ilionul posterior pentru trecerea nervului sciatic',
        'Un canal în sinfiza pubiană',
        'Un foramen între ilion și femur'
      ],
      explanation:
        'Foramenul obturator este o deschidere mare anteroinferioară față de acetabul, mărginită de ischion și pubis și acoperită în cea mai mare parte de membrana obturatorie, lăsând un canal îngust pentru vasele și nervul obturator.[web:479][web:493][web:496]'
    }
  },
  'hip6': {
    ro: {
      question: 'Care contribuții osoase la acetabul sunt cele mai exacte?',
      options: [
        'Ilionul formează întreg acetabulul',
        'Ischionul formează întreg acetabulul',
        'Pubisul formează întreg acetabulul',
        'Ilionul partea superioară, ischionul partea postero-inferioară și pubisul partea antero-inferioară a acetabulului',
        'Sacrul și coccisul formează jumătatea posterioară a acetabulului'
      ],
      explanation:
        'Acetabulul este format din toate cele trei componente ale osului coxal: ilion superior, ischion postero-inferior și pubis antero-inferior.[web:493][web:500][web:501]'
    }
  },
  'hip7': {
    ro: {
      question:
        'Care repere sunt împerecheate corect cu partea osului coxal pe care se află?',
      options: [
        'Spina și tuberozitatea ischială – ilionul',
        'Creasta și tuberculul pubian – pubisul',
        'Fața auriculară pentru sacru – pubisul',
        'Incizura sciatică mare – doar pubisul',
        'Fosa ilionului – ischionul'
      ],
      explanation:
        'Pubisul poartă corpul, creasta pubiană, tuberculul pubian și ramurile superioară și inferioară; ischionul poartă spina și tuberozitatea ischială, iar ilionul creasta ilionului, fosa ilionului și fața auriculară.[web:478][web:491][web:502]'
    }
  },
  'fe1': {
    ro: {
      question: 'Care afirmație descrie cel mai bine femurul?',
      options: [
        'Un os scurt care face parte din pelvis',
        'Un os plat care formează peretele posterior al abdomenului',
        'Singurul os al coapsei și cel mai lung și rezistent os al corpului',
        'Unul din două oase paralele ale gambei sub genunchi',
        'Un os sesamoid inclus în tendonul cvadricepsului'
      ],
      explanation:
        'Femurul este singurul os al coapsei și cel mai lung și mai rezistent os al scheletului uman.[web:492][web:508][web:511]'
    }
  },
  'fe2': {
    ro: {
      question: 'Care structuri se găsesc la extremitatea proximală a femurului?',
      options: [
        'Condilii medial și lateral, fosa intercondiliană și fața rotulară',
        'Capul, gâtul, trohanterul mare și trohanterul mic',
        'Platforma tibială și eminența intercondiliană',
        'Maleolele medială și laterală',
        'Capul fibulei și procesul stiloid'
      ],
      explanation:
        'Femurul proximal cuprinde capul, gâtul și trohanterii mare și mic, repere importante de inserție musculară.[web:483][web:486][web:505]'
    }
  },
  'fe3': {
    ro: {
      question:
        'Care afirmație descrie corect gâtul femural și relația lui cu diafiza?',
      options: [
        'Gâtul este aliniat în prelungirea diafizei la 180°',
        'Gâtul este înclinat superolateral față de diafiză la aproximativ 90°',
        'Gâtul este înclinat superomedial față de diafiză, formând un unghi de aproximativ 120–135° la adult',
        'Gâtul este perfect orizontal, fără unghi față de diafiză',
        'Gâtul există doar la copii și fuzionează la adult'
      ],
      explanation:
        'Gâtul femural se proiectează superomedial față de diafiză, creând un unghi de înclinație de aproximativ 120–135° la adult, optimizând transmiterea sarcinilor.[web:483][web:492][web:505]'
    }
  },
  'fe4': {
    ro: {
      question:
        'Care element de pe fața posterioară a diafizei femurale servește drept creastă majoră pentru inserții musculare?',
      options: [
        'Linia intertrohanteriană',
        'Fosa trohanteriană',
        'Linea aspera',
        'Fața rotulară',
        'Fosa intercondiliană'
      ],
      explanation:
        'Linea aspera este o creastă longitudinală proeminentă pe fața posterioară a diafizei femurale, care dă inserție mai multor mușchi ai coapsei.[web:483][web:506][web:512]'
    }
  },
  'fe5': {
    ro: {
      question:
        'Care structuri formează extremitatea articulară distală a femurului la articulația genunchiului?',
      options: [
        'Maleolele medială și laterală și platoul tibial',
        'Condilii medial și lateral, fosa intercondiliană și fața rotulară',
        'Capul, gâtul și trohanterii',
        'Acetabulul și fovea capitis',
        'Tuberozitatea tibială și eminența intercondiliană'
      ],
      explanation:
        'Femurul distal prezintă condilii medial și lateral separați posterior de fosa intercondiliană și anterior de fața rotulară, articulând cu tibia și rotula.[web:483][web:492][web:505]'
    }
  },
  'fe6': {
    ro: {
      question:
        'Care regiune a femurului prezintă cel mai mare risc de necroză avasculară după fractură și de ce?',
      options: [
        'Mijlocul tijei, din cauza acoperirii musculare slabe',
        'Condilii distali, din lipsă de vascularizație colaterală',
        'Zona intertrohanteriană, din absența ramurilor arteriale',
        'Gâtul femural, deoarece fractura poate întrerupe vasele retiniculare de la artera femurală circumflexă medială care vascularizează capul',
        'Linea aspera, deoarece nu există artere nutriționale la nivelul tijei'
      ],
      explanation:
        'Fracturile intracapsulare ale gâtului femural pot întrerupe ramurile retiniculare ale arterei femurale circumflexe mediale, punând în pericol vascularizația capului femural și predispunând la necroză avasculară.[web:486][web:505][web:514]'
    }
  },
  'fe7': {
    ro: {
      question:
        'Care combinație împerechează corect reperele trohanterice majore cu pozițiile lor relative?',
      options: [
        'Trohanterul mare este postero-medial; trohanterul mic este antero-lateral',
        'Trohanterul mare este mare și lateral; trohanterul mic este mai mic și postero-medial',
        'Ambii trohanteri se află pe partea medială a femurului',
        'Trohanterul mare este distal de condili; trohanterul mic este la diafiza femurală distală',
        'Ambii trohanteri se află pe fața anterioară a femurului'
      ],
      explanation:
        'Trohanterul mare este o proiecție largă, laterală, iar trohanterul mic este o proeminență mai mică, postero-medială la jonctiunea gât–diafiză.[web:483][web:509][web:515]'
    }
  },
  'pa1': {
    ro: {
      question: 'Rotula este cel mai corect clasificată ca tip de os:',
      options: [
        'Os lung',
        'Os scurt',
        'Os plat',
        'Os sesamoid',
        'Os neregulat'
      ],
      explanation:
        'Rotula este cel mai mare os sesamoid, inclus în tendonul mușchiului cvadriceps femural.'
    }
  },
  'pa2': {
    ro: {
      question:
        'Care față a rotulei este articulară și participă la articulația genunchiului?',
      options: [
        'Fața anterioară',
        'Fața posterioară',
        'Marginea superioară',
        'Marginea inferioară (vârful)',
        'Marginea medială'
      ],
      explanation:
        'Fața posterioară a rotulei este acoperită cu cartilaj articular și articulează cu suprafața trohleară femurală.'
    }
  },
  'pa3': {
    ro: {
      question: 'Vârful rotulei este orientat:',
      options: [
        'Superior și lateral',
        'Superior și medial',
        'Inferior',
        'Posterior',
        'Strict anterior'
      ],
      explanation:
        'Vârful ascuțit al rotulei este orientat inferior și dă inserție ligamentului rotular.'
    }
  },
  'pa4': {
    ro: {
      question:
        'Ligamentul rotular leagă vârful rotulei de care structură?',
      options: [
        'Tuberozitatea tibială',
        'Epicondilul medial al femurului',
        'Capul fibulei',
        'Spina iliacă antero-superioară',
        'Eminența intercondiliană'
      ],
      explanation:
        'Ligamentul rotular se extinde de la vârful rotulei până la tuberozitatea tibială, transmițând forța cvadricepsului către tibie.'
    }
  },
  'pa5': {
    ro: {
      question:
        'Principala funcție a rotulei în mecanismul extensor este de a:',
      options: [
        'Micșora brațul de forță al mușchiului cvadriceps',
        'Mări avantajul mecanic al tendonului cvadricepsului',
        'Împiedica flexia genunchiului',
        'Acționa doar ca amortizor',
        'Limita rotația tibiei'
      ],
      explanation:
        'Prin creșterea unghiului de acțiune al tendonului cvadricepsului, rotula îmbunătățește levierul și eficiența extensiei genunchiului.'
    }
  },
  'ti1': {
    ro: {
      question: 'Tibia se află pe care parte a gambei în poziția anatomică?',
      options: [
        'Lateral, în linie cu degetul mic',
        'Medial, în linie cu degetul mare',
        'Doar posterior',
        'Doar anterior',
        'Central între femur și fibulă'
      ],
      explanation: 'Tibia formează partea medială a gambei și este aliniată cu degetul mare.'
    }
  },
  'ti2': {
    ro: {
      question: 'Care afirmație descrie cel mai bine rolul tibiei?',
      options: [
        'Os fără sarcină, doar pentru inserții musculare',
        'Principalul os care suportă greutatea între femur și talus',
        'Os care formează doar maleola laterală',
        'Os sesamoid mic la genunchi',
        'Os care articulează doar cu fibula și rotula'
      ],
      explanation:
        'Tibia este principalul os al gambei care suportă greutatea, transmițând forțele de la femur la talus.'
    }
  },
  'ti3': {
    ro: {
      question: 'Care structuri se găsesc la extremitatea proximală a tibiei?',
      options: [
        'Maleolele medială și laterală',
        'Condilii medial și lateral',
        'Trohanterii mare și mic',
        'Capul și gâtul',
        'Fațetele pentru navicular și cuboid'
      ],
      explanation:
        'Tibia proximală are condili medial și lateral care articulează cu condilii femurali la articulația genunchiului.'
    }
  },
  'fi1': {
    ro: {
      question: 'Fibula se află pe care parte a gambei în poziția anatomică?',
      options: [
        'Medial, în linie cu degetul mare',
        'Lateral, în linie cu degetul mic',
        'Anterior pe linia mediană',
        'Posterior pe linia mediană',
        'Central între tibie și talus'
      ],
      explanation: 'Fibula se află lateral în gambă, pe partea degetului mic.'
    }
  },
  'fi2': {
    ro: {
      question: 'Care descrie cel mai bine rolul funcțional principal al fibulei?',
      options: [
        'Principalul os al gambei care suportă greutatea',
        'Osul principal care articulează cu femurul',
        'Oferă inserții musculare și formează maleola laterală',
        'Poartă greutatea corporală de la tibie la talus',
        'Formează suprafața articulară pentru rotulă'
      ],
      explanation:
        'Fibula nu este os primar de susținere a greutății; oferă inserții musculare și formează maleola laterală la gleznă.'
    }
  },
  'tf1': {
    ro: {
      question:
        'Care afirmație descrie cel mai bine pozițiile relative și rolurile tibiei și fibulei în gambă?',
      options: [
        'Tibia este laterală și în principal pentru inserții musculare; fibula este medială și suportă greutatea',
        'Tibia este medială și principalul os portant; fibula este laterală, mai subțire, în principal pentru inserții musculare și stabilitate laterală la gleznă',
        'Ambele oase suportă egal greutatea și nu au diferențe funcționale',
        'Fibula este medială și formează genunchiul; tibia este laterală și formează doar glezna',
        'Tibia și fibula fuzionează distal într-un singur os'
      ],
      explanation:
        'Tibia este osul medial, mai mare, principal portant al gambei, iar fibula este laterală, zveltă și oferă în principal inserții musculare și stabilitate laterală la gleznă.[web:516][web:517][web:524]'
    }
  },
  'tf2': {
    ro: {
      question:
        'Care structuri formează suprafața articulară proximală a tibiei la articulația genunchiului?',
      options: [
        'Maleolele medială și laterală',
        'Tuberozitatea tibială și eminența intercondiliană',
        'Condilii medial și lateral care formează platoul tibial',
        'Capul fibulei și plafonul tibial',
        'Condilul medial și maleola medială'
      ],
      explanation:
        'Tibia proximală are condili medial și lateral care formează platoul tibial, articulând cu condilii femurali la genunchi.[web:516][web:518][web:520]'
    }
  },
  'tf3': {
    ro: {
      question:
        'Care reper de pe tibia proximală anterioară servește ca inserție pentru ligamentul rotular?',
      options: [
        'Eminența intercondiliană',
        'Tuberozitatea tibială',
        'Maleola medială',
        'Incizura fibulară',
        'Tuberculul lui Gerdy'
      ],
      explanation:
        'Tuberozitatea tibială este o proiecție osoasă anterioară proeminentă imediat distal de condili, unde se inserează ligamentul rotular.[web:516][web:519][web:523]'
    }
  },
  'tf4': {
    ro: {
      question:
        'Care trăsaturi caracterizează tibia distală la articulația gleznică (talocrurală)?',
      options: [
        'Capul tibiei și maleola laterală',
        'Suprafața articulară distală (plafonul tibial) și maleola medială, cu incizura fibulară pe fața laterală',
        'Suprafața articulară distală și maleola laterală',
        'Doar maleola medială, fără suprafață articulară',
        'Eminența intercondiliană și tuberozitatea tibială'
      ],
      explanation:
        'Tibia distală formează plafonul tibial (suprafața articulară pentru talus), poartă maleola medială și prezintă lateral incizura fibulară pentru articulația tibio-fibulară distală.[web:517][web:520][web:523]'
    }
  },
  'tf5': {
    ro: {
      question: 'Care repere se găsesc la extremitatea proximală a fibulei?',
      options: [
        'Maleola laterală și incizura fibulară',
        'Capul fibulei și gâtul fibulei',
        'Maleola medială și tuberozitatea tibială',
        'Eminența intercondiliană și platoul tibial',
        'Baza și capul fibulei formând suprafața articulară a genunchiului'
      ],
      explanation:
        'Fibula proximală cuprinde capul și un gât îngust; capul articulează cu condilul lateral al tibiei la articulația tibio-fibulară superioară.[web:524][web:529][web:530]'
    }
  },
  'tf6': {
    ro: {
      question: 'Care afirmație descrie cel mai bine maleola laterală a fibulei?',
      options: [
        'Este principala suprafață portantă a articulației gleznei',
        'Se află medial de tibie și articulează doar cu calcaneul',
        'Formează proeminența osoasă laterală a gleznei, articulează cu talusul și contribuie la stabilitatea laterală a gleznei',
        'Este doar punct de inserție musculară, fără suprafețe articulare',
        'Face parte din articulația genunchiului și nu are legătură cu glezna'
      ],
      explanation:
        'Fibula distală formează maleola laterală, care articulează cu talusul și stabilizează lateral articulația gleznică.[web:521][web:524][web:530]'
    }
  },
  'tf7': {
    ro: {
      question:
        'Care este semnificația funcțională a membranei interosoase între tibie și fibulă?',
      options: [
        'Separă gamba doar în compartimente anterioar și posterior',
        'Permite rotația liberă între tibie și fibulă în repaus',
        'Leagă tibia de fibulă, oferă suprafață suplimentară pentru inserții musculare și ajută la transmiterea forțelor între oase',
        'Formează suprafața articulară pentru femur',
        'Adăpostește nervul tibial în interiorul ei'
      ],
      explanation:
        'Membrana interosoasă stabilizează raportul tibie–fibulă, dă inserție mușchilor profunzi ai gambei și ajută la distribuirea sarcinilor mecanice între oase.[web:520][web:524][web:529]'
    }
  },
  'ta1': {
    ro: {
      question:
        'Talusul este în principal responsabil de articulațiile dintre care regiuni?',
      options: [
        'Femur și tibie',
        'Gambă și picior la gleznă și articulația subtalară',
        'Doar tibie și fibulă',
        'Metatarsiene și falange',
        'Doar calcaneu și navicular'
      ],
      explanation:
        'Talusul leagă gambă de picior, participând la articulația talocrurală (glezna), subtalară și la articulațiile tarsiene transverse.'
    }
  },
  'ta2': {
    ro: {
      question:
        'Care parte a talusului articulează cu tibia la articulația gleznică (talocrurală)?',
      options: [
        'Capul talusului',
        'Gâtul talusului',
        'Corpul talusului cu suprafața sa trohleară',
        'Fața inferioară cu fațetele calcaneene',
        'Procesul posterior'
      ],
      explanation:
        'Suprafața trohleară superioară a corpului talusului articulează cu tibia distală (și fibula), formând articulația gleznică.'
    }
  },
  'caL1': {
    ro: {
      question: 'Calcaneul este cel mai bine descris ca:',
      options: [
        'Cel mai superior os tarsian',
        'Cel mai mare os tarsian care formează călcâiul',
        'Os sesamoid în tendonul Ahile',
        'Un os mic doar în arcul median al piciorului',
        'Osul principal al antepiciorului'
      ],
      explanation:
        'Calcaneul este cel mai mare os tarsian și formează proeminența călcâiului, transmițând greutatea de la talus la sol.'
    }
  },
  'caL2': {
    ro: {
      question:
        'Fața posterioară a calcaneului primește inserția cărui tendon?',
      options: [
        'Tendonul tibialului anterior',
        'Ligamentul rotular',
        'Tendonul Ahile (calcanean)',
        'Tendonul peronierului lung',
        'Tendonul flexorului lung al halucelui'
      ],
      explanation:
        'Tendonul calcanean (Ahile) se inserează pe tuberozitatea posterioară a calcaneului.'
    }
  },
  'tb1': {
    ro: {
      question: 'Câte oase tarsiene sunt într-un picior și care sunt acestea?',
      options: [
        'Șase: talus, calcaneu, navicular, cuboid, două cuneiforme',
        'Șapte: talus, calcaneu, navicular, cuboid și trei cuneiforme',
        'Opt: talus, calcaneu, navicular, cuboid și patru cuneiforme',
        'Cinci: talus, calcaneu, navicular, cuboid și un cuneiform',
        'Patru: doar talus, calcaneu, navicular și cuboid'
      ],
      explanation:
        'Fiecare picior are șapte oase tarsiene: talus, calcaneu, navicular, cuboid și trei cuneiforme (medial, intermediar și lateral).[web:525][web:531][web:532]'
    }
  },
  'tb2': {
    ro: {
      question: 'Care descriere caracterizează cel mai bine talusul?',
      options: [
        'Cel mai mare os tarsian care formează călcâiul',
        'Al doilea ca mărime os tarsian care transmite greutatea de la tibie la picior și articulează cu tibia, fibula, calcaneul și navicularul',
        'Os în formă de barcă pe mijlocul medial al piciorului',
        'Os cubiform pe mijlocul lateral al piciorului',
        'Os în formă de pană care articulează doar cu metatarsienele'
      ],
      explanation:
        'Talusul este al doilea os tarsian ca mărime; formează glezna cu tibia și fibula și articulează cu calcaneul și navicularul, transmițând greutatea corporală către picior.[web:525][web:528][web:541]'
    }
  },
  'tb3': {
    ro: {
      question: 'Care os tarsian formează călcâiul și este cel mai mare os tarsian?',
      options: ['Talusul', 'Navicularul', 'Cuboidul', 'Calcaneul', 'Cuneiformul medial'],
      explanation:
        'Calcaneul este cel mai mare os tarsian și formează călcâiul, articulând cu talusul și cuboidul și contribuind la arcurile longitudinale.[web:525][web:533][web:538]'
    }
  },
  'tb4': {
    ro: {
      question:
        'Care descriere potrivește corect navicularul și cuboidul cu pozițiile lor?',
      options: [
        'Navicularul lateral și cuboidul medial în mijlocul piciorului',
        'Navicularul proximal față de talus și medial; cuboidul lateral, distal față de calcaneu',
        'Navicularul distal față de metatarsiene; cuboidul proximal față de tibie',
        'Atât navicularul cât și cuboidul se află doar în retropicior',
        'Navicularul și cuboidul sunt ambele oase sesamoide'
      ],
      explanation:
        'Navicularul se află medial între talus și cuneiforme, iar cuboidul este osul lateral al rândului tarsian distal, distal de calcaneu și proximal de metatarsienele IV–V.[web:525][web:532][web:536]'
    }
  },
  'tb5': {
    ro: {
      question: 'Care afirmație despre oasele cuneiforme este cea mai exactă?',
      options: [
        'Există două oase cuneiforme care articulează doar cu talusul',
        'Există trei oase cuneiforme (medial, intermediar, lateral) între navicular și bazele primelor trei metatarsiene',
        'Oasele cuneiforme se află între calcaneu și cuboid',
        'Toate cuneiformele formează exclusiv arcul longitudinal lateral',
        'Oasele cuneiforme articulează doar între ele'
      ],
      explanation:
        'Trei oase cuneiforme în formă de pană (medial, intermediar, lateral) se află posterior de navicular și anterior de bazele metatarsienelor I, II și III, contribuind la arcurile medială și transversală.[web:525][web:539][web:542]'
    }
  },
  'tb6': {
    ro: {
      question:
        'Care articulații definesc articulația subtalară (talocalcaneană) și care este funcția ei principală?',
      options: [
        'Între talus și tibie; permite dorsiflexia și flexia plantară',
        'Între calcaneu și cuboid; permite flexia degetelor',
        'Între talus și calcaneu la mai multe fațete; permite inversia și everția retropiciorului',
        'Între navicular și cuneiforme; permite abducția degetelor',
        'Între talus și metatarsiene; transmite direct greutatea către degete'
      ],
      explanation:
        'Articulația subtalară este formată de contactul dintre talus și calcaneu la fațetele anterioară, mijlocie și posterioară și permite în principal inversia și everția retropiciorului.[web:525][web:535][web:540]'
    }
  },
  'tb7': {
    ro: {
      question:
        'Funcțional, cum diferă navicularul și cuboidul la distribuirea forțelor prin picior?',
      options: [
        'Navicularul transmite forțe către metatarsienele laterale; cuboidul către cele mediale',
        'Navicularul transmite în principal forțele de la talus către primele trei metatarsiene prin cuneiforme; cuboidul transmite forțele de la calcaneu către metatarsienele IV și V',
        'Ambele oase transmit forțe doar către talus',
        'Ambele oase susțin doar arcul transversal',
        'Navicularul și cuboidul nu au rol în transmiterea forțelor'
      ],
      explanation:
        'Navicularul preia sarcina de la talus spre cuneiforme și apoi spre primele trei metatarsiene, iar cuboidul o preia de la calcaneu spre metatarsienele IV și V.[web:525][web:532][web:534]'
    }
  },
  'ull-001': {
    ro: {
      question: 'Care os este cel mai lung os al corpului uman?',
      options: ['Humerusul', 'Tibia', 'Femurul', 'Fibula'],
      explanation:
        'Femurul este cel mai lung și cel mai rezistent os al corpului uman, întinzându-se de la șold la genunchi.'
    }
  },
  'ull-002': {
    ro: {
      question: 'Câte falange sunt într-o mână?',
      options: ['10', '12', '14', '16'],
      explanation:
        'Fiecare mână are 14 falange: 2 la degetul mare (proximală și distală) și câte 3 la fiecare dintre celelalte patru degete (proximală, mijlocie și distală).'
    }
  },
  'ull-003': {
    ro: {
      question: 'Care os formează călcâiul piciorului?',
      options: ['Talusul', 'Calcaneul', 'Cuboidul', 'Navicularul'],
      explanation:
        'Calcaneul este cel mai mare os tarsian și formează călcâiul; articulează superior cu talusul și anterior cu cuboidul.'
    }
  },
  'ull-004': {
    ro: {
      question: 'Rotula este frecvent numită:',
      options: ['Osul cotului', 'Capacul genunchiului', 'Osul gleznei', 'Osul încheieturii'],
      explanation:
        'Rotula (capacul genunchiului) este un os sesamoid în tendonul cvadricepsului; protejează genunchiul și îmbunătățește avantajul mecanic al cvadricepsului.'
    }
  },
  'ull-005': {
    ro: {
      question:
        'Extremitatea laterală a claviculei articulează cu ce structură la articulația acromioclaviculară?',
      options: [
        'Manubriul sternului',
        'Acromionul scapulei',
        'Procesul coroid al scapulei',
        'Tubercul mare al humerusului'
      ],
      explanation:
        'Articulația acromioclaviculară se formează între extremitatea laterală a claviculei și acromionul scapulei, legând centura scapulară de trunchi.'
    }
  },
  'ull-006': {
    ro: {
      question: 'Radiusul se află pe care parte a antebrațului?',
      options: [
        'Partea medială (ulnară)',
        'Partea laterală (de polică)',
        'Partea posterioară',
        'Partea anterioară'
      ],
      explanation:
        'Radiusul se află pe partea laterală (de polică) a antebrațului; este mai scurt decât ulna proximal, dar mai lat distal, unde articulează cu oasele carpiene.'
    }
  },
  'ull-007': {
    ro: {
      question: 'Câte oase carpiene sunt în fiecare încheietură?',
      options: ['6', '7', '8', '9'],
      explanation:
        'Fiecare încheietură conține 8 oase carpiene în două rânduri: proximal (scafoid, semilunar, triquetrum, pisiform) și distal (trapez, trapezoid, capitat, hamat).'
    }
  },
  'ull-008': {
    ro: {
      question: 'Câte oase metacarpiene se află de obicei într-o mână?',
      options: ['4', '5', '6', '8'],
      explanation:
        'Mâna are cinci metacarpiene, numerotate 1–5 de la polică spre degetul mic; fiecare articulează proximal cu carpul și distal cu falangele aceleiași raze.'
    }
  },
  'ull-010': {
    ro: {
      question: 'Care os articulează cu acetabulul și formează articulația șoldului?',
      options: ['Tibia', 'Fibula', 'Femurul', 'Rotula'],
      explanation:
        'Capul femurului articulează cu acetabulul bazinului, formând articulația șoldului — o articulație sinovială tip „bilă și cavitate”.'
    }
  },
  'io-001': {
    ro: {
      question: 'Care organ este responsabil pentru producerea de insulină?',
      options: ['Ficatul', 'Pancreasul', 'Rinichiul', 'Splina'],
      explanation: 'Pancreasul produce insulină în celulele beta ale insulelor Langerhans, care reglează nivelurile de glucoză din sânge.'
    },
    es: {
      question: '¿Qué órgano es responsable de producir insulina?',
      options: ['El hígado', 'El páncreas', 'El riñón', 'El bazo'],
      explanation: 'El páncreas produce insulina en las células beta de los islotes de Langerhans, que regulan los niveles de glucosa en sangre.'
    },
    pt: {
      question: 'Que órgão é responsável por produzir insulina?',
      options: ['O fígado', 'O pâncreas', 'O rim', 'O baço'],
      explanation: 'O pâncreas produz insulina nas células beta das ilhotas de Langerhans, que regulam os níveis de glicose no sangue.'
    }
  },
  'io-002': {
    ro: {
      question: 'Unde este localizat apendicele?',
      options: ['Cadranul superior stâng', 'Cadranul superior drept', 'Cadranul inferior stâng', 'Cadranul inferior drept'],
      explanation: 'Apendicele este localizat în cadranul inferior drept al abdomenului, atașat de cecul intestinului gros.'
    },
    es: {
      question: '¿Dónde se localiza el apéndice?',
      options: ['Cuadrante superior izquierdo', 'Cuadrante superior derecho', 'Cuadrante inferior izquierdo', 'Cuadrante inferior derecho'],
      explanation: 'El apéndice se localiza en el cuadrante inferior derecho del abdomen, unido al ciego del intestino grueso.'
    },
    pt: {
      question: 'Onde está localizado o apêndice?',
      options: ['Quadrante superior esquerdo', 'Quadrante superior direito', 'Quadrante inferior esquerdo', 'Quadrante inferior direito'],
      explanation: 'O apêndice está localizado no quadrante inferior direito do abdómen, ligado ao ceco do intestino grosso.'
    }
  },
  'hn-001': {
    ro: {
      question: 'Care nerv cranian este responsabil pentru expresiile faciale?',
      options: ['Trigemen (V)', 'Facial (VII)', 'Glosofaringian (IX)', 'Vag (X)'],
      explanation: 'Nervul facial (CN VII) inervează mușchii expresiei faciale și transportă și senzațiile gustative din cele două treimi anterioare ale limbii.'
    },
    es: {
      question: '¿Qué nervio craneal es responsable de las expresiones faciales?',
      options: ['Trigémino (V)', 'Facial (VII)', 'Glosofaríngeo (IX)', 'Vago (X)'],
      explanation: 'El nervio facial (CN VII) inerva los músculos de la expresión facial y también transporta las sensaciones gustativas de los dos tercios anteriores de la lengua.'
    },
    pt: {
      question: 'Que nervo craniano é responsável pelas expressões faciais?',
      options: ['Trigémeo (V)', 'Facial (VII)', 'Glossofaríngeo (IX)', 'Vago (X)'],
      explanation: 'O nervo facial (CN VII) inerva os músculos da expressão facial e também transporta as sensações gustativas dos dois terços anteriores da língua.'
    }
  },
  'na-001': {
    ro: {
      question: 'Care structură conectează cele două emisfere cerebrale?',
      options: ['Puntea', 'Corpul calos', 'Talamusul', 'Hipotalamusul'],
      explanation: 'Corpul calos este cea mai mare structură de substanță albă din creier, conectând emisferele cerebrale stângă și dreaptă și facilitând comunicarea interhemisferică.'
    },
    es: {
      question: '¿Qué estructura conecta los dos hemisferios cerebrales?',
      options: ['El puente', 'El cuerpo calloso', 'El tálamo', 'El hipotálamo'],
      explanation: 'El cuerpo calloso es la estructura de sustancia blanca más grande del cerebro, conectando los hemisferios cerebrales izquierdo y derecho y facilitando la comunicación interhemisférica.'
    },
    pt: {
      question: 'Que estrutura conecta os dois hemisférios cerebrais?',
      options: ['A ponte', 'O corpo caloso', 'O tálamo', 'O hipotálamo'],
      explanation: 'O corpo caloso é a maior estrutura de substância branca do cérebro, conectando os hemisférios cerebrais esquerdo e direito e facilitando a comunicação inter-hemisférica.'
    }
  },
  'na-002': {
    ro: {
      question: 'Care parte a creierului este în principal responsabilă pentru coordonarea motorie?',
      options: ['Cerebrumul', 'Cerebelul', 'Trunchiul cerebral', 'Sistemul limbic'],
      explanation: 'Cerebelul este responsabil pentru coordonarea mișcărilor voluntare, menținerea echilibrului și învățarea motorie.'
    },
    es: {
      question: '¿Qué parte del cerebro es principalmente responsable de la coordinación motora?',
      options: ['El cerebro', 'El cerebelo', 'El tronco encefálico', 'El sistema límbico'],
      explanation: 'El cerebelo es responsable de coordinar los movimientos voluntarios, mantener el equilibrio y el aprendizaje motor.'
    },
    pt: {
      question: 'Que parte do cérebro é principalmente responsável pela coordenação motora?',
      options: ['O cérebro', 'O cerebelo', 'O tronco cerebral', 'O sistema límbico'],
      explanation: 'O cerebelo é responsável por coordenar os movimentos voluntários, manter o equilíbrio e a aprendizagem motora.'
    }
  },
  'pc1': {
    ro: {
      question: 'Care afirmație distinge cel mai bine circulația pulmonară de cea sistemică în ceea ce privește conținutul de oxigen în vasele majore?',
      options: [
        'Arterele pulmonare transportă sânge oxigenat către plămâni și venele pulmonare transportă sânge dezoxigenat',
        'Arterele și venele pulmonare ambele transportă sânge dezoxigenat',
        'Arterele pulmonare transportă sânge dezoxigenat către plămâni și venele pulmonare transportă sânge oxigenat către inimă',
        'Arterele pulmonare transportă sânge mixt și venele pulmonare transportă doar sânge dezoxigenat',
        'Circulația pulmonară nu are vene, doar artere și capilare'
      ],
      explanation: 'În circulația pulmonară, arterele părăsesc ventriculul drept transportând sânge dezoxigenat către plămâni, în timp ce venele pulmonare returnează sânge oxigenat către atriul stâng.'
    }
  },
  'pc2': {
    ro: {
      question: 'Câte vene pulmonare drenează de obicei în atriul stâng?',
      options: [
        'Două (una din fiecare plămân)',
        'Trei (una din fiecare lob al plămânului drept)',
        'Patru (două din fiecare plămân)',
        'Șase (una din fiecare lob al ambilor plămâni)',
        'O singură venă pulmonară comună'
      ],
      explanation: 'De obicei, patru vene pulmonare (două din fiecare plămân) returnează sângele oxigenat către atriul stâng.'
    }
  },
  'pc3': {
    ro: {
      question: 'Care descriere rezumă cel mai bine aprovizionarea arterială duală a plămânilor?',
      options: [
        'Doar arterele pulmonare aprovizionează plămânii',
        'Doar arterele bronșice aprovizionează plămânii',
        'Arterele pulmonare furnizează sânge cu presiune scăzută pentru schimbul de gaze; arterele bronșice furnizează sânge sistemic cu presiune ridicată către căile aeriene conducătoare și structurile de susținere',
        'Arterele bronșice furnizează sânge dezoxigenat către alveole',
        'Arterele pulmonare și arterele bronșice provin ambele din ventriculul drept'
      ],
      explanation: 'Arterele pulmonare (din ventriculul drept) formează un circuit cu presiune scăzută pentru schimbul de gaze, în timp ce arterele bronșice (din aortă) aprovizionează bronhiile, vasele mari și pleura cu sânge sistemic oxigenat.'
    }
  },
  'pc4': {
    ro: {
      question: 'Care structuri sunt în principal aprovizionate de arterele bronșice mai degrabă decât de arterele pulmonare?',
      options: [
        'Doar paturile capilare alveolare',
        'Doar bronhiolele respiratorii și alveolele',
        'Căile aeriene conducătoare (bronhii și bronhiole), pleura viscerală și pereții vaselor pulmonare mari',
        'Doar pleura parietală',
        'Doar ventriculul drept'
      ],
      explanation: 'Arterele bronșice aprovizionează arborele bronșic până la bronhiolele respiratorii, pleura viscerală, ganglionii limfatici hilari și pereții vaselor pulmonare mari.'
    }
  },
  'pc5': {
    ro: {
      question: 'Care rută descrie cel mai bine drenajul venos al sângelui furnizat de arterele bronșice?',
      options: [
        'Integral prin venele bronșice în sistemul azygos',
        'Integral prin venele pulmonare către atriul stâng',
        'Parțial prin venele bronșice către venele sistemice și parțial prin anastomoze în venele pulmonare',
        'Exclusiv prin vena cavă inferioară',
        'Exclusiv prin sistemul venos portal'
      ],
      explanation: 'Aproximativ o treime din sângele arterial bronșic drenează prin venele bronșice către venele sistemice (ex. azygos), în timp ce restul intră în venele pulmonare, creând un șunt fiziologic dreapta-stânga mic.'
    }
  },
  'pc6': {
    ro: {
      question: 'Care caracteristică hemodinamică este cea mai caracteristică sistemului arterial pulmonar comparativ cu arterele sistemice?',
      options: [
        'Rezistență mai mare și pereți mai groși',
        'Rezistență mai mică, pereți mai subțiri mai complianți și suprafață transversală totală mai mare',
        'Absența mușchiului neted în peretele arterial pulmonar',
        'Prezența valvelor în toate arterele pulmonare',
        'Absența completă a țesutului elastic'
      ],
      explanation: 'Arterele pulmonare au pereți mai subțiri, sunt mai compliante și operează la presiuni și rezistențe mai scăzute decât arterele sistemice, fiind adaptate să primească întregul debit cardiac la presiune scăzută.'
    }
  },
  'pc7': {
    ro: {
      question: 'Care afirmație explică cel mai bine de ce edemul pulmonar se poate prezenta inițial ca "mansoane peribronșice" la imagistică?',
      options: [
        'Lichidul de edem se acumulează mai întâi în spațiul pleural',
        'Arterele bronșice nu au niciun drenaj limfatic',
        'Lichidul tinde să se acumuleze în tecile interstițiale peribronchovasculare unde arterele pulmonare, venele și bronhiile curg împreună',
        'Capilarele pulmonare nu însoțesc bronhiile',
        'Doar venele bronșice sunt afectate în edemul timpuriu'
      ],
      explanation: 'Arterele și venele pulmonare călătoresc cu bronhiile în fascicule bronchovasculare; acumularea lichidului interstițial în jurul acestor structuri produce "mansoane" peribronșice pe radiografii.'
    }
  },
  'spc1': {
    ro: {
      question: 'Care circuit transportă sânge oxigenat de la ventriculul stâng către țesuturile corporale și returnează sânge dezoxigenat către atriul drept?',
      options: ['Circulația pulmonară', 'Circulația portală', 'Circulația sistemică', 'Doar circulația coronariană', 'Circulația limfatică'],
      explanation: 'Circulația sistemică livrează sânge oxigenat din ventriculul stâng prin aortă către țesuturi și returnează sânge dezoxigenat prin venele cave către atriul drept.'
    }
  },
  'spc2': {
    ro: {
      question: 'Care vas este principala cale arterială de ieșire a circulației sistemice?',
      options: ['Trunchiul pulmonar', 'Vena cavă superioară', 'Vena cavă inferioară', 'Aorta', 'Vena portă hepatică'],
      explanation: 'Aorta este principala arteră sistemică care primește sânge din ventriculul stâng și îl distribuie către toate regiunile corpului.'
    }
  },
  'spc3': {
    ro: {
      question: 'Care secvență descrie corect ordinea vaselor pe măsură ce sângele curge prin circulația sistemică de la inimă și înapoi?',
      options: [
        'Ventricul stâng → vene cave → aortă → atriu drept',
        'Ventricul stâng → aortă → artere → arteriole → capilare → venule → vene → vene cave → atriu drept',
        'Ventricul drept → trunchi pulmonar → vene pulmonare → atriu stâng',
        'Atriu stâng → vene pulmonare → artere pulmonare → ventricul drept',
        'Atriu drept → aortă → vene pulmonare → ventricul stâng'
      ],
      explanation: 'În circulația sistemică, sângele curge din ventriculul stâng în aortă, prin artere, arteriole, capilare, venule și vene, apoi venele cave către atriul drept.'
    }
  },
  'spc4': {
    ro: {
      question: 'Care afirmație descrie cel mai bine sistemul venos portal hepatic?',
      options: [
        'Transportă sânge oxigenat de la plămâni direct către inimă',
        'Transportă sânge venos de la tractul gastrointestinal și splină către ficat înainte de a reveni la circulația sistemică',
        'Drenează sângele venos din creier către atriul drept',
        'Este un sistem de artere care aprovizionează doar ficatul',
        'Ocolește ficatul, trimitând nutrienți direct către vena cavă inferioară'
      ],
      explanation: 'Sistemul portal hepatic transportă sânge venos bogat în nutrienți de la stomac, intestine, pancreas și splină către ficat pentru procesare înainte de a ajunge la circulația sistemică.'
    }
  },
  'spc5': {
    ro: {
      question: 'Care vene se unesc de obicei pentru a forma vena portă hepatică?',
      options: [
        'Vena cavă superioară și vena cavă inferioară',
        'Venele renale și venele hepatice',
        'Vena mezenterică superioară și vena splenică',
        'Vena jugulară internă și vena subclaviană',
        'Venele iliace comune'
      ],
      explanation: 'Vena portă hepatică este formată de obicei prin convergența venei mezenterice superioare și venei splenice la confluența splenico-mezenterică.'
    }
  },
  'spc6': {
    ro: {
      question: 'Care secvență reprezintă cel mai bine calea sângelui prin sistemul portal hepatic înapoi la circulația venoasă sistemică?',
      options: [
        'Vena portă → sinusoide hepatice → vene centrale → vene hepatice → vena cavă inferioară',
        'Vena portă → artere hepatice → sinus coronarian → vena cavă superioară',
        'Vena portă → vene renale → vena cavă inferioară',
        'Vena portă → vena azygos → vena cavă superioară',
        'Vena portă → vene pulmonare → atriu stâng'
      ],
      explanation: 'Sângele venos portal intră în sinusoidele hepatice, se drenează în venele centrale, apoi în venele hepatice, care în final se golesc în vena cavă inferioară.'
    }
  },
  'spc7': {
    ro: {
      question: 'Funcțional, cum diferă fluxul venos portal de întoarcerea venoasă sistemică tipică?',
      options: [
        'Venele portale transportă întotdeauna sânge oxigenat, spre deosebire de venele sistemice',
        'Sângele portal trece prin două paturi capilare în serie (intestin și ficat) înainte de a reveni la inimă',
        'Venele portale drenează doar plămânii',
        'Sângele portal ocolește toate paturile capilare',
        'Venele portale conțin multe valve pentru a preveni fluxul către ficat'
      ],
      explanation: 'Într-un sistem portal, sângele venos dintr-un pat capilar (intestin) trece printr-un al doilea pat capilar (sinusoide hepatice) înainte de a reveni la circulația sistemică.'
    }
  },
  'fc1': {
    ro: {
      question: 'Care afirmație descrie cel mai bine scopul principal al șunturilor circulatorii fetale?',
      options: [
        'Să crească fluxul sanguin către plămânii și ficatul fetal',
        'Să ocolească placenta și să direcționeze sângele către rinichi',
        'Să ocolească plămânii fetali nefuncționali și să ocolească parțial ficatul, asigurând în același timp că sângele oxigenat ajunge la organele vitale',
        'Să amestece sângele matern și fetal direct în camerele inimii',
        'Să prevină ajungerea sângelui la creier și miocard'
      ],
      explanation: 'Șunturile fetale (ductus venosus, foramen ovale, ductus arteriosus) permit sângelui placentar oxigenat să ocolească plămânii și parțial ficatul, prioritizând perfuzia inimii și creierului.'
    }
  },
  'fc2': {
    ro: {
      question: 'Care combinație enumeră corect cele trei șunturi circulatorii fetale majore?',
      options: [
        'Foramen ovale, ductus arteriosus, ductus venosus',
        'Foramen ovale, sinus coronarian, ductus venosus',
        'Ductus arteriosus, vena azygos, ligamentum teres',
        'Ductus venosus, vena cavă superioară, vena ombilicală',
        'Ligamentum arteriosum, ligamentum venosum, ligament ombilical'
      ],
      explanation: 'Șunturile fetale cheie sunt foramen ovale (AD→AS), ductus arteriosus (arteră pulmonară→aortă) și ductus venosus (venă ombilicală→VCI, ocolind cea mai mare parte a ficatului).'
    }
  },
  'fc3': {
    ro: {
      question: 'Care vase din cordonul ombilical transportă sânge oxigenat și dezoxigenat la făt?',
      options: [
        'Două vene ombilicale transportă sânge dezoxigenat; o arteră ombilicală transportă sânge oxigenat',
        'Două artere ombilicale transportă sânge oxigenat; o venă ombilicală transportă sânge dezoxigenat',
        'Două artere ombilicale transportă sânge dezoxigenat către placentă; o venă ombilicală transportă sânge oxigenat către făt',
        'Toate vasele ombilicale transportă sânge complet amestecat',
        'Doar arterele ombilicale sunt prezente în cordon'
      ],
      explanation: 'Cordonul ombilical are în mod normal două artere ombilicale care returnează sânge dezoxigenat către placentă și o venă ombilicală care transportă sânge oxigenat de la placentă către făt.'
    }
  },
  'fc4': {
    ro: {
      question: 'Care este rolul principal al ductus venosus în circulația fetală?',
      options: [
        'Să șunteze sângele de la artera pulmonară la aortă',
        'Să șunteze sângele de la atriul drept la atriul stâng',
        'Să transporte sânge oxigenat de la vena ombilicală direct la vena cavă inferioară, ocolind cea mai mare parte a ficatului',
        'Să dreneze sângele dezoxigenat din creier',
        'Să conecteze vena cavă superioară la atriul stâng'
      ],
      explanation: 'Ductus venosus permite cea mai mare parte a sângelui venos ombilical foarte oxigenat să ocolească sinusoidele hepatice și să intre în vena cavă inferioară în drum către atriul drept.'
    }
  },
  'fc5': {
    ro: {
      question: 'Care relație de presiune ajută la menținerea foramen ovale funcțional deschis în timpul vieții fetale?',
      options: [
        'Presiunea atriului stâng mai mare decât presiunea atriului drept',
        'Presiunea atriului drept mai mare decât presiunea atriului stâng',
        'Presiuni egale în ambele atrii',
        'Presiune ventriculară stângă mai mare decât presiunea ventriculară dreaptă',
        'Presiune arterială sistemică mai mare decât presiunea arterială pulmonară'
      ],
      explanation: 'La făt, rezistența vasculară pulmonară ridicată menține presiunea atriului drept și a părților drepte mai mare decât presiunile din stânga, promovând șuntarea dreapta-stânga prin foramen ovale.'
    }
  },
  'fc6': {
    ro: {
      question: 'Imediat după naștere, care schimbări fiziologice duc cel mai direct la închiderea funcțională a foramen ovale?',
      options: [
        'Creșterea fluxului venos ombilical și scăderea presiunii atriului stâng',
        'Rezistență vasculară pulmonară ridicată persistentă și presiune crescută a atriului drept',
        'Pierderea circulației placentare, scăderea rezistenței vasculare pulmonare cu expansiunea pulmonară, întoarcere venoasă pulmonară crescută ridicând presiunea atriului stâng peste cea dreaptă',
        'Constrângerea ductus arteriosus ridicând presiunea atriului drept',
        'Constrângerea arterelor ombilicale cauzând șuntare dreapta-stânga prin foramen ovale'
      ],
      explanation: 'Clamparea cordonului și expansiunea pulmonară scad rezistența pulmonară și cresc întoarcerea venoasă pulmonară, ridicând presiunea atriului stâng peste cea dreaptă și presând septum primum contra septum secundum, închizând funcțional foramen ovale.'
    }
  },
  'fc7': {
    ro: {
      question: 'Care rămășițe postnatale corespund corect ductus arteriosus și ductus venosus fetal la un nou-născut la termen sănătos?',
      options: [
        'Ductus arteriosus → ligamentum teres; ductus venosus → ligamentum arteriosum',
        'Ductus arteriosus → ligamentum arteriosum; ductus venosus → ligamentum venosum',
        'Ductus arteriosus → ligamentum venosum; ductus venosus → ligamentum arteriosum',
        'Ambele devin parte a sinusului coronarian',
        'Ambele persistă ca canale vasculare patente pe toată viața'
      ],
      explanation: 'După închidere, ductus arteriosus formează ligamentum arteriosum între trunchiul pulmonar și aortă, în timp ce ductus venosus devine ligamentum venosum în ficat.'
    }
  },
  'ttb1': {
    ro: {
      question: 'La ce nivel vertebral se bifurcă de obicei traheea în bronhiile principale în torace?',
      options: [
        'La nivelul vertebrei T1',
        'La nivelul T4–T5 (unghiul sternal)',
        'La nivelul vertebrei T7',
        'La nivelul vertebrei C7',
        'La nivelul vertebrelor T9–T10'
      ],
      explanation: 'În torace, traheea coboară în mediastinul superior și se bifurcă de obicei la nivelul unghiului sternal, corespunzător discului intervertebral T4–T5.'
    }
  },
  'ttb2': {
    ro: {
      question: 'Care afirmație descrie cel mai bine poziția traheei toracice în raport cu esofagul?',
      options: [
        'Traheea se află posterior față de esofag pe tot parcursul său',
        'Traheea se află anterior față de esofag pe tot parcursul său',
        'Traheea se află lateral față de esofag doar pe partea stângă',
        'Traheea se află lateral față de esofag doar pe partea dreaptă',
        'Traheea și esofagul nu au o relație anatomică apropiată'
      ],
      explanation: 'În mediastinul superior, traheea toracică se află anterior față de esofag, cu peretele său posterior membranos direct în raport cu tubul esofagian.'
    }
  },
  'ttb3': {
    ro: {
      question: 'Care bronhie principală este mai verticală, mai largă și mai scurtă, și prin urmare mai predispusă să primească corpuri străine aspirate?',
      options: [
        'Bronhia principală stângă',
        'Bronhia principală dreaptă',
        'Sunt identice ca calibru și direcție',
        'Ambele bronhii principale sunt orizontale',
        'Nicio bronhie nu primește material aspirat preferențial'
      ],
      explanation: 'Bronhia principală dreaptă este clasic descrisă ca fiind mai largă, mai scurtă și mai verticală decât cea stângă, astfel corpurile străine inhalate tind să intre mai frecvent în arborele bronșic drept.'
    }
  },
  'ttb4': {
    ro: {
      question: 'Care structură arcuiește peste bronhia principală stângă când aceasta intră în rădăcina plămânului?',
      options: [
        'Vena azygos',
        'Arcul aortic',
        'Vena cavă superioară',
        'Vena cavă inferioară',
        'Artera toracică internă'
      ],
      explanation: 'Arcul aortic trece peste bronhia principală stângă pe măsură ce se curbează posterior și spre stânga, formând o relație caracteristică la rădăcina plămânului stâng.'
    }
  },
  'ttb5': {
    ro: {
      question: 'Care vas arcuiește peste bronhia principală dreaptă la hilul plămânului drept?',
      options: [
        'Arcul aortic',
        'Vena brahiocefalică stângă',
        'Vena azygos',
        'Trunchiul pulmonar',
        'Aorta toracică descendentă'
      ],
      explanation: 'Vena azygos formează un arc caracteristic peste rădăcina plămânului drept, trecând superior față de bronhia principală dreaptă înainte de a se drena în vena cavă superioară.'
    }
  },
  'ttb6': {
    ro: {
      question: 'Care dintre următoarele afirmații despre carină este cea mai precisă?',
      options: [
        'Este o creastă musculară pe peretele anterior al traheei',
        'Este o creastă cartilaginoasă la bifurcație care se proiectează în originea bronhiilor principale',
        'Este o bandă fibroasă care unește bronhiile principale posterior',
        'Este un șanț între venele pulmonare',
        'Este vizibilă doar extern pe suprafața plămânului'
      ],
      explanation: 'Carina este o creastă cartilaginoasă în formă de chilă la capătul inferior al traheei, proiectându-se între originile celor două bronhii principale și servind ca un reper bronhoscopic important.'
    }
  },
  'ttb7': {
    ro: {
      question: 'Care structură se află direct posterior față de bifurcația traheei în torace?',
      options: [
        'Aorta ascendentă',
        'Trunchiul pulmonar',
        'Esofagul',
        'Vena cavă superioară',
        'Artera pulmonară stângă'
      ],
      explanation: 'La nivelul carinei, esofagul se află imediat posterior, astfel încât mărirea patologică a ganglionilor subcarinali sau distorsiunea carinei poate îngusta sau deplasa lumenul esofagian.'
    }
  },
  'ttb8': {
    ro: {
      question: 'Cum diferă bronhia principală stângă de cea dreaptă în cursul său prin mediastin?',
      options: [
        'Trece mai vertical și ajunge la plămân într-o distanță mai scurtă',
        'Trece inferior față de trunchiul pulmonar și vena cavă superioară',
        'Trece inferolateral, anterior față de esofag și aorta toracică',
        'Trece inferolateral, inferior față de arcul aortic și anterior față de esofag și aorta descendentă',
        'Rulează în întregime în mediastinul anterior'
      ],
      explanation: 'Bronhia principală stângă urmează un curs mai lung și mai oblic, trecând inferior față de arcul aortic și anterior față de esofag și aorta toracică descendentă înainte de a intra în hilul plămânului stâng.'
    }
  },
  'ttb9': {
    ro: {
      question: 'Care dintre următoarele descrie cel mai bine raporturile traheei toracice în mediastinul superior?',
      options: [
        'Anterior față de timus și posterior față de vena cavă superioară',
        'Posterior față de esofag și anterior față de coloana vertebrală',
        'Anterior față de esofag și posterior față de arcul aortic și trunchiul brahiocefal',
        'Anterior față de esofag și posterior față de stern, timus și venele mari',
        'Lateral față de esofag și vasele mari fără raporturi anterioare'
      ],
      explanation: 'În mediastinul superior, traheea se află anterior față de esofag și posterior față de structurile mediastinului anterior, incluzând sternul, timusul și venele mari precum venele brahiocefalice și vena cavă superioară.'
    }
  },
  'ttb10': {
    ro: {
      question: 'Care afirmație explică cel mai bine semnificația clinică a bronhiei superioare drepte (eparteriala) în raport cu artera pulmonară dreaptă?',
      options: [
        'Se află inferior față de artera pulmonară dreaptă, similar cu toate celelalte bronhii lobare',
        'Traversează anterior față de artera și venele pulmonare',
        'Apare deasupra nivelului arterei pulmonare drepte în hil',
        'Este singura bronhie care nu este însoțită de o ramură a arterei pulmonare',
        'Se află în întregime în afara rădăcinii plămânului'
      ],
      explanation: 'Bronhia lobului superior drept este numită eparterială deoarece apare deasupra arterei pulmonare drepte în rădăcina plămânului, un aranjament distinctiv comparativ cu bronhiile hipartariale rămase.'
    }
  },
  'mb1': {
    ro: {
      question: 'Care afirmație compară cel mai bine bronhiile principale dreapta și stânga?',
      options: [
        'Bronhia principală dreaptă este mai lungă și mai îngustă decât cea stângă',
        'Bronhia principală dreaptă este mai scurtă, mai largă și mai verticală decât cea stângă',
        'Bronhia principală stângă este mai scurtă și mai verticală decât cea dreaptă',
        'Ambele bronhii principale au lungime, calibru și direcție identice',
        'Bronhia principală stângă este mai largă și mai verticală decât cea dreaptă'
      ],
      explanation: 'Bronhia principală dreaptă este caracteristic mai scurtă, mai largă și mai verticală decât cea stângă, o configurație care favorizează intrarea materialului aspirat în arborele bronșic drept.'
    }
  },
  'mb2': {
    ro: {
      question: 'Care lob pulmonar este aprovizionat de o bronhie lobară "eparterială"?',
      options: [
        'Lobul mijlociu drept',
        'Lobul inferior drept',
        'Lobul superior drept',
        'Lobul superior stâng',
        'Lobul inferior stâng'
      ],
      explanation: 'Bronhia lobului superior drept apare deasupra arterei pulmonare drepte și este prin urmare numită eparterială, în timp ce bronhiile lobare rămase sunt hiparteriale.'
    }
  },
  'mb3': {
    ro: {
      question: 'Care este lungimea tipică a bronhiei principale stângi comparativ cu cea dreaptă?',
      options: [
        'Bronhia principală stângă este mai scurtă decât cea dreaptă (aproximativ 1 cm)',
        'Bronhia principală stângă are lungime identică cu cea dreaptă (aproximativ 2 cm)',
        'Bronhia principală stângă este mai lungă, în mod obișnuit aproximativ 5 cm în lungime',
        'Bronhia principală stângă lipsește; traheea se divide direct în bronhii lobare',
        'Bronhia principală stângă se extinde doar în substanța pulmonară'
      ],
      explanation: 'Bronhia principală stângă are un curs intratoracic mai lung, măsurând în mod obișnuit aproximativ 5 cm, deoarece trece oblic sub arcul aortic pentru a ajunge la rădăcina plămânului stâng, în timp ce cea dreaptă este de obicei mai scurtă.'
    }
  },
  'mb4': {
    ro: {
      question: 'Care structuri majore sunt strâns legate de bronhia principală stângă pe parcursul cursului său?',
      options: [
        'Vena cavă superioară anterior și vena azygos posterior',
        'Aorta ascendentă anterior și vena cavă inferioară posterior',
        'Arcul aortic superior și esofagul și aorta toracică descendentă posterior',
        'Trunchiul pulmonar superior și atriul drept posterior',
        'Vasele toracice interne anterior și coloana vertebrală posterior'
      ],
      explanation: 'Bronhia principală stângă trece inferior față de arcul aortic și anterior față de esofag și aorta toracică descendentă, relații de importanță în patologia și imagistica mediastinală.'
    }
  },
  'mb5': {
    ro: {
      question: 'În câte bronhii lobare (secundare) se divide de obicei bronhia principală dreaptă?',
      options: [
        'Două bronhii lobare',
        'Trei bronhii lobare',
        'Patru bronhii lobare',
        'Cinci bronhii lobare',
        'Șase bronhii lobare'
      ],
      explanation: 'Bronhia principală dreaptă se divide în trei bronhii lobare care aprovizionează lobii superior, mijlociu și inferior ai plămânului drept, în timp ce bronhia principală stângă se divide în două bronhii lobare.'
    }
  },
  'mb6': {
    ro: {
      question: 'Care caracteristică clinică reflectă cel mai direct orientarea mai verticală a bronhiei principale drepte?',
      options: [
        'Incidență mai mare a pneumoniei pe partea stângă',
        'Compresia frecventă a bronhiei principale drepte de către arcul aortic',
        'Probabilitate mai mare de aspirare a corpului străin în bronhia lobului inferior drept',
        'Protecție completă a plămânului drept împotriva materialului aspirat',
        'Absența bronhiilor segmentare pe partea dreaptă'
      ],
      explanation: 'Deoarece bronhia principală dreaptă este mai verticală și în linie directă cu traheea, corpurile străine aspirate tind să pătrundă în ea și se depun adesea în bronhia lobului inferior drept.'
    }
  },
  'sc-ext-1': {
    ro: {
      question: 'La ce nivel vertebral se termină de obicei măduva spinării la adulți?',
      options: [
        'Vertebra T12',
        'Nivelul vertebral L1-L2',
        'Nivelul vertebral L3-L4',
        'Vertebra S1',
        'Vertebra L5'
      ],
      explanation: 'Măduva spinării la adulți se termină de obicei la nivelul discului intervertebral L1-L2, formând conul medular (conus medullaris). Acest lucru este semnificativ clinic pentru puncția lombară, care se efectuează în siguranță sub L3 pentru a evita lezarea măduvei spinării.'
    }
  },
  'sc-ext-2': {
    ro: {
      question: 'Care dintre următoarele reprezintă umflătura cervicală a măduvei spinării?',
      options: [
        'Segmentele C1-C4',
        'Segmentele C4-T1',
        'Segmentele T2-T6',
        'Segmentele L1-L3',
        'Segmentele S1-S3'
      ],
      explanation: 'Umflătura cervicală se extinde de la segmentele medulare C4 la T1 și corespunde originii plexului brahial, care inervează membrele superioare. Creșterea țesutului nervos reflectă inervația motorie și senzitivă complexă necesară pentru funcția membrului superior.'
    }
  },
  'sc-ext-3': {
    ro: {
      question: 'Filum terminale este o continuare a cărui strat meningeal?',
      options: [
        'Doar dura mater',
        'Doar arahnoida mater',
        'Pia mater',
        'Grăsimea epidurală',
        'Ligamentul longitudinal posterior'
      ],
      explanation: 'Filum terminale este un filament subțire de pia mater care se extinde de la vârful conului medular până la dorsul coccisului, ancorând măduva spinării în canalul vertebral.'
    }
  },
  'pw1': {
    ro: {
      question: 'Infarctele lacunare sunt cauzate în mod clasic de ocluzia căror tipuri de vase?',
      options: [
        'Artere extracraniene mari precum carotida internă',
        'Artere piale corticale pe suprafața creierului',
        'Artere perforante profunde unice (penetrante) care aprovizionează structurile cerebrale profunde',
        'Sinusurile venoase ale durei mater',
        'Doar trunchiul arterial basilar'
      ],
      explanation: 'Infarctele lacunare sunt infarcte subcorticale mici cauzate de ocluzia unei singure artere penetrante profunde care aprovizionează structuri precum ganglionii bazali, talamusul și capsula internă.'
    }
  },
  'pw2': {
    ro: {
      question: 'Care artere profunde sunt cel mai frecvent implicate în infarctele lacunare ale ganglionilor bazali și capsulei interne?',
      options: [
        'Arterele cerebeloase postero-inferioare',
        'Arterele lenticulostriate (centrale anterolaterale) ale arterei cerebrale medii',
        'Arterele cerebeloase antero-inferioare',
        'Perforantele arterei vertebrale către bulb',
        'Ramurile meningee ale arterei carotide externe'
      ],
      explanation: 'Arterele lenticulostriate laterale din segmentul M1 al arterei cerebrale medii străpung substanța perforată anterioară pentru a aproviziona ganglionii bazali și capsula internă și sunt o locație comună în infarcția lacunară.'
    }
  },
  'sc-ext-4': {
    ro: {
      question: 'Care fisură a măduvei spinării conține artera spinală anterioară?',
      options: [
        'Sulcus median posterior',
        'Sulcus posterolateral',
        'Fisura mediană anterioară',
        'Sulcus anterolateral',
        'Canalul central'
      ],
      explanation: 'Fisura mediană anterioară este un șanț longitudinal adânc pe suprafața ventrală a măduvei spinării care conține artera spinală anterioară și ramurile sale. Această arteră aprovizionează două treimi anterioare ale măduvei spinării.'
    }
  },
  'sc-ext-5': {
    ro: {
      question: 'Ganglionii radiculari dorsali sunt localizați în ce poziție anatomică?',
      options: [
        'În interiorul substanței măduvei spinării',
        'În foramenele intervertebrale',
        'În canalul vertebral posterior de măduvă',
        'Anterior de corpurile vertebrale',
        'În interiorul tecii durale'
      ],
      explanation: 'Ganglionii radiculari dorsali, conținând corpurile celulare ale neuronilor senzitivi primari, sunt localizați în foramenele intervertebrale. Poziția lor îi face vulnerabili la compresie în afecțiuni precum hernia de disc sau stenoza foraminală.'
    }
  },
  'pw3': {
    ro: {
      question: 'Care mecanism este cel mai clasic asociat cu accidentul vascular cerebral lacunar în arterele perforante profunde?',
      options: [
        'Ruptura plăcii aterosclerotice la bifurcația carotidei cu emboli mari',
        'Lipohialinoza și necroza fibrinoidă a arterelor perforante mici, adesea legate de hipertensiunea cronică',
        'Vasospasm izolat al arterelor corticale după hemoragie subarahnoidiană',
        'Cardioembolism din fibrilație atrială doar',
        'Compresia venelor în spațiul subdural'
      ],
      explanation: 'Accidentele vasculare cerebrale lacunare clasice sunt legate de lipohialinoza și necroza fibrinoidă în arterele perforante mici, puternic asociate cu hipertensiunea de lungă durată și boala vaselor mici.'
    }
  },
  'pw4': {
    ro: {
      question: 'Infarctele de zonă limitrofă (watershed) apar de obicei în ce regiuni ale creierului?',
      options: [
        'În miezul teritoriilor arteriale majore, cum ar fi regiunea trunchiului ACM',
        'La granițele dintre două teritorii arteriale cerebrale majore unde presiunea de perfuzie este cea mai scăzută',
        'Doar în emisferele cerebeloase',
        'Doar în teritoriile perforante ale trunchiului cerebral',
        'Exclusiv în ganglionii bazali profunzi'
      ],
      explanation: 'Infarctele de zonă limitrofă apar la joncțiunile dintre teritoriile arteriale majore (ex. ACA-ACM, ACM-ACP sau perforante profunde-teritorii superficiale), care sunt deosebit de vulnerabile la hipoperfuzie.'
    }
  },
  'pw5': {
    ro: {
      question:
        'Care situație clinică sau hemodinamică este CEA MAI STRÂNS asociată cu dezvoltarea infarctelor corticale de zonă limitrofă (watershed)?',
      options: [
        'Hipotensiune sistemică severă, adesea combinată cu stenoză carotidiană sau a altor artere mari semnificativă',
        'Tromboză izolată a sinusului venos cu flux arterial normal',
        'Anemie ușoară fără hipotensiune',
        'Leziunea nervilor cranieni în sinusul cavernos',
        'Doar leziuni de masă în fosa posterioară'
      ],
      explanation:
        'Infarctele corticale de zonă limitrofă apar frecvent când hipotensiunea sistemică coexistează cu stenoză sau ocluzie severă a arterelor de alimentare majore (ex. carotida internă), compromițând perfuzia distală în zonele limitrofe.[web:192][web:195][web:200]'
    }
  },
  'pw6': {
    ro: {
      question:
        'Infarctele de zonă limitrofă internă (profunde) implică cel mai frecvent ce regiune și mecanism?',
      options: [
        'Cortex cerebelos, prin ocluzia AICP',
        'Corona radiata și centrum semiovale, prin insuficiență hemodinamică între sistemele perforante profunde și cele superficiale',
        'Opercul frontal, prin ocluzie embolică a unei ramuri ACM',
        'Bulb, prin disecția vertebrală',
        'Pol occipital, prin emboli pe ramuri ACP'
      ],
      explanation:
        'Infarctele de watershed intern apar caracteristic în corona radiata și centrum semiovale, unde se suprapun teritoriile arterelor perforante profunde și ramurilor corticale superficiale, fiind vulnerabile la hipoperfuzie.[web:192][web:195][web:198]'
    }
  },
  'pw7': {
    ro: {
      question: 'Care artere perforante provin din artera cerebrală posterioară și vascularizează talamusul?',
      options: [
        'Arterele lenticulostriate',
        'Arterele talamoperforante (talamice posterioare)',
        'Artera recurentă a lui Heubner',
        'Ramurile arterei coroide anterioare',
        'Perforantele pontine'
      ],
      explanation:
        'Arterele talamoperforante (perforatoare talamice posterioare) provin din segmentul P1 al arterei cerebrale posterioare și vascularizează talamusul medial și posterior.'
    }
  },
  'pw8': {
    ro: {
      question: 'Artera recurentă a lui Heubner este o ramură perforantă a cărei artere?',
      options: [
        'Artera cerebrală medie (segment M1)',
        'Artera cerebrală anterioară (segment A1 sau A2)',
        'Artera cerebrală posterioară (segment P1)',
        'Artera bazilară',
        'Artera coroidă anterioară'
      ],
      explanation:
        'Artera recurentă a lui Heubner (artera striată medială) provine de obicei din segmentul A1 sau A2 proximal al arterei cerebrale anterioare și vascularizează capul nucleului caudat și brațul anterior al capsulei interne.'
    }
  },
  'pw9': {
    ro: {
      question:
        'Care prezentare clinică este clasic asociată cu infarctele lacunare care afectează brațul posterior al capsulei interne?',
      options: [
        'Hemianopsie homonimă',
        'Hemipareză motorie pură',
        'Afasie globală',
        'Orbire corticală',
        'Ataxie cerebeloasă'
      ],
      explanation:
        'Infarctele lacunare în brațul posterior al capsulei interne cauzează clasic hemipareză motorie pură, deoarece fibrele tractului cortico-spinal sunt dens grupate în această regiune.'
    }
  },
  'pw10': {
    ro: {
      question:
        'Infarctele de zonă limitrofă corticale (externe) între teritoriile ACA și ACM se manifestă de obicei prin ce tipar de pareză?',
      options: [
        'Slăbiciune la nivelul feței și mâinii, cu crutarea gambei (tipar ACM)',
        'Slăbiciune proximală la braț și umăr („omul în butoi” / man-in-a-barrel)',
        'Slăbiciune izolată a gambei (tipar ACA)',
        'Hemiplegie completă cu pierdere senzorială',
        'Slăbiciune facială bilaterală'
      ],
      explanation:
        'Infarctele bilaterale de watershed între ACA și ACM pot determina sindromul „omul în butoi”, cu slăbiciune proximală la membrul superior și centura scapulară, crutând adesea fața și membrele inferioare aflate în teritoriile centrale.'
    }
  },
  'her1': {
    ro: {
      question: 'În ce compartiment mediastinal este localizată în principal inima?',
      options: [
        'Mediastinul superior',
        'Mediastinul anterior',
        'Mediastinul mijlociu în sacul pericardic',
        'Mediastinul posterior',
        'Complet în afara mediastinului'
      ],
      explanation: 'Inima se află în interiorul pericardului fibros în mediastinul mijlociu, între plămâni și deasupra diafragmului.'
    }
  },
  'her2': {
    ro: {
      question: 'Ce cameră formează vârful anatomic al inimii?',
      options: [
        'Atriul drept',
        'Ventriculul drept',
        'Atriul stâng',
        'Ventriculul stâng',
        'Sinusul coronarian'
      ],
      explanation: 'Vârful inimii este format de partea inferolaterală a ventriculului stâng și este orientat anterior, inferior și spre stânga.'
    }
  },
  'sfr1': {
    ro: {
      question: 'Care pliu peritoneal atașează curbura mică a stomacului la ficat?',
      options: [
        'Omentul mare',
        'Omentul mic (ligamentul hepatogastric)',
        'Ligamentul gastrosplenic',
        'Mezocolonul transvers',
        'Ligamentul falciform'
      ],
      explanation: 'Omentul mic se extinde de la curbura mică a stomacului și duodenul proximal la ficat, ligamentul hepatogastric fiind porțiunea atașată la stomac.'
    }
  },
  'sfr2': {
    ro: {
      question: 'Care structură formează peretele posterior al sacului mic (bursa omentală) în spatele stomacului?',
      options: [
        'Ficatul',
        'Colonul transvers',
        'Pancreasul și acoperirea sa peritoneală',
        'Splina',
        'Rinichiul stâng'
      ],
      explanation: 'Peretele posterior al sacului mic este format în principal de peritoneul care acoperă pancreasul, stomacul formând peretele anterior al acestui spațiu potențial.'
    }
  },
  'sfr3': {
    ro: {
      question: 'Care ligament conectează curbura mare a stomacului la splină?',
      options: [
        'Ligamentul hepatogastric',
        'Ligamentul gastrocolic',
        'Ligamentul gastrosplenic (gastrolienal)',
        'Ligamentul splenorenal',
        'Ligamentul frenicogastric'
      ],
      explanation: 'Ligamentul gastrosplenic (gastrolienal) se extinde de la curbura mare a stomacului la hilul splinei, transmițând vasele gastrice scurte și vasele gastroepiploice stângi.'
    }
  },

  'mc1': {
    ro: {
      question: 'Care afirmație descrie cel mai bine microcirculația?',
      options: [
        'Doar arterele mari și venele mari',
        'Rețeaua de arteriole, capilare și venule unde are loc schimbul substanțelor',
        'Doar inima și aorta',
        'Doar vasele limfatice',
        'Doar venele profunde'
      ],
      explanation: 'Microcirculația constă din arteriole, capilare și venule unde are loc schimbul de gaze, nutrienți și deșeuri între sânge și țesuturi.',
      correctAnswer: 1
    }
  },
  'mc2': {
    ro: {
      question: 'Care tip de capilare sunt cele mai permeabile?',
      options: [
        'Capilare continue',
        'Capilare fenestrate',
        'Capilare sinusoidale (discontinue)',
        'Toate au permeabilitate egală',
        'Capilarele nu sunt niciodată permeabile'
      ],
      explanation: 'Capilarele sinusoidale (discontinue) sunt cele mai permeabile, având spații mari între celule și o membrană bazală discontinuă, găsite în ficat, splină și măduvă osoasă.'
    }
  },
  'mc3': {
    ro: {
      question: 'Ce forțe determină mișcarea fluidului prin pereții capilarelor conform ecuației Starling?',
      options: [
        'Doar presiunea hidrostatică',
        'Doar presiunea oncotică',
        'Presiunea hidrostatică capilar și oncotică interstițială (favorează filtrarea) versus presiunea oncotică capilară și hidrostatică interstițială (favorează reabsorbția)',
        'Doar gravitația',
        'Doar temperatura'
      ],
      explanation: 'Ecuația Starling descrie echilibrul între presiunea hidrostatică (împinge fluidul afară) și presiunea oncotică (trage fluidul înapoi) atât în capilare cât și în interstițiu.',
      correctAnswer: 2
    }
  },
  'mc4': {
    ro: {
      question: 'În majoritatea patului capilar, unde predomină filtrarea față de reabsorbție?',
      options: [
        'Filtrarea predomină la capătul arterial; reabsorbția predomină la capătul venos',
        'Reabsorbția predomină la capătul arterial; filtrarea predomină la capătul venos',
        'Filtrarea și reabsorbția sunt egale peste tot',
        'Nu există nicio filtrare sau reabsorbție',
        'Doar filtrarea are loc pretutindeni'
      ],
      explanation: 'La capătul arterial al capilarelor, presiunea hidrostatică ridicată favorizează filtrarea, în timp ce la capătul venos, presiunea hidrostatică scăzută permite reabsorbției oncotice să predomine.'
    }
  },
  'mc5': {
    ro: {
      question: 'Ce rol joacă sistemul limfatic în echilibrul fluidelor?',
      options: [
        'Nu are nicio legătură cu fluidele',
        'Returnează excesul de fluid interstițial filtrat și proteine în circulația venoasă',
        'Doar produce limfocite',
        'Doar filtrează sângele',
        'Doar stochează grăsimi'
      ],
      explanation: 'Sistemul limfatic colectează excesul de fluid interstițial (inclusiv proteine) care nu este reabsorbit de capilare și îl returnează în circulația venoasă, prevenind edemul.'
    }
  },
  'mc6': {
    ro: {
      question: 'Care mechanim reglează fluxul sanguin prin paturile capilare?',
      options: [
        'Doar inima',
        'Sfincterele precapilare și metarteriolele',
        'Doar venele',
        'Doar hormonii',
        'Fluxul este constant fără reglare'
      ],
      explanation: 'Sfincterele precapilare (benzi de mușchi neted la intrarea capilarelor) și metarteriolele reglează fluxul sanguin în paturile capilare în funcție de nevoile metabolice locale.'
    }
  },
  'hd1': {
    ro: {
      question: 'Care lege descrie relația dintre flux, presiune și rezistență în vasele de sânge?',
      options: [
        'Legea lui Boyle',
        'Legea lui Ohm (flux = ΔPresiune / Rezistență)',
        'Legea lui Newton',
        'Legea lui Hooke',
        'Legea lui Avogadro'
      ],
      explanation: 'Fluxul sanguin este proporțional cu gradientul de presiune și invers proporțional cu rezistența vasculară (Q = ΔP/R), analog cu legea lui Ohm în electricitate.'
    }
  },
  'hd2': {
    ro: {
      question: 'Care afirmație descrie cel mai bine rezistența vasculară?',
      options: [
        'Este determinată doar de lungimea vasului',
        'Este invers proporțională cu a patra putere a razei vasului (legea Poiseuille)',
        'Nu depinde de vâscozitatea sângelui',
        'Este aceeași în toate vasele',
        'Nu afectează fluxul sanguin'
      ],
      explanation: 'Conform legii Poiseuille, rezistența este direct proporțională cu lungimea și vâscozitatea și invers proporțională cu a patra putere a razei - astfel, mici modificări ale diametrului au efecte mari.'
    }
  },
  'hd3': {
    ro: {
      question: 'Unde se găsește cea mai mare rezistență vasculară în circulația sistemică?',
      options: [
        'În aortă',
        'În capilare',
        'În arteriole',
        'În vene',
        'În vena cavă'
      ],
      explanation: 'Arteriolele contribuie cel mai mult la rezistența vasculară totală datorită diametrului lor mic și capacității de vasoconstricție/vasodilatație, servind ca "robinete de rezistență".'
    }
  },
  'hd4': {
    ro: {
      question: 'Ce este fluxul laminar versus turbulent?',
      options: [
        'Fluxul laminar este haotic; fluxul turbulent este ordonat',
        'Fluxul laminar este ordonat în straturi; fluxul turbulent este haotic și poate produce sufluri',
        'Ambele sunt identice',
        'Fluxul turbulent apare doar în vene',
        'Fluxul laminar nu există niciodată'
      ],
      explanation: 'Fluxul laminar este ordonat și silențios, cu straturi de sânge care se mișcă paralel. Fluxul turbulent este dezordonat, apare la viteze mari sau îngustări, și poate produce sufluri audibile.'
    }
  },
  'hd5': {
    ro: {
      question: 'Ce este numărul Reynolds și ce indică despre fluxul sanguin?',
      options: [
        'Măsoară temperatura sângelui',
        'Raportul dintre forțele inerciale și cele viscoase; valori înalte indică flux turbulent',
        'Numărul de celule roșii din sânge',
        'Presiunea din aortă',
        'Frecvența cardiacă'
      ],
      explanation: 'Numărul Reynolds este un număr adimensional care prevede turbulența; când este >2000-2500, fluxul devine turbulent datorită vitezei mari, razei mari sau vâscozității scăzute.'
    }
  },
  'hd6': {
    ro: {
      question: 'De ce viteza fluxului sanguin este cea mai lentă în capilare în ciuda diametrului lor mic?',
      options: [
        'Capilarele au rezistența cea mai mare',
        'Aria transversală totală a tuturor capilarelor combinate este cea mai mare, reducând viteza',
        'Inima pompează mai încet către capilare',
        'Capilarele au valve',
        'Sângele se oprește în capilare'
      ],
      explanation: 'Deși fiecare capilar este îngust, aria transversală totală a tuturor capilarelor din organism este enormă, reducând viteza conform principiului continuității (Q = A × v).'
    }
  }
};
