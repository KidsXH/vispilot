'use client'

import {Message} from "@/types";
import {requestToOpenAI} from "@/model/OpenAI";
import {ModelConfig} from "@/store/features/ChatSlice";

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

export const sendRequest = async (messages: Message[], modelConfig: ModelConfig) => {
  return await requestToOpenAI(messages, modelConfig);
}


export const sendUtteranceTestRequest = async (params: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  dataPrompt: string;
  firstRoundResponse?: string;
  nextUserPrompt?: string;
  apiKey?: string;
  baseURL?: string;
}): Promise<string> => {
  const { model, systemPrompt, userPrompt, dataPrompt, apiKey, baseURL } = params;

  // Create messages array for the request
  const messages: Message[] = [
    { id: 0, role: "system", sender: "system", content: [{ type: 'text', text: systemPrompt}] },
    { id: 1, role: "user", sender: "user", content: [{ type: 'text', text: dataPrompt }] },
    { id: 2, role: "user", sender: "user", content: [{ type: 'text', text: userPrompt }] },
  ];

  if (params.firstRoundResponse && params.nextUserPrompt) {
    messages.push({ id: 3, role: "assistant", sender: "assistant", content: [{ type: 'text', text: params.firstRoundResponse }] });
    messages.push({ id: 4, role: "user", sender: "user", content: [{ type: 'text', text: params.nextUserPrompt }] });
  }

  const formatMsg = messages.map((msg: Message) => {
    return {
      role: msg.role,
      content: msg.content[0].text,
    }
  })

  const data = {
    "messages": formatMsg,
    "model": model,
    "max_tokens": 8000,
  }

  try {
    const apiUrl = (baseURL || DEFAULT_BASE_URL) + '/chat/completions';
    const response = await fetch(apiUrl,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey || ''}`
        },
        method: "POST",
        body: JSON.stringify(data),
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    const responseJson = await response.json();
    const responseText = responseJson.choices[0].message.content;
    return JSON.stringify(JSON.parse(responseText!.replace(/```json/g, '').replace(/```/g, '')));
  } catch (error) {
    console.error("Error in sendUtteranceTestRequest:", userPrompt, error);
    throw error;
  }
}