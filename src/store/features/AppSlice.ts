import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '@/store'

interface AppState {
  vegaLiteSize: [number | 'auto', number | 'auto']
}

const initialState: AppState = {
  vegaLiteSize: [400, 300],
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setVegaLiteSize: (state, action: PayloadAction<[number | 'auto', number | 'auto']>) => {
      state.vegaLiteSize = action.payload
    },
  },
})

export const { setVegaLiteSize } = appSlice.actions

export const selectVegaLiteSize = (state: RootState) => state.app.vegaLiteSize

export default appSlice.reducer