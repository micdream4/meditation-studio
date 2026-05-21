import type { GenerateRequest, GenerationDurationMinutes } from "@/types/api";

type ScriptIssue = {
  code: string;
  severity: "info" | "warn";
  message: string;
};

const TITLE_PATTERNS = [
  /^#+\s+/,
  /^title\s*:/i,
  /^guided meditation\s*:/i,
  /^meditation script\s*:/i,
] as const;

const PREFACE_PATTERNS = [
  /^here(?:'s| is) (?:a|your) .{0,80}meditation/i,
  /^certainly[,.]?\s+/i,
  /^of course[,.]?\s+/i,
  /^below is .{0,80}meditation/i,
] as const;

function targetWordRange(durationMinutes: GenerationDurationMinutes) {
  switch (durationMinutes) {
    case 1:
      return { min: 90, max: 170 };
    case 5:
      return { min: 450, max: 650 };
    case 10:
      return { min: 900, max: 1200 };
    case 15:
      return { min: 1300, max: 1700 };
    case 20:
      return { min: 1700, max: 2200 };
  }
}

function normalizePauseMarker(line: string) {
  return line
    .replace(/\[(?:short\s+pause|pause\s+short)\]/gi, "[pause short]")
    .replace(/\[(?:long\s+pause|pause\s+long)\]/gi, "[pause long]")
    .replace(/\[(?:medium\s+pause|pause\s+medium|pause)\]/gi, "[pause]");
}

function cleanLine(line: string) {
  return normalizePauseMarker(line)
    .replace(/^\s*[-*]\s+/, "")
    .replace(/^\s*\d+[.)]\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isPauseParagraph(paragraph: string) {
  return /^\[pause(?: short| long)?\]$/i.test(paragraph);
}

function getMaxPauseMarkers(input: GenerateRequest["input"]) {
  if (input.durationMinutes === 1) {
    if (input.mode === "template" && input.theme === "sleep-wind-down") return 6;
    if (input.mode === "mood" && input.mood === "sleepless") return 6;
    return 5;
  }

  return Math.max(6, input.durationMinutes * 4);
}

function limitPauseMarkers(
  paragraphs: string[],
  input: GenerateRequest["input"] | undefined,
) {
  const limited = [...paragraphs];

  while (limited.length > 0 && isPauseParagraph(limited[limited.length - 1]!)) {
    limited.pop();
  }

  if (!input) return limited;

  const maxPauseMarkers = getMaxPauseMarkers(input);
  const getPauseIndexes = () =>
    limited
      .map((paragraph, index) => ({ paragraph, index }))
      .filter(({ paragraph }) => isPauseParagraph(paragraph));

  while (getPauseIndexes().length > maxPauseMarkers) {
    const pauseIndexes = getPauseIndexes();
    const removableShortPause = [...pauseIndexes]
      .reverse()
      .find(({ paragraph }) => /^\[pause short\]$/i.test(paragraph));
    const removablePause =
      removableShortPause ??
      [...pauseIndexes]
        .reverse()
        .find(({ index }) => index > 1) ??
      pauseIndexes[pauseIndexes.length - 1];

    if (!removablePause) break;
    limited.splice(removablePause.index, 1);
  }

  return limited;
}

export function normalizeMeditationScript(rawScript: string) {
  const withoutFences = rawScript
    .replace(/```(?:text|markdown)?/gi, "")
    .replace(/```/g, "")
    .replace(/\r\n/g, "\n")
    .trim();

  const cleanedLines = withoutFences
    .split("\n")
    .map(cleanLine)
    .filter(Boolean)
    .filter((line, index) => {
      if (index > 4) return true;
      if (TITLE_PATTERNS.some((pattern) => pattern.test(line))) return false;
      return !PREFACE_PATTERNS.some((pattern) => pattern.test(line));
    });

  const paragraphs: string[] = [];
  let current: string[] = [];

  for (const line of cleanedLines) {
    const isPause = /^\[pause(?: short| long)?\]$/i.test(line);
    if (isPause) {
      if (current.length > 0) {
        paragraphs.push(current.join(" "));
        current = [];
      }
      paragraphs.push(line.toLowerCase());
      continue;
    }

    current.push(line);
    if (/[.!?]$/.test(line) && current.join(" ").length > 260) {
      paragraphs.push(current.join(" "));
      current = [];
    }
  }

  if (current.length > 0) {
    paragraphs.push(current.join(" "));
  }

  return limitPauseMarkers(paragraphs, undefined)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeMeditationScriptForInput(
  rawScript: string,
  input: GenerateRequest["input"],
) {
  const normalized = normalizeMeditationScript(rawScript);
  const paragraphs = normalized.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);

  return limitPauseMarkers(paragraphs, input)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function analyzeMeditationScript(
  script: string,
  input: GenerateRequest["input"],
) {
  const words = script.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
  const pauseMarkers = script.match(/\[pause(?: short| long)?\]/gi) ?? [];
  const sentences = script
    .replace(/\[pause(?: short| long)?\]/gi, "")
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const longSentences = sentences.filter((sentence) => {
    const count = sentence.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length ?? 0;
    return count > 32;
  });
  const range = targetWordRange(input.durationMinutes);
  const issues: ScriptIssue[] = [];

  if (words.length < range.min) {
    issues.push({
      code: "word_count_low",
      severity: "warn",
      message: `Script has ${words.length} words; target minimum is ${range.min}.`,
    });
  }

  if (words.length > range.max) {
    issues.push({
      code: "word_count_high",
      severity: "warn",
      message: `Script has ${words.length} words; target maximum is ${range.max}.`,
    });
  }

  if (longSentences.length > Math.max(2, sentences.length * 0.12)) {
    issues.push({
      code: "long_sentences",
      severity: "warn",
      message: "Script has too many long sentences for spoken meditation audio.",
    });
  }

  if (pauseMarkers.length < Math.max(1, Math.floor(input.durationMinutes / 2))) {
    issues.push({
      code: "few_pauses",
      severity: "info",
      message: "Script uses few explicit pause markers.",
    });
  }

  if (pauseMarkers.length > getMaxPauseMarkers(input)) {
    issues.push({
      code: "too_many_pauses",
      severity: "warn",
      message: "Script uses too many explicit pause markers.",
    });
  }

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    pauseCount: pauseMarkers.length,
    longSentenceCount: longSentences.length,
    issues,
  };
}

export function prepareMeditationScriptForAudio(
  rawScript: string,
  input: GenerateRequest["input"],
) {
  const script = normalizeMeditationScriptForInput(rawScript, input);
  const quality = analyzeMeditationScript(script, input);

  if (quality.issues.some((issue) => issue.severity === "warn")) {
    console.warn("meditation_script_quality", {
      mode: input.mode,
      durationMinutes: input.durationMinutes,
      wordCount: quality.wordCount,
      pauseCount: quality.pauseCount,
      issues: quality.issues,
    });
  }

  return { script, quality };
}
