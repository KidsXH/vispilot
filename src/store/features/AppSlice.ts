import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '@/store'

interface AppState {
  value: number
}

const initialState: AppState = {
  value: 0,
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1
    },
    decrement: (state) => {
      state.value -= 1
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    },
  },
})

export const { increment, decrement, incrementByAmount } = appSlice.actions

export const selectCount = (state: RootState) => state.app.value

export default appSlice.reducer