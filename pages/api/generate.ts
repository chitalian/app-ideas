// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { OAICompletion } from "../../lib/OAICompletion";
import { getEveryPromptFunction, getOpenAICompletion } from "../../lib/util";

const prompt = `You are brainstorming some new awesome AI app ideas following the generative ai hype wave of 2022. What's the best idea for an app to use a combination of LLM's (large language models for text generation), image models (SD/stable diffusion, for image generation) or other modalities.

Topic: Images, Social Network
Idea: Instagram for SD
Description: A place where users can generate images for free and share them with their friends
Topic: Memes, Images
Idea: Meme generator
Description: As the name suggests, this will combine LLM + SD to create memes
Topic: Images, Fun, Playground
Idea: Whiteboard
Description: As you are drawing an image it just continuously updates the an AI img2img image at 50% opacity
Topic: Images, Collaboration, Fun, Playground
Idea: Whiteboard Multiplayer
Description: As you are drawing an image it just continuously updates the an AI img2img image at 50% opacity but multiple people are using one canvas
Topic: Images, Photoshop, Playground
Idea: SD Photoshop plugin
Description: Make a plugin where it can take the context of an image and fill in the blanks but within photoshop
Topic: Technical, Software, Tools
Idea: Component Library for SD
Description: Make a good react component library for interacting with SD
Topic: Game, Fun, Competition
Idea: Guess the prompt
Description: Make a global competition to guess the prompt for an image.
Topic: Business
Idea: AI Resumes
Description: Make a resume enhancer
Topic: Art
Idea: Tattoo suggestions
Description: Give you tattoo suggestions using SD
Topic: Tools, Playground
Idea: Image DAG picker
Description: Given a prompt you are now given 4 images, and then you can keep doing img2img until you find the img you want, but visualized as a dag
Topic: Software, Psychology
Idea: Sentiment analysis
Description: Given a body of text, generate a sentiment analysis
Topic: Software, Engineering
Idea: zsh autocompletion pilot
Description: As you are typing in your terminal can you get suggestions of commands to run
Topic: Education
Idea: text highlight an explain
Description: Select any text and explain it
Topic: Software, Developer
Idea: FauxPilot VSCode extension
Description: Build a good extension for Faux Pilot, an open-source alternative to GitHub CoPilot`;

interface Error {
  error: string;
}

interface Result {
  idea: string;
  description: string;
}

function parseResults(
  completion: string
): [string, string, string] | undefined {
  const topicSplit = completion.split("Idea: ");
  if (topicSplit.length != 2) {
    return undefined;
  }
  const topic = topicSplit[0];

  const descriptionSplit = topicSplit[1].split("Description: ");
  if (descriptionSplit.length != 2) {
    return undefined;
  }
  const idea = descriptionSplit[0].replace("Idea:", "");
  const description = descriptionSplit[1];
  return [topic, idea, description];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Error | Result>
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let { keywords, model }: { keywords: string; model: string } = req.body;
  if (keywords.length > 256) {
    res.status(404).json({ error: "MAX LEN" });
    return;
  }
  /*
  let epFunction = await getEveryPromptFunction('app-idea-generator-0oTaY4', 'ai-app-ideas')
  if(epFunction) {
    let prompt = epFunction.template
    variables.forEach((variable, index) => {
      prompt = prompt.replace(`{{${index}}}`, variable)
    })

    let completion = await getOpenAICompletion(
      prompt,
      model,
      epFunction.options.max_tokens,
      epFunction.options.temperature,
      epFunction.options.frequency_penalty,
      epFunction.options.presence_penalty,
      epFunction.options.stop,
    )

    if(completion) {
      res.status(200).json(completion)
    } else {
      res.status(404).json({ error: 'Not found.' })
    }
  } else {
    res.status(404).json({ error: 'Not found.' })
  }
  */

  // Really weird but if do not upper case the first letter it behaves totally differently...
  keywords =
    keywords === ""
      ? ""
      : keywords.charAt(0).toUpperCase().concat(keywords.slice(1));

  console.log(`${prompt}\nTopic: ${keywords}\nIdea:`);
  let completion = await getOpenAICompletion(
    keywords === "" ? `${prompt}\nTopic:` : `${prompt}\nTopic: ${keywords}`,
    model,
    256,
    1.0,
    1.0,
    1.0,
    ["Topic: "]
  );

  if (completion) {
    console.log(completion);
    const result = parseResults(completion);
    if (result === undefined) {
      res.status(404).json({ error: "Bad response" });
      return;
    }
    const [topic, idea, description] = result;
    res.status(200).json({ idea, description });
  } else {
    res.status(404).json({ error: "Not found." });
  }
}
