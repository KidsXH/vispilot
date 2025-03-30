'use client'

import {Message} from "@/types";
import {requestToGemini} from "@/model/Gemini";
import {ChatModels, ModelConfig} from "@/store/features/ChatSlice";

export const sendRequest = async (messages: Message[], modelConfig: ModelConfig) => {
  if (modelConfig.name.toLowerCase().startsWith("gemini")) {
    return await requestToGemini(messages, modelConfig);
  }

  // throw error if model is not supported
  throw new Error(`Model ${modelConfig.name} is not supported`);
}


export const sendUtteranceTestRequest = async (params: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  dataPrompt: string;
  firstRoundResponse?: string;
  nextUserPrompt?: string;
}): Promise<string> => {
  const { model, systemPrompt, userPrompt, dataPrompt } = params;

  // Create a modelConfig object based on the model name
  const modelConfig: ModelConfig = {
    name: model as ChatModels,
    key: process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
  };

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
    "model": "claude-3-5-sonnet-20241022",
    // "model": "gpt-4o",
    // "model": "gemini-2.0-flash-001",
  }

  try {
    // const response = await sendRequest(messages, modelConfig);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL + '/v1/chat/completions' || '';
    const response = await fetch(apiUrl,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        },
        method: "POST",
        body: JSON.stringify(data),
      }
    )
    const responseJson = await response.json();
    // GPT Response
    const responseText = responseJson.choices[0].message.content;
    // Gemini Response
    // const responseText = responseJson.content[0].text;
    return JSON.stringify(JSON.parse(responseText!.replace(/```json/g, '').replace(/```/g, '')));
  } catch (error) {
    console.error("Error in sendUtteranceTestRequest:", userPrompt, error);
    throw error;
  }
}