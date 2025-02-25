import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {RootState} from '@/store'
import {TopLevelSpec} from "vega-lite";

export type ToolType = 'pencil' | 'select' | 'selectArea' | 'shape' | 'axis' | 'note'
export type ShapeType = 'rectangle' | 'circle'

interface CanvasState {
  tool: 'pencil' | 'select' | 'selectArea' | 'shape' | 'axis' | 'note'
  vegaEmbeds: { vegaSpecs: TopLevelSpec[], positions: number[][] }
}

const initialState: CanvasState = {
  tool: 'pencil',
  vegaEmbeds: {
    vegaSpecs: [],
    positions: [],
  }
}

export const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    setTool: (state, action: PayloadAction<CanvasState['tool']>) => {
      state.tool = action.payload
    },
    addVegaEmbeds: (state, action: PayloadAction<TopLevelSpec>) => {
      const lastPosition = state.vegaEmbeds.positions[state.vegaEmbeds.positions.length - 1] || [896, -100]
      state.vegaEmbeds = {
        vegaSpecs: [...state.vegaEmbeds.vegaSpecs, action.payload],
        positions: [...state.vegaEmbeds.positions, [lastPosition[0], lastPosition[1] + 180]],
      }
    },
    removeVegaEmbeds: (state, action: PayloadAction<number>) => {
      state.vegaEmbeds = {
        vegaSpecs: state.vegaEmbeds.vegaSpecs.filter((_, index) => index !== action.payload),
        positions: state.vegaEmbeds.positions.filter((_, index) => index !== action.payload),
      }
    },
  },
})

export const {setTool, addVegaEmbeds, removeVegaEmbeds} = canvasSlice.actions

export const selectTool = (state: RootState) => state.canvas.tool
export const selectVegaEmbeds = (state: RootState) => state.canvas.vegaEmbeds

export default canvasSlice.reducer

