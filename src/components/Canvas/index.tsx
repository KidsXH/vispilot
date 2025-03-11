'use client'

import SketchPad from '@/components/Canvas/SketchCanvas'
import { CanvasPath } from '@/types'

interface CanvasProps {
  color: string
  thickness: number
  opacity: number
  vegaString?: string
  setIsShape: (isShape: boolean) => void
  setSelectedPath: (path: CanvasPath | null) => void
}

const Canvas = ({ color, thickness, opacity, vegaString, setIsShape, setSelectedPath }: CanvasProps) => {
  return (
    <div className="flex flex-col p-2 relative select-none">
      <div className="font-bold text-xl">Canvas</div>
      <div className="grow bg-slate-50/50 border border-neutral-300 h-[700px] mt-1">
        <SketchPad
          color={color}
          thickness={thickness}
          opacity={opacity}
          vegaString={vegaString}
          setIsShape={setIsShape}
          setSelectedPath={setSelectedPath}
        />
      </div>
    </div>
  )
}

export default Canvas
