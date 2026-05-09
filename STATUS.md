# Project Status

Goal: fine-tune a Piper TTS model for Traditional Chinese (Taiwan Mandarin) using a synthesized corpus.

## Done

### Corpus generation
- `topics.json` — 69 topic prompts covering daily life, travel, culture, sports, etc.
- `gen-corpus.js` — calls Gemini (`gemini-3-flash-preview`) with a strict prompt that enforces Taiwan-style zh-TW vocabulary, no Latin/Arabic characters, phonetic diversity, and proper Chinese punctuation; produces 10 sentences per topic (~690 total) into `corpus.txt`

### Voice synthesis (corpus → dataset)
- `corpus-to-voices.js` — reads `corpus.txt`, synthesizes each sentence with `msedge-tts` (voice: `zh-TW-HsiaoChenNeural`), converts to 22050 Hz 16-bit mono WAV via ffmpeg, and writes a Piper-compatible LJSpeech dataset:
  ```
  dataset/
    wavs/00001.wav … 00690.wav
    metadata.csv        (stem|sentence)
  ```
- Verified: WAV files play correctly, quality is good

### piper-train Docker image
- `Dockerfile.piper-train` builds `piper-train:jetson` on top of `dustynv/pytorch:2.6-r36.4.0-cu128-24.04`
- Resolved several hard dependency problems (see [issue #1](https://github.com/changtimwu/tts-experiment/issues/1)):
  - SM87 (Orin) CUDA kernels — only available in dustynv's custom pytorch build
  - `piper-phonemize` (no cp312/aarch64 PyPI wheel) — transplanted binary from `dustynv/piper-tts`
  - espeak-ng 1.52 with custom `espeak_TextToPhonemesWithTerminator` symbol — copied from piper-tts after apt install
- Verified imports and Chinese phonemization work inside the container:
  ```
  torch 2.6.0 | cuda True | lightning 1.9.5 | piper_train OK | piper_phonemize OK
  phonemize('你好台灣', 'cmn') → [['n','i','2','χ','ˈ','ɑ','u','2',...]]
  ```

## Not Done

### Fine-tuning (blocked: needs a proper GPU machine)

Jetson Orin Nano has only 8 GB unified RAM shared between CPU and GPU — not enough to run piper_train. To resume on a proper machine:

1. **Download pretrained zh_CN checkpoint** (~846 MB) from HuggingFace:
   ```
   huggingface-cli download rhasspy/piper-checkpoints \
     zh/zh_CN/huayan/medium/epoch=3269-step=2460540.ckpt \
     --repo-type dataset -d ./checkpoints
   ```

2. **Preprocess** the dataset into phoneme IDs:
   ```bash
   docker run --rm --runtime nvidia \
     -v $PWD/dataset:/dataset -v $PWD/training:/training \
     piper-train:jetson \
     python3 -m piper_train.preprocess \
       --language zh \
       --input-dir /dataset \
       --output-dir /training \
       --dataset-format ljspeech \
       --single-speaker \
       --sample-rate 22050
   ```

3. **Fine-tune**:
   ```bash
   docker run --rm --runtime nvidia \
     -v $PWD/training:/training -v $PWD/checkpoints:/checkpoints \
     piper-train:jetson \
     python3 -m piper_train \
       --dataset-dir /training \
       --accelerator gpu --devices 1 \
       --batch-size 16 \
       --max_epochs 10000 \
       --resume_from_single_speaker_checkpoint /checkpoints/pretrained.ckpt \
       --checkpoint-epochs 10 \
       --precision 32
   ```

4. **Export to ONNX**:
   ```bash
   python3 -m piper_train.export_onnx /checkpoints/last.ckpt /checkpoints/model.onnx
   cp /training/config.json /checkpoints/model.onnx.json
   ```

5. **Test inference** with the exported model using `dustynv/piper-tts`

## Notes
- `Dockerfile.piper-train` is portable — should work on any x86-64 or aarch64 machine with a proper NVIDIA GPU once the base image is swapped for the right platform tag
- On x86-64, replace `dustynv/pytorch:2.6-r36.4.0-cu128-24.04` with a standard `nvcr.io/nvidia/pytorch` image and install `piper-phonemize` from PyPI (cp310/cp311 wheels available)
