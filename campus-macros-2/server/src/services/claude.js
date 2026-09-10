// Anthropic API — photo macro estimates and menu macro estimates. Both are labeled "estimated".
import Anthropic from '@anthropic-ai/sdk';

const client = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = () => process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

function parseJson(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{'), arr = clean.indexOf('[');
  const from = start === -1 ? arr : arr === -1 ? start : Math.min(start, arr);
  return JSON.parse(clean.slice(from));
}

/** Estimate macros from a meal photo. Returns { items:[{name,portion,calories,protein,carbs,fat}], total:{...}, confidence, notes } */
export async function estimateFromPhoto({ base64, mediaType, hint }) {
  const res = await client().messages.create({
    model: MODEL(),
    max_tokens: 1200,
    system: 'You are a registered dietitian estimating nutrition from meal photos. Be realistic about portion sizes for a college dining hall or restaurant plate. Respond with JSON only, no prose, no markdown fences.',
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: `Identify each food on the plate and estimate its portion and macros.${hint ? ` Context from the user: ${hint}.` : ''}
Return exactly this JSON shape:
{"items":[{"name":"","portion":"","calories":0,"protein":0,"carbs":0,"fat":0}],"total":{"calories":0,"protein":0,"carbs":0,"fat":0},"confidence":"low|medium|high","notes":""}` },
      ],
    }],
  });
  const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  return parseJson(text);
}

/** Estimate macros for a restaurant's menu items from text (menu scrape, description, or just the restaurant name + cuisine). */
export async function estimateMenuMacros({ restaurantName, menuText, cuisineHint }) {
  const res = await client().messages.create({
    model: MODEL(),
    max_tokens: 3000,
    system: 'You estimate nutrition for restaurant menu items. Use typical restaurant portion sizes and standard USDA values. If the item is a well-known chain item with published nutrition, use the published numbers. Respond with JSON only, no prose, no markdown fences.',
    messages: [{ role: 'user', content:
`Restaurant: ${restaurantName}${cuisineHint ? ` (${cuisineHint})` : ''}
${menuText ? `Menu:\n${menuText.slice(0, 12000)}` : 'No menu text is available — list the 15-25 most common items this type of restaurant serves.'}

Return a JSON array: [{"name":"","portion":"","calories":0,"protein":0,"carbs":0,"fat":0}]` }],
  });
  const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  const arr = parseJson(text);
  return (Array.isArray(arr) ? arr : arr.items || []).map((x) => ({ ...x, source: 'estimated' }));
}
