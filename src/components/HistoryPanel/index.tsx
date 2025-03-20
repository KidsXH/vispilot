'use client'

import VegaLite from '@/components/VegaLite'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectHistory } from '@/store/features/HistorySlice'
import { CanvasPath } from '@/types'
import { useEffect, useRef } from 'react'

const HistoryIcon = {
  pencil: 'stylus_note',
  shape: 'shapes',
  axis: 'shuffle',
  note: 'sticky_note',
  chat: 'edit_note',
  vega: 'add_chart',
  model: 'emoji_objects'
}

const HistoryPanel = () => {
  const dispatch = useAppDispatch()
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const historyData = useAppSelector(selectHistory)
  const modelItemCount = historyData.filter(item => item.type === 'model').length
  const canvasItemCount = historyData.filter(item => item.type === 'canvas').length
  const chatItemCount = historyData.filter(item => item.type === 'chat').length
  const lineWidth = (chatItemCount + canvasItemCount) * 44 + modelItemCount * 224 + (historyData.length - 1) * 32

  useEffect(() => {
    if (svgContainerRef.current) {
      svgContainerRef.current.scrollLeft = svgContainerRef.current.scrollWidth
    }
  }, [historyData])

  return (
    <>
      <div className="flex flex-col p-2 min-w-0">
        <div className="font-bold text-xl">Authoring Flow</div>
        <div
          className="h-[240px] flex overflow-x-auto overflow-y-hidden items-center w-full pb-2 pl-10 mt-1 gap-8 relative"
          ref={svgContainerRef}>
          <div className="absolute top-14 h-1 bg-gray-300" style={{ width: lineWidth }} />
          {historyData.map((d, i) => {
            return (
              <div key={i} className="h-56">
                {d.type === 'chat' && (
                  <div className="flex flex-col h-full group select-none cursor-pointer pt-10">
                    <span className="relative w-11 h-11 rounded-lg bg-chat group-hover:bg-gray-500 text-white p-2.5">
                      <span className="material-symbols-outlined">{HistoryIcon['chat']}</span>
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-0 z-10 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-chat text-white text-sm py-1 px-3 rounded-md whitespace-nowrap">
                          {d.content as string}
                        </div>
                        <div className="w-1 ml-4.5 border-t-4 border-l-4 border-r-4 border-transparent border-t-chat"></div>
                      </div>
                    </span>
                  </div>
                )}
                {d.type === 'canvas' && (
                  <div className="flex flex-col h-full group select-none cursor-pointer pt-10">
                    <span className="relative w-11 h-11 rounded-lg bg-canvas group-hover:bg-blue-200 text-white p-2.5">
                      <span className="material-symbols-outlined">{HistoryIcon[(d.content as CanvasPath).type]}</span>
                    </span>
                  </div>
                )}
                {d.type === 'model' && (
                  <div className="flex flex-col items-center h-full group select-none cursor-pointer pt-10 gap-1">
                    <span className="relative w-11 h-11 rounded-lg bg-canvas group-hover:bg-blue-200 text-white p-2.5">
                      <span className="material-symbols-outlined">{HistoryIcon['model']}</span>
                    </span>

                    <div className="border-t-9 border-l-6 border-r-6 border-transparent border-t-canvas group-hover:border-t-blue-200"></div>
                    <div className="flex items-center justify-center w-48 h-28 bg-canvas rounded vega-container">
                      <VegaLite vegaString={d.content as string} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default HistoryPanel
