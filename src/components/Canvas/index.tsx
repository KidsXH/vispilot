'use client'

import SketchPad from '@/components/Canvas/SketchCanvas'
import { CanvasPath } from '@/types'

const Canvas = ({
  color,
  thickness,
  opacity,
  setIsShape,
  setSelectedPath
}: {
  color: string
  thickness: number
  opacity: number
  setIsShape: (isShape: boolean) => void
  setSelectedPath: (path: CanvasPath | null) => void
}) => {
  return (
    <div className="flex flex-col p-2 relative select-none">
      <div className="font-bold text-xl">Canvas</div>
      <div className="grow bg-slate-50/50 border border-neutral-300 h-[700px] mt-1">
        <SketchPad
          color={color}
          thickness={thickness}
          opacity={opacity}
          setIsShape={setIsShape}
          setSelectedPath={setSelectedPath}
        />
      </div>
    </div>
  )
}

export default Canvas
