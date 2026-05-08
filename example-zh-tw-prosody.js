// Demonstrate prosody (rate/pitch/volume) variations in Traditional Chinese
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from "fs";

fs.mkdirSync("./output/zh-tw", { recursive: true });

const tts = new MsEdgeTTS();
await tts.setMetadata("zh-TW-HsiaoChenNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

const variants = [
    { label: "normal",   text: "今天天氣真好，適合出去走走。",  opts: {}                                          },
    { label: "slow",     text: "今天天氣真好，適合出去走走。",  opts: { rate: 0.6                               } },
    { label: "fast",     text: "今天天氣真好，適合出去走走。",  opts: { rate: 1.8                               } },
    { label: "deep",     text: "今天天氣真好，適合出去走走。",  opts: { pitch: "-80Hz"                          } },
    { label: "high",     text: "今天天氣真好，適合出去走走。",  opts: { pitch: "+100Hz"                         } },
    { label: "dramatic", text: "注意！前方道路施工，請小心慢行。", opts: { rate: 0.8, pitch: "-50Hz", volume: 90 } },
];

for (const { label, text, opts } of variants) {
    const { audioFilePath } = await tts.toFile("./output/zh-tw", text, opts);
    console.log(`[${label}] ${audioFilePath}  ${JSON.stringify(opts)}`);
}
