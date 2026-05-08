import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from "fs";

fs.mkdirSync("./output", { recursive: true });

const tts = new MsEdgeTTS();
await tts.setMetadata("en-US-GuyNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

// rate: 0.5 = half speed, 2.0 = double speed (default 1.0)
// pitch: "+200Hz" raises pitch, "-100Hz" lowers it
// volume: 0-100 (default 100)
const variants = [
    { text: "This is normal speech.",          opts: {}                                          },
    { text: "This is slow, deep speech.",      opts: { rate: 0.6, pitch: "-100Hz", volume: 80 } },
    { text: "This is fast, high-pitched.",     opts: { rate: 1.8, pitch: "+150Hz"             } },
];

for (const { text, opts } of variants) {
    const { audioFilePath } = await tts.toFile("./output", text, opts);
    console.log(`Saved: ${audioFilePath}  (${JSON.stringify(opts)})`);
}
