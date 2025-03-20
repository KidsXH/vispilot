'use client'
import VLJsonView from '@/components/DesignPanel/VLJsonView'
import VLPreview from '@/components/DesignPanel/VLPreview'
import {useAppDispatch, useAppSelector} from '@/store'
import Configuration from '@/components/DesignPanel/Configuration'
import {
  addPath,
  selectCurrentStyle,
  selectDesignIdea, setTool,
} from "@/store/features/CanvasSlice";
import {CanvasPath, Message} from "@/types";
import {addHistory} from "@/store/features/HistorySlice";
import {addMessage, selectMessages, selectModel, setState} from "@/store/features/ChatSlice";
import {sendRequest} from "@/model";
import {useCallback} from "react";

const DesignPanel = () => {
  const dispatch = useAppDispatch()
  const currentStyle = useAppSelector(selectCurrentStyle)
  const designIdea = useAppSelector(selectDesignIdea)

  const messages = useAppSelector(selectMessages)
  const modelConfig = useAppSelector(selectModel)

  const reGenerateDesign = useCallback(() => {
    const message: Message = {
      id: Date.now(),
      role: 'user',
      sender: 'system',
      content: [
        {type: 'text', text: 'Please generate another solution.'},
      ]
    }
    dispatch(addMessage(message))
    dispatch(setState('waiting'))
    sendRequest([...messages, message], modelConfig).then(response => {
      dispatch(addMessage(response))
      dispatch(setState('idle'))
    })
  }, [dispatch, messages, modelConfig])

  return (
    <div className="flex flex-col p-2 h-full">
      <div className="font-bold text-xl border-b-2 border-neutral-200 min-h-8">Design Panel</div>
      <div className="font-bold text-base mt-1">Configuration</div>
      <div className="min-h-60 border-b border-neutral-200 font-bold text-base">
        <Configuration/>
      </div>
      <div className="flex mt-1">
        <div className="font-bold text-base">Design Ideas</div>
        <div className="flex justify-end items-center gap-1 ml-auto">
          <button
            className="flex items-center gap-1 justify-center select-none cursor-pointer px-1 rounded hover:bg-neutral-100"
            title="Generate New Design"
            onClick={reGenerateDesign}
          >
            <span className="material-symbols-outlined text-neutral-600 m-auto">refresh</span>
          </button>
          <button
            className="flex items-center gap-1 justify-center select-none cursor-pointer px-1 rounded hover:bg-neutral-100"
            title="Add to Canvas"
            onClick={() => {
              if (designIdea) {
                const newPath: CanvasPath = {
                  id: Date.now(),
                  points: [[450, 230]],
                  style: currentStyle,
                  pressure: 1,
                  type: 'vega',
                  vegaSVG: designIdea,
                }
                dispatch(setTool('select'))
                dispatch(addPath(newPath))
                dispatch(addHistory({type: 'canvas', content: newPath}))
              }
            }}>
            <span className="material-symbols-outlined text-neutral-600 m-auto">add_chart</span>
          </button>
        </div>
      </div>
      <div className="mt-1 h-[220px]">
        <VLPreview/>
      </div>
      <div className="font-bold text-sm">Visualization Specification</div>
      <div className="grow mt-2 py-1 min-h-0 border border-neutral-200 overflow-auto no-scrollbar whitespace-pre">
        <VLJsonView/>
      </div>
    </div>
  )
}


export default DesignPanel
