#!/usr/bin/env python3
"""Switch Growra's app icon for a seasonal release, then back.

    python3 scripts/set-app-icon.py halloween   # or christmas
    python3 scripts/set-app-icon.py default

The icon changes with an app update (owner, 2026-10-25), not at runtime: run this before an EAS
build for a seasonal release, and with `default` for the first release after the season.

It rewrites the files app.json points at: assets/images/icon.png (1024 px) and the Android
adaptive layers android-icon-background.png / android-icon-foreground.png (512 px). The seasonal
art (assets/seasonal/<season>/app-icon.png, full-bleed square) becomes the background layer at
70% over a blurred copy of itself, so the launcher mask (the middle ~72 of 108 dp) keeps all of
it, with an empty foreground. The monochrome layer stays. `default` restores
assets/images/default-icons/.
"""
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageFilter

IMAGES = Path('assets/images')
DEFAULTS = IMAGES / 'default-icons'
SEASONS = ('halloween', 'christmas')
LAYER = 512
ART_SHARE = 0.7


def set_season(season: str) -> None:
    art = Image.open(f'assets/seasonal/{season}/app-icon.png').convert('RGB')
    art.resize((1024, 1024), Image.LANCZOS).save(IMAGES / 'icon.png', optimize=True)
    layer = art.resize((LAYER, LAYER), Image.LANCZOS).filter(ImageFilter.GaussianBlur(LAYER / 20)).convert('RGBA')
    inner = round(LAYER * ART_SHARE)
    layer.paste(art.resize((inner, inner), Image.LANCZOS), ((LAYER - inner) // 2, (LAYER - inner) // 2))
    layer.save(IMAGES / 'android-icon-background.png', optimize=True)
    Image.new('RGBA', (LAYER, LAYER), (0, 0, 0, 0)).save(IMAGES / 'android-icon-foreground.png', optimize=True)


def main() -> int:
    choice = sys.argv[1] if len(sys.argv) == 2 else ''
    if choice == 'default':
        for icon in DEFAULTS.glob('*.png'):
            shutil.copy2(icon, IMAGES / icon.name)
    elif choice in SEASONS:
        set_season(choice)
    else:
        print(f'usage: {sys.argv[0]} {{{",".join(SEASONS)},default}}', file=sys.stderr)
        return 1
    print(f'App icon set to: {choice}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
