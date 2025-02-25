'use server'

import {Message} from "@/types";

export const sendRequest = async (messages: Message[]) => {
  const api = `${process.env.API_URL}/chat/completions`;

  const payload = {
    model: "/root/autodl-pub/models/mllm/Qwen2-VL-7B_Instruct/",
    messages: messages.map((message) => {
      return {
        role: message.role,
        content: message.content
      }
    }),
  }
  console.log('sending request to', api, payload);
  const response = await fetch(api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const message = responseToMessage(await response.json(), messages[messages.length - 1].id + 1)
  console.log('response', message);
  return message
}

const responseToMessage = (response: any, id: number): Message => {
  if (response.object === 'error') {
    return {
      id,
      role: 'assistant',
      sender: 'assistant',
      content: [{type: 'text', text: response.message}]
    }
  }
  return {
    id,
    role: 'assistant',
    sender: 'assistant',
    content: [{type: 'text', text: response.choices[0].message.content}]
  }
}