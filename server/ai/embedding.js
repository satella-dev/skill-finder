import OpenAI from "openai";
import { OPENAI_KEY } from "../config.js";

const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;

export function hasKorean(text) { return /[\uac00-\ud7af]/.test(text); }

export async function translateToEnglish(text) {
  if (!openai) return text;
  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Translate Korean to English. Keep tech terms. Output ONLY translation." },
        { role: "user", content: text }
      ],
      max_tokens: 100, temperature: 0
    });
    return resp.choices[0].message.content.trim();
  } catch { return text; }
}

export async function getEmbedding(text) {
  if (!openai) return null;
  try {
    const resp = await openai.embeddings.create({ model: "text-embedding-3-small", input: [text] });
    return resp.data[0].embedding;
  } catch { return null; }
}
