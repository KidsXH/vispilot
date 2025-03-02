import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {RootState} from '@/store'
import {CSVData, UtteranceSample} from "@/types";

interface CorpusSlice {
  visDataset: { [key: string]: CSVData }
  utteranceSamples: UtteranceSample[]
}

const initialState: CorpusSlice = {
  visDataset: {},
  utteranceSamples: [],
}

export const corpusSlice = createSlice({
  name: 'corpus',
  initialState,
  reducers: {
    setVisDataset: (state, action: PayloadAction<{ [key: string]: CSVData }>) => {
      state.visDataset = action.payload
    },
    setUtteranceSamples: (state, action: PayloadAction<UtteranceSample[]>) => {
      state.utteranceSamples = action.payload
    },
    setUtteranceSample: (state, action: PayloadAction<{ id: number, sample: UtteranceSample }>) => {
      const {id, sample} = action.payload;
      const sampleIndex = state.utteranceSamples.findIndex((sample) => sample.id === id);
      if (sampleIndex !== -1) {
        state.utteranceSamples = [...state.utteranceSamples.slice(0, sampleIndex), sample, ...state.utteranceSamples.slice(sampleIndex + 1)];
      }
    }
  },
})

export const {setVisDataset, setUtteranceSample, setUtteranceSamples} = corpusSlice.actions

export const selectVisDataset = (state: RootState) => state.corpus.visDataset
export const selectUtteranceSamples = (state: RootState) => state.corpus.utteranceSamples

export default corpusSlice.reducer

