from __future__ import annotations

import math
from array import array
from pathlib import Path

import lameenc

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "music" / "piano-light-1.mp3"
SAMPLE_RATE = 44100
CHANNELS = 2
DURATION_SECONDS = 96


def adsr(position: float, duration: float) -> float:
    attack = min(0.04, duration * 0.08)
    decay = min(0.25, duration * 0.15)
    release = min(0.4, duration * 0.2)
    sustain = max(0.0, duration - attack - decay - release)

    if position < attack:
        return position / attack
    if position < attack + decay:
        decay_progress = (position - attack) / decay
        return 1.0 - decay_progress * 0.3
    if position < attack + decay + sustain:
        return 0.7
    release_progress = (position - attack - decay - sustain) / release
    return max(0.0, 0.7 * (1.0 - release_progress))


def note_wave(frequency: float, time_value: float) -> float:
    return (
        math.sin(2 * math.pi * frequency * time_value) * 0.72
        + math.sin(2 * math.pi * frequency * 2 * time_value) * 0.18
        + math.sin(2 * math.pi * frequency * 3 * time_value) * 0.10
    )


def build_score():
    return [
        ([261.63, 329.63, 392.00], 3.0),
        ([293.66, 369.99, 440.00], 3.0),
        ([220.00, 293.66, 349.23], 3.0),
        ([246.94, 311.13, 392.00], 3.0),
    ]


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    score = build_score()
    total_frames = SAMPLE_RATE * DURATION_SECONDS
    samples = array("h")

    for frame in range(total_frames):
        current_time = frame / SAMPLE_RATE
        block_index = int(current_time // 3.0) % len(score)
        chord, chord_duration = score[block_index]
        block_start = int(current_time // 3.0) * 3.0
        local_time = current_time - block_start

        signal = 0.0
        for note_index, frequency in enumerate(chord):
            onset = note_index * 0.24
            note_duration = max(0.9, chord_duration - onset + 0.25)
            note_time = local_time - onset
            if 0 <= note_time <= note_duration:
                signal += note_wave(frequency, note_time) * adsr(note_time, note_duration)

        signal *= 0.12
        drift = 0.97 + 0.03 * math.sin(2 * math.pi * current_time / 12.0)
        left = max(-1.0, min(1.0, signal * drift))
        right = max(-1.0, min(1.0, signal * (2.0 - drift)))
        samples.append(int(left * 32767))
        samples.append(int(right * 32767))

    encoder = lameenc.Encoder()
    encoder.set_bit_rate(128)
    encoder.set_in_sample_rate(SAMPLE_RATE)
    encoder.set_channels(CHANNELS)
    encoder.set_quality(2)

    encoded = encoder.encode(samples.tobytes()) + encoder.flush()
    OUTPUT.write_bytes(encoded)
    print(f"generated music: {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
