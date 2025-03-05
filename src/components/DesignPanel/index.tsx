'use client'
import VLJsonView from '@/components/DesignPanel/VLJsonView'
import { ChangeEvent, useState } from 'react'

interface DesignPanelProps {
  setColor: (color: string) => void
  setThickness: (thickness: number) => void
}

const DesignPanel = ({ setColor, setThickness }: DesignPanelProps) => {
  const [color, setInternalColor] = useState('#000000')
  const [thickness, setInternalThickness] = useState(2)

  const handleColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value
    setInternalColor(newColor)
    setColor(newColor)
  }

  const handleThicknessChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newThickness = parseInt(event.target.value, 10)
    setInternalThickness(newThickness)
    setThickness(newThickness)
  }

  return (
    <div className="flex flex-col p-2">
      <div className="font-bold text-xl border-b-2 border-neutral-200 pb-2">Design Panel</div>
      <div className="h-72 border-b border-neutral-200 mt-1 font-bold text-base">
        Configuration
        {/* 选择栏：颜色和粗细 */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Color</label>
          <input type="color" value={color} onChange={handleColorChange} className="mt-1 block w-full" />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Thickness</label>
          <input
            type="range"
            min="1"
            max="10"
            value={thickness}
            onChange={handleThicknessChange}
            className="mt-1 block w-full"
          />
        </div>
      </div>
      <div className="font-bold text-base mt-1">Vega-Lite Code</div>
      <div className="mt-2 max-h-[660px] overflow-auto no-scrollbar whitespace-pre">
        <VLJsonView />
      </div>
    </div>
  )
}

export default DesignPanel
