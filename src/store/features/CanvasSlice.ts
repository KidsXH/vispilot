import {RootState} from '@/store';
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {CanvasStyle, CanvasPath} from "@/types";

export type ToolType = 'pencil' | 'select' | 'selectArea' | 'shape' | 'axis' | 'note'
export type ShapeType = 'rectangle' | 'circle'

interface CanvasState {
  tool: 'pencil' | 'select' | 'selectArea' | 'shape' | 'axis' | 'note'
  currentStyle: CanvasStyle;
  paths: CanvasPath[];
  focusedPathID: number | null;
  designIdea: string | null;
  vegaElementHighlight: {
    containerPos: [number, number];
    bbox: [number, number, number, number];
    elements: string[];
  }
}

const initialState: CanvasState = {
  tool: 'pencil',
  currentStyle: {
    fill: 'none',
    stroke: '#000000',
    strokeWidth: 1,
    opacity: 1,
  },
  paths: [],
  focusedPathID: null,
  designIdea: null,
  vegaElementHighlight: {
    containerPos: [0, 0],
    bbox: [0, 0, 0, 0],
    elements: [],
  }
}

export const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    setTool: (state, action: PayloadAction<CanvasState['tool']>) => {
      state.tool = action.payload
    },
    setCurrentStyle: (state, action: PayloadAction<Partial<CanvasStyle>>) => {
      state.currentStyle = {...state.currentStyle, ...action.payload}
    },
    addPath: (state, action: PayloadAction<CanvasPath>) => {
      state.paths = [...state.paths, action.payload]
    },
    clearPaths: (state) => {
      state.paths = []
    },
    setPath: (state, action: PayloadAction<{ id: number, path: CanvasPath }>) => {
      state.paths = state.paths.map((path) => {
        if (path.id === action.payload.id) {
          return action.payload.path
        }
        return path
      })
    },
    updatePathPoints: (state, action: PayloadAction<{ id: number, pathPoints: number[][] }>) => {
      const index = state.paths.findIndex((path) => path.id === action.payload.id)
      if (index !== -1) {
        state.paths[index].points = action.payload.pathPoints
      }
    },
    removePath: (state, action: PayloadAction<number>) => {
      state.paths = state.paths.filter((path) => path.id !== action.payload)
    },
    addVegaPath: (state, action: PayloadAction<{ svg: string }>) => {
      const newID = Date.now();
      const newPath: CanvasPath = {
        id: newID,
        points: [[450, 230]],
        style: state.currentStyle,
        pressure: 1,
        type: 'vega',
        vegaSVG: action.payload.svg,
      }
      state.paths = [newPath, ...state.paths]
    },
    setFocusedPathID: (state, action: PayloadAction<number | null>) => {
      state.focusedPathID = action.payload
    },
    setDesignIdea: (state, action: PayloadAction<string | null>) => {
      state.designIdea = action.payload
    },
    setVegaElementHighlight: (state, action: PayloadAction<{ containerPos: [number, number], bbox: [number, number, number, number], elements: string[] }>) => {
      state.vegaElementHighlight = structuredClone(action.payload)
    },
    clearVegaElementHighlight: (state) => {
      state.vegaElementHighlight = {
        containerPos: [0, 0],
        bbox: [0, 0, 0, 0],
        elements: [],
      }
    }
  },
})

export const {
  setTool,
  addVegaPath,
  addPath,
  clearPaths,
  setPath,
  removePath,
  setCurrentStyle,
  updatePathPoints,
  setFocusedPathID,
  setDesignIdea,
  setVegaElementHighlight,
  clearVegaElementHighlight
} = canvasSlice.actions

export const selectTool = (state: RootState) => state.canvas.tool
export const selectPaths = (state: RootState) => state.canvas.paths
export const selectCurrentStyle = (state: RootState) => state.canvas.currentStyle
export const selectFocusedPathID = (state: RootState) => state.canvas.focusedPathID
export const selectDesignIdea = (state: RootState) => state.canvas.designIdea
export const selectVegaElementHighlight = (state: RootState) => state.canvas.vegaElementHighlight

export default canvasSlice.reducer

