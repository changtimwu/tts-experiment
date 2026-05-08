import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from "fs";

// Stream audio data and save to file manually
const tts = new MsEdgeTTS();
await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

const { audioStream } = tts.toStream("Hello! This is a streaming example using Microsoft Edge TTS.");

const out = fs.createWriteStream("./stream-output.mp3");
audioStream.pipe(out);

audioStream.on("close", () => {
    console.log("Stream closed — saved to stream-output.mp3");
});
