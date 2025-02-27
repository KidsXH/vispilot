export interface CanvasPath {
  id: number;
  points: number[][];
  color: string;
  width: number;
  pressure: number;
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
