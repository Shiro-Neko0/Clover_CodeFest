import Anthropic from '@anthropic-ai/sdk';

// All Claude calls live here, on the server, so the API key never reaches the browser.
let client;
const getClient = () => (client ||= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));
const MODEL = () => process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

// Words that should always send the person to emergency help, whatever the AI says.
export const RED_FLAGS = /chest pain|chest tight|can'?t breathe|trouble breathing|short of breath|sesak nafas|sakit dada|dada sakit|pengsan|faint(ed)?|stroke|numb face|slurred/i;

// Claude needs the chat to start with a user message and to alternate user / assistant.
// Our chat starts with clover's greeting, so we drop leading bot messages and merge neighbours with the same role.
const toMessages = (messages) => {
  const out = [];
  for (const m of messages) {
    const role = m.from === 'user' ? 'user' : 'assistant';
    const text = String(m.text).slice(0, 1500);
    if (!out.length && role === 'assistant') continue;
    if (out.length && out[out.length - 1].role === role) out[out.length - 1].content += '\n' + text;
    else out.push({ role, content: text });
  }
  return out;
};

async function generate({ system, messages, temperature = 0.3, maxTokens = 700 }) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set.');
  const res = await getClient().messages.create({
    model: MODEL(),
    max_tokens: maxTokens,
    temperature,
    system,
    messages
  });
  return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
}

// Claude has no "JSON mode", so we take everything between the first { and the last }.
const safeJSON = (text) => {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    return JSON.parse(text.slice(start, end + 1));
  } catch { return null; }
};

const CHECKIN_SYSTEM = `You are clover, a warm and plain-spoken daily check-in buddy for older people in Malaysia.
Reply in the language the person uses (English, Bahasa Melayu, or a mix). Use short sentences. Ask only ONE question at a time.
Cover these topics, in this order, skipping what you already know: 1) how many hours they slept, 2) what they ate today, 3) warning signs (chest pain, trouble breathing, dizziness, swollen feet), 4) blood pressure if they measured it (optional).
Never diagnose and never tell them to change medicine. If they mention chest pain or trouble breathing, tell them to call 999 and say you are telling their caregiver.
When all four topics are covered, thank them and set "done" to true.
Return ONLY JSON in this shape, with no other text:
{"reply": string, "extracted": {"sleepHours": number|null, "bpSys": number|null, "bpDia": number|null, "symptoms": string[], "meals": [{"name": string, "kcal": number}]}, "done": boolean}
Only extract facts from the person's LATEST message. Use null or [] when the latest message has no such fact.
For meals, estimate kcal for a typical Malaysian portion of each dish.`;

export async function checkinTurn(messages) {
  const text = await generate({ system: CHECKIN_SYSTEM, messages: toMessages(messages), temperature: 0.2 });
  const out = safeJSON(text);
  if (!out || typeof out.reply !== 'string') {
    return { reply: 'Sorry, I did not catch that. Could you say it again?', extracted: {}, done: false };
  }
  return { reply: out.reply, extracted: out.extracted || {}, done: !!out.done };
}

const MEAL_SYSTEM = `You look at a photo of a meal and estimate its nutrition for a typical single portion, for an older person in Malaysia who may have diabetes or high blood pressure.
Return ONLY JSON, with no other text: {"name": string, "kcal": number, "carbs": number, "protein": number, "fat": number, "tip": string, "isFood": boolean}
carbs, protein and fat are grams. "tip" is ONE short, kind suggestion (for example a smaller rice portion or more vegetables). If the photo is not food, set isFood to false and use zeros.`;

export async function analyzeMeal({ base64, mimeType }) {
  const messages = [{
    role: 'user',
    content: [
      { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
      { type: 'text', text: 'What is in this meal and how much nutrition does it have?' }
    ]
  }];
  const out = safeJSON(await generate({ system: MEAL_SYSTEM, messages, temperature: 0.2 }));
  if (!out) throw new Error('The AI did not return a readable answer. Please try again.');
  return out;
}

const CHAT_SYSTEM = `You are clover, a friendly health buddy for older people in Malaysia. Reply in the language the person uses.
Use short, simple sentences and no jargon. Give general information only. You are not a doctor: do not diagnose and do not change doses.
For anything urgent (chest pain, trouble breathing, fainting, stroke signs) tell them to call 999 straight away.
For medicine questions, suggest checking the label or asking their pharmacist or doctor. Keep answers under 90 words.`;

export const chatTurn = (messages) =>
  generate({ system: CHAT_SYSTEM, messages: toMessages(messages), temperature: 0.5, maxTokens: 300 });