'use client'

import SketchPad from '@/components/Canvas/SketchCanvas'

const Canvas = () => {
  return (
    <div className="flex flex-col p-2 relative select-none">
      <div className="font-bold text-xl">Canvas</div>
      <div className="grow bg-slate-50/50 border border-neutral-300 h-[700px] mt-1">
        <SketchPad />
      </div>
    </div>
  )
}

export default Canvas
