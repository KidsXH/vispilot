'use client'

import Canvas from '@/components/Canvas'
import Chat from '@/components/Chat'
import DataTable from '@/components/DataTable'
import DesignPanel from '@/components/DesignPanel'
import { CanvasPath } from '@/types'
import { useState } from 'react'
import HistoryPanel from '../components/HistoryPanel'

export default function Home() {
  const [isShape, setIsShape] = useState(false)
  const [selectedPath, setSelectedPath] = useState<CanvasPath | null>(null)

  return (
    <div className="flex flex-col w-[1920px] h-[1080px] mx-auto mt-20 border border-black bg-white font-sans">
      <div className="flex items-center w-full h-10 px-2 bg-neutral-900 text-white text-2xl font-system">VisPilot</div>
      <div className="flex flex-grow w-full">
        <div className="flex flex-col min-w-80 max-w-80 border border-black">
          <div className="h-96 border-b border-black">
            <DataTable />
          </div>
          <div className="grow border-t border-black">
            <Chat />
          </div>
        </div>
        <div className="flex flex-row-reverse grow border border-black min-w-0">
          <div className="min-w-[340px] w-[340px] border-l-2 border-black">
            <DesignPanel
              isShape={isShape}
              selectedPath={selectedPath}
            />
          </div>
          <div className="flex flex-col-reverse grow min-w-0">
            <div className="h-72 border-t border-black">
              <HistoryPanel />
            </div>
            <div className="grow border-b border-black">
              <Canvas
                setIsShape={setIsShape}
                setSelectedPath={setSelectedPath}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
