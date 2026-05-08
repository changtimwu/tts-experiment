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

## Notes

- TTS examples require a network connection (calls the Microsoft Edge Read Aloud API)
- Input text should be XML-escaped to avoid SSML injection
- Full voice list: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
