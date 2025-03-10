'use client'
import VLJsonView from '@/components/DesignPanel/VLJsonView'
import {CanvasPath} from '@/types'
import {ChangeEvent, useEffect, useState} from 'react'
import VLPreview from "@/components/DesignPanel/VLPreview";
import {useAppSelector} from "@/store";
import {selectVegaString} from "@/store/features/DataSlice";

interface DesignPanelProps {
  setColor: (color: string) => void
  setThickness: (thickness: number) => void
  setOpacity: (opacity: number) => void
  isShape: boolean
  selectedPath: CanvasPath | null
}

const DesignPanel = ({setColor, setThickness, setOpacity, isShape, selectedPath}: DesignPanelProps) => {
  const [color, setInternalColor] = useState('#000000')
  const [thickness, setInternalThickness] = useState(2)
  const [opacity, setInternalOpacity] = useState(1)
  const [width, setWidth] = useState<number>(100)
  const [height, setHeight] = useState<number>(100)
  const [radius, setRadius] = useState<number>(100)

  const vegaString = useAppSelector(selectVegaString)

  useEffect(() => {
    if (selectedPath) {
      const points = selectedPath.points
      if (selectedPath.shapeType === 'rectangle') {
        const [startX, startY] = points[0]
        const [endX, endY] = points[1]
        const computedWidth = Math.abs(endX - startX)
        const computedHeight = Math.abs(endY - startY)
        setWidth(Math.floor(computedWidth))
        setHeight(Math.floor(computedHeight))
      } else if (selectedPath.shapeType === 'circle') {
        const [startX, startY] = points[0]
        const [endX, endY] = points[1]
        const computedRadius = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2)
        setRadius(Math.floor(computedRadius))
      }
    }
  }, [selectedPath])

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

  const handleOpacityChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newOpacity = parseFloat(event.target.value)
    setInternalOpacity(newOpacity)
    setOpacity(newOpacity)
  }

  const handleWidthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(event.target.value, 10)
    setWidth(newWidth)
    if (selectedPath && selectedPath.shapeType === 'rectangle') {
      const points = selectedPath.points
      const [startX, startY] = points[0]
      const [endX, endY] = points[1]
      points[1] = [startX + newWidth, endY]
      selectedPath.points = points
    }
  }

  const handleHeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(event.target.value, 10)
    setHeight(newHeight)
    if (selectedPath && selectedPath.shapeType === 'rectangle') {
      const points = selectedPath.points
      const [startX, startY] = points[0]
      const [endX, endY] = points[1]
      points[1] = [endX, startY + newHeight]
      selectedPath.points = points
    }
  }

  const handleRadiusChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseInt(event.target.value, 10)
    setRadius(newRadius)
    if (selectedPath && selectedPath.shapeType === 'circle') {
      const points = selectedPath.points
      const [startX, startY] = points[0]
      points[1] = [startX + newRadius, startY]
      selectedPath.points = points
    }
  }

  return (
    <div className="flex flex-col p-2">
      <div className="font-bold text-xl border-b-2 border-neutral-200 pb-2">Design Panel</div>
      <div className="font-bold text-base mt-1">Configuration</div>
      <div className="h-60 border-b border-neutral-200 font-bold text-base">
        <Configuration
          color={color}
          thickness={thickness}
          opacity={opacity}
          width={width}
          height={height}
          radius={radius}
          handleColorChange={handleColorChange}
          handleThicknessChange={handleThicknessChange}
          handleOpacityChange={handleOpacityChange}
          handleWidthChange={handleWidthChange}
          handleHeightChange={handleHeightChange}
          handleRadiusChange={handleRadiusChange}
          isShape={isShape}
          selectedPath={selectedPath}
        />
      </div>
      <div className="flex mt-1">
        <div className="font-bold text-base">Design Ideas</div>
        <div className="flex justify-end items-center gap-1 ml-auto">
          <button
            className="flex items-center gap-1 justify-center select-none cursor-pointer px-1 rounded hover:bg-neutral-100"
            title="Generate New Design"
          >
            <span className="material-symbols-outlined text-neutral-600 m-auto">refresh</span>
          </button>
          <button
            className="flex items-center gap-1 justify-center select-none cursor-pointer px-1 rounded hover:bg-neutral-100"
            title="Add to Canvas"
            onClick={() => {
              const vega = vegaString;
              // TODO: send vega-lite code to canvas
            }}
          >
            <span className="material-symbols-outlined text-neutral-600 m-auto">add_to_queue</span>
          </button>
        </div>
      </div>
      <div className="mt-1 h-[160px]">
        <VLPreview/>
      </div>
      <div className="font-bold text-sm">Visualization Specification</div>
      <div className="mt-2 py-1 max-h-[500px] border border-neutral-200 overflow-auto no-scrollbar whitespace-pre">
        <VLJsonView/>
      </div>
    </div>
  )
}

const Configuration = ({
                         color,
                         thickness,
                         opacity,
                         width,
                         height,
                         radius,
                         handleColorChange,
                         handleThicknessChange,
                         handleOpacityChange,
                         handleWidthChange,
                         handleHeightChange,
                         handleRadiusChange,
                         isShape,
                         selectedPath
                       }: {
  color: string
  thickness: number
  opacity: number
  width: number
  height: number
  radius: number
  handleColorChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleThicknessChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleOpacityChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleWidthChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleHeightChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleRadiusChange: (event: ChangeEvent<HTMLInputElement>) => void
  isShape: boolean
  selectedPath: CanvasPath | null
}) => {
  return (
    <div className="mt-1 font-bold text-base">
      {/* 选择栏：颜色和粗细 */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Color</label>
        <input type="color" value={color} onChange={handleColorChange} className="mt-1 block w-full"/>
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
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Opacity</label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={opacity}
          onChange={handleOpacityChange}
          className="mt-1 block w-full"
        />
      </div>
      {isShape && selectedPath && selectedPath.shapeType === 'rectangle' && (
        <div className="mt-4 flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Width</label>
            <input type="number" min="1" value={width} onChange={handleWidthChange} className="mt-1 block w-full"/>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Height</label>
            <input type="number" min="1" value={height} onChange={handleHeightChange} className="mt-1 block w-full"/>
          </div>
        </div>
      )}
      {isShape && selectedPath && selectedPath.shapeType === 'circle' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Radius</label>
          <input type="number" min="1" value={radius} onChange={handleRadiusChange} className="mt-1 block w-full"/>
        </div>
      )}
    </div>
  )
}

export default DesignPanel
