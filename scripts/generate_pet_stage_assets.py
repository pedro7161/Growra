from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import math
import random

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets" / "pets"
SIZE = 1024


@dataclass(frozen=True)
class Palette:
    dark: tuple[int, int, int]
    light: tuple[int, int, int]
    glow: tuple[int, int, int]
    accent: tuple[int, int, int]


@dataclass(frozen=True)
class PetConfig:
    source_id: str
    theme: str
    palette: Palette
    recolor_base: bool


PETS: dict[str, PetConfig] = {
    "sprout": PetConfig("sprout", "forest", Palette((78, 116, 36), (255, 234, 146), (255, 232, 126), (116, 196, 72)), False),
    "pebble": PetConfig("pebble", "earth", Palette((102, 96, 89), (238, 224, 186), (255, 228, 146), (122, 196, 78)), False),
    "moss": PetConfig("moss", "forest", Palette((62, 104, 64), (212, 255, 183), (220, 255, 163), (126, 216, 110)), False),
    "ember": PetConfig("ember", "fire", Palette((116, 38, 10), (255, 225, 118), (255, 192, 60), (255, 96, 28)), False),
    "ripple": PetConfig("ripple", "water", Palette((52, 90, 132), (194, 242, 255), (168, 239, 255), (86, 194, 255)), False),
    "astra": PetConfig("astra", "cosmic", Palette((68, 62, 150), (255, 223, 255), (255, 220, 160), (148, 210, 255)), False),
    "nova": PetConfig("nova", "solar", Palette((122, 38, 18), (255, 238, 148), (255, 189, 70), (255, 96, 52)), False),
    "tempo": PetConfig("astra", "storm", Palette((48, 72, 132), (232, 242, 255), (166, 218, 255), (216, 234, 255)), True),
    "glint": PetConfig("pebble", "crystal", Palette((62, 112, 132), (252, 228, 255), (154, 248, 255), (255, 176, 230)), True),
    "umbra": PetConfig("astra", "shadow", Palette((38, 24, 76), (214, 214, 255), (188, 160, 255), (112, 120, 226)), True),
    "cindra": PetConfig("ember", "lava", Palette((102, 26, 8), (255, 220, 122), (255, 154, 52), (255, 74, 18)), True),
    "zephie": PetConfig("astra", "wind", Palette((102, 176, 188), (245, 248, 255), (202, 255, 255), (204, 238, 164)), True),
}


def load_source_image(source_id: str) -> Image.Image:
    return Image.open(ASSETS / f"{source_id}.png").convert("RGBA")


def recolor_image(image: Image.Image, palette: Palette, strength: float) -> Image.Image:
    grayscale = ImageOps.grayscale(image)
    colorized = ImageOps.colorize(grayscale, palette.dark, palette.light).convert("RGBA")
    return Image.blend(image, colorized, strength)


def scaled_canvas(image: Image.Image, zoom: float) -> Image.Image:
    if zoom == 1:
        return image.copy()

    width = round(image.width * zoom)
    height = round(image.height * zoom)
    scaled = image.resize((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", image.size, (255, 255, 255, 0))
    left = (image.width - width) // 2
    top = (image.height - height) // 2
    canvas.alpha_composite(scaled, (left, top))
    return canvas


def add_glow(canvas: Image.Image, color: tuple[int, int, int], radius: int, alpha: int) -> Image.Image:
    glow = Image.new("RGBA", canvas.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(glow)
    center_x = canvas.width // 2
    center_y = round(canvas.height * 0.57)
    draw.ellipse(
        (center_x - radius, center_y - radius, center_x + radius, center_y + radius),
        fill=(color[0], color[1], color[2], alpha),
    )
    return glow.filter(ImageFilter.GaussianBlur(radius=max(18, radius // 4)))


def draw_sparkle(draw: ImageDraw.ImageDraw, x: float, y: float, size: float, color: tuple[int, int, int], alpha: int) -> None:
    draw.line((x - size, y, x + size, y), fill=(*color, alpha), width=max(1, round(size / 3)))
    draw.line((x, y - size, x, y + size), fill=(*color, alpha), width=max(1, round(size / 3)))
    small = size * 0.6
    draw.line((x - small, y - small, x + small, y + small), fill=(*color, round(alpha * 0.7)), width=1)
    draw.line((x - small, y + small, x + small, y - small), fill=(*color, round(alpha * 0.7)), width=1)


def add_particles(canvas: Image.Image, palette: Palette, pet_id: str, stage: int, theme: str) -> Image.Image:
    overlay = Image.new("RGBA", canvas.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    rng = random.Random(f"{pet_id}-{stage}-{theme}")
    count = 18 + stage * 20

    for _ in range(count):
        x = rng.randint(110, 914)
        y = rng.randint(90, 890)
        size = rng.randint(4 + stage, 10 + stage * 2)
        if rng.random() < 0.45:
            draw_sparkle(draw, x, y, size, palette.glow, 160 + stage * 24)
            continue

        radius = size if theme not in {"storm", "water", "wind"} else max(3, size - 2)
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(*palette.accent, 130 + stage * 18))

    return overlay.filter(ImageFilter.GaussianBlur(radius=0.5 + stage * 0.4))


def add_theme_effects(canvas: Image.Image, config: PetConfig, stage: int) -> Image.Image:
    overlay = Image.new("RGBA", canvas.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    center_x = canvas.width // 2
    center_y = round(canvas.height * 0.66)
    ring_radius = 270 + stage * 44

    if config.theme in {"water", "storm", "wind"}:
        for index in range(2 + stage):
            offset = index * 26
            box = (
                center_x - ring_radius + offset,
                center_y - 110 + offset // 2,
                center_x + ring_radius - offset,
                center_y + 110 - offset // 2,
            )
            draw.arc(box, 0, 360, fill=(*config.palette.glow, 115), width=4)

    if config.theme in {"fire", "lava", "solar"}:
        for index in range(14 + stage * 8):
            angle = math.tau * index / (14 + stage * 8)
            radius = 290 + stage * 30 + (index % 3) * 18
            x = center_x + math.cos(angle) * radius
            y = center_y - 60 + math.sin(angle) * (110 + stage * 10)
            size = 14 + (index % 4) * 3
            draw.ellipse((x - size, y - size, x + size, y + size), fill=(*config.palette.accent, 130))

    if config.theme == "crystal":
        base_y = 788
        for index, x in enumerate((246, 350, 664, 778)):
            height = 90 + stage * 22 + (index % 2) * 18
            draw.polygon(
                (
                    (x, base_y),
                    (x + 24, base_y - height),
                    (x + 62, base_y),
                ),
                fill=(*config.palette.glow, 120),
            )

    if config.theme == "shadow":
        for index in range(3 + stage):
            inset = index * 16
            draw.arc(
                (center_x - 190 - inset, center_y - 240 - inset, center_x + 190 + inset, center_y + 130 + inset),
                205,
                330,
                fill=(*config.palette.accent, 125),
                width=4,
            )

    if config.theme in {"forest", "earth", "wind"}:
        for index in range(8 + stage * 6):
            angle = math.tau * index / (8 + stage * 6)
            radius = 250 + stage * 26
            x = center_x + math.cos(angle) * radius
            y = center_y + 80 + math.sin(angle) * 66
            leaf = [
                (x, y),
                (x + 18, y - 10),
                (x + 32, y + 6),
                (x + 12, y + 20),
            ]
            draw.polygon(leaf, fill=(*config.palette.accent, 105))

    return overlay.filter(ImageFilter.GaussianBlur(radius=1.2))


def enhance_stage(image: Image.Image, config: PetConfig, pet_id: str, stage: int) -> Image.Image:
    stage_recolor = 0.34 if config.recolor_base else 0.08 + stage * 0.04
    canvas = recolor_image(image, config.palette, stage_recolor)
    canvas = scaled_canvas(canvas, 1 + stage * 0.055)
    canvas = ImageEnhance.Color(canvas).enhance(1.08 + stage * 0.08)
    canvas = ImageEnhance.Contrast(canvas).enhance(1.04 + stage * 0.06)
    canvas = ImageEnhance.Brightness(canvas).enhance(0.98 + stage * 0.02)

    overlay = Image.new("RGBA", canvas.size, (255, 255, 255, 0))
    overlay = Image.alpha_composite(overlay, add_glow(canvas, config.palette.glow, 150 + stage * 42, 34 + stage * 10))
    overlay = Image.alpha_composite(overlay, add_theme_effects(canvas, config, stage))
    overlay = Image.alpha_composite(overlay, add_particles(canvas, config.palette, pet_id, stage, config.theme))

    merged = Image.alpha_composite(canvas, overlay)
    softened = Image.alpha_composite(
        merged,
        overlay.filter(ImageFilter.GaussianBlur(radius=4 + stage)).copy(),
    )
    return ImageEnhance.Sharpness(softened).enhance(1.2 + stage * 0.18)


def save_stage(image: Image.Image, pet_id: str, name: str) -> None:
    target = ASSETS / pet_id / name
    image.save(target)


def build_pet_assets(pet_id: str, config: PetConfig) -> None:
    source = load_source_image(config.source_id)
    base = enhance_stage(source, config, pet_id, 0) if config.recolor_base else source.copy()
    evo1 = enhance_stage(source, config, pet_id, 1)
    evo2 = enhance_stage(source, config, pet_id, 2)

    save_stage(base, pet_id, "base.png")
    save_stage(evo1, pet_id, "evo1.png")
    save_stage(evo2, pet_id, "evo2.png")
    save_stage(base, pet_id, "variants/default.png")


def main() -> None:
    for pet_id, config in PETS.items():
        build_pet_assets(pet_id, config)


if __name__ == "__main__":
    main()
