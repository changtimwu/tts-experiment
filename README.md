# tts-experiment

Experiments with [msedge-tts](https://github.com/migushthe2nd/msedgetts), a Node.js library that uses the Microsoft Edge Read Aloud API for text-to-speech synthesis. No API key required — works server-side out of the box.

## Setup

```bash
npm install
```

## Examples

| File | Description |
|---|---|
| `example-file.js` | Write TTS audio directly to an MP3 file using `toFile()` |
| `example-stream.js` | Pipe audio stream to a file using `toStream()` |
| `example-prosody.js` | Control speech `rate`, `pitch`, and `volume` |
| `example-boundaries.js` | Extract word/sentence boundary timing metadata |
| `example-voices.js` | Compare multiple Neural voices (EN, DE, JA) |

Run any example:

```bash
node example-file.js
```

Output MP3s are saved to the `./output/` directory.

## Corpus Generation

`gen-corpus.js` generates Traditional Chinese (Taiwan Mandarin) training sentences for [Piper TTS](https://github.com/rhasspy/piper) using the Gemini LLM.

### How it works

1. Reads 69 topic prompts from `topics.json` (daily life, travel, culture, sports, etc.)
2. For each topic, calls Gemini with a strict system prompt that enforces:
   - Taiwan-style Traditional Chinese vocabulary
   - No English letters, Arabic numerals, or emoji — all numbers written in Chinese
   - 15–60 characters per sentence (~5–15 seconds of speech)
   - Diverse sentence structures (statements, questions, exclamations, conditionals, etc.)
   - Phonetic diversity across Mandarin initials, finals, and tones
   - Chinese punctuation only
3. Appends the resulting sentences (10 per topic) to `corpus.txt`, one sentence per line

### Setup

Create `gemini-api-key.env` in the project root:

```
GEMINI_API_KEY=your-key-here
```

### Run

```bash
node gen-corpus.js
```

Output is saved to `corpus.txt` (~690 sentences total). Progress is tracked in `corpus-progress.json` — if the run is interrupted, re-running will skip already-completed topics and resume from where it left off.

## Voice Synthesis (corpus → dataset)

`corpus-to-voices.js` converts a text corpus into a [Piper](https://github.com/rhasspy/piper)-ready LJSpeech dataset by synthesizing each sentence with msedge-tts and transcoding to WAV via ffmpeg.

**Requires:** `ffmpeg` (`sudo apt install ffmpeg`)

### Output layout

```
dataset/
  wavs/
    00001.wav      # 22050 Hz, 16-bit mono PCM
    00002.wav
    …
  metadata.csv     # LJSpeech format: stem|sentence
  progress.json    # resume state (safe to delete when done)
```

### Run

```bash
node corpus-to-voices.js
```

With explicit options:

```bash
node corpus-to-voices.js \
  --input  corpus.txt            \
  --outdir ./dataset             \
  --voice  zh-TW-HsiaoChenNeural
```

| Option | Short | Default |
|---|---|---|
| `--input` | `-i` | `./corpus.txt` |
| `--outdir` | `-o` | `./dataset` |
| `--voice` | `-v` | `zh-TW-HsiaoChenNeural` |

Progress is saved after each sentence — re-running resumes from where it left off.

Available zh-TW voices: `zh-TW-HsiaoChenNeural` (female), `zh-TW-HsiaoYuNeural` (female), `zh-TW-YunJheNeural` (male).

## Full Pipeline

```bash
# 1. Generate corpus from topics
node gen-corpus.js          # → corpus.txt (~690 sentences)

# 2. Synthesize to WAV dataset
node corpus-to-voices.js    # → dataset/wavs/*.wav + metadata.csv
```

## Piper Training Environment (Jetson)

`Dockerfile.piper-train` builds a Docker image for fine-tuning Piper TTS on Jetson Orin (L4T R36.4 / JetPack 6.1, CUDA 12.8, SM87).

It layers on `dustynv/pytorch:2.6-r36.4.0-cu128-24.04` and transplants `piper_phonemize` from `dustynv/piper-tts:r36.4.0-cu128-24.04` (the only source of a pre-built cp312/aarch64 binary with espeak-ng 1.52).

### Build

```bash
docker build -f Dockerfile.piper-train -t piper-train:jetson .
```

### Run training

```bash
docker run --rm --runtime nvidia \
  -v $PWD/dataset:/dataset \
  -v $PWD/training:/training \
  -v $PWD/checkpoints:/checkpoints \
  piper-train:jetson bash
```

Inside the container, the three training steps are:

```bash
# 1. Preprocess dataset → phoneme IDs
python3 -m piper_train.preprocess \
  --language zh \
  --input-dir /dataset \
  --output-dir /training \
  --dataset-format ljspeech \
  --single-speaker \
  --sample-rate 22050

# 2. Fine-tune from a zh_CN checkpoint
python3 -m piper_train \
  --dataset-dir /training \
  --accelerator gpu --devices 1 \
  --batch-size 16 \
  --max_epochs 10000 \
  --resume_from_single_speaker_checkpoint /checkpoints/pretrained.ckpt \
  --checkpoint-epochs 10 \
  --precision 32

# 3. Export to ONNX for inference
python3 -m piper_train.export_onnx /checkpoints/last.ckpt /checkpoints/model.onnx
cp /training/config.json /checkpoints/model.onnx.json
```

## Notes

- TTS examples require a network connection (calls the Microsoft Edge Read Aloud API)
- Input text should be XML-escaped to avoid SSML injection
- Full voice list: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
