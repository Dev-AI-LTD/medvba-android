import type { Question } from './questions';

export const clavicleQuestions: Question[] = [
  {
    id: 'cl1',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which description BEST characterizes the general shape and orientation of the clavicle?',
    options: [
      'A straight vertical bone connecting the scapula to the vertebral column',
      'A horizontally oriented, S-shaped long bone that acts as a strut between the sternum and scapula',
      'A flat triangular bone forming the posterior thoracic wall',
      'A short irregular bone embedded in a tendon',
      'A purely cartilaginous structure without ossification'
    ],
    correctAnswer: 1,
    explanation:
      'The clavicle is a horizontally oriented, S-shaped long bone that serves as an osseous strut between the sternum and scapula, keeping the upper limb away from the thorax.[web:405][web:406][web:408]'
  },
  {
    id: 'cl2',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'The medial two-thirds of the clavicular shaft are typically:',
    options: [
      'Concave anteriorly and flattened',
      'Convex anteriorly and more robust',
      'Convex posteriorly and thin',
      'Completely straight with no curvature',
      'Concave superiorly only'
    ],
    correctAnswer: 1,
    explanation:
      'When viewed from above, the medial two-thirds of the clavicle are convex anteriorly, while the lateral third is concave anteriorly, giving the bone its characteristic S-shape.[web:405][web:408][web:411]'
  },
  {
    id: 'cl3',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which surface and border of the lateral clavicle give attachment to the deltoid and trapezius muscles, respectively?',
    options: [
      'Deltoid to posterior border; trapezius to anterior border',
      'Deltoid to superior surface; trapezius to inferior surface',
      'Deltoid to anterior border; trapezius to posterior border',
      'Deltoid to inferior surface; trapezius to superior surface only',
      'Both muscles attach to the sternal end only'
    ],
    correctAnswer: 2,
    explanation:
      'On the lateral third of the clavicle, the anterior border provides origin to the deltoid muscle, while the posterior border serves as an insertion site for the trapezius muscle.[web:404][web:406][web:416]'
  },
  {
    id: 'cl4',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which prominent features on the inferior surface of the clavicle are important for ligamentous attachments connecting it to the first rib and scapula?',
    options: [
      'Spine and glenoid fossa',
      'Conoid tubercle and trapezoid line, and costal tuberosity',
      'Coracoid process and acromion',
      'Deltoid tuberosity and radial groove',
      'Linea aspera and intercondylar fossa'
    ],
    correctAnswer: 1,
    explanation:
      'The inferior surface shows the costal tuberosity for the costoclavicular ligament medially and the conoid tubercle with trapezoid line laterally for the coracoclavicular ligaments (conoid and trapezoid).[web:404][web:406][web:408]'
  },
  {
    id: 'cl5',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which joints does the clavicle directly participate in?',
    options: [
      'Glenohumeral and scapulothoracic joints',
      'Sternoclavicular and acromioclavicular joints',
      'Costovertebral and manubriosternal joints',
      'Only the acromioclavicular joint',
      'Only the sternocostal joint'
    ],
    correctAnswer: 1,
    explanation:
      'The clavicle articulates medially with the manubrium of the sternum at the sternoclavicular joint and laterally with the acromion of the scapula at the acromioclavicular joint.[web:405][web:409][web:418]'
  },
  {
    id: 'cl6',
    category: 'upper-lower-limbs',
    difficulty: 'hard',
    question: 'Which group lists the main muscles attached to the medial third of the clavicle?',
    options: [
      'Deltoid and trapezius',
      'Pectoralis minor, teres major and latissimus dorsi',
      'Sternocleidomastoid, pectoralis major and sternohyoid/subclavius',
      'Supraspinatus and infraspinatus',
      'Biceps brachii and coracobrachialis'
    ],
    correctAnswer: 2,
    explanation:
      'The medial portion of the clavicle provides attachments for the sternocleidomastoid (superior/posterior), pectoralis major (anterior) and sternohyoid and subclavius on/inferiorly.[web:406][web:407][web:413]'
  },
  {
    id: 'cl7',
    category: 'upper-lower-limbs',
    difficulty: 'hard',
    question: 'Which statement BEST summarizes the ossification pattern of the clavicle?',
    options: [
      'It is the last bone to begin ossification and the first to complete it',
      'It ossifies entirely by endochondral ossification from a single center',
      'It is the first bone to begin ossification in utero, with both intramembranous and endochondral components, and one of the last to complete epiphyseal fusion',
      'It never develops a secondary ossification center',
      'It ossifies only after birth'
    ],
    correctAnswer: 2,
    explanation:
      'The clavicle begins ossifying early via two primary intramembranous centers in the shaft and later develops an endochondral center at the sternal end, with fusion completing in early adulthood.[web:408][web:411][web:414]'
  }
];

export const humerusQuestions: Question[] = [
  {
    id: 'hu1',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which segments are classically described in the humerus?',
    options: [
      'Head and shaft only',
      'Proximal end, shaft and distal end',
      'Only shaft and distal epiphysis',
      'Only proximal epiphysis and shaft',
      'Neck and condyles only'
    ],
    correctAnswer: 1,
    explanation:
      'The humerus is divided into a proximal end (head, necks, tubercles), a shaft and a distal end (condyles and epicondyles).[web:434][web:435][web:437]'
  },
  {
    id: 'hu2',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which structure of the proximal humerus articulates with the glenoid cavity of the scapula?',
    options: [
      'Greater tubercle',
      'Lesser tubercle',
      'Head of the humerus',
      'Anatomical neck',
      'Surgical neck'
    ],
    correctAnswer: 2,
    explanation:
      'The smooth, hemispherical head of the humerus articulates with the glenoid cavity of the scapula to form the glenohumeral joint.[web:434][web:436][web:443]'
  },
  {
    id: 'hu3',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which statement BEST distinguishes the anatomical neck from the surgical neck of the humerus?',
    options: [
      'The anatomical neck lies between the head and tubercles; the surgical neck lies distal to the tubercles and is a common fracture site',
      'The anatomical neck is distal to the deltoid tuberosity; the surgical neck is proximal to the head',
      'Both terms refer to the same constricted region',
      'The surgical neck is part of the distal humerus only',
      'The anatomical neck is only present in children'
    ],
    correctAnswer: 0,
    explanation:
      'The anatomical neck surrounds the head, separating it from the tubercles, while the surgical neck is the more distal narrowing below the tubercles, frequently fractured.[web:435][web:438][web:443]'
  },
  {
    id: 'hu4',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which surface feature on the lateral shaft of the humerus serves as the insertion site of the deltoid muscle?',
    options: [
      'Greater tubercle',
      'Lesser tubercle',
      'Deltoid tuberosity',
      'Radial groove',
      'Medial supracondylar ridge'
    ],
    correctAnswer: 2,
    explanation:
      'The deltoid tuberosity is a roughened, triangular elevation on the lateral aspect of the humeral shaft where the deltoid muscle inserts.[web:435][web:436][web:441]'
  },
  {
    id: 'hu5',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'The radial groove (spiral groove) on the posterior humerus is clinically important because it transmits which neurovascular structures?',
    options: [
      'Axillary nerve and posterior circumflex humeral artery',
      'Radial nerve and deep brachial (profunda brachii) artery',
      'Median nerve and brachial artery',
      'Ulnar nerve and superior ulnar collateral artery',
      'Musculocutaneous nerve and radial artery'
    ],
    correctAnswer: 1,
    explanation:
      'The radial groove on the posterior humeral shaft carries the radial nerve and the deep brachial artery, making them vulnerable in midshaft fractures.[web:435][web:436][web:441]'
  },
  {
    id: 'hu6',
    category: 'upper-lower-limbs',
    difficulty: 'hard',
    question: 'Which nerve is MOST at risk in a fracture of the surgical neck of the humerus?',
    options: [
      'Radial nerve',
      'Median nerve',
      'Ulnar nerve',
      'Axillary nerve',
      'Musculocutaneous nerve'
    ],
    correctAnswer: 3,
    explanation:
      'The axillary nerve and posterior circumflex humeral artery wind around the surgical neck of the humerus and are threatened in fractures at this level.[web:435][web:441][web:446]'
  },
  {
    id: 'hu7',
    category: 'upper-lower-limbs',
    difficulty: 'hard',
    question: 'Which nerve is MOST commonly injured in association with a midshaft (diaphyseal) humeral fracture involving the radial groove?',
    options: [
      'Axillary nerve',
      'Radial nerve',
      'Median nerve',
      'Ulnar nerve',
      'Long thoracic nerve'
    ],
    correctAnswer: 1,
    explanation:
      'Midshaft humeral fractures can damage the radial nerve as it travels in the radial groove, leading to wrist drop and sensory deficits on the dorsum of the hand.[web:435][web:442][web:445]'
  }
];

export const radiusAndUlnaQuestions: Question[] = [
  {
    id: 'ru1',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which statement BEST describes the relative position of the radius and ulna in the anatomical position?',
    options: [
      'Radius is medial and ulna is lateral in the forearm',
      'Radius is lateral and ulna is medial in the forearm',
      'Both bones lie directly anterior to each other',
      'Both bones lie directly posterior to each other',
      'Radius lies entirely proximal to the ulna'
    ],
    correctAnswer: 1,
    explanation:
      'In the anatomical position, the radius is located on the lateral (thumb) side of the forearm, while the ulna lies medially.[web:448][web:449][web:451]'
  },
  {
    id: 'ru2',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which description correctly contrasts the proximal and distal ends of the radius and ulna?',
    options: [
      'Radius has a large proximal end and small distal end; ulna has a small proximal end and broad distal end',
      'Radius has a small proximal end and broad distal end; ulna has a large proximal end and small distal end',
      'Both bones have identical proximal and distal dimensions',
      'Both have broad proximal ends and narrow distal ends',
      'Both have narrow proximal ends and broad distal ends'
    ],
    correctAnswer: 1,
    explanation:
      'The radius is smaller proximally (head, neck) and broad distally at the wrist, whereas the ulna is large proximally (olecranon, trochlear notch) and tapers distally.[web:448][web:452][web:456]'
  },
  {
    id: 'ru3',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which landmarks are found at the proximal end of the radius?',
    options: [
      'Olecranon, coronoid process and trochlear notch',
      'Head, neck and radial tuberosity',
      'Styloid process and Lister\'s tubercle',
      'Ulnar notch and radial styloid process',
      'Capitulum and trochlea'
    ],
    correctAnswer: 1,
    explanation:
      'The proximal radius consists of the disc-shaped head, a narrow neck and the radial tuberosity, which serves as the insertion for the biceps brachii tendon.[web:449][web:455][web:458]'
  },
  {
    id: 'ru4',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which structure on the distal radius articulates with the carpal bones to form part of the wrist joint?',
    options: [
      'Radial tuberosity',
      'Radial head',
      'Distal articular surface for scaphoid and lunate',
      'Ulnar notch',
      'Coronoid process'
    ],
    correctAnswer: 2,
    explanation:
      'The distal articular surface of the radius articulates laterally with the scaphoid and medially with the lunate, forming the radiocarpal joint.[web:451][web:452][web:461]'
  },
  {
    id: 'ru5',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which landmarks characterize the proximal ulna at the elbow joint?',
    options: [
      'Head of ulna and styloid process',
      'Radial head and radial notch',
      'Olecranon, coronoid process and trochlear notch',
      'Ulnar notch and dorsal tubercle',
      'Capitulum and trochlea'
    ],
    correctAnswer: 2,
    explanation:
      'The proximal ulna features the olecranon and coronoid process, which together form the trochlear notch that articulates with the trochlea of the humerus at the elbow.[web:448][web:453][web:456]'
  },
  {
    id: 'ru6',
    category: 'upper-lower-limbs',
    difficulty: 'hard',
    question: 'Which paired eponymous fracture patterns involve combined injury of radius/ulna and dislocation at a radioulnar joint?',
    options: [
      'Colles and Smith fractures',
      'Monteggia fracture (proximal ulna fracture with radial head dislocation) and Galeazzi fracture (distal radial fracture with distal radioulnar joint dislocation)',
      'Pott and Jones fractures',
      'Greenstick and torus fractures',
      'Supracondylar and intercondylar fractures'
    ],
    correctAnswer: 1,
    explanation:
      'A Monteggia fracture consists of a proximal ulna fracture with dislocation of the radial head, while a Galeazzi fracture involves a distal radial shaft fracture with dislocation of the distal radioulnar joint.[web:448][web:454][web:457]'
  },
  {
    id: 'ru7',
    category: 'upper-lower-limbs',
    difficulty: 'hard',
    question: 'What is the functional significance of the interosseous membrane between radius and ulna?',
    options: [
      'It prevents pronation and supination of the forearm',
      'It transmits forces from the ulna to the radius and provides additional surface area for muscle attachments while stabilizing the two bones',
      'It forms the articular surface for the humerus',
      'It houses the radial nerve within its substance',
      'It separates flexor and extensor muscles completely'
    ],
    correctAnswer: 1,
    explanation:
      'The interosseous membrane binds radius and ulna, distributes loads (especially from the hand to the ulna via the radius) and offers attachment for deep forearm muscles.[web:448][web:454][web:458]'
  }
];

export const carpalBonesQuestions: Question[] = [
  {
    id: 'carp1',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'How many carpal bones are present in one wrist and how are they arranged?',
    options: [
      'Six carpal bones arranged in one row',
      'Seven carpal bones arranged in a single arch',
      'Eight carpal bones arranged in two rows of four',
      'Nine carpal bones arranged in three rows of three',
      'Ten carpal bones arranged randomly'
    ],
    correctAnswer: 2,
    explanation:
      'Each wrist contains eight carpal bones organized into a proximal and a distal row, each containing four bones.[web:463][web:465][web:467]'
  },
  {
    id: 'carp2',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which list correctly names the carpal bones of the proximal row from lateral (radial) to medial (ulnar)?',
    options: [
      'Trapezium, trapezoid, capitate, hamate',
      'Scaphoid, lunate, triquetrum, pisiform',
      'Scaphoid, lunate, capitate, hamate',
      'Pisiform, triquetrum, lunate, scaphoid',
      'Hamate, capitate, trapezoid, trapezium'
    ],
    correctAnswer: 1,
    explanation:
      'The proximal row of carpals from radial to ulnar side is: scaphoid, lunate, triquetrum and pisiform.[web:463][web:464][web:470]'
  },
  {
    id: 'carp3',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which carpal bone is MOST commonly fractured and lies in the floor of the anatomical snuffbox?',
    options: [
      'Lunate',
      'Pisiform',
      'Scaphoid',
      'Hamate',
      'Capitate'
    ],
    correctAnswer: 2,
    explanation:
      'The scaphoid is the most frequently fractured carpal bone and forms part of the floor of the anatomical snuffbox.[web:463][web:469][web:472]'
  },
  {
    id: 'carp4',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which carpal bones directly articulate with the distal radius at the radiocarpal (wrist) joint?',
    options: [
      'Scaphoid and lunate',
      'Lunate and triquetrum only',
      'All four bones of the proximal row',
      'Trapezium and trapezoid',
      'Capitate and hamate'
    ],
    correctAnswer: 0,
    explanation:
      'The radiocarpal joint is formed mainly between the distal radius and the scaphoid and lunate; the triquetrum may articulate via an articular disc on the ulnar side.[web:465][web:467][web:470]'
  },
  {
    id: 'carp5',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which carpal bone has a prominent hook (hamulus) on its palmar surface that helps form the ulnar border of the carpal tunnel?',
    options: [
      'Trapezium',
      'Capitate',
      'Hamate',
      'Pisiform',
      'Scaphoid'
    ],
    correctAnswer: 2,
    explanation:
      'The hamate possesses a palmar projection known as the hook of hamate, which contributes to the medial boundary of the carpal tunnel and Guyon\'s canal.[web:463][web:468][web:470]'
  },
  {
    id: 'carp6',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which carpal bone is a sesamoid bone in the tendon of flexor carpi ulnaris and articulates primarily with the triquetrum?',
    options: [
      'Pisiform',
      'Lunate',
      'Capitate',
      'Trapezoid',
      'Scaphoid'
    ],
    correctAnswer: 0,
    explanation:
      'The pisiform is a pea-shaped sesamoid bone embedded in the tendon of flexor carpi ulnaris and articulates with the palmar surface of the triquetrum.[web:463][web:467][web:468]'
  },
  {
    id: 'carp7',
    category: 'upper-lower-limbs',
    difficulty: 'hard',
    question: 'Which carpal bone articulates with the first metacarpal to form the saddle joint responsible for thumb opposition?',
    options: [
      'Trapezoid',
      'Trapezium',
      'Capitate',
      'Hamate',
      'Scaphoid'
    ],
    correctAnswer: 1,
    explanation:
      'The trapezium articulates with the base of the first metacarpal forming a saddle-type carpometacarpal joint, essential for thumb opposition.[web:463][web:465][web:470]'
  }
];

export const hipBoneQuestions: Question[] = [
  {
    id: 'hip1',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which bones fuse to form a single hip bone (os coxae) in the adult?',
    options: [
      'Ilium, sacrum and coccyx',
      'Ilium, ischium and pubis',
      'Sacrum, coccyx and pubis',
      'Femur, ilium and ischium',
      'Ischium, pubis and sacrum'
    ],
    correctAnswer: 1,
    explanation:
      'Each hip bone develops from three parts—ilium, ischium and pubis—which are initially separated by triradiate cartilage and later fuse to form the os coxae.[web:478][web:479][web:496]'
  },
  {
    id: 'hip2',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which landmark on the lateral surface of the hip bone articulates with the head of the femur?',
    options: [
      'Obturator foramen',
      'Iliac fossa',
      'Acetabulum',
      'Greater sciatic notch',
      'Auricular surface'
    ],
    correctAnswer: 2,
    explanation:
      'The acetabulum is a deep, cup-shaped cavity on the lateral hip bone that receives the head of the femur to form the hip joint.[web:479][web:493][web:496]'
  },
  {
    id: 'hip3',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which component of the hip bone forms the most superior part and contributes to the iliac crest and iliac fossa?',
    options: [
      'Ilium',
      'Ischium',
      'Pubis',
      'Sacrum',
      'Coccyx'
    ],
    correctAnswer: 0,
    explanation:
      'The ilium is the broad, superior part of the hip bone, forming the iliac crest and housing the iliac fossa on its medial surface.[web:479][web:491][web:500]'
  },
  {
    id: 'hip4',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which set correctly pairs prominent iliac spines with their usual surface landmarks?',
    options: [
      'ASIS and PSIS both lie on the medial surface of the ilium',
      'ASIS is a palpable anterior projection at the end of the iliac crest; PSIS lies posteriorly and corresponds to skin dimples over the sacroiliac region',
      'PSIS lies anteriorly near the pubic crest, while ASIS lies posteriorly near the sacrum',
      'AIIS and PIIS form the iliac crest',
      'Only PSIS is part of the iliac crest'
    ],
    correctAnswer: 1,
    explanation:
      'The anterior superior iliac spine (ASIS) marks the anterior end of the iliac crest and is easily palpable; the posterior superior iliac spine (PSIS) marks the posterior end and produces characteristic dimples over the sacroiliac area.[web:493][web:497][web:500]'
  },
  {
    id: 'hip5',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which description BEST characterizes the obturator foramen of the hip bone?',
    options: [
      'An opening between ilium and sacrum transmitting the femoral nerve',
      'A large anteroinferior opening bounded by ischium and pubis, largely closed by a membrane',
      'A notch on the posterior ilium for passage of the sciatic nerve',
      'A canal within the pubic symphysis',
      'A foramen between ilium and femur'
    ],
    correctAnswer: 1,
    explanation:
      'The obturator foramen is a large opening anteroinferior to the acetabulum, bounded by ischium and pubis and mostly covered by the obturator membrane, leaving a small canal for the obturator vessels and nerve.[web:479][web:493][web:496]'
  },
  {
    id: 'hip6',
    category: 'upper-lower-limbs',
    difficulty: 'hard',
    question: 'Which bone contributions to the acetabulum are MOST accurate?',
    options: [
      'Ilium forms the entire acetabulum',
      'Ischium forms the entire acetabulum',
      'Pubis forms the entire acetabulum',
      'Ilium forms the superior part, ischium the posteroinferior part and pubis the anteroinferior part of the acetabulum',
      'Sacrum and coccyx form the posterior half of the acetabulum'
    ],
    correctAnswer: 3,
    explanation:
      'The acetabulum is formed by all three hip-bone components: ilium superiorly, ischium posteroinferiorly and pubis anteroinferiorly.[web:493][web:500][web:501]'
  },
  {
    id: 'hip7',
    category: 'upper-lower-limbs',
    difficulty: 'hard',
    question: 'Which landmarks are correctly matched with the part of the hip bone that bears them?',
    options: [
      'Ischial spine and ischial tuberosity – ilium',
      'Pubic crest and pubic tubercle – pubis',
      'Auricular surface for sacrum – pubis',
      'Greater sciatic notch – pubis only',
      'Iliac fossa – ischium'
    ],
    correctAnswer: 1,
    explanation:
      'The pubis bears the body, pubic crest, pubic tubercle and superior/inferior rami; the ischium bears the ischial spine and tuberosity, while the ilium bears the iliac crest, iliac fossa and auricular surface.[web:478][web:491][web:502]'
  }
];

export const femurQuestions: Question[] = [
  {
    id: 'fe1',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which statement BEST describes the femur?',
    options: [
      'A short bone that forms part of the pelvis',
      'A flat bone forming the posterior abdominal wall',
      'The only bone of the thigh and the longest, strongest bone in the body',
      'One of two parallel bones in the leg below the knee',
      'A sesamoid bone embedded in the quadriceps tendon'
    ],
    correctAnswer: 2,
    explanation:
      'The femur is the single bone of the thigh and is the longest and strongest bone of the human skeleton.[web:492][web:508][web:511]'
  },
  {
    id: 'fe2',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which structures are found at the proximal end of the femur?',
    options: [
      'Medial and lateral condyles, intercondylar fossa and patellar surface',
      'Head, neck, greater trochanter and lesser trochanter',
      'Tibial plateau and intercondylar eminence',
      'Medial and lateral malleoli',
      'Fibular head and styloid process'
    ],
    correctAnswer: 1,
    explanation:
      'The proximal femur consists of the head, neck and the greater and lesser trochanters, which serve as major muscle attachment sites.[web:483][web:486][web:505]'
  },
  {
    id: 'fe3',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which statement correctly describes the femoral neck and its relationship to the shaft?',
    options: [
      'The neck is aligned directly in line with the shaft at 180 degrees',
      'The neck is angled superolaterally from the shaft at about 90 degrees',
      'The neck is angled superomedially from the shaft, forming an angle of roughly 120–135 degrees in adults',
      'The neck lies completely horizontal with no angle relative to the shaft',
      'The neck is only present in children and fuses in adults'
    ],
    correctAnswer: 2,
    explanation:
      'The femoral neck projects superomedially from the shaft, creating an angle of inclination of approximately 120–135 degrees in adults, optimizing load transmission.[web:483][web:492][web:505]'
  },
  {
    id: 'fe4',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which feature on the posterior aspect of the femoral shaft serves as a major ridge for muscle attachment?',
    options: [
      'Intertrochanteric line',
      'Trochanteric fossa',
      'Linea aspera',
      'Patellar surface',
      'Intercondylar fossa'
    ],
    correctAnswer: 2,
    explanation:
      'The linea aspera is a prominent longitudinal ridge on the posterior femoral shaft providing attachment for several thigh muscles.[web:483][web:506][web:512]'
  },
  {
    id: 'fe5',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which structures form the distal articular end of the femur at the knee joint?',
    options: [
      'Medial and lateral malleoli and tibial plateau',
      'Medial and lateral condyles, intercondylar fossa and patellar surface',
      'Head, neck and trochanters',
      'Acetabulum and fovea capitis',
      'Tibial tuberosity and intercondylar eminence'
    ],
    correctAnswer: 1,
    explanation:
      'The distal femur features medial and lateral condyles separated posteriorly by the intercondylar fossa and anteriorly by the patellar surface, articulating with tibia and patella.[web:483][web:492][web:505]'
  },
  {
    id: 'fe6',
    category: 'upper-lower-limbs',
    difficulty: 'hard',
    question: 'Which region of the femur is at greatest risk for avascular necrosis after fracture and why?',
    options: [
      'Midshaft, because it has the poorest muscular coverage',
      'Distal condyles, because they lack collateral blood supply',
      'Intertrochanteric region, because it receives no arterial branches',
      'Femoral neck, because fracture can disrupt retinacular vessels from the medial femoral circumflex artery supplying the head',
      'Linea aspera, because no nutrient arteries enter the shaft there'
    ],
    correctAnswer: 3,
    explanation:
      'Intracapsular femoral neck fractures can disrupt retinacular branches of the medial femoral circumflex artery, endangering femoral head vascularity and predisposing to avascular necrosis.[web:486][web:505][web:514]'
  },
  {
    id: 'fe7',
    category: 'upper-lower-limbs',
    difficulty: 'hard',
    question: 'Which combination correctly matches major trochanteric landmarks with their relative positions?',
    options: [
      'Greater trochanter is posteromedial; lesser trochanter is anterolateral',
      'Greater trochanter is large and lateral; lesser trochanter is smaller and posteromedial',
      'Both trochanters are located on the medial side of the femur',
      'Greater trochanter is distal to the condyles; lesser trochanter is at the distal femoral shaft',
      'Both trochanters lie on the anterior surface of the femur'
    ],
    correctAnswer: 1,
    explanation:
      'The greater trochanter is a large, lateral projection, while the lesser trochanter is a smaller, posteromedial prominence at the junction of the neck and shaft.[web:483][web:509][web:515]'
  }
];

export const patellaQuestions: Question[] = [
  {
    id: 'pa1',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'The patella is best classified as which type of bone?',
    options: [
      'Long bone',
      'Short bone',
      'Flat bone',
      'Sesamoid bone',
      'Irregular bone'
    ],
    correctAnswer: 3,
    explanation: 'The patella is the largest sesamoid bone, embedded within the tendon of the quadriceps femoris.',
  },
  {
    id: 'pa2',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which surface of the patella is articular and participates in the knee joint?',
    options: [
      'Anterior surface',
      'Posterior surface',
      'Superior border',
      'Inferior border (apex)',
      'Medial border'
    ],
    correctAnswer: 1,
    explanation: 'The posterior surface of the patella is covered with articular cartilage and articulates with the femoral trochlear surface.',
  },
  {
    id: 'pa3',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'The apex of the patella is directed:',
    options: [
      'Superiorly and laterally',
      'Superiorly and medially',
      'Inferiorly',
      'Posteriorly',
      'Directly anteriorly'
    ],
    correctAnswer: 2,
    explanation: 'The pointed apex of the patella is directed inferiorly and gives attachment to the patellar ligament.',
  },
  {
    id: 'pa4',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'The patellar ligament connects the apex of the patella to which structure?',
    options: [
      'Tibial tuberosity',
      'Medial epicondyle of the femur',
      'Head of the fibula',
      'Anterior superior iliac spine',
      'Intercondylar eminence'
    ],
    correctAnswer: 0,
    explanation: 'The patellar ligament extends from the apex of the patella to the tibial tuberosity, transmitting quadriceps force to the tibia.',
  },
  {
    id: 'pa5',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'The main function of the patella in the extensor mechanism is to:',
    options: [
      'Decrease the leverage of the quadriceps muscle',
      'Increase the mechanical advantage of the quadriceps tendon',
      'Prevent flexion of the knee',
      'Act as a shock absorber only',
      'Limit rotation of the tibia'
    ],
    correctAnswer: 1,
    explanation: 'By increasing the angle of pull of the quadriceps tendon, the patella improves the leverage and efficiency of knee extension.',
  }
];

export const tibiaQuestions: Question[] = [
  {
    id: 'ti1',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'The tibia is located on which side of the leg in the anatomical position?',
    options: [
      'Lateral side, in line with the little toe',
      'Medial side, in line with the great toe',
      'Posterior side only',
      'Anterior side only',
      'Central between femur and fibula'
    ],
    correctAnswer: 1,
    explanation: 'The tibia forms the medial side of the leg and is aligned with the great toe.',
  },
  {
    id: 'ti2',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which statement best describes the role of the tibia?',
    options: [
      'Non–weight-bearing bone for muscle attachment only',
      'Main weight-bearing bone between the femur and talus',
      'Bone solely forming the lateral malleolus',
      'Small sesamoid bone in the knee',
      'Bone that articulates only with fibula and patella'
    ],
    correctAnswer: 1,
    explanation: 'The tibia is the main weight-bearing bone of the leg, transmitting forces from the femur to the talus.',
  },
  {
    id: 'ti3',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which structures are located at the proximal end of the tibia?',
    options: [
      'Medial and lateral malleoli',
      'Medial and lateral condyles',
      'Greater and lesser trochanters',
      'Head and neck',
      'Navicular and cuboid facets'
    ],
    correctAnswer: 1,
    explanation: 'The proximal tibia has medial and lateral condyles that articulate with the femoral condyles at the knee joint.',
  }
];

export const fibulaQuestions: Question[] = [
  {
    id: 'fi1',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'The fibula is located on which side of the leg in the anatomical position?',
    options: [
      'Medial side, in line with the great toe',
      'Lateral side, in line with the little toe',
      'Anterior midline',
      'Posterior midline',
      'Centrally between tibia and talus'
    ],
    correctAnswer: 1,
    explanation: 'The fibula lies laterally in the leg, along the little-toe side.',
  },
  {
    id: 'fi2',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which best describes the main functional role of the fibula?',
    options: [
      'Primary weight-bearing bone of the leg',
      'Main bone articulating with the femur',
      'Provides muscle attachment and forms the lateral malleolus',
      'Carries the body weight from tibia to talus',
      'Forms the articular surface for the patella'
    ],
    correctAnswer: 2,
    explanation: 'The fibula is not a primary weight-bearing bone; it provides muscle attachments and forms the lateral malleolus at the ankle.',
  }
];

export const tibiaFibulaQuestions: Question[] = [
  {
    id: 'tf1',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which statement BEST describes the relative positions and roles of the tibia and fibula in the leg?',
    options: [
      'Tibia is lateral and primarily for muscle attachment; fibula is medial and weight-bearing',
      'Tibia is medial and the main weight-bearing bone; fibula is lateral and mainly for muscle attachment and ankle stability',
      'Both bones are equal weight-bearing and lie side by side without functional differences',
      'Fibula is medial and forms the knee joint; tibia is lateral and forms only the ankle joint',
      'Tibia and fibula fuse distally to form a single bone'
    ],
    correctAnswer: 1,
    explanation:
      'The tibia is the medial, larger, primary weight-bearing bone of the leg, while the fibula is lateral, slender and mainly provides muscle attachment and lateral ankle stability.[web:516][web:517][web:524]'
  },
  {
    id: 'tf2',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which structures form the proximal articular surface of the tibia at the knee joint?',
    options: [
      'Medial and lateral malleoli',
      'Tibial tuberosity and intercondylar eminence',
      'Medial and lateral condyles forming the tibial plateau',
      'Fibular head and tibial plafond',
      'Medial condyle and medial malleolus'
    ],
    correctAnswer: 2,
    explanation:
      'The proximal tibia has medial and lateral condyles that form the tibial plateau, articulating with the corresponding femoral condyles at the knee.[web:516][web:518][web:520]'
  },
  {
    id: 'tf3',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which landmark on the anterior proximal tibia serves as the insertion for the patellar ligament?',
    options: [
      'Intercondylar eminence',
      'Tibial tuberosity',
      'Medial malleolus',
      'Fibular notch',
      "Gerdy's tubercle"
    ],
    correctAnswer: 1,
    explanation:
      'The tibial tuberosity is a prominent anterior bony projection just distal to the condyles where the patellar ligament inserts.[web:516][web:519][web:523]'
  },
  {
    id: 'tf4',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which features characterize the distal tibia at the ankle (talocrural) joint?',
    options: [
      'Head of tibia and lateral malleolus',
      'Distal articular surface (plafond) and medial malleolus, with a fibular notch laterally',
      'Distal articular surface and lateral malleolus',
      'Only the medial malleolus with no articular surface',
      'Intercondylar eminence and tibial tuberosity'
    ],
    correctAnswer: 1,
    explanation:
      'The distal tibia forms the tibial plafond (articular surface for the talus), bears the medial malleolus and has a lateral fibular notch for the distal tibiofibular joint.[web:517][web:520][web:523]'
  },
  {
    id: 'tf5',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which landmarks are found at the proximal end of the fibula?',
    options: [
      'Lateral malleolus and fibular notch',
      'Head of fibula and neck of fibula',
      'Medial malleolus and tibial tuberosity',
      'Intercondylar eminence and tibial plateau',
      'Base and head of fibula forming the knee joint surface'
    ],
    correctAnswer: 1,
    explanation:
      'The proximal fibula consists of the head and a narrow neck; the head articulates with the lateral condyle of the tibia at the superior tibiofibular joint.[web:524][web:529][web:530]'
  },
  {
    id: 'tf6',
    category: 'upper-lower-limbs',
    difficulty: 'hard',
    question: 'Which statement BEST describes the lateral malleolus of the fibula?',
    options: [
      'It is the main weight-bearing surface of the ankle joint',
      'It lies medial to the tibia and articulates only with the calcaneus',
      'It forms the prominent lateral ankle bone, articulating with the talus and contributing to ankle joint stability',
      'It is purely a muscular attachment site with no articular surfaces',
      'It is part of the knee joint and not related to the ankle'
    ],
    correctAnswer: 2,
    explanation:
      'The distal fibula forms the lateral malleolus, which articulates with the talus and helps stabilize the lateral side of the ankle joint.[web:521][web:524][web:530]'
  },
  {
    id: 'tf7',
    category: 'upper-lower-limbs',
    difficulty: 'hard',
    question: 'What is the functional significance of the interosseous membrane between tibia and fibula?',
    options: [
      'It separates the leg into anterior and posterior compartments only',
      'It allows free rotation between tibia and fibula at rest',
      'It binds the tibia and fibula together, provides additional surface for muscle attachment and helps transmit forces between the bones',
      'It forms the articular surface for the femur',
      'It houses the tibial nerve within its substance'
    ],
    correctAnswer: 2,
    explanation:
      'The interosseous membrane stabilizes the tibia–fibula relationship, offers attachment for deep leg muscles and helps distribute mechanical loads between the bones.[web:520][web:524][web:529]'
  }
];

export const talusQuestions: Question[] = [
  {
    id: 'ta1',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'The talus is primarily responsible for forming articulations between which regions?',
    options: [
      'Femur and tibia',
      'Leg and foot at the ankle and subtalar joints',
      'Tibia and fibula only',
      'Metatarsals and phalanges',
      'Calcaneus and navicular only'
    ],
    correctAnswer: 1,
    explanation: 'The talus forms a link between the leg and foot, participating in the talocrural (ankle), subtalar, and transverse tarsal joints.',
  },
  {
    id: 'ta2',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which part of the talus articulates with the tibia at the ankle (talocrural) joint?',
    options: [
      'Head of the talus',
      'Neck of the talus',
      'Body of the talus with its trochlear surface',
      'Inferior surface with calcaneal facets',
      'Posterior process'
    ],
    correctAnswer: 2,
    explanation: 'The superior trochlear surface of the talar body articulates with the distal tibia (and fibula) to form the ankle joint.',
  }
];

export const calcaneusQuestions: Question[] = [
  {
    id: 'caL1',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'The calcaneus is best described as:',
    options: [
      'The most superior tarsal bone',
      'The largest tarsal bone forming the heel',
      'A sesamoid bone in the Achilles tendon',
      'A small bone of the midfoot arch only',
      'The main bone of the forefoot'
    ],
    correctAnswer: 1,
    explanation: 'The calcaneus is the largest tarsal bone and forms the prominence of the heel, transmitting weight from talus to ground.',
  },
  {
    id: 'caL2',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'The posterior surface of the calcaneus receives the insertion of which tendon?',
    options: [
      'Tibialis anterior tendon',
      'Patellar tendon',
      'Achilles (calcaneal) tendon',
      'Peroneus longus tendon',
      'Flexor hallucis longus tendon'
    ],
    correctAnswer: 2,
    explanation: 'The calcaneal (Achilles) tendon inserts into the posterior tuberosity of the calcaneus.',
  }
];

export const tarsalBonesQuestions: Question[] = [
  {
    id: 'tb1',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'How many tarsal bones are present in one foot and which are they?',
    options: [
      'Six: talus, calcaneus, navicular, cuboid, two cuneiforms',
      'Seven: talus, calcaneus, navicular, cuboid and three cuneiforms',
      'Eight: talus, calcaneus, navicular, cuboid and four cuneiforms',
      'Five: talus, calcaneus, navicular, cuboid and one cuneiform',
      'Four: talus, calcaneus, navicular and cuboid only'
    ],
    correctAnswer: 1,
    explanation:
      'Each foot has seven tarsal bones: talus, calcaneus, navicular, cuboid and three cuneiforms (medial, intermediate and lateral).[web:525][web:531][web:532]'
  },
  {
    id: 'tb2',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which description BEST characterizes the talus?',
    options: [
      'Largest tarsal bone forming the heel',
      'Second-largest tarsal bone that transmits weight from tibia to foot and articulates with tibia, fibula, calcaneus and navicular',
      'Boat-shaped bone on the medial midfoot',
      'Cube-shaped bone on the lateral midfoot',
      'Wedge-shaped bone articulating with metatarsals only'
    ],
    correctAnswer: 1,
    explanation:
      'The talus is the second-largest tarsal bone; it forms the ankle joint with the tibia and fibula and articulates with the calcaneus and navicular, transmitting body weight to the foot.[web:525][web:528][web:541]'
  },
  {
    id: 'tb3',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which tarsal bone forms the heel and is the largest tarsal bone?',
    options: [
      'Talus',
      'Navicular',
      'Cuboid',
      'Calcaneus',
      'Medial cuneiform'
    ],
    correctAnswer: 3,
    explanation:
      'The calcaneus is the largest tarsal bone and forms the heel, articulating with the talus and cuboid and contributing to the longitudinal arches.[web:525][web:533][web:538]'
  },
  {
    id: 'tb4',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which description correctly matches navicular and cuboid bones with their positions?',
    options: [
      'Navicular lateral and cuboid medial in the midfoot',
      'Navicular proximal to talus and medial; cuboid lateral, distal to calcaneus',
      'Navicular distal to metatarsals; cuboid proximal to tibia',
      'Both navicular and cuboid lie in the hindfoot only',
      'Navicular and cuboid are both sesamoid bones'
    ],
    correctAnswer: 1,
    explanation:
      'The navicular lies medially between talus and cuneiforms, while the cuboid is the lateral bone of the distal tarsal row, distal to the calcaneus and proximal to the 4th–5th metatarsals.[web:525][web:532][web:536]'
  },
  {
    id: 'tb5',
    category: 'upper-lower-limbs',
    difficulty: 'medium',
    question: 'Which statement about the cuneiform bones is MOST accurate?',
    options: [
      'There are two cuneiform bones that articulate only with the talus',
      'There are three cuneiform bones (medial, intermediate, lateral) located between the navicular and the bases of the first three metatarsals',
      'The cuneiform bones lie between the calcaneus and cuboid',
      'All cuneiform bones form the lateral longitudinal arch exclusively',
      'The cuneiform bones articulate only with each other'
    ],
    correctAnswer: 1,
    explanation:
      'Three wedge-shaped cuneiform bones (medial, intermediate, lateral) lie between the navicular posteriorly and the bases of the first, second and third metatarsals anteriorly, contributing to medial and transverse arches.[web:525][web:539][web:542]'
  },
  {
    id: 'tb6',
    category: 'upper-lower-limbs',
    difficulty: 'hard',
    question: 'Which articulations define the subtalar (talocalcaneal) joint and its primary function?',
    options: [
      'Between talus and tibia; allows dorsiflexion and plantarflexion',
      'Between calcaneus and cuboid; allows toe flexion',
      'Between talus and calcaneus at multiple facets; permits inversion and eversion of the hindfoot',
      'Between navicular and cuneiforms; allows abduction of toes',
      'Between talus and metatarsals; transmits body weight directly to toes'
    ],
    correctAnswer: 2,
    explanation:
      'The subtalar joint is formed by articulations between talus and calcaneus at anterior, middle and posterior facets and mainly allows inversion and eversion movements of the hindfoot.[web:525][web:535][web:540]'
  },
  {
    id: 'tb7',
    category: 'upper-lower-limbs',
    difficulty: 'hard',
    question: 'Functionally, how do the navicular and cuboid differ in distributing forces through the foot?',
    options: [
      'Navicular transmits forces to lateral metatarsals; cuboid to medial metatarsals',
      'Navicular primarily transmits forces from talus to medial three metatarsals via cuneiforms; cuboid transmits forces from calcaneus to the 4th and 5th metatarsals',
      'Both bones transmit forces only to the talus',
      'Both bones only support the transverse arch',
      'Navicular and cuboid have no role in force transmission'
    ],
    correctAnswer: 1,
    explanation:
      'The navicular relays load from the talus to the cuneiforms and then to the first three metatarsals, while the cuboid relays load from the calcaneus to the 4th and 5th metatarsals.[web:525][web:532][web:534]'
  }
];

export const upperLimbBonesQuestions: Question[] = [
  {
    id: 'ull-001',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which bone is the longest bone in the human body?',
    options: ['Humerus', 'Tibia', 'Femur', 'Fibula'],
    correctAnswer: 2,
    explanation: 'The femur is the longest and strongest bone in the human body, extending from the hip to the knee.',
  },
  {
    id: 'ull-002',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'How many phalanges are in one hand?',
    options: ['10', '12', '14', '16'],
    correctAnswer: 2,
    explanation: 'Each hand has 14 phalanges: 2 in the thumb (proximal and distal) and 3 in each of the other four fingers (proximal, middle, and distal).',
  },
  {
    id: 'ull-003',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which bone forms the heel of the foot?',
    options: ['Talus', 'Calcaneus', 'Cuboid', 'Navicular'],
    correctAnswer: 1,
    explanation: 'The calcaneus is the largest tarsal bone and forms the heel of the foot. It articulates with the talus superiorly and the cuboid anteriorly.',
  },
  {
    id: 'ull-004',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'The patella is commonly known as the:',
    options: ['Elbow bone', 'Kneecap', 'Ankle bone', 'Wrist bone'],
    correctAnswer: 1,
    explanation: 'The patella, or kneecap, is a sesamoid bone embedded in the quadriceps tendon. It protects the knee joint and improves the mechanical advantage of the quadriceps muscle.',
  },
  {
    id: 'ull-005',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question:
      'The lateral end of the clavicle articulates with which structure at the acromioclavicular joint?',
    options: [
      'Manubrium of the sternum',
      'Acromion of the scapula',
      'Coracoid process of the scapula',
      'Greater tubercle of the humerus',
    ],
    correctAnswer: 1,
    explanation:
      'The acromioclavicular joint is formed between the lateral end of the clavicle and the acromion process of the scapula, linking the shoulder girdle to the trunk.',
  },
  {
    id: 'ull-006',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'The radius is located on which side of the forearm?',
    options: ['Medial (ulnar) side', 'Lateral (thumb) side', 'Posterior side', 'Anterior side'],
    correctAnswer: 1,
    explanation: 'The radius is located on the lateral (thumb) side of the forearm. It is shorter than the ulna proximally but wider distally where it articulates with the carpal bones.',
  },
  {
    id: 'ull-007',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'How many carpal bones are in each wrist?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    explanation: 'Each wrist contains 8 carpal bones arranged in two rows: proximal row (scaphoid, lunate, triquetrum, pisiform) and distal row (trapezium, trapezoid, capitate, hamate).',
  },
  {
    id: 'ull-008',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'How many metacarpal bones are typically found in one hand?',
    options: ['4', '5', '6', '8'],
    correctAnswer: 1,
    explanation:
      'The hand has five metacarpals, numbered 1–5 from the thumb side to the little-finger side; each articulates proximally with the carpus and distally with the phalanges of the same ray.',
  },
  {
    id: 'ull-010',
    category: 'upper-lower-limbs',
    difficulty: 'easy',
    question: 'Which bone articulates with the acetabulum to form the hip joint?',
    options: ['Tibia', 'Fibula', 'Femur', 'Patella'],
    correctAnswer: 2,
    explanation: 'The head of the femur articulates with the acetabulum of the pelvis to form the hip joint, a ball-and-socket synovial joint.',
  }
];
