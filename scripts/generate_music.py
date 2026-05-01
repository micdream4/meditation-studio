from __future__ import annotations

import math
import random
import shutil
import subprocess
import wave
from array import array
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MUSIC_DIR = ROOT / "public" / "music"
WAV_OUTPUT = MUSIC_DIR / "meditation-pad.wav"
M4A_OUTPUT = MUSIC_DIR / "meditation-pad.m4a"

SAMPLE_RATE = 24000
DURATION_SECONDS = 180
RANDOM_SEED = 250501


def clamp(value: float) -> float:
    return max(-1.0, min(1.0, value))


def fade_envelope(position: float, duration: float) -> float:
    fade_seconds = 8.0
    fade_in = min(1.0, position / fade_seconds)
    fade_out = min(1.0, (duration - position) / fade_seconds)
    return max(0.0, min(fade_in, fade_out))


def smooth_noise(previous: float, target: float, amount: float) -> float:
    return previous + (target - previous) * amount


def render_pad() -> array:
    rng = random.Random(RANDOM_SEED)
    total_frames = SAMPLE_RATE * DURATION_SECONDS
    samples = array("h")

    chord = [110.0, 146.83, 196.0, 220.0, 293.66]
    phases = [rng.random() * math.tau for _ in chord]
    detune = [rng.uniform(-0.08, 0.08) for _ in chord]
    noise_value = 0.0
    noise_target = 0.0

    for frame in range(total_frames):
        t = frame / SAMPLE_RATE
        if frame % 900 == 0:
            noise_target = rng.uniform(-1.0, 1.0)
        noise_value = smooth_noise(noise_value, noise_target, 0.0008)

        pad = 0.0
        for index, frequency in enumerate(chord):
            slow_lfo = 1.0 + 0.0015 * math.sin(math.tau * t / (23.0 + index * 3.0))
            phase = phases[index] + math.tau * (frequency + detune[index]) * slow_lfo * t
            overtone = math.sin(phase * 2.0) * 0.08
            pad += (math.sin(phase) + overtone) * (0.18 / (index + 1) ** 0.4)

        breath = 0.72 + 0.28 * math.sin(math.tau * t / 9.5) ** 2
        shimmer = math.sin(math.tau * 528.0 * t + math.sin(math.tau * t / 17.0)) * 0.015
        low_air = noise_value * 0.035
        signal = (pad * breath + shimmer + low_air) * fade_envelope(t, DURATION_SECONDS)

        samples.append(int(clamp(signal * 0.34) * 32767))

    return samples


def write_wav(samples: array) -> None:
    with wave.open(str(WAV_OUTPUT), "wb") as wav:
      wav.setnchannels(1)
      wav.setsampwidth(2)
      wav.setframerate(SAMPLE_RATE)
      wav.writeframes(samples.tobytes())


def convert_to_m4a() -> bool:
    if not shutil.which("afconvert"):
        return False

    try:
        subprocess.run(
            [
                "afconvert",
                "-f",
                "m4af",
                "-d",
                "aac",
                str(WAV_OUTPUT),
                str(M4A_OUTPUT),
            ],
            check=True,
        )
        return True
    except subprocess.CalledProcessError:
        M4A_OUTPUT.unlink(missing_ok=True)
        return False


def main() -> None:
    MUSIC_DIR.mkdir(parents=True, exist_ok=True)
    samples = render_pad()
    write_wav(samples)

    if convert_to_m4a():
        WAV_OUTPUT.unlink(missing_ok=True)
        print(f"generated music: {M4A_OUTPUT.relative_to(ROOT)}")
    else:
        print(f"generated music: {WAV_OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
