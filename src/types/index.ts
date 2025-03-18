import { SpecCategory, TestState } from "@/app/corpus/page";

export interface CanvasStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export interface CanvasPath {
  id: number;
  points: number[][];
  pressure: number;
  style: CanvasStyle;
  type: 'pencil'| 'axis' | 'shape' | 'note' | 'vega';
  shapeType?: 'rectangle'| 'circle';
  text?: string;
  vegaSVG?: string;
}

export interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  sender: 'user' | 'assistant' | 'system';
  content: MessageContent[];
}

export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string }
}

export type CSVData = {[key: string]: string}[]

export interface UtteranceSample {
  id: number;
  utteranceSet: string;
  sequential: string;
  visID: string;
  dataset: string;
  groundTruth: any;
  vegaLite: any;
  specGen: any;
  specGT: any;
  inference: {
    dataSchema: {[key: string]: string}
    mark: {[key: string]: string};
    encoding: {[key: string]: string};
    design: {[key: string]: string};
  }
  accuracy: {
    dataSchema: number;
    mark: number;
    encoding: number;
    design: number;
  }
  accGenDiff: any;
  accGTDiff: any;
  tested: TestState;
}

export interface HistoryItem {
  type: 'chat' | 'canvas' | 'model'
  content: string | CanvasPath | ModelOutput;
}

export interface ModelOutput {
  chat: string;
  vega: string;
}

export interface CSVFile {
  filename: string;
  content: string;
}


export type CheckListConfig = {
  data: string[];
  mark: string[];
  encoding: string[];
  design: string[];
}

export type CheckListCategory = 'data' | 'mark' | 'encoding' | 'design';