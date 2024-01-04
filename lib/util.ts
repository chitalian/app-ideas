const { OPENAI_API_KEY } = process.env;

const oaiBase = "https://api.openai.com/v1";
const oaiURL = (endpoint: string, model: string) =>
  `${oaiBase}/engines/${model}/${endpoint}`;

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
