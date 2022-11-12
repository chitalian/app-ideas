// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getOpenAICompletion } from "../../lib/util";

const prompt = `You are brainstorming some new awesome AI app ideas following the generative ai hype wave of 2022. What's the best idea for an app to use a combination of LLM's (large language models for text generation), image models (stable diffusion, for image generation) or other modalities.

`;

const defaultIdeas: Idea[] = [
  {
    topic: "Images, Social Network",
    name: "Instagram for Stable Diffusion",
    description:
      "A place where users can generate images for free and share them with their friends",
  },
  {
    topic: "Memes, Images",
    name: "Meme generator",
    description:
      "As the name suggests, this will combine LLM + Stable Diffusion to create memes",
  },
  {
    topic: "Images, Fun, Playground",
    name: "Whiteboard",
    description:
      "As you are drawing an image it just continuously updates the an AI img2img image at 50% opacity",
  },
  {
    topic: "Images, Collaboration, Fun, Playground",
    name: "Whiteboard Multiplayer",
    description:
      "As you are drawing an image it just continuously updates the an AI img2img image at 50% opacity but multiple people are using one canvas",
  },
  {
    topic: "Images, Photoshop, Playground",
    name: "Stable Diffusion Photoshop plugin",
    description:
      "Make a plugin where it can take the context of an image and fill in the blanks but within photoshop",
  },
  {
    topic: "Technical, Software, Tools",
    name: "Component Library for Stable Diffusion",
    description:
      "Make a good react component library for interacting with Stable Diffusion",
  },
  {
    topic: "Game, Fun, Competition",
    name: "Guess the prompt",
    description: "Make a global competition to guess the prompt for an image.",
  },
  {
    topic: "Business",
    name: "AI Resumes",
    description: "Make a resume enhancer",
  },
  {
    topic: "Art, Tattoo, Cool",
    name: "Tattoo suggestions",
    description: "Give you tattoo suggestions using Stable Diffusion",
  },
  {
    topic: "Software, Psychology",
    name: "Sentiment analysis",
    description: "Given a body of text, generate a sentiment analysis",
  },
];
interface Error {
  error: string;
}

interface Result {
  description: string;
  idea: string;
  topic: string;
}

interface Idea {
  topic: string | undefined;
  name: string;
  description: string;
}

function parseResults(
  completion: string
): [string, string, string] | undefined {
  const topicSplit = completion.split("Idea: ");
  if (topicSplit.length != 2) {
    return undefined;
  }
  const topic = topicSplit[0].trim();

  const descriptionSplit = topicSplit[1].split("Description: ");
  if (descriptionSplit.length != 2) {
    return undefined;
  }
  const idea = descriptionSplit[0].replace("Idea:", "").trim();
  const description = descriptionSplit[1].trim();
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

  let {
    favourites,
    keywords,
    model,
  }: { favourites: Idea[]; keywords: string; model: string } = req.body;
  if (keywords.length > 256) {
    res.status(404).json({ error: "MAX LEN" });
    return;
  }

  // Really weird but if do not upper case the first letter it behaves totally differently...
  keywords =
    keywords === ""
      ? ""
      : keywords.charAt(0).toUpperCase().concat(keywords.slice(1));

  // Keep 5 < favourites < 10
  if (favourites.length > 10) {
    favourites = favourites.slice(0, 10);
  } else if (favourites.length < 5) {
    favourites = defaultIdeas;
  }

  // Backfill random topics
  favourites = favourites.map((favourite) =>
    favourite.topic === undefined
      ? {
          topic: "random",
          name: favourite.name,
          description: favourite.description,
        }
      : favourite
  );

  const favouritesString = favourites
    .map((favourite) => {
      return `Topic: ${favourite.topic?.trim()}\nIdea: ${favourite.name?.trim()}\nDescription: ${favourite.description?.trim()}`;
    })
    .join("\n");

  let fullPrompt = `${prompt}\n${favouritesString}`;

  fullPrompt =
    keywords === ""
      ? `${fullPrompt}\nTopic:`
      : `${fullPrompt}\nTopic: ${keywords}\n`;

  console.log(fullPrompt);

  let completion = await getOpenAICompletion(
    fullPrompt,
    model,
    256,
    1.0,
    1.0,
    1.0,
    ["Topic: "]
  );

  if (completion) {
    const result = parseResults(completion);
    if (result === undefined) {
      res.status(404).json({ error: "Bad response" });
      return;
    }
    const [topic, idea, description] = result;
    res.status(200).json({ description, idea, topic });
  } else {
    res.status(404).json({ error: "Not found." });
  }
}
