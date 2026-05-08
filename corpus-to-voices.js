/**
 * corpus-to-voices.js
 *
 * Reads a text corpus (one sentence per line) and synthesizes each sentence
 * to a WAV file using msedge-tts, producing a Piper-ready LJSpeech dataset.
 *
 * Output layout:
 *   <outdir>/
 *     wavs/
 *       00001.wav
 *       00002.wav
 *       ...
 *     metadata.csv      (LJSpeech format: filename_stem|text)
 *     progress.json     (resume state — safe to delete after completion)
 *
 * Usage:
 *   node corpus-to-voices.js [options]
 *
 * Options:
 *   --input  -i  Input corpus file          (default: ./corpus.txt)
 *   --outdir -o  Output dataset directory   (default: ./dataset)
 *   --voice  -v  Edge TTS voice name        (default: zh-TW-HsiaoChenNeural)
 */

import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const get = (flags, def) => {
    for (const f of flags) {
        const i = args.indexOf(f);
        if (i !== -1 && args[i + 1]) return args[i + 1];
    }
    return def;
};

const INPUT_FILE  = get(["--input",  "-i"], "./corpus.txt");
const OUT_DIR     = get(["--outdir", "-o"], "./dataset");
const VOICE       = get(["--voice",  "-v"], "zh-TW-HsiaoChenNeural");

// ── Setup ─────────────────────────────────────────────────────────────────────

const WAVS_DIR      = path.join(OUT_DIR, "wavs");
const METADATA_FILE = path.join(OUT_DIR, "metadata.csv");
const PROGRESS_FILE = path.join(OUT_DIR, "progress.json");

fs.mkdirSync(WAVS_DIR, { recursive: true });

if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Input file not found: ${INPUT_FILE}`);
    process.exit(1);
}

const sentences = fs
    .readFileSync(INPUT_FILE, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

console.log(`Input:  ${INPUT_FILE} (${sentences.length} sentences)`);
console.log(`Voice:  ${VOICE}`);
console.log(`Output: ${OUT_DIR}\n`);

// ── Resume state ──────────────────────────────────────────────────────────────

let progress = { done: 0 };
if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    console.log(`Resuming from sentence ${progress.done + 1}…\n`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad(n, width = 5) {
    return String(n).padStart(width, "0");
}

// Pipe an audio stream through ffmpeg → 22050 Hz 16-bit mono WAV
function streamToWav(audioStream, outPath) {
    return new Promise((resolve, reject) => {
        const ff = spawn("ffmpeg", [
            "-y",
            "-i", "pipe:0",
            "-ar", "22050",
            "-ac", "1",
            "-c:a", "pcm_s16le",
            outPath,
        ]);
        audioStream.pipe(ff.stdin);
        ff.stdin.on("error", () => {}); // ignore broken-pipe if ffmpeg exits early
        ff.stderr.on("data", () => {});  // suppress ffmpeg progress output
        ff.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`ffmpeg exited ${code} for ${outPath}`));
        });
    });
}

// ── Main loop ─────────────────────────────────────────────────────────────────

const tts = new MsEdgeTTS();
await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {});

const metaStream = fs.createWriteStream(METADATA_FILE, {
    flags: progress.done === 0 ? "w" : "a",
});

for (let i = progress.done; i < sentences.length; i++) {
    const sentence = sentences[i];
    const stem     = pad(i + 1);
    const wavPath  = path.join(WAVS_DIR, `${stem}.wav`);

    process.stdout.write(`[${stem}/${pad(sentences.length)}] ${sentence.slice(0, 40)}… `);

    const { audioStream } = tts.toStream(sentence);
    await streamToWav(audioStream, wavPath);

    metaStream.write(`${stem}|${sentence}\n`);

    progress.done = i + 1;
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

    console.log("✓");
}

metaStream.end();
console.log(`\nDone. ${sentences.length} WAV files → ${path.resolve(OUT_DIR)}`);
