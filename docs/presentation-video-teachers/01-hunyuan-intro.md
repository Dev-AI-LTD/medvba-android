# Hunyuan — intro și outro (8 sec fiecare)

## Fișier sursă

Încarcă în Hunyuan (Image-to-Video):

**[`assets/icon-for-hunyuan.png`](./assets/icon-for-hunyuan.png)**

(Copie din `assets/images/icon.png` — creier neon + ADN.)

## Intro — prompt principal

```
Cinematic medical education app intro. Glowing neon brain icon with DNA helix rotates 360° on deep navy background #0A1628, cyan glow #00B4D8, subtle floating particles and soft light rays. Premium dark-mode med-tech aesthetic, sharp logo edges, no distortion of the brain shape. Gentle pulse glow on rotation. Empty space at bottom third for title overlay. 8 seconds, smooth motion, loop-friendly ending.
```

## Intro — negative prompt

```
blurry, warped logo, extra text, watermark, white background, cartoonish, low quality, distorted brain, ugly artifacts, readable letters, UI buttons
```

## Setări recomandate Hunyuan

| Parametru | Valoare |
|-----------|---------|
| Mod | Image-to-video (I2V) |
| Durată | 8 sec |
| Aspect ratio | 9:16 (1080×1920) sau 1:1 dacă outro-ul e pătrat |
| Motion strength | 30–45% (mediu — păstrează logo clar) |
| CFG / Guidance | Mediu-ridicat dacă există |

## După generare

1. Descarcă clipul ca `raw/intro-hunyuan.mp4`
2. În CapCut: adaugă text overlay sec 2–7:
   - Linia 1: **MEDVBA** (bold, alb, ~48pt)
   - Linia 2: *Pregătire pentru anatomie și admitere* (cyan `#00B4D8`, ~28pt)
3. Fade in 0.5s la început, fade out 0.3s spre sec 8

## Outro fundal (opțional Hunyuan)

Dacă vrei fundal animat în loc de SVG static:

```
Abstract deep navy medical background #0A1628, soft cyan #00B4D8 light waves, minimal particles, calm professional mood, slow drift, no UI, no text, no logo, seamless loop, 8 seconds.
```

**Negative:** `text, logo, buttons, faces, bright white flash`

Alternativ: folosește [`assets/outro-frame.svg`](./assets/outro-frame.svg) — export PNG 1080×1920 în browser sau Figma, apoi Ken Burns ușor în CapCut (scale 100% → 105% în 8s).

## Outro — text overlay (CapCut, nu în AI)

| Element | Text |
|---------|------|
| Titlu | MEDVBA |
| Subtitlu | medvba.app |
| CTA | Disponibil pe Google Play |
| Sub-CTA | Recomandați studenților voștri |

## Placeholder (deja generat)

Dacă Hunyuan nu e disponibil imediat, folosește temporar:

**[`raw/intro-placeholder.mp4`](../raw/intro-placeholder.mp4)** — zoom lent pe icon, fundal `#0A1628` (ffmpeg). Înlocuiește cu `intro-hunyuan.mp4` când AI e gata.

Fundal outro static: **`raw/outro-frame.png`** (navy; adaugă text în CapCut) sau **`assets/outro-frame.svg`** (deschide în browser → screenshot 1080×1920).

## Livrabil așteptat

- [ ] `raw/intro-hunyuan.mp4` (8s, 9:16) — înlocuiește placeholder
- [x] `raw/intro-placeholder.mp4` — fallback
- [x] `raw/outro-frame.png` — fundal outro
