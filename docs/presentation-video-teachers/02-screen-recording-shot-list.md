# Shot list — înregistrare ecran (Android)

**Durată țintă înregistrări brute:** ~45 sec material util (vei tăia la 10+12+12+10 sec în montaj).

**Pregătire telefon**

- Tema întunecată activă (Setări app → Mod întunecat)
- Notificări: Nu deranja
- Brightness 80%+
- Înregistrare nativă: Setări Android → Ecran → Înregistrare ecran, sau **AZ Screen Recorder** / **Mobizen**
- Rezoluție: 1080×2400 sau maxim disponibil; crop la 9:16 în montaj

## Cont demo (obligatoriu)

Înainte de filmare, în [edit-profile](https://medvba.app) sau în app:

| Câmp | Valoare demo |
|------|----------------|
| Nume afișat | `Student Demo` |
| Profil | Public (badge OK) |
| Avatar | Generic Dicebear (implicit) |

**Nu filma:** `boctavian2014`, email real, mesaje chat.

## Shot 1 — Study (țintă montaj: 10 sec, timeline 0:08–0:18)

| Pas | Acțiune | Durată filmare |
|-----|---------|----------------|
| 1 | Deschide app → tab **Quiz** sau din Home tap pe modul Study/admitere | 2s |
| 2 | Navighează la **Study / Învățare** — [`/study/chapters`](../../app/study/chapters.tsx) modul admitere (`med-admission-barrons`) | 3s |
| 3 | Deschide un capitol **gratuit** (primele 3) | 2s |
| 4 | Arată butoanele **Citește rezumatul** și opțional tap **Ascultă rezumatul** (1s redare) | 4s |
| 5 | Scroll ușor prin 2–3 rânduri de text rezumat | 3s |

**Cadru cheie:** titlu capitol + butoane rezumat vizibile.

**Fișier brut sugerat:** `raw/shot-study.mp4`

---

## Shot 2 — Quiz (țintă montaj: 12 sec, timeline 0:18–0:30)

| Pas | Acțiune | Durată |
|-----|---------|--------|
| 1 | Tab **Quiz** | 1s |
| 2 | Scroll lent pe listă module: Membre, Organe interne, Neuroanatomie | 4s |
| 3 | Tap modul **Organe interne** sau **Neuroanatomie** | 2s |
| 4 | Start quiz capitol sau **Test rapid** | 2s |
| 5 | Afișează 1 întrebare grilă — selectează un răspuns | 3s |
| 6 | Afișează feedback corect/greșit + buton continuare | 3s |

**Evită:** popup Premium, limită zilnică epuizată.

**Fișier brut:** `raw/shot-quiz.mp4`

---

## Shot 3 — Home (țintă montaj: 12 sec, timeline 0:30–0:42)

| Pas | Acțiune | Durată |
|-----|---------|--------|
| 1 | Tab **Home** | 1s |
| 2 | Pauză pe header + salut „Student Demo” | 2s |
| 3 | Card **Continue Learning** + inel progres zilnic | 3s |
| 4 | Scroll la **Your Progress** — bară % + „X of 21,759 questions” | 4s |
| 5 | Cele 3 carduri: Accuracy, Questions, Study Time | 3s |
| 6 | Opțional: Quick Start Anatomie (fără tap Premium lock) | 2s |

**Cadru cheie:** procent complet + număr total întrebări.

**Fișier brut:** `raw/shot-home.mp4`

---

## Shot 4 — AI Tutor (țintă montaj: 10 sec, timeline 0:42–0:52)

| Pas | Acțiune | Durată |
|-----|---------|--------|
| 1 | Tab **AI Tutor** | 1s |
| 2 | Tap câmp mesaj, tastează (sau lipește): `Care e diferența între arteră și venă în membrul superior?` | 4s |
| 3 | Trimite → așteaptă răspuns (max 15s înregistrare; taie la 4s răspuns în montaj) | 8s |
| 4 | Scroll ușor 2 linii din răspuns | 2s |

**Fișier brut:** `raw/shot-tutor.mp4`

---

## Verificare post-înregistrare

- [ ] Fără username/email real
- [ ] Banner galben Premium < 1 sec total în toate clipurile
- [ ] Text lizibil (nu motion blur)
- [ ] Toate 4 fișiere în `raw/`

## ADB (opțional, emulator)

```powershell
adb shell screenrecord /sdcard/medvba-shot.mp4
# Ctrl+C după durată
adb pull /sdcard/medvba-shot.mp4 raw/
```
