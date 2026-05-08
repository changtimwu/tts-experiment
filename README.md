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

## Notes

- Requires a network connection (calls the Edge Read Aloud API)
- Input text should be XML-escaped to avoid SSML injection
- Full voice list: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
