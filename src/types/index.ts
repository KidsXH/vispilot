export interface CanvasPath {
  id: number;
  points: number[][];
  color: string;
  width: number;
  pressure: number;
  type: 'pencil'| 'axis' | 'shape' | 'note';
  shapeType?: 'rectangle'| 'circle'| null;
}

export interface Message {
  id: number;
  role: 'user' | 'model';
  content: MessageContent[];
  sender: 'system' | 'user' | 'model' ;
}

export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string }
}

