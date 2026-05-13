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
