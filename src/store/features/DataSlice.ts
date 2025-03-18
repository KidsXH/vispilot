import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {RootState} from '@/store'
import {CSVFile} from "@/types";

interface DataSlice {
  dataSource: CSVFile;
  vegaString: string;
}

const initialState: DataSlice = {
  dataSource: {
    filename: '-',
    content: '',
  },
  vegaString: '{}',
}

export const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setDataSource: (state, action: PayloadAction<CSVFile>) => {
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