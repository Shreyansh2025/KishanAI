import { BACKEND_URL } from "./config";

export async function askClaudeJSON(userPrompt, systemHint = "") {
  const fullPrompt = systemHint ? `${systemHint}\n\n${userPrompt}` : userPrompt;
  try {
    const resp = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fullPrompt, language: "en", history: "[]" }),
    });
    const json = await resp.json();
    const rawText = json?.data?.bot_text || "";
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonStart = cleaned.search(/[{[]/);
    return JSON.parse(cleaned.slice(jsonStart));
  } catch {
    return getFallbackVegetables(userPrompt);
  }
}

function getFallbackVegetables(prompt) {
  const isRabi = prompt.toLowerCase().includes("rabi");
  const isZaid = prompt.toLowerCase().includes("zaid");
  const kharif = [
    { name:"Tomato",      emoji:"🍅", plantingTime:"June-July",   harvestDays:75,  waterNeed:"High",   difficulty:"Medium", profit:"High",   tip:"Stake plants at 30cm. Spray neem oil weekly." },
    { name:"Brinjal",     emoji:"🍆", plantingTime:"June-August", harvestDays:70,  waterNeed:"Medium", difficulty:"Easy",   profit:"Medium", tip:"Pinch growing tips for bushy plants." },
    { name:"Bitter Gourd",emoji:"🫑", plantingTime:"June-July",   harvestDays:55,  waterNeed:"Medium", difficulty:"Easy",   profit:"High",   tip:"Trellis support. Harvest every 2 days." },
    { name:"Okra",        emoji:"🫛", plantingTime:"June-July",   harvestDays:50,  waterNeed:"Medium", difficulty:"Easy",   profit:"Medium", tip:"Harvest before pods become hard." },
    { name:"Cucumber",    emoji:"🥒", plantingTime:"July",        harvestDays:45,  waterNeed:"High",   difficulty:"Easy",   profit:"Medium", tip:"Mulch to retain moisture." },
    { name:"Chilli",      emoji:"🌶️", plantingTime:"June-August", harvestDays:90,  waterNeed:"Medium", difficulty:"Medium", profit:"High",   tip:"Avoid waterlogging." },
  ];
  const rabi = [
    { name:"Cauliflower", emoji:"🥦", plantingTime:"Oct-November", harvestDays:80,  waterNeed:"Medium", difficulty:"Medium", profit:"High",   tip:"Earth up around plants when curds form." },
    { name:"Cabbage",     emoji:"🥬", plantingTime:"Oct-November", harvestDays:90,  waterNeed:"Medium", difficulty:"Easy",   profit:"Medium", tip:"Protect from frost with mulch." },
    { name:"Pea",         emoji:"🫛", plantingTime:"October",      harvestDays:60,  waterNeed:"Low",    difficulty:"Easy",   profit:"High",   tip:"Inoculate seeds with Rhizobium." },
    { name:"Carrot",      emoji:"🥕", plantingTime:"Oct-Nov",      harvestDays:75,  waterNeed:"Medium", difficulty:"Easy",   profit:"Medium", tip:"Deep loamy soil needed." },
    { name:"Spinach",     emoji:"🥬", plantingTime:"Oct-Dec",      harvestDays:40,  waterNeed:"Medium", difficulty:"Easy",   profit:"Medium", tip:"Multiple cuttings possible." },
    { name:"Onion",       emoji:"🧅", plantingTime:"Nov-Dec",      harvestDays:120, waterNeed:"Medium", difficulty:"Medium", profit:"High",   tip:"Stop watering 2 weeks before harvest." },
  ];
  const zaid = [
    { name:"Watermelon",  emoji:"🍉", plantingTime:"Feb-March", harvestDays:85, waterNeed:"High",   difficulty:"Medium", profit:"High",   tip:"One strong vine per plant." },
    { name:"Muskmelon",   emoji:"🍈", plantingTime:"Feb-March", harvestDays:80, waterNeed:"Medium", difficulty:"Medium", profit:"High",   tip:"Reduce watering as fruits ripen." },
    { name:"Pumpkin",     emoji:"🎃", plantingTime:"Feb-April", harvestDays:90, waterNeed:"Medium", difficulty:"Easy",   profit:"Medium", tip:"3 meter space between plants." },
    { name:"Ridge Gourd", emoji:"🫑", plantingTime:"Feb-March", harvestDays:60, waterNeed:"Medium", difficulty:"Easy",   profit:"Medium", tip:"Harvest young for best taste." },
    { name:"Cowpea",      emoji:"🫘", plantingTime:"Mar-April", harvestDays:55, waterNeed:"Low",    difficulty:"Easy",   profit:"Medium", tip:"Drought tolerant crop." },
    { name:"Bottle Gourd",emoji:"🧃", plantingTime:"Feb-March", harvestDays:55, waterNeed:"High",   difficulty:"Easy",   profit:"Low",    tip:"Harvest at 30-35cm length." },
  ];
  return { vegetables: isRabi ? rabi : isZaid ? zaid : kharif };
}