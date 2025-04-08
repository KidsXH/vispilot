import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {RootState} from '@/store'
import {HistoryItem} from "@/types";

interface HistorySlice {
  history: HistoryItem[];
}

const initialState: HistorySlice = {
  history: [],
}

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    addHistory: (state, action: PayloadAction<HistoryItem>) => {
      state.history = [...state.history, structuredClone(action.payload)]
    },
    clearHistory: (state) => {
      state.history = []
    },
    removeLastHistory: (state) => {
      state.history = state.history.slice(0, -1)
    }
  },
})

export const {addHistory, clearHistory, removeLastHistory} = historySlice.actions

export const selectHistory = (state: RootState) => state.history.history

export default historySlice.reducer