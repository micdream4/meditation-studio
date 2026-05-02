import decodeMp3 from "@audio/decode-mp3";

import { DEFAULT_MUSIC_VOLUME } from "@/lib/music";

const EXPORT_SAMPLE_RATE = 24_000;
const EXPORT_MUSIC_VOLUME = DEFAULT_MUSIC_VOLUME * 1.35;

type PcmAudioData = {
  channelData: Float32Array[];
  sampleRate: number;
};

function clamp16Bit(value: number) {
  return Math.max(-1, Math.min(1, value));
}

function readAscii(view: DataView, offset: number, length: number) {
  let value = "";
  for (let i = 0; i < length; i++) {
    value += String.fromCharCode(view.getUint8(offset + i));
  }
  return value;
}

function decodePcmWav(bytes: Uint8Array): PcmAudioData {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (readAscii(view, 0, 4) !== "RIFF" || readAscii(view, 8, 4) !== "WAVE") {
    throw new Error("Unsupported WAV file.");
  }

  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let audioFormat = 0;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset + 8 <= view.byteLength) {
    const chunkId = readAscii(view, offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkDataOffset = offset + 8;

    if (chunkId === "fmt ") {
      audioFormat = view.getUint16(chunkDataOffset, true);
      channels = view.getUint16(chunkDataOffset + 2, true);
      sampleRate = view.getUint32(chunkDataOffset + 4, true);
      bitsPerSample = view.getUint16(chunkDataOffset + 14, true);
    } else if (chunkId === "data") {
      dataOffset = chunkDataOffset;
      dataSize = chunkSize;
      break;
    }

    offset = chunkDataOffset + chunkSize + (chunkSize % 2);
  }

  if (audioFormat !== 1 || bitsPerSample !== 16 || channels < 1 || dataOffset < 0) {
    throw new Error("Only 16-bit PCM WAV background audio is supported.");
  }

  const frameCount = Math.floor(dataSize / (channels * 2));
  const channelData = Array.from({ length: channels }, () => new Float32Array(frameCount));

  for (let frame = 0; frame < frameCount; frame++) {
    for (let channel = 0; channel < channels; channel++) {
      const sampleOffset = dataOffset + (frame * channels + channel) * 2;
      channelData[channel]![frame] = view.getInt16(sampleOffset, true) / 32768;
    }
  }

  return { channelData, sampleRate };
}

function sampleMono(audio: PcmAudioData, frame: number) {
  const firstChannel = audio.channelData[0];
  if (!firstChannel || firstChannel.length === 0) {
    return 0;
  }

  const lowerIndex = Math.floor(frame);
  if (lowerIndex < 0) return 0;

  const upperIndex = lowerIndex + 1;
  const amount = frame - lowerIndex;
  let sum = 0;
  let channels = 0;

  for (const channel of audio.channelData) {
    const lower = channel[lowerIndex] ?? 0;
    const upper = channel[upperIndex] ?? lower;
    sum += lower + (upper - lower) * amount;
    channels++;
  }

  return channels > 0 ? sum / channels : 0;
}

function sampleLoopingMono(audio: PcmAudioData, frame: number) {
  const length = audio.channelData[0]?.length ?? 0;
  if (length === 0) return 0;
  return sampleMono(audio, frame % length);
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function encodeMonoWav(samples: Int16Array, sampleRate: number) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * bytesPerSample, samples[i]!, true);
  }

  return buffer;
}

export async function mixMeditationAudioToWav({
  speechBytes,
  musicBytes,
}: {
  speechBytes: Uint8Array;
  musicBytes: Uint8Array;
}) {
  const [speech, music] = await Promise.all([
    decodeMp3(speechBytes),
    Promise.resolve(decodePcmWav(musicBytes)),
  ]);
  const speechLength = speech.channelData[0]?.length ?? 0;
  const durationSeconds = speechLength / speech.sampleRate;
  const outputFrames = Math.max(1, Math.ceil(durationSeconds * EXPORT_SAMPLE_RATE));
  const samples = new Int16Array(outputFrames);

  for (let i = 0; i < outputFrames; i++) {
    const t = i / EXPORT_SAMPLE_RATE;
    const speechSample = sampleMono(speech, t * speech.sampleRate);
    const musicSample = sampleLoopingMono(music, t * music.sampleRate) * EXPORT_MUSIC_VOLUME;
    const limited = Math.tanh((speechSample * 0.98 + musicSample) * 1.05);
    samples[i] = Math.round(clamp16Bit(limited) * 32767);
  }

  return encodeMonoWav(samples, EXPORT_SAMPLE_RATE);
}
