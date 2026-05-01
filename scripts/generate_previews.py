from __future__ import annotations

from pathlib import Path

import lameenc
import miniaudio

ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "public" / "audio"
PREVIEW_DIR = AUDIO_DIR / "preview"
TARGET_SECONDS = 60


def encode_mp3(raw_pcm: bytes, sample_rate: int, channels: int) -> bytes:
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(128)
    encoder.set_in_sample_rate(sample_rate)
    encoder.set_channels(channels)
    encoder.set_quality(2)
    return encoder.encode(raw_pcm) + encoder.flush()


def main() -> None:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)

    for source in sorted(AUDIO_DIR.glob("*.mp3")):
        decoded = miniaudio.decode_file(str(source))
        frames_to_keep = min(int(decoded.sample_rate * TARGET_SECONDS), decoded.num_frames)
        samples_to_keep = frames_to_keep * decoded.nchannels
        clipped_pcm = bytes(decoded.samples[:samples_to_keep])
        encoded = encode_mp3(clipped_pcm, decoded.sample_rate, decoded.nchannels)
        target = PREVIEW_DIR / source.name
        target.write_bytes(encoded)
        print(f"generated preview: {target.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
