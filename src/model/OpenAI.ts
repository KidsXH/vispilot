import {Message, MessageContent} from "@/types";
import {ModelConfig} from "@/store/features/ChatSlice";

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

export const requestToOpenAI = async (messages: Message[], modelConfig: ModelConfig) => {
  const baseURL = modelConfig.baseURL || DEFAULT_BASE_URL;
  const apiKey = modelConfig.key;
  const model = modelConfig.name;

  const formattedMessages = messages.map((message) => {
    return {
      role: message.role === 'assistant' ? 'assistant' : (message.role === 'system' ? 'system' : 'user'),
      content: messageContentToOpenAIFormat(message.content),
    };
  });

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: formattedMessages,
      max_tokens: 32000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  const responseJson = await response.json();
  const text = responseJson.choices[0].message.content;

  return {
    id: Date.now(),
    role: 'assistant',
    sender: 'assistant',
    content: [{type: 'text', text: text}]
  } as Message;
};

export const messageContentToOpenAIFormat = (content: MessageContent[]) => {
  // If there's only text content, return simple string format
  if (content.length === 1 && content[0].type === 'text') {
    return content[0].text;
  }

  // For multimodal content, return array format
  return content.map((item) => {
    if (item.type === 'text') {
      return {
        type: 'text',
        text: item.text,
      };
    } else {
      // Image content
      return {
        type: 'image_url',
        image_url: {
          url: item.image,
        },
      };
    }
  });
};
