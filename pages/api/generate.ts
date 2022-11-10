// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { OAICompletion } from '../../lib/OAICompletion'
import { getEveryPromptFunction, getOpenAICompletion } from '../../lib/util'

const prompt = `You are brainstorming some new awesome AI app ideas following the generative ai hype wave of 2022. What's the best idea for an app to use a combination of LLM's (large language models for text generation), image models (SD/stable diffusion, for image generation) or other modalities.

Idea: Instagram for SD
Description: A place where users can generate images for free and share them with their friends
Idea: Meme generator
Description: As the name suggests, this will combine LLM + SD to create memes
Idea: Whiteboard
Description: As you are drawing an image it just continuously updates the an AI img2img image at 50% opacity
Idea: Whiteboard Multiplayer
Description: As you are drawing an image it just continuously updates the an AI img2img image at 50% opacity but multiple people are using one canvas
Idea: SD Photoshop plugin
Description: Make a plugin where it can take the context of an image and fill in the blanks but within photoshop
Idea: Component Library for SD
Description: Make a good react component library for interacting with SD
Idea: Guess the prompt
Description: Make a global competition to guess the prompt for an image.
Idea: AI Resumes
Description: Make a resume enhancer
Idea: Tattoo suggestions
Description: Give you tattoo suggestions using SD
Idea: Image DAG picker
Description: Given a prompt you are now given 4 images, and then you can keep doing img2img until you find the img you want, but visualized as a dag
Idea: Sentiment analysis
Description: Given a body of text, generate a sentiment analysis
Idea: zsh autocompletion pilot
Description: As you are typing in your terminal can you get suggestions of commands to run
Idea: text highlight an explain
Description: Select any text and explain it
Idea: FauxPilot VSCode extension
Description: Build a good extension for Faux Pilot, an open-source alternative to GitHub CoPilot
Idea: SD Generator + Up Scaler
Description: Build a site where you can use SD and then pipe the result into an AI upscaler
Idea:`

interface Error {
  error: string
}

interface Result {
  idea: string
  description: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Error | Result>
) {
  if(req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  let { keywords, model } = req.body

  const variables = [keywords]
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
  let completion = await getOpenAICompletion(
    prompt,
    model,
    100,
    1.0,
    1.0,
    1.0,
    ["Idea: "],
  )

  if(completion) {
    let idea = completion.split('Description: ')[0].replace('Idea: ', '')
    let description = completion.split('Description: ')[1].split('Idea: ')[0]
    res.status(200).json({ idea, description })
  } else {
    res.status(404).json({ error: 'Not found.' })
  }
}