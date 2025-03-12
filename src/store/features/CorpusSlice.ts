import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {RootState} from '@/store'
import {CheckListConfig, CSVData, UtteranceSample} from "@/types";
import {defaultCheckList} from "@/app/corpus/VisSpecList";

interface CorpusSlice {
  visDataset: { [key: string]: CSVData }
  utteranceSamples: UtteranceSample[]
  checklist: CheckListConfig
  filteredIDs: number[]
}

const initialState: CorpusSlice = {
  visDataset: {},
  utteranceSamples: [],
  checklist: defaultCheckList,
  filteredIDs: []
}

export const corpusSlice = createSlice({
  name: 'corpus',
  initialState,
  reducers: {
    setVisDataset: (state, action: PayloadAction<{ filename: string, data: CSVData }>) => {
      const {filename, data} = action.payload;
      state.visDataset = {...state.visDataset, [filename]: data}
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
    },
    setChecklist: (state, action: PayloadAction<CheckListConfig>) => {
      state.checklist = structuredClone(action.payload);
    },
    setFilteredIDs: (state, action: PayloadAction<number[]>) => {
      state.filteredIDs = [...action.payload];
    }
  },
})

export const {setFilteredIDs, setVisDataset, setUtteranceSample, setUtteranceSamples, setChecklist} = corpusSlice.actions

export const selectVisDataset = (state: RootState) => state.corpus.visDataset
export const selectUtteranceSamples = (state: RootState) => state.corpus.utteranceSamples
export const selectChecklist = (state: RootState) => state.corpus.checklist
export const selectFilteredIDs = (state: RootState) => state.corpus.filteredIDs

export default corpusSlice.reducer

