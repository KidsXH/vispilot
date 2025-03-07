'use client'

import {Message} from "@/types";
import {requestToGemini} from "@/model/Gemini";

export const sendRequest = async (messages: Message[]) => {
  return await requestToGemini(messages);

  // const api = `${process.env.NEXT_PUBLIC_API_URL}/chat/completions`;
  //
  // const payload = {
  //   model: process.env.NEXT_PUBLIC_MODEL,
  //   messages: messages.map((message) => {
  //     return {
  //       role: message.role,
  //       content: message.content
  //     }
  //   }),
  //   stream: true // Enable streaming
  // }
  //
  // console.log('sending request to', api, payload);
  // const response = await fetch(api, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Access-Control-Allow-Origin': '*',
  //   },
  //   body: JSON.stringify(payload)
  // });
  //
  // if (!response.ok) {
  //   const error = await response.json();
  //   return responseToMessage(error, messages[messages.length - 1].id + 1);
  // }
  //
  // if (!response.body) {
  //   throw new Error('No response body');
  // }
  //
  // const reader = response.body.getReader();
  // const decoder = new TextDecoder();
  // let content = '';
  //
  // while (true) {
  //   const { done, value } = await reader.read();
  //   if (done) break;
  //
  //   const chunk = decoder.decode(value);
  //   const lines = chunk.split('\n').filter(line => line.trim() !== '');
  //   for (const line of lines) {
  //     if (line.startsWith('data: ')) {
  //       const data = line.slice(6);
  //       if (data === '[DONE]') continue;
  //
  //       try {
  //         const parsed = JSON.parse(data);
  //         if (parsed.choices[0]?.delta?.content) {
  //           content += parsed.choices[0].delta.content;
  //         }
  //       } catch (e) {
  //         console.error('Error parsing JSON:', e);
  //       }
  //     }
  //   }
  // }
  //
  // return {
  //   id: messages[messages.length - 1].id + 1,
  //   role: 'assistant',
  //   sender: 'assistant',
  //   content: [{type: 'text', text: content}]
  // } as Message;

  // const message = responseToMessage(await response.json(), messages[messages.length - 1].id + 1)
  // console.log('response', response);
  // return message
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
