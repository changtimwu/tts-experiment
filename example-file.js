import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from "fs";

const tts = new MsEdgeTTS();
await tts.setMetadata("en-GB-SoniaNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

fs.mkdirSync("./output", { recursive: true });

const { audioFilePath } = await tts.toFile("./output", "This audio was written directly to a file using the toFile method.");
console.log("Audio saved to:", audioFilePath);
