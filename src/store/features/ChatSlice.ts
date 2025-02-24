import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {RootState} from '@/store'
import {Message} from "@/types";

export type ChatModels = 'Deepseek-VL2' | 'Qwen2-VL-2B';
export type ChatState = 'idle' | 'waiting';

interface ChatSlice {
  state: ChatState;
  model: ChatModels;
  messages: Message[];
}

const initialState: ChatSlice = {
  state: 'idle',
  model: 'Qwen2-VL-2B',
  messages: [
    {
      id: 1,
      role: 'model',
      sender: 'model',
      content: [
        {type: 'text', text: 'Hello!'},
      ],
    },
    {
      id: 2,
      role: 'user',
      sender: 'user',
      content: [
        {type: 'text', text: 'Hi!'},
        {type: 'text', text: '😀'},
      ]
    }
  ],
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages = [...state.messages, action.payload]
    },
    setModel: (state, action: PayloadAction<ChatModels>) => {
      state.model = action.payload
    },
    setState: (state, action: PayloadAction<ChatState>) => {
      state.state = action.payload
    }
  },
})

export const {addMessage, setModel, setState} = chatSlice.actions

export const selectMessages = (state: RootState) => state.chat.messages
export const selectModel = (state: RootState) => state.chat.model
export const selectState = (state: RootState) => state.chat.state

export default chatSlice.reducer