# CapCut — timeline montaj (60 sec)

**Proiect nou:** 1080×1920, 30 fps, durată 60s.

## Track-uri

| Track | Conținut |
|-------|----------|
| V1 | Video (intro + 4 shots + outro) |
| V2 | Text overlays (titluri secțiuni, opțional) |
| A1 | Voiceover |
| A2 | Muzică instrumentală (-24 LUFS, duck -6dB când vorbește VO) |

## Muzică

- Gen: ambient corporate / soft piano
- Fără beat puternic, fără lyrics
- Fade in 1s, fade out 2s la final
- Surse: YouTube Audio Library „Documentary Gentle”, Epidemic „Medical Innovation” (similar)

## Timeline V1 (video)

| Clip | In | Out | Durată | Fișier | Tranziție în |
|------|-----|-----|--------|--------|--------------|
| Intro | 0:00.0 | 0:08.0 | 8.0s | `raw/intro-hunyuan.mp4` | — |
| Study | 0:08.0 | 0:18.0 | 10.0s | `raw/shot-study.mp4` | Cross dissolve 0.3s |
| Quiz | 0:18.0 | 0:30.0 | 12.0s | `raw/shot-quiz.mp4` | Cross dissolve 0.3s |
| Home | 0:30.0 | 0:42.0 | 12.0s | `raw/shot-home.mp4` | Cross dissolve 0.3s |
| Tutor | 0:42.0 | 0:52.0 | 10.0s | `raw/shot-tutor.mp4` | Cross dissolve 0.3s |
| Outro | 0:52.0 | 1:00.0 | 8.0s | `raw/outro-frame.png` sau `outro-bg.mp4` | Cross dissolve 0.3s |

### Crop screen recordings

- Scale: fit height, crop lateral dacă e nevoie
- Speed: 1.0x (nu accelera — profesorii vor citi textul)
- Stabilizare: off (UI trebuie clar)

### Intro text overlay (V2)

| Timp | Text | Stil |
|------|------|------|
| 0:02–0:07 | MEDVBA | Bold, alb, centrat, shadow ușor |
| 0:02.5–0:07 | Pregătire pentru anatomie | Regular, #00B4D8, sub titlu |

### Outro text (V2)

| Timp | Text |
|------|------|
| 0:52–0:58 | MEDVBA |
| 0:53–0:59 | medvba.app |
| 0:54–0:59 | Disponibil pe Google Play |
| 0:55–0:59 | Recomandați studenților voștri |

## Timeline A1 (voiceover)

- Importă înregistrarea VO sau generează TTS din `03-voiceover-script-ro.txt`
- Aliniază manual la cue-urile din `04-subtitles-60s-ro.srt` dacă deviază
- Normalizare vocală: -16 LUFS

## Watermark (V2, opțional)

- Icon 48×48, colț dreapta sus, opacity 40%, de la 0:08 până la 0:52

## Export

| Variantă | Setări |
|----------|--------|
| Principal | MP4 H.264, 1080×1920, 30fps, 12–15 Mbps |
| Proiector | 1920×1080 — duplică proiect, reframing centrat pe carduri |
| Thumbnail | Frame la 0:32 (Home progress) sau 0:02 (intro) |

**Fișier final:** `export/medvba-profesori-60s-ro.mp4`

## Import subtitrări

CapCut → Text → Import SRT → `04-subtitles-60s-ro.srt`  
Verifică sincronizarea după alinierea VO.
