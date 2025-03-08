import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {RootState} from '@/store'

interface DataSlice {
  dataSource: string;
  vegaString: string;
}

const initialState: DataSlice = {
  dataSource: '-',
  vegaString: '{}',
}

export const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setDataSource: (state, action: PayloadAction<string>) => {
      state.dataSource = action.payload
    },
    setVegaString: (state, action: PayloadAction<string>) => {
      state.vegaString = action.payload
    },
  },
})

export const {setDataSource, setVegaString} = dataSlice.actions

export const selectDataSource = (state: RootState) => state.data.dataSource
export const selectVegaString = (state: RootState) => state.data.vegaString

export default dataSlice.reducer