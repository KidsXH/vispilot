import { SpecCategory, TestState } from "@/app/corpus/page";

export interface CanvasPath {
  id: number;
  points: number[][];
  color: string;
  width: number;
  pressure: number;
  opacity: number;
  type: 'pencil'| 'axis' | 'shape' | 'note';
  shapeType?: 'rectangle'| 'circle'| null;
  text?: string;
}

export interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent[];
  sender: 'system' | 'user' | 'assistant' ;
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
  visId: string;
  dataset: string;
  dataSchema: SpecCategory | null;
  task: SpecCategory | null;
  mark: SpecCategory | null;
  encoding: SpecCategory | null;
  design: SpecCategory | null;
  accuracy: number| null;    // Value between 0 and 1
  inferenceLevel: number| null;  // Value between 0 and 1
  tested: TestState;
}
