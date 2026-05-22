# Prezentare video MEDVBA — profesori

Pachet de producție pentru clipul promo **Concept A** („De la curs la grilă”), **60 secunde**, public țintă: cadre didactice.

## Decizie blocată

| Element | Valoare |
|---------|---------|
| Concept | **A** — pedagogic (învață → exersează → măsoară → întreabă) |
| Durată | **60 sec** |
| Raport | **9:16** (1080×1920) pentru telefon; exportă și **16:9** dacă prezinți pe proiector |
| Întrebări totale (voiceover) | **21.759** (verificat din `mocks/questions.ts`, mai 2026) |

## Fișiere în acest folder

| Fișier | Rol |
|--------|-----|
| [00-concept-decision.md](./00-concept-decision.md) | Decizie concept + storyboard |
| [01-hunyuan-intro.md](./01-hunyuan-intro.md) | Prompturi Hunyuan + setări intro/outro |
| [02-screen-recording-shot-list.md](./02-screen-recording-shot-list.md) | Listă cadre, tap-uri, durate |
| [03-voiceover-script-ro.txt](./03-voiceover-script-ro.txt) | Text narare română |
| [03-voiceover-script-en.txt](./03-voiceover-script-en.txt) | Text narare engleză (opțional) |
| [04-subtitles-60s-ro.srt](./04-subtitles-60s-ro.srt) | Subtitrări RO sincronizate |
| [04-subtitles-60s-en.srt](./04-subtitles-60s-en.srt) | Subtitrări EN |
| [05-capcut-edit-timeline.md](./05-capcut-edit-timeline.md) | Timeline montaj CapCut |
| [06-email-for-teachers.md](./06-email-for-teachers.md) | Email către profesori |
| [07-short-reel-30s-cut.md](./07-short-reel-30s-cut.md) | Variantă scurtă social |
| [assets/icon-for-hunyuan.png](./assets/icon-for-hunyuan.png) | Sursă upload Hunyuan |
| [assets/outro-frame.svg](./assets/outro-frame.svg) | Cadru outro (export PNG 1080×1920) |

## Ordine de lucru

1. Generează intro în Hunyuan → salvează ca `raw/intro-hunyuan.mp4`
2. Înregistrează ecranele după [02-screen-recording-shot-list.md](./02-screen-recording-shot-list.md)
3. Înregistrează voiceover după [03-voiceover-script-ro.txt](./03-voiceover-script-ro.txt)
4. Montează în CapCut după [05-capcut-edit-timeline.md](./05-capcut-edit-timeline.md)
5. Importă [04-subtitles-60s-ro.srt](./04-subtitles-60s-ro.srt)
6. Taie Reels 30s după [07-short-reel-30s-cut.md](./07-short-reel-30s-cut.md)

Folderul `raw/` conține deja:

- `intro-placeholder.mp4` — intro provizoriu (înlocuiește cu Hunyuan)
- `outro-frame.png` — fundal outro navy

Rulează statistici voiceover: `bun run scripts/presentation-video-stats.ts`

## Checklist final

- [ ] Cont demo: nume generic (ex. „Student Demo”), fără email/username real
- [ ] Banner Premium minim în cadru
- [ ] Intro Hunyuan 8s + 4 clipuri screen ~10s fiecare + outro 8s
- [ ] Voiceover + muzică instrumentală discretă (-18 LUFS voice, -24 LUFS music)
- [ ] CTA: medvba.app + Google Play
