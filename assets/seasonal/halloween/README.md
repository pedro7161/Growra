# Growra Halloween artwork

- `app-icon.png`: seasonal icon master (Sprout in a witch hat). `scripts/set-app-icon.py halloween` installs it; the icon changes only with an app update.
- `pets/<id>/{base,evo1,evo2}.webp`: every companion with the witch hat drawn on, shown during Halloween (`getPetImage` in `src/constants/petImages.ts`). Gloam and Holly have none.
- `witch-hat-overlay.png`: the hat used as the reference when the hatted art was drawn; the app does not show it.
