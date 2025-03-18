'use client'

import {Message} from "@/types";
import {requestToGemini} from "@/model/Gemini";
import {ModelConfig} from "@/store/features/ChatSlice";

export const sendRequest = async (messages: Message[], modelConfig: ModelConfig) => {
  if (modelConfig.name.toLowerCase().startsWith("gemini")) {
    return await requestToGemini(messages, modelConfig);
  }

  // throw error if model is not supported
  throw new Error(`Model ${modelConfig.name} is not supported`);
}
