/**
 * Seed pilot granular topic summaries for Internal Organs (cardiovascular subset).
 * Run: bun run tsx scripts/seed-internal-organs-pilot.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.join(__dirname, "..", "content", "study", "drafts");

type TopicSeed = {
  chapterId: string;
  title: string;
  parentChapterId: string;
  learn: string;
  concepts: string[];
  clinical: string[];
  pitfalls: string[];
  mini: string;
};

const PARENT_MODULE = "med-admission-barrons";
const MODULE_ID = "internal-organs";

function md(seed: TopicSeed): string {
  const concepts = seed.concepts.map((c) => `- ${c}`).join("\n");
  const clinical = seed.clinical.map((c) => `- ${c}`).join("\n");
  const pitfalls = seed.pitfalls.map((c) => `- ${c}`).join("\n");
  return `## Ce înveți în acest capitol

${seed.learn}

## Concepte cheie

${concepts}

## Legături clinice și admitere

${clinical}

## Capcane frecvente la examen

${pitfalls}

## Mini-rezumat

${seed.mini}`;
}

const PILOT: TopicSeed[] = [
  {
    chapterId: "internal-organs-intro",
    title: "Organe Interne - Introducere",
    parentChapterId: "cardiovascular",
    learn:
      "Capitolul introduce organizarea cavităților toracice și abdominale și relația dintre organe, vase și structuri de susținere. Este baza pentru capitolele detaliate despre inimă, plămâni și vase mari.",
    concepts: [
      "**Cavitatea toracică**: conține inima, plămânii, traheea, esofagul toracic și vasele mari.",
      "**Cavitatea abdominală**: organe digestive, splina, rinichii și vasele abdominale.",
      "**Mediastin**: compartiment central între plămâni, împărțit funcțional în anterior, mijlociu și posterior.",
      "**Peritoneu**: membrană seroasă care învelește organele abdominale și formează mezenterul.",
      "**Raporturi anatomice**: poziția unui organ față de vecini este esențială la examen.",
    ],
    clinical: [
      "**Imagistică**: planurile și compartimentele explică localizarea leziunilor pe CT/RX.",
      "**Chirurgie**: inciziile și abordările respectă straturile și lojile anatomice.",
    ],
    pitfalls: [
      "Confuzia între **mediastin** (spațiu) și **pericard** (înveliș al inimii).",
      "Amestecarea cavității abdominale cu pelviană la organe genitale inferioare.",
    ],
    mini:
      "Introducerea stabilește cadrul topografic: torace pentru circulație și respirație, abdomen pentru digestie și vase. Mediastinul și peritoneul organizează raporturile. Aceste repere vor fi folosiți în toate sub-capitolele Organe Interne.",
  },
  {
    chapterId: "heart-external",
    title: "Inima - Anatomie Externă",
    parentChapterId: "cardiovascular",
    learn:
      "Studiezi forma externă a inimii, fețele și marginile cordului, raporturile cu plămânii, diafragmul și vasele mari. Aceste repere permit orientarea la examenul clinic și pe secțiuni imagistice.",
    concepts: [
      "**Formă și orientare**: piramidă ovoidă, bază sus și mare, apex orientat stânga-înainte-jos.",
      "**Fețe**: sternocostală (anterior), diafragmatică (inferioară), pulmonară stângă și dreaptă.",
      "**Marginea stângă**: formată în principal de ventriculul stâng; marginea dreaptă de atriul drept.",
      "**Sulcus coronarian**: șanț între atrii și ventricule; conține vase coronariene.",
      "**Apex cordis**: situat în al 5-lea spațiu intercostal stâng, pe linia medio-claviculară.",
      "**Raporturi**: posterior cu esofag și aortă; lateral cu plămânii; inferior cu diafragm.",
    ],
    clinical: [
      "**Auscultația**: fețele și valvele se corelează cu focarele de ascultare.",
      "**Imagistică toracică**: conturul cardiac și poziția apexului pe radiografie.",
    ],
    pitfalls: [
      "Confuzia **apex** (ventricul stâng) cu **baza** (atrii și vase mari).",
      "Credința că marginea dreaptă este formată de ventriculul drept (predomină atriul drept).",
    ],
    mini:
      "Anatomia externă a inimii oferă repere topografice: apex, baze, fețe și sulcus coronarian. Raporturile cu plămânii și diafragmul explică proiecția clinică. Stăpânește orientarea cordului înainte de camere și valve.",
  },
  {
    chapterId: "heart-vascularization",
    title: "Vascularizația Cordului",
    parentChapterId: "cardiovascular",
    learn:
      "Vascularizația cordului descrie arterele și venele coronariene care hrănesc miocardul. Înțelegi originea, cursul principal și zonele de risc ischemic.",
    concepts: [
      "**Arterele coronariene**: dreaptă (de obicei din sinusul aortic drept) și stângă (din stânga, cu ramuri circumflexă și interventriculară anterioară).",
      "**Dominanță**: dreaptă, stângă sau codominantă — raportul între ramura posterioară și circumflexă.",
      "**Venele cardiace**: mici (în peretele miocardic) și mari (sinus coronarian → atriul drept).",
      "**Sinusul coronarian**: colectează majoritatea sângelui venos coronarian.",
      "**Zone de watershed**: zone limitrofe între teritorii arteriale, vulnerabile la ischemie.",
    ],
    clinical: [
      "**Infarct miocardic**: teritoriul depinde de artera ocluzată (IVA, CX, CD).",
      "**Bypass coronarian**: țintele chirurgicale urmează anatomia coronariană.",
    ],
    pitfalls: [
      "Confuzia **origine arteră coronară stângă** (un singur orificiu sinusal) cu două artere separate.",
      "Amestecarea **venelor pulmonare** (sânge oxigenat spre stânga) cu venele coronariene.",
    ],
    mini:
      "Circulația coronariană asigură perfuzia miocardului prin artere și vene cardiace. Dominanța și ramurile IVA/CX/CD definesc teritoriile ischemice. Sinusul coronarian drenează sângele venos al peretelui.",
  },
  {
    chapterId: "right-atrium",
    title: "Atriul Drept",
    parentChapterId: "cardiovascular",
    learn:
      "Atriul drept primește sângele venos sistemic și îl direcționează spre ventriculul drept. Structurile interne (valvă tricuspidă, creste, orificii venoase) sunt frecvent testate la admitere.",
    concepts: [
      "**Aport venos**: vene cave superioară și inferioară, plus sinus venos coronarian.",
      "**Valva tricuspidă**: la orificiul atrioventricular drept; previne refluxul în atriu.",
      "**Cresta terminală**: separă partea netedă (sinus venarum) de partea rugoasă (auricul).",
      "**Fossa ovalis**: remanent al foramenului oval fetal pe septul interatrial.",
      "**Nodul sinusal**: în peretele atriului drept, lângă deschiderea venei cave superioare.",
    ],
    clinical: [
      "**Fibrilație atrială**: originea frecventă în țesutul atrial drept și stâng.",
      "**Defect sept atrial**: foramen patent sau comunicare prin fossa ovalis.",
    ],
    pitfalls: [
      "Confuzia **sinus venos coronarian** (venă) cu **sinus coronarian** anatomic al inimii.",
      "Localizarea greșită a **nodului sinusal** în atriul stâng.",
    ],
    mini:
      "Atriul drept colectează sângele venos sistemic și îl trimite prin valva tricuspidă. Cresta terminală și fossa ovalis sunt repere septale. Nodul sinusal, în peretele drept, inițiază ritmul cardiac.",
  },
  {
    chapterId: "left-atrium",
    title: "Atriul Stâng",
    parentChapterId: "cardiovascular",
    learn:
      "Atriul stâng primește sângele oxigenat din plămâni și îl trimite spre ventriculul stâng. Anatomia sa internă și raporturile cu venele pulmonare sunt esențiale.",
    concepts: [
      "**Vene pulmonare**: de obicei patru orificii în peretele posterior al atriului stâng.",
      "**Valva mitrală**: controlă fluxul spre ventriculul stâng; are două cuspe.",
      "**Peretele posterior**: subțire, în raport cu esofagul (util la ecografie transesofagiană).",
      "**Auricul stâng**: extensie anterioară; loc frecvent al formațiunii trombotice în fibrilație atrială.",
      "**Septul interatrial**: separă atriile; comunicări patologice pot shunta sânge.",
    ],
    clinical: [
      "**Stenoză mitrală**: dilatare atrială stângă și risc de embolie.",
      "**Ecografie**: măsurarea atriului stâng e prognostic în insuficiență cardiacă.",
    ],
    pitfalls: [
      "Confuzia **numărului venelor pulmonare** (4 orificii tipice, nu 2).",
      "Credința că valva mitrală are trei cuspe (este bicuspă).",
    ],
    mini:
      "Atriul stâng primește sângele oxigenat prin venele pulmonare și îl pasează prin valva mitrală. Peretele posterior și auricul stâng au relevanță clinică în aritmii și embolii.",
  },
  {
    chapterId: "right-ventricle",
    title: "Ventriculul Drept",
    parentChapterId: "cardiovascular",
    learn:
      "Ventriculul drept pompează sângele spre plămâni prin artera pulmonară. Morfologia sa (trabecule, bandă septomarginală, valvă pulmonară) diferențiază partea dreaptă a inimii.",
    concepts: [
      "**Trabecule carnee**: relief muscular intern care ajută evacuarea.",
      "**Bandă septomarginală (moderator)**: conține ramuri din plexul His; leagă septul de perete.",
      "**Valva pulmonară**: la ieșire; trei cuspe semilunare spre trunchiul pulmonar.",
      "**Infundibul pulmonar**: canal de ieșire, muscular, spre artera pulmonară.",
      "**Peretele anterior**: subțire, în raport cu sternul (traume penetrante).",
    ],
    clinical: [
      "**Hipertensiune pulmonară**: hipertrofie și dilatare ventriculară dreaptă.",
      "**Bloc de ramură**: banda septomarginală conține conținut de conducere.",
    ],
    pitfalls: [
      "Confuzia **ventricul drept** cu **atriu drept** la localizarea valvei tricuspide.",
      "Amestecarea **arterei pulmonare** (sânge neoxigenat) cu aorta.",
    ],
    mini:
      "Ventriculul drept evacuează sângele neoxigenat spre plămâni. Trabeculele, banda septomarginală și valva pulmonară sunt repere interne. Peretele anterior subțire îl face vulnerabil la traume.",
  },
  {
    chapterId: "left-ventricle",
    title: "Ventriculul Stâng",
    parentChapterId: "cardiovascular",
    learn:
      "Ventriculul stâng generează presiunea sistemică și pompează sângele în aortă. Peretele gros muscular și valva aortică definesc funcția de pompare sistemică.",
    concepts: [
      "**Perete gros**: adaptat pentru presiuni mari; forma conică spre apex.",
      "**Valva aortică**: trei cuspe semilunare la ieșire; previne refluxul.",
      "**Septul interventricular**: separă ventriculele; partea membranoasă superior.",
      "**Papilare și coarde tendinoase**: fixează cuspele mitrale în sistolă.",
      "**Orificiul aortic**: situat posterior și dreapta față de orificiul mitral.",
    ],
    clinical: [
      "**Infarct anterior**: afectează frecvent peretele ventriculului stâng.",
      "**Insuficiență aortică**: dilatare ventriculară compensatorie.",
    ],
    pitfalls: [
      "Confuzia **grosimii peretelui**: VS mult mai gros decât VD.",
      "Credința că valva aortică are două cuspe (normal tricuspidă).",
    ],
    mini:
      "Ventriculul stâng este camera de pompare sistemică, cu perete gros și valvă aortică. Papilarele și coardele susțin valva mitrală. Septul interventricular îl separă de ventriculul drept.",
  },
  {
    chapterId: "coronary-circulation",
    title: "Circulația Coronariană",
    parentChapterId: "cardiovascular",
    learn:
      "Circulația coronariană descrie fluxul arterial și venos care hrănește miocardul, inclusiv variațiile în timpul ciclului cardiac și factorii care influențează perfuzia.",
    concepts: [
      "**Perfuzie diastolică**: arterele coronariene se umplu în principal în diastolă.",
      "**Autoreglare**: capacitatea de a menține fluxul în limite de presiune perfuzie.",
      "**Metabolism miocardic**: necesar ridicat de oxigen; extragere mare din sânge.",
      "**Colaterale**: se dezvoltă lent în obstrucții cronice.",
      "**Sinusurile aortice**: originea tipică a coronarelor drepte și stângi.",
    ],
    clinical: [
      "**Angină**: dezechilibru între cerință și aport coronarian.",
      "**Tahicardie**: scurtează diastola și poate reduce perfuzia coronariană.",
    ],
    pitfalls: [
      "Confuzia perfuziei coronariene în **sistolă** (predominent diastolică).",
      "Ignorarea **dominanței coronariene** la interpretarea teritoriilor.",
    ],
    mini:
      "Circulația coronariană asigură oxigenarea miocardului, cu umplere diastolică și autoreglare. Originea din sinusurile aortice și rețeaua venoasă cardiacă completează schema. Înțelegerea lor explică ischemia la efort sau tahicardie.",
  },
  {
    chapterId: "pulmonary-circulation",
    title: "Circulația Pulmonară",
    parentChapterId: "cardiovascular",
    learn:
      "Circulația pulmonară transportă sângele neoxigenat de la ventriculul drept la plămâni și înapoi oxigenat la atriul stâng. Presiunile sunt scăzute comparativ cu circulația sistemică.",
    concepts: [
      "**Trunchiul pulmonar**: iese din VD; se bifurcă în artere pulmonare dreaptă și stângă.",
      "**Arteriole pulmonare**: duc sânge neoxigenat spre capilarele alveolare.",
      "**Capilare pulmonare**: locul schimbului gazos.",
      "**Venele pulmonare**: duc sânge oxigenat spre atriul stâng (unică venă cu O₂ ridicat).",
      "**Presiune scăzută**: sistem de basă presiune, adaptat schimbului gazos.",
    ],
    clinical: [
      "**Embolie pulmonară**: obstrucție arterială pulmonară acută.",
      "**Hipertensiune pulmonară**: remodelare vasculară și suprasarcină pe VD.",
    ],
    pitfalls: [
      "Confuzia **arterei pulmonare** (sânge neoxigenat) cu **aorta**.",
      "Credința că venele pulmonare sunt „vene sistemice”.",
    ],
    mini:
      "Circulația pulmonară realizează oxigenarea sângelui între ventriculul drept și atriul stâng. Arterele pulmonare poartă sânge neoxigenat; venele pulmonare îl returnează oxigenat. Presiunile scăzute caracterizează acest pat.",
  },
  {
    chapterId: "systemic-portal",
    title: "Circulația Sistemică și Portală",
    parentChapterId: "cardiovascular",
    learn:
      "Circulația sistemică distribuie sângele oxigenat de la ventriculul stâng la țesuturi. Circulația portală hepatică colectează sângele digestiv înainte de a ajunge la sistemul cava.",
    concepts: [
      "**Aorta**: vas de ieșire al VS; arc, toracică, abdominală cu ramuri majore.",
      "**Circulație sistemică**: artere → capilare → vene → atriu drept.",
      "**Circulație portală**: vena portă leagă capilarele digestive de sinusoidele hepatice.",
      "**Vena cava superioară și inferioară**: retur sistemic la atriul drept.",
      "**Anastomoze**: între sisteme port și cava în caz de hipertensiune portală.",
    ],
    clinical: [
      "**Varice esofagiene**: shunt porto-sistemic prin plexuri venoase.",
      "**Șoc**: redistribuirea fluxului sistemic afectează perfuzia organelor.",
    ],
    pitfalls: [
      "Confuzia **circulației portale** (două capilare) cu **sistemica** (una).",
      "Amestecarea **venei porte** cu **venei cave** la origine.",
    ],
    mini:
      "Circulația sistemică livrează oxigen și nutrienți la țesuturi, apoi returnează sângele la atriul drept. Circulația portală filtrează sângele intestinal prin ficat. Înțelegerea ambelor explică ciroza și varicele.",
  },
  {
    chapterId: "fetal-circulation",
    title: "Circulația Fetală",
    parentChapterId: "cardiovascular",
    learn:
      "Circulația fetală ocolește plămânii neventilați prin shunturi (foramen oval, ductus arteriosus) și folosește circulația placentară pentru schimbul gazos.",
    concepts: [
      "**Foramen ovale**: comunicare atrială dreapta → stânga; direcționat de presiuni.",
      "**Ductus arteriosus**: leagă trunchiul pulmonar de aorta, ocolește plămânii.",
      "**Ductus venosus**: ocolește parțial ficatul; sânge de la vena ombilicală.",
      "**Placenta**: locul schimbului gazos și nutrițional fetal.",
      "**Tranziție la naștere**: închiderea shunturilor și creșterea rezistenței pulmonare.",
    ],
    clinical: [
      "**Persistență ductus arteriosus**: șunt stânga-dreapta postnatal.",
      "**Cianoză neonatală**: defecte care mențin shunt dreapta-stânga.",
    ],
    pitfalls: [
      "Confuzia direcției **foramenului oval** fetal (dreapta → stânga).",
      "Credința că plămânii fetal sunt complet perfuzați ca la adult.",
    ],
    mini:
      "Fătul ocolește plămânii prin foramen oval și ductus arteriosus, iar placenta asigură oxigenarea. La naștere, shunturile se închid și circulația pulmonară devine funcțională. Defectele persistente explică cianoza neonatală.",
  },
  {
    chapterId: "microcirculation",
    title: "Microcirculație",
    parentChapterId: "cardiovascular",
    learn:
      "Microcirculația cuprinde arteriole, metarteriole, capilare și venule unde are loc schimbul cu țesuturile. Mecanismele locale reglează fluxul și permeabilitatea.",
    concepts: [
      "**Capilare**: rețea cu diametru mic; schimb difuziv și filtrare.",
      "**Precapilare**: arteriole cu tonus muscular — reglează fluxul.",
      "**Filtare starling**: echilibru între presiune hidrostatică și oncotică.",
      "**Venițe**: colectează sângele; capacitance mare în sistemul venos.",
      "**Autoreglare locală**: răspuns la metaboliti, hipoxie, stres mecanic.",
    ],
    clinical: [
      "**Edem**: dezechilibru în filtrare/reabsorbție capilară.",
      "**Șoc**: redistribuirea fluxului microcirculator afectează perfuzia țesuturilor.",
    ],
    pitfalls: [
      "Confuzia **capilarelor** cu **venelor** la funcția de schimb.",
      "Ignorarea rolului **tonusului precapilar** în reglarea fluxului.",
    ],
    mini:
      "Microcirculația este locul schimbului cu țesuturile, prin capilare și reglare precapilară. Echilibrul Starling explică edemul. Autoreglarea locală adaptează fluxul la nevoile metabolice.",
  },
  {
    chapterId: "hemodynamics",
    title: "Hemodinamică",
    parentChapterId: "cardiovascular",
    learn:
      "Hemodinamica descrie relația între presiune, flux și rezistență vasculară. Legile de continuitate și reglarea presiunii arteriale sunt centrale la admitere.",
    concepts: [
      "**Debit cardiac**: volum pompat pe minut; productul frecvență × volum sistolic.",
      "**Rezistență vasculară**: opoziție la flux; reglată de tonus arteriolar.",
      "**Presiune arterială**: determinată de debit și rezistență periferică.",
      "**Legea continuității**: debitul este similar în serie (cu excepția shunturilor).",
      "**Distribuția fluxului**: organele primesc fracțiuni variabile din debit.",
    ],
    clinical: [
      "**Hipotensiune**: scădere debit sau rezistență disproporționată.",
      "**Antihipertensive**: acționează pe rezistență sau volum.",
    ],
    pitfalls: [
      "Confuzia **presiunii** cu **debitului** (pot fi disociate).",
      "Credința că rezistența este constantă (variază cu tonusul).",
    ],
    mini:
      "Hemodinamica leagă debitul, rezistența și presiunea arterială. Debitul cardiac și tonusul arteriolar sunt reglatoare cheie. Înțelegerea lor explică șocul, hipertensiunea și răspunsul la tratament.",
  },
  {
    chapterId: "ascending-aorta",
    title: "Aorta Ascendentă",
    parentChapterId: "cardiovascular",
    learn:
      "Aorta ascendentă pleacă de la ventriculul stâng și se continuă cu arcul aortic. Originea arterelor coronariene și raporturile cu inima sunt puncte frecvente la examen.",
    concepts: [
      "**Origine**: de la orificiul aortic, imediat superior valvei aortice.",
      "**Raporturi**: în față cu inima, lateral cu plămânii, posterior cu atriul stâng.",
      "**Arterele coronariene**: emerg de obicei din sinusurile aortice în porțiunea inițială.",
      "**Pericard**: aorta ascendentă este în relație cu sacul pericardic.",
      "**Extensie**: până la nivelul manubriului sternal unde începe arcul aortic.",
    ],
    clinical: [
      "**Disecție aortică**: poate începe în aorta ascendentă (tip A).",
      "**Imagistică**: conturul aortic pe radiografie toracică.",
    ],
    pitfalls: [
      "Confuzia **aortei ascendente** cu **trunchiul pulmonar** (ambele ies din inimă).",
      "Localizarea greșită a originii coronarienelor la valva mitrală.",
    ],
    mini:
      "Aorta ascendentă este segmentul inițial post-aortic, cu originea coronarienelor în sinusuri. Raporturile cu inima și pericardul sunt relevante clinic. Continuă cranial cu arcul aortic.",
  },
  {
    chapterId: "aortic-arch",
    title: "Arcul Aortic",
    parentChapterId: "cardiovascular",
    learn:
      "Arcul aortic curbează vasul de la nivel toracic superior și dă naștere la ramuri supraaortice care vascularizează capul, gâtul și membrele superioare.",
    concepts: [
      "**Trunchi brahiocefalic**: se bifurcă în artera carotidă comună dreaptă și subclavie dreaptă.",
      "**Carotida comună stângă**: ram direct din arc (majoritatea indivizilor).",
      "**Subclavia stângă**: ultima ramură majoră a arcului.",
      "**Ligamentum arteriosum**: remanent fetal al ductus arteriosus.",
      "**Raporturi**: trahee și esofag posterior; nerv stâng recurent sub arc.",
    ],
    clinical: [
      "**Sincope**: compresie la nivelul arcului (rare).",
      "**Imagistică vasculară**: arcul este evaluat în angio-CT și ecografie.",
    ],
    pitfalls: [
      "Confuzia **trunchiului brahiocefalic** (doar dreapta) cu ramuri bilaterale simetrice.",
      "Amestecarea **carotidei comune stângi** cu dreapta (origini diferite).",
    ],
    mini:
      "Arcul aortic dă cele trei ramuri supraaortice: brahiocefalic, carotidă comună stângă și subclavie stângă. Ligamentul arteriosum amintește de ductus fetal. Raporturile cu traheea și nervul recurent sunt importante chirurgical.",
  },
];

function main() {
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  for (const seed of PILOT) {
    const payload = {
      moduleId: MODULE_ID,
      chapterId: seed.chapterId,
      locale: "ro",
      title: seed.title,
      parentModuleId: PARENT_MODULE,
      parentChapterId: seed.parentChapterId,
      summaryMarkdown: md(seed),
      summaryVersion: 1,
      status: "published",
    };
    const outPath = path.join(DRAFTS_DIR, `${seed.chapterId}.ro.json`);
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
    console.log(`Wrote ${outPath}`);
  }
}

main();
