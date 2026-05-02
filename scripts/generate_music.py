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


def adsr(position: float, start: float, duration: float, attack = 0.08, release = 1.4) -> float:
    local = position - start
    if local < 0 or local > duration:
        return 0.0
    if local < attack:
        return local / attack
    if local > duration - release:
        return max(0.0, (duration - local) / release)
    return 1.0


def render_soft_piano() -> array:
    total_frames = SAMPLE_RATE * DURATION_SECONDS
    samples = array("h")
    progression = [
        [261.63, 329.63, 392.00, 523.25],
        [220.00, 261.63, 329.63, 440.00],
        [196.00, 246.94, 293.66, 392.00],
        [174.61, 220.00, 261.63, 349.23],
    ]

    for frame in range(total_frames):
        t = frame / SAMPLE_RATE
        bar = int(t // 4.0) % len(progression)
        bar_start = math.floor(t / 4.0) * 4.0
        signal = 0.0

        for step, frequency in enumerate(progression[bar]):
            start = bar_start + step * 0.55
            env = adsr(t, start, 3.1)
            if env <= 0:
                continue
            local = t - start
            decay = math.exp(-local * 0.55)
            tone = (
                math.sin(math.tau * frequency * t)
                + 0.22 * math.sin(math.tau * frequency * 2.0 * t)
                + 0.08 * math.sin(math.tau * frequency * 3.0 * t)
            )
            signal += tone * env * decay * 0.11

        low = math.sin(math.tau * (progression[bar][0] / 2.0) * t) * 0.035
        air = math.sin(math.tau * 880.0 * t + math.sin(t * 0.21)) * 0.006
        signal = (signal + low + air) * fade_envelope(t, DURATION_SECONDS)
        samples.append(int(clamp(signal * 0.55) * 32767))

    return samples


def render_bells_pad() -> array:
    rng = random.Random(RANDOM_SEED + 9)
    total_frames = SAMPLE_RATE * DURATION_SECONDS
    samples = array("h")
    pad_notes = [196.00, 261.63, 329.63, 392.00, 493.88]
    bell_notes = [523.25, 587.33, 659.25, 783.99, 880.00]
    phases = [rng.random() * math.tau for _ in pad_notes]

    for frame in range(total_frames):
        t = frame / SAMPLE_RATE
        signal = 0.0

        for index, frequency in enumerate(pad_notes):
            phase = phases[index] + math.tau * frequency * t
            drift = math.sin(math.tau * t / (19.0 + index * 4.0)) * 0.004
            signal += math.sin(phase + drift) * (0.05 / (index + 1) ** 0.25)

        pulse_start = math.floor(t / 5.0) * 5.0
        for index, frequency in enumerate(bell_notes):
            start = pulse_start + index * 0.38
            env = adsr(t, start, 4.2, attack=0.015, release=3.5)
            if env <= 0:
                continue
            local = t - start
            shimmer = math.exp(-local * 0.42)
            tone = (
                math.sin(math.tau * frequency * t)
                + 0.32 * math.sin(math.tau * frequency * 2.01 * t)
            )
            signal += tone * env * shimmer * 0.028

        breath = 0.82 + 0.18 * math.sin(math.tau * t / 12.0)
        signal *= breath * fade_envelope(t, DURATION_SECONDS)
        samples.append(int(clamp(signal * 0.62) * 32767))

    return samples


def write_wav(samples: array, output: Path) -> None:
    with wave.open(str(output), "wb") as wav:
      wav.setnchannels(1)
      wav.setsampwidth(2)
      wav.setframerate(SAMPLE_RATE)
      wav.writeframes(samples.tobytes())


def convert_to_m4a(wav_output: Path, m4a_output: Path) -> bool:
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
                str(wav_output),
                str(m4a_output),
            ],
            check=True,
        )
        return True
    except subprocess.CalledProcessError:
        m4a_output.unlink(missing_ok=True)
        return False


def render_track(name: str, samples: array, keep_wav: bool = False) -> None:
    wav_output = MUSIC_DIR / f"{name}.wav"
    m4a_output = MUSIC_DIR / f"{name}.m4a"
    write_wav(samples, wav_output)

    if convert_to_m4a(wav_output, m4a_output):
        if not keep_wav:
            wav_output.unlink(missing_ok=True)
        print(f"generated music: {m4a_output.relative_to(ROOT)}")
        if keep_wav:
            print(f"generated music: {wav_output.relative_to(ROOT)}")
    else:
        print(f"generated music: {wav_output.relative_to(ROOT)}")


def main() -> None:
    MUSIC_DIR.mkdir(parents=True, exist_ok=True)
    render_track("meditation-pad", render_pad())
    render_track("soft-piano-breath", render_soft_piano(), keep_wav=True)
    render_track("gentle-bells-pad", render_bells_pad(), keep_wav=True)


if __name__ == "__main__":
    main()
