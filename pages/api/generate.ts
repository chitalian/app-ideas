// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { OAICompletion } from '../../lib/OAICompletion'
import { ModelType, getEveryPromptFunction, getOpenAICompletion } from '../../lib/util'

interface Error {
  error: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Error | OAICompletion>
) {
  if(req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  let { keywords, model } = req.body
  model = model.toUpperCase() as ModelType

  const variables = [keywords]

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
}