'use client'
import VLJsonView from '@/components/DesignPanel/VLJsonView'
import VLPreview from '@/components/DesignPanel/VLPreview'
import {useAppDispatch, useAppSelector} from '@/store'
import {selectVegaString} from '@/store/features/DataSlice'
import {CanvasPath} from '@/types'
import {ChangeEvent, useEffect, useState} from 'react'
import Configuration from '@/components/DesignPanel/Configuration'
import {addVegaPath, selectCurrentStyle, selectDesignIdea, setCurrentStyle} from "@/store/features/CanvasSlice";

interface DesignPanelProps {
  isShape: boolean
  selectedPath: CanvasPath | null
}

const DesignPanel = ({
                       isShape,
                       selectedPath
                     }: DesignPanelProps) => {
  const [width, setWidth] = useState<number>(100)
  const [height, setHeight] = useState<number>(100)
  const [radius, setRadius] = useState<number>(100)

  const dispatch = useAppDispatch()
  const vegaString = useAppSelector(selectVegaString)
  const designIdea = useAppSelector(selectDesignIdea)

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
      <div className="font-bold text-xl border-b-2 border-neutral-200 h-8">Design Panel</div>
      <div className="font-bold text-base mt-1">Configuration</div>
      <div className="h-60 border-b border-neutral-200 font-bold text-base">
        <Configuration
          width={width}
          height={height}
          radius={radius}
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
            title="Generate New Design">
            <span className="material-symbols-outlined text-neutral-600 m-auto">refresh</span>
          </button>
          <button
            className="flex items-center gap-1 justify-center select-none cursor-pointer px-1 rounded hover:bg-neutral-100"
            title="Add to Canvas"
            onClick={() => {
              if (designIdea) {
                dispatch(addVegaPath({svg: designIdea}))
              }
            }}>
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


export default DesignPanel
