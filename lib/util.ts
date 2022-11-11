import { Convert as EPConvert, EPFunction } from "./EPFunction";
import { Convert as OAIConvert, OAICompletion } from "./OAICompletion";

const { EVERYPROMPT_API_KEY, OPENAI_API_KEY } = process.env;

const epBase = "https://www.everyprompt.com/api/v0/functions";
const epURL = (workspace: string, functionSlug: string) =>
  `${epBase}/${workspace}/${functionSlug}`;

const oaiBase = "https://api.openai.com/v1";
const oaiURL = (endpoint: string, model: string) =>
  `${oaiBase}/engines/${model}/${endpoint}`;

export async function getEveryPromptFunction(
  slug: string,
  team: string
): Promise<EPFunction | undefined> {
  let response = await fetch(epURL(team, slug), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${EVERYPROMPT_API_KEY}`,
    },
  });

  if (response.status === 200) {
    let json = await response.json();
    return EPConvert.toEPFunction(json);
  }

  return undefined;
}

export async function getOpenAICompletion(
  prompt: string,
  model: string,
  maxTokens: number,
  temperature: number,
  frequencyPenalty: number,
  presencePenalty: number,
  stop: string[]
): Promise<string | undefined> {
  let response = await fetch(oaiURL("completions", model), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      prompt,
      max_tokens: maxTokens,
      temperature,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      stop,
    }),
  });

  if (response.status === 200) {
    let json = await response.json();
    return json.choices[0].text;
  }

  return undefined;
}
