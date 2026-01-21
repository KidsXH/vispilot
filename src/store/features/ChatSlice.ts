import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {RootState} from '@/store'
import {Message} from "@/types";

export type ChatModels = string;
export type ChatState = 'idle' | 'waiting';

export interface ModelConfig {
  name: ChatModels;
  key: string;
  baseURL?: string;
}

interface ChatSlice {
  state: ChatState;
  model: ModelConfig;
  messages: Message[];
}

const initialState: ChatSlice = {
  state: 'idle',
  model: {
    name: 'openai/gpt-4o',
    key: '',
    baseURL: 'https://openrouter.ai/api/v1',
  },
  messages: [],
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages = [...state.messages, action.payload]
    },
    setModel: (state, action: PayloadAction<ModelConfig>) => {
      state.model = action.payload
    },
    setState: (state, action: PayloadAction<ChatState>) => {
      state.state = action.payload
    },
    clearMessages: (state) => {
      state.messages = []
    },
    importMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload
    },
    removeLastQA: (state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        state.messages = state.messages.slice(0, -1);
        while (state.messages.length > 3 && state.messages[state.messages.length - 1].role !== 'assistant') {
          state.messages = state.messages.slice(0, -1);
        }
      }
    }
  },
})

export const {addMessage, setModel, setState, clearMessages, importMessages, removeLastQA} = chatSlice.actions

export const selectMessages = (state: RootState) => state.chat.messages
export const selectModel = (state: RootState) => state.chat.model
export const selectState = (state: RootState) => state.chat.state

export default chatSlice.reducer