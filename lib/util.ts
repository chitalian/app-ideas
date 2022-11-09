import * as dotenv from 'dotenv'
import { Convert as EPConvert, EPFunction } from "./EPFunction"
import { Convert as OAIConvert, OAICompletion } from "./OAICompletion"

dotenv.config()
let { EVERYPROMPT_API_KEY, OPENAI_API_KEY } = process.env


const epBase = 'https://www.everyprompt.com/api/v0/functions'
const epURL = (workspace: string, functionSlug: string) => `${epBase}/${workspace}/${functionSlug}`

const oaiBase = 'https://api.openai.com/v1'
const oaiURL = (endpoint: string, model: string) => `${oaiBase}/engines/${model}/${endpoint}`

export enum ModelType {
    DAVINCI = 'text-davinci-002',
    CURIE = 'text-curie-001',
    BABBAGE = 'text-bart-001',
    ADA = 'text-ada-001'
}
  
async function getEveryPromptFunction(
    slug: string,
    team: string
): Promise<EPFunction | undefined> {
    let response = await fetch(
        epURL(team, slug),
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${EVERYPROMPT_API_KEY}`,
            }
        }
    )

    if(response.status === 200) {
        let json = await response.json()
        return EPConvert.toEPFunction(json)
    } else {
        return undefined
    }
}

async function getOpenAICompletion(
    prompt: string,
    model: ModelType,
    maxTokens: number,
    temperature: number,
    frequencyPenalty: number,
    presencePenalty: number,
    stop: string[]
): Promise<OAICompletion | undefined> {
    let response = await fetch(
        oaiURL('completions', model),
        {
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
                stop
            })
        }
    )

    if(response.status === 200) {
        let json = await response.json()
        return OAIConvert.toOAICompletion(json)
    } else {
        return undefined
    }
}