insert into public.curated_tracks (
  title,
  slug,
  full_audio_path,
  preview_audio_path,
  transcript_path,
  duration_seconds,
  sort_order
)
values
  (
    'Breathing Meditation',
    'breathing-meditation',
    '/audio/01_Breathing_Meditation.mp3',
    '/audio/01_Breathing_Meditation.mp3',
    null,
    331,
    1
  ),
  (
    'Breath, Sound, Body Meditation',
    'breath-sound-body-meditation',
    '/audio/02_Breath_Sound_Body_Meditation.mp3',
    '/audio/02_Breath_Sound_Body_Meditation.mp3',
    null,
    720,
    2
  ),
  (
    'Complete Meditation Instructions',
    'complete-meditation-instructions',
    '/audio/03_Complete_Meditation_Instructions.mp3',
    '/audio/03_Complete_Meditation_Instructions.mp3',
    null,
    1141,
    3
  ),
  (
    'Meditation for Working with Difficulties',
    'meditation-for-working-with-difficulties',
    '/audio/04_Meditation_for_Working_with_Difficulties.mp3',
    '/audio/04_Meditation_for_Working_with_Difficulties.mp3',
    null,
    415,
    4
  ),
  (
    'Loving Kindness Meditation',
    'loving-kindness-meditation',
    '/audio/05_Loving_Kindness_Meditation.mp3',
    '/audio/05_Loving_Kindness_Meditation.mp3',
    null,
    571,
    5
  ),
  (
    'Body Sound Meditation',
    'body-sound-meditation',
    '/audio/06_Body-Sound-Meditation.mp3',
    '/audio/06_Body-Sound-Meditation.mp3',
    null,
    186,
    6
  ),
  (
    'Body Scan Meditation',
    'body-scan-meditation',
    '/audio/07_Body-Scan-Meditation.mp3',
    '/audio/07_Body-Scan-Meditation.mp3',
    null,
    165,
    7
  ),
  (
    'Body Scan for Sleep',
    'body-scan-for-sleep',
    '/audio/08_Body-Scan-for-Sleep.mp3',
    '/audio/08_Body-Scan-for-Sleep.mp3',
    null,
    830,
    8
  )
on conflict (slug) do update
set
  title = excluded.title,
  full_audio_path = excluded.full_audio_path,
  preview_audio_path = excluded.preview_audio_path,
  transcript_path = excluded.transcript_path,
  duration_seconds = excluded.duration_seconds,
  sort_order = excluded.sort_order;
