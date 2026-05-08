import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from "fs";

fs.mkdirSync("./output/zh-tw", { recursive: true });

const tts = new MsEdgeTTS();

const samples = [
    {
        voice: "zh-TW-HsiaoChenNeural",
        desc: "HsiaoChen (female)",
        text: "大家好，我是曉臻。歡迎來到台灣，這裡有美麗的風景和美味的小吃。",
    },
    {
        voice: "zh-TW-HsiaoYuNeural",
        desc: "HsiaoYu (female)",
        text: "台灣的夜市非常熱鬧，有各種各樣的美食，像是臭豆腐、珍珠奶茶和鹽酥雞。",
    },
    {
        voice: "zh-TW-YunJheNeural",
        desc: "YunJhe (male)",
        text: "科技改變了我們的生活方式。智慧型手機、人工智慧和網際網路讓世界變得更加便利。",
    },
];

for (const { voice, desc, text } of samples) {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {});
    const { audioFilePath } = await tts.toFile("./output/zh-tw", text);
    console.log(`[${desc}] → ${audioFilePath}`);
    console.log(`  "${text}"\n`);
}
