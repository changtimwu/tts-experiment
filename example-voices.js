// List a curated set of voices and generate a sample clip for each.
// Full voice list: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support

import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from "fs";

fs.mkdirSync("./output/voices", { recursive: true });

const voices = [
    { name: "en-US-AriaNeural",   sample: "Hi, I'm Aria from the United States."      },
    { name: "en-GB-SoniaNeural",  sample: "Hello, I'm Sonia from Great Britain."       },
    { name: "en-AU-NatashaNeural",sample: "G'day, I'm Natasha from Australia."         },
    { name: "en-IE-ConnorNeural", sample: "Hello there, I'm Connor from Ireland."      },
    { name: "de-DE-KatjaNeural",  sample: "Hallo, ich bin Katja aus Deutschland."      },
    { name: "ja-JP-NanamiNeural", sample: "こんにちは、七海です。"                          },
];

const tts = new MsEdgeTTS();

for (const { name, sample } of voices) {
    await tts.setMetadata(name, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioFilePath } = await tts.toFile(`./output/voices`, sample);
    console.log(`${name} → ${audioFilePath}`);
}
