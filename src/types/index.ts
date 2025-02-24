export interface CanvasPath {
  id: number;
  points: number[][];
  color: string;
  width: number;
  pressure: number;
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

