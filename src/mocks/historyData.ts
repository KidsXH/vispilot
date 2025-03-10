import {HistoryItem} from "@/types";

export const historyData: HistoryItem[] = [
  {
    type: 'chat',
    content: 'Start',
  },
  {
    type: 'canvas',
    content: {
      id: 0,
      points: [[0, 0], [100, 100]],
      color: 'black',
      width: 5,
      pressure: 1,
      opacity: 1,
      type: 'pencil',
    },
  },
  {
    type: 'canvas',
    content:
    {
      id: 2,
      points: [[50, 50], [150, 150]],
      color: 'blue',
      width: 5,
      pressure: 1,
      opacity: 1,
      type: 'axis',
    },
  },
  {
    type: "canvas",
    content: {
      id: 3,
      points: [[100, 100], [200, 200]],
      color: 'green',
      width: 5,
      pressure: 1,
      opacity: 1,
      type: 'shape',
      shapeType: 'rectangle',
    },
  },
  {
    type: "canvas",
    content: {
      id: 4,
      points: [[150, 150], [250, 250]],
      color: 'yellow',
      width: 5,
      pressure: 1,
      opacity: 1,
      type: 'note',
      text: 'This is a note',
    },
  }
]