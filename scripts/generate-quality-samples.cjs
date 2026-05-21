/* eslint-disable @typescript-eslint/no-require-imports */

const { existsSync, readFileSync } = require("node:fs");
const { mkdir, writeFile } = require("node:fs/promises");
const path = require("node:path");
const Module = require("node:module");
const { createJiti } = require("jiti");

function loadEnvFile(filename) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) continue;

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveProjectAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(process.cwd(), "src", request.slice(2)),
      parent,
      isMain,
      options,
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const jiti = createJiti(`${process.cwd()}/`);
const { generateMeditationScript } = jiti("../src/lib/openrouter.ts");
const {
  prepareMeditationScriptForAudio,
} = jiti("../src/lib/script-quality.ts");
const {
  listVoices,
  synthesizeSpeechSegments,
} = jiti("../src/lib/elevenlabs.ts");

const DEFAULT_SCENARIOS = [
  {
    slug: "anxiety-release-1min",
    label: "Anxiety release, 1 minute",
    input: { mode: "template", theme: "anxiety-release", durationMinutes: 1 },
  },
  {
    slug: "sleep-wind-down-1min",
    label: "Sleep wind-down, 1 minute",
    input: { mode: "template", theme: "sleep-wind-down", durationMinutes: 1 },
  },
  {
    slug: "focus-reset-1min",
    label: "Focus reset, 1 minute",
    input: { mode: "template", theme: "focus-reset", durationMinutes: 1 },
  },
];

function parseArgs() {
  const rawArgs = process.argv.slice(2);
  const args = new Set(rawArgs);
  const voiceCount = Number(
    rawArgs.find((arg) => arg.startsWith("--voice-count="))?.slice("--voice-count=".length) ??
      "1",
  );

  return {
    all: args.has("--all"),
    outputDir: rawArgs.find((arg) => arg.startsWith("--out="))?.slice("--out=".length) ??
      ".tmp/quality-samples",
    voiceCount: Number.isFinite(voiceCount) ? Math.max(1, Math.min(voiceCount, 8)) : 1,
  };
}

async function decodeMp3DurationSeconds(audioBuffer) {
  const decodeMp3 = (await import("@audio/decode-mp3")).default;
  const audio = await decodeMp3(audioBuffer);
  const frames = audio.channelData[0]?.length ?? 0;
  return frames / audio.sampleRate;
}

function formatDuration(seconds) {
  return `${seconds.toFixed(1)}s`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "voice";
}

function getScenarioVerdict({ quality, durationSeconds, targetMinutes }) {
  const targetSeconds = targetMinutes * 60;
  const durationRatio = durationSeconds / targetSeconds;
  const hasWarnings = quality.issues.some((issue) => issue.severity === "warn");

  if (hasWarnings) return "needs-review";
  if (durationRatio < 0.72 || durationRatio > 1.28) return "needs-review";
  return "candidate";
}

function buildMarkdownReport(results) {
  const voiceSummaries = Array.from(
    results.reduce((summaries, result) => {
      const key = result.voice.id;
      const existing = summaries.get(key) ?? {
        voice: result.voice,
        total: 0,
        candidates: 0,
        needsReview: 0,
        durations: [],
      };
      existing.total++;
      if (result.verdict === "candidate") existing.candidates++;
      if (result.verdict === "needs-review") existing.needsReview++;
      existing.durations.push(result.durationSeconds);
      summaries.set(key, existing);
      return summaries;
    }, new Map()).values(),
  );
  const lines = [
    "# Meditation Studio Quality Samples",
    "",
    "Use this report to judge whether the project moved closer to the product success target: a paying user should want to listen, save, replay, and download the generated session.",
    "",
    "## Voice Summary",
    "",
    "| Voice | Candidate | Needs review | Avg duration | Notes |",
    "|---|---:|---:|---:|---|",
  ];

  for (const summary of voiceSummaries) {
    const avgDuration =
      summary.durations.reduce((total, duration) => total + duration, 0) /
      summary.durations.length;
    lines.push([
      summary.voice.name,
      `${summary.candidates}/${summary.total}`,
      String(summary.needsReview),
      formatDuration(avgDuration),
      "",
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push(
    "",
    "## Samples",
    "",
    "| Scenario | Voice | Duration | Words | Pauses | Long sentences | Verdict | Audio | Script | Listen score | Save score | Notes |",
    "|---|---|---:|---:|---:|---:|---|---|---|---:|---:|---|",
  );

  for (const result of results) {
    lines.push([
      result.label,
      result.voice.name,
      formatDuration(result.durationSeconds),
      String(result.quality.wordCount),
      String(result.quality.pauseCount),
      String(result.quality.longSentenceCount),
      result.verdict,
      `[mp3](${path.basename(result.audioPath)})`,
      `[txt](${path.basename(result.scriptPath)})`,
      "",
      "",
      "",
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push(
    "",
    "Manual listening checklist:",
    "",
    "- Would a user willingly listen to the whole session?",
    "- Would a user save it for later?",
    "- Do the voice, pauses, and pacing fit the selected scenario?",
    "- Does it avoid diagnosis, treatment claims, hype, and false reassurance?",
    "- Does it feel meaningfully better than generic ChatGPT plus TTS?",
  );

  return `${lines.join("\n")}\n`;
}

async function generateScenarioScript({ scenario, outputDir }) {
  const rawScript = await generateMeditationScript(scenario.input);
  const prepared = prepareMeditationScriptForAudio(rawScript, scenario.input);
  const scriptPath = path.join(outputDir, `${scenario.slug}.txt`);
  await writeFile(scriptPath, prepared.script);

  return { prepared, scriptPath };
}

async function synthesizeScenarioVoice({
  scenario,
  voice,
  prepared,
  scriptPath,
  outputDir,
}) {
  const audioBuffer = await synthesizeSpeechSegments(
    prepared.script,
    voice.id,
    scenario.input,
  );
  const durationSeconds = await decodeMp3DurationSeconds(audioBuffer);
  const voiceSlug = slugify(`${voice.name}-${voice.id.slice(0, 6)}`);
  const audioPath = path.join(outputDir, `${scenario.slug}--${voiceSlug}.mp3`);

  await writeFile(audioPath, audioBuffer);

  return {
    slug: `${scenario.slug}--${voiceSlug}`,
    label: scenario.label,
    input: scenario.input,
    voice,
    audioPath,
    scriptPath,
    durationSeconds,
    bytes: audioBuffer.length,
    quality: prepared.quality,
    verdict: getScenarioVerdict({
      quality: prepared.quality,
      durationSeconds,
      targetMinutes: scenario.input.durationMinutes,
    }),
  };
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY.");
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("Missing ELEVENLABS_API_KEY.");
  }

  const options = parseArgs();
  const outputDir = path.resolve(process.cwd(), options.outputDir);
  const scenarios = options.all ? DEFAULT_SCENARIOS : DEFAULT_SCENARIOS.slice(0, 1);

  await mkdir(outputDir, { recursive: true });

  const voices = await listVoices();
  const selectedVoices = voices.slice(0, options.voiceCount);
  if (selectedVoices.length === 0) {
    throw new Error("No ElevenLabs voices are available.");
  }

  const results = [];
  for (const scenario of scenarios) {
    console.log(`Generating script for ${scenario.slug}...`);
    const { prepared, scriptPath } = await generateScenarioScript({ scenario, outputDir });

    for (const voice of selectedVoices) {
      console.log(`Synthesizing ${scenario.slug} with ${voice.name}...`);
      results.push(await synthesizeScenarioVoice({
        scenario,
        voice,
        prepared,
        scriptPath,
        outputDir,
      }));
    }
  }

  const jsonPath = path.join(outputDir, "quality-report.json");
  const markdownPath = path.join(outputDir, "quality-report.md");
  await writeFile(jsonPath, `${JSON.stringify(results, null, 2)}\n`);
  await writeFile(markdownPath, buildMarkdownReport(results));

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${markdownPath}`);
  for (const result of results) {
    console.log(
      `${result.verdict}: ${result.slug} ${formatDuration(result.durationSeconds)} ${result.audioPath}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
