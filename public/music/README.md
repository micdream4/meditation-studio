This folder contains optional background sounds for generated sessions.

Current files:
- `rainforest-water.mp3` — CC0-style rainforest water ambience sourced from Happy Soul Music / Freesound attribution chain.
- `ocean-waves.m4a` — CC0-style ocean waves ambience sourced from Happy Soul Music / Freesound attribution chain.
- `soft-rain.m4a` — CC0-style rain ambience sourced from Happy Soul Music / Freesound attribution chain.
- `meditation-pad.m4a` — repository-generated warm drone/pad from [generate_music.py](/Users/huanglu/Documents/Code/25-meditation-studio/scripts/generate_music.py). No third-party source asset.
- `soft-piano-breath.m4a` / `soft-piano-breath.wav` — repository-generated sparse piano bed from `generate_music.py`. No third-party source asset.
- `gentle-bells-pad.m4a` / `gentle-bells-pad.wav` — repository-generated warm bell/pad bed from `generate_music.py`. No third-party source asset.
- `piano-light-1.mp3` — older repository-generated placeholder. Keep for reference only; it is not offered in the app.

The app defaults `NEXT_PUBLIC_DEFAULT_MUSIC_TRACK_ID=none`. Background audio is opt-in on the create page because a mismatched music bed hurts the meditation experience.
Legacy saved sessions that reference `meditation-pad` or `rainforest-water` are mapped to the new light music beds in `src/lib/music.ts`.

Before production launch, archive the original source pages and licenses for each selected background asset.
