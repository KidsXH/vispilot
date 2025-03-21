import {Message, MessageContent} from "@/types";
import {GoogleGenerativeAI, Content, Part} from "@google/generative-ai";
import {ModelConfig} from "@/store/features/ChatSlice";

export const requestToGemini = async (messages: Message[], modelConfig: ModelConfig) => {
  const genAI = new GoogleGenerativeAI(modelConfig.key || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({model: modelNameToID(modelConfig.name)});

  const historyMessage = messages.slice(1, messages.length - 1);
  const history = historyMessage.map((message) => {
    return {
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: messageContentToParts(message.content),
    } as Content
  })

  const systemPrompt = messages[0].content[0].text || '';

  const chat = model.startChat({
    systemInstruction: {
      role: 'system',
      parts: [
        {
          text: systemPrompt,
        },
      ],
    },
    history: history,
    generationConfig: {
      maxOutputTokens: 8000,
    },
  })

  const msg = messageContentToParts(messages[messages.length - 1].content);

  const result = await chat.sendMessage(msg)
  const text = result.response.text();

  console.log('Model Response', text)
  console.log('Parsed Response', parseResponseTextAsJson(text))

  return {
    id: Date.now(),
    role: 'assistant',
    sender: 'assistant',
    content: [{type: 'text', text: text}]
  } as Message;
}

const messageContentToParts = (content: MessageContent[]) => {
  return content.map((content) => {
    return (content.type === 'text' ?
      ({text: content.text}) :
      ({inlineData: {mimeType: 'image/png',
          // remove the data:image/png;base64,
          data: (content.image!).replace('data:image/png;base64,', ''),
      }})) as Part
  })
}

export const parseResponseTextAsJson = (text: string) => {
  if (!text.startsWith('```json') || !text.endsWith('```')) {
    return null;
  }
  const jsonText = text.slice(7, -3);
  try {
    const json = JSON.parse(jsonText);
    return {
      think: json.think,
      chat: json.chat,
      vega: json.vega,
    }
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return null;
  }
}

const modelNameToID = (modelName: string) => {
  if (modelName === 'Gemini 2.0 Flash') {
    return 'gemini-2.0-flash-001';
  }
  if (modelName === 'Gemini 2.0 Pro') {
    return 'gemini-2.0-pro-exp-02-05';
  }
  return ''
}