'use client'

import Canvas from '@/components/Canvas'
import Chat from '@/components/Chat'
import DataTable from '@/components/DataTable'
import DesignPanel from '@/components/DesignPanel'
import { CanvasPath } from '@/types'
import { useState } from 'react'
import HistoryPanel from '../components/HistoryPanel'

export default function Home() {

  return (
    <div className="flex flex-col 2k:w-[1920px] 2k:h-[1080px] 2k:mx-auto 2k:mt-20 w-full h-[100vh] border border-black bg-white font-sans">
      <div className="flex items-center w-full h-10 px-2 bg-neutral-900 text-white text-2xl font-system">VisPilot</div>
      <div className="flex flex-grow w-full  min-h-0">
        <div className="flex flex-col min-w-80 max-w-80 border border-black">
          <div className="2k:h-96 border-b border-black">
            <DataTable />
          </div>
          <div className="grow border-t border-black min-h-0">
            <Chat />
          </div>
        </div>
        <div className="flex flex-row-reverse grow border border-black min-w-0">
          <div className="min-w-[340px] w-[340px] border-l-2 border-black">
            <DesignPanel />
          </div>
          <div className="flex flex-col-reverse grow min-w-0">
            <div className="h-72 border-t border-black">
              <HistoryPanel />
            </div>
            <div className="flex flex-col grow border-b border-black">
              <Canvas />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
