import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

config({ path: "./gemini-api-key.env" });

const SYSTEM_PROMPT = `你是繁體中文台灣腔的語料工程師。任務是產出可用於訓練 Piper 中文 TTS 的句子。

嚴格遵守以下規則，違反任何一條都算失敗：
1. 一律使用台灣慣用的繁體中文與用詞，例如：捷運、便當、悠遊卡、超商、機車、健保、便利商店、夜市、捷安特、宅配、里長、便當盒等。
2. 禁止使用任何英文字母、阿拉伯數字、表情符號、網址、檔名或代號。所有數字一律寫成中文（例如「兩千二十六年」「下午三點半」「第二十一屆」）。
3. 整批句子要像一篇短文，主題一致、有先後邏輯、語氣連貫，但每一句仍須各自完整可獨立朗讀。
4. 每句長度落在 15 到 60 個中文字（含標點），讓 TTS 唸起來大約 5 到 15 秒。
5. 句式要充分多樣，避免句句長相一樣。請在批內混用：陳述、疑問、感嘆、條件、轉折、因果、比較、時間狀語、地點狀語、引述、列舉、並列、假設、讓步、建議、勸告、提醒、回憶、預測等。
6. 主動兼顧發音多樣性：盡量涵蓋 ㄓㄔㄕㄖ 與 ㄗㄘㄙ 對比、ㄣㄥ 對比、ㄢㄤ 對比、ㄧㄨㄩ 介音、輕聲與一二三四聲、雙字詞、三字詞、四字成語、台灣常見地名與人名等。
7. 每句結尾必須是中文標點 。 ？ ！ 三者之一。中間可酌量使用 ， 、 ； ：「」『』 等中文標點，但不要用半形標點。
8. 直接輸出每句一行，不要編號、不要項目符號、不要引號包整句、不要任何說明文字、不要 Markdown、不要空行。`;

const SENTENCES_PER_TOPIC = 10;
const OUTPUT_FILE = "./corpus.txt";
const PROGRESS_FILE = "./corpus-progress.json";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const topics = JSON.parse(fs.readFileSync("./topics.json", "utf-8"));

// Load progress so we can resume if interrupted
let progress = { done: [] };
if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
}
const done = new Set(progress.done);

const outStream = fs.createWriteStream(OUTPUT_FILE, { flags: "a" });

for (const topic of topics) {
    if (done.has(topic)) {
        console.log(`[skip] ${topic}`);
        continue;
    }

    process.stdout.write(`[gen]  ${topic} … `);

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: { systemInstruction: SYSTEM_PROMPT, maxOutputTokens: 1024 },
        contents: `主題：${topic}\n請產出 ${SENTENCES_PER_TOPIC} 句。`,
    });

    const text = response.text.trim();
    const sentences = text.split("\n").filter((l) => l.trim().length > 0);
    console.log(`${sentences.length} sentences`);

    for (const s of sentences) {
        outStream.write(s.trim() + "\n");
    }

    done.add(topic);
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ done: [...done] }, null, 2));

    // Brief pause to avoid rate-limit bursts
    await new Promise((r) => setTimeout(r, 300));
}

outStream.end();
console.log(`\nDone. Output: ${path.resolve(OUTPUT_FILE)}`);
console.log(`Total topics: ${done.size}`);
