/** Black or white text, whichever reads better on a "#rrggbb" (or "#rgb") background; white when the colour is not valid hex. */
export function readableTextColor(background: string): "#000000" | "#ffffff" {
  const hex = background.trim().replace(/^#/, "");
  const full = hex.length === 3 ? hex.replace(/./g, "$&$&") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return "#ffffff";
  const channel = (offset: number) => {
    const value = parseInt(full.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  // Black wins when its contrast ratio (L + 0.05) / 0.05 beats white's 1.05 / (L + 0.05).
  return luminance > 0.179 ? "#000000" : "#ffffff";
}
