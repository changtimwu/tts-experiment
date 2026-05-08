import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from "fs";

fs.mkdirSync("./output", { recursive: true });

const tts = new MsEdgeTTS();
await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {
    wordBoundaryEnabled: true,
    sentenceBoundaryEnabled: true,
});

const text = "Hello world. How are you doing today?";

const { audioStream, metadataStream } = tts.toStream(text);

// Collect and print word/sentence boundary events
const metaChunks = [];
metadataStream.on("data", (chunk) => metaChunks.push(chunk));
metadataStream.on("close", () => {
    const meta = JSON.parse(metaChunks.join(""));
    for (const item of meta.Metadata) {
        const { Type, Data } = item;
        const offsetMs = Data.Offset / 10000;   // 100-ns ticks → ms
        const durationMs = Data.Duration / 10000;
        console.log(`[${Type}] "${Data.text.Text}"  offset=${offsetMs.toFixed(0)}ms  duration=${durationMs.toFixed(0)}ms`);
    }
});

const out = fs.createWriteStream("./output/boundaries.mp3");
audioStream.pipe(out);
audioStream.on("close", () => console.log("Audio saved to ./output/boundaries.mp3"));
