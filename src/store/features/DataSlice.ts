import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {RootState} from '@/store'

interface DataSlice {
  dataSource: string;
}

const initialState: DataSlice = {
  dataSource: '-',
}

export const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setDataSource: (state, action: PayloadAction<string>) => {
      state.dataSource = action.payload
    },
  },
})

export const {setDataSource} = dataSlice.actions

export const selectDataSource = (state: RootState) => state.data.dataSource

export default dataSlice.reducer