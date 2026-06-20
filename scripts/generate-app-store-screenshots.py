#!/usr/bin/env python3
"""Generate App Store 6.5\" screenshots (1242x2688) with headline + framed capture."""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1242, 2688
BG = (10, 18, 30)  # #0A121E
ACCENT = (18, 181, 193)  # teal
TITLE_COLOR = (255, 255, 255)
SUBTITLE_COLOR = (142, 160, 180)

ASSETS = Path(
    r"C:\Users\octav\.cursor\projects\c-Users-octav-Desktop-MEDVBA3\assets"
)
OUT = Path(__file__).resolve().parent.parent / "docs" / "app-store-screenshots" / "ios-6.5"

# Order matters for App Store (first 3 = install sheet).
# Slot #2 must show the in-app paywall (RevenueCat) for App Review / guideline 2.3.2 clarity.
SLIDES: list[tuple[str, str, str]] = [
    (
        "c__Users_octav_AppData_Roaming_Cursor_User_workspaceStorage_ef7a66e609e3feb7feecf43b802b548a_images_WhatsApp_Image_2026-05-28_at_1.56.06_PM-d9e687ea-77fa-4aec-b35c-582de2fade64.png",
        "MEDVBA",
        "Exam prep for medical students",
    ),
    (
        "c__Users_octav_AppData_Roaming_Cursor_User_workspaceStorage_ef7a66e609e3feb7feecf43b802b548a_images_45-9be6430e-2128-44d3-9693-da60e56f6ceb.png",
        "Premium subscription",
        "Monthly and yearly plans — Restore Purchases on paywall",
    ),
    (
        "c__Users_octav_AppData_Roaming_Cursor_User_workspaceStorage_ef7a66e609e3feb7feecf43b802b548a_images_8-78c5e0fa-2628-475f-9f22-cca78c0c8548.png",
        "Practice quizzes",
        "Quick MCQ, practice sessions, and exam mode",
    ),
    (
        "c__Users_octav_AppData_Roaming_Cursor_User_workspaceStorage_ef7a66e609e3feb7feecf43b802b548a_images_6-f646fea3-c692-47d4-a9ca-0765277552ef.png",
        "Your dashboard",
        "Track progress, streaks, and daily goals",
    ),
    (
        "c__Users_octav_AppData_Roaming_Cursor_User_workspaceStorage_ef7a66e609e3feb7feecf43b802b548a_images_9-309d2a38-45ba-4295-9360-899d4d8dbd5e.png",
        "Anatomy regions",
        "Thousands of questions by topic",
    ),
    (
        "c__Users_octav_AppData_Roaming_Cursor_User_workspaceStorage_ef7a66e609e3feb7feecf43b802b548a_images_image-a97c03c7-7ddf-4d2d-a8ea-716903a7533b.png",
        "AI Tutor",
        "Ask medical questions — study support, not clinical advice",
    ),
    (
        "c__Users_octav_AppData_Roaming_Cursor_User_workspaceStorage_ef7a66e609e3feb7feecf43b802b548a_images_image-d4fdf669-48e3-4a50-9e58-3467c577fecc.png",
        "Student chat",
        "Message classmates — text only, no live video",
    ),
    (
        "c__Users_octav_AppData_Roaming_Cursor_User_workspaceStorage_ef7a66e609e3feb7feecf43b802b548a_images_image-c8b4e24e-6f3f-4a1a-b36f-b0011d6853ce.png",
        "Find study partners",
        "Filter by city and university, then message",
    ),
    (
        "c__Users_octav_AppData_Roaming_Cursor_User_workspaceStorage_ef7a66e609e3feb7feecf43b802b548a_images_7-d252c2bb-dfbd-4965-a322-24e98a0e7b68.png",
        "Premium content",
        "Unlock full question banks and modules",
    ),
    (
        "c__Users_octav_AppData_Roaming_Cursor_User_workspaceStorage_ef7a66e609e3feb7feecf43b802b548a_images_14-ee3495dc-ab20-425a-8d82-97eb58837437.png",
        "Privacy & settings",
        "Face ID, notifications, and your data",
    ),
]


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    if os.name == "nt":
        windir = os.environ.get("WINDIR", r"C:\Windows")
        fonts = Path(windir) / "Fonts"
        candidates = [
            fonts / ("segoeuib.ttf" if bold else "segoeui.ttf"),
            fonts / ("arialbd.ttf" if bold else "arial.ttf"),
        ]
    else:
        candidates = [
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"),
        ]
    for p in candidates:
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def rounded_rect_mask(size: tuple[int, int], radius: int) -> Image.Image:
    w, h = size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=255)
    return mask


def compose(src_path: Path, title: str, subtitle: str) -> Image.Image:
    canvas = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(canvas)

    title_font = load_font(72, bold=True)
    sub_font = load_font(40, bold=False)

    draw.text((W // 2, 140), title, fill=TITLE_COLOR, font=title_font, anchor="mm")
    draw.text((W // 2, 220), subtitle, fill=SUBTITLE_COLOR, font=sub_font, anchor="mm")

    # Accent line under subtitle
    line_w = min(420, len(title) * 28)
    draw.rounded_rectangle(
        ((W - line_w) // 2, 260, (W + line_w) // 2, 268),
        radius=4,
        fill=ACCENT,
    )

    shot = Image.open(src_path).convert("RGB")
    sw, sh = shot.size
    margin_x = 72
    top_y = 320
    bottom_margin = 80
    max_w = W - margin_x * 2
    max_h = H - top_y - bottom_margin
    scale = min(max_w / sw, max_h / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    shot = shot.resize((nw, nh), Image.Resampling.LANCZOS)

    frame_pad = 24
    frame_w = nw + frame_pad * 2
    frame_h = nh + frame_pad * 2
    fx = (W - frame_w) // 2
    fy = top_y + (max_h - frame_h) // 2

    # Phone frame shadow
    shadow = Image.new("RGBA", (frame_w + 40, frame_h + 40), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        (20, 20, frame_w + 19, frame_h + 19),
        radius=48,
        fill=(0, 0, 0, 90),
    )
    canvas.paste(shadow, (fx - 20, fy - 10), shadow)

    frame_bg = Image.new("RGB", (frame_w, frame_h), (22, 32, 48))
    mask = rounded_rect_mask((frame_w, frame_h), 44)
    canvas.paste(frame_bg, (fx, fy), mask)

    inner_x = fx + frame_pad
    inner_y = fy + frame_pad
    inner_mask = rounded_rect_mask((nw, nh), 36)
    canvas.paste(shot, (inner_x, inner_y), inner_mask)

    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for i, (filename, title, subtitle) in enumerate(SLIDES, start=1):
        src = ASSETS / filename
        if not src.exists():
            raise FileNotFoundError(f"Missing source: {src}")
        out = OUT / f"{i:02d}-{title.lower().replace(' ', '-').replace('&', 'and')[:40]}.png"
        img = compose(src, title, subtitle)
        img.save(out, "PNG", optimize=True)
        print(f"Wrote {out} ({W}x{H})")

    readme = OUT.parent / "README-upload-order.md"
    lines = [
        "# App Store screenshots (6.5\" / 1242×2688)",
        "",
        "Upload to **App Store Connect → Previews and Screenshots → iPhone 6.5\" Display**",
        "in this order (drag `ios-6.5/01-...` first):",
        "",
    ]
    for i, (_, title, _) in enumerate(SLIDES, start=1):
        lines.append(f"{i}. {title}")
    lines.extend(
        [
            "",
            "**Install sheet:** Apple uses only screenshots **1–3** on the app page — #2 must show the paywall.",
            "",
            "IAP promotional images (separate): see `README-iap-promotional-images.md`.",
            "",
            "App Previews (video): optional — leave empty if none.",
            "",
            "Generated by `npm run screenshots:ios-6.5` (`python scripts/generate-app-store-screenshots.py`).",
        ]
    )
    readme.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {readme}")


if __name__ == "__main__":
    main()
