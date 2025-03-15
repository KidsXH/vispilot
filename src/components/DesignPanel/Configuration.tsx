import {ChangeEvent} from "react";
import {CanvasPath} from "@/types";
import {useAppDispatch, useAppSelector} from "@/store";
import {selectCurrentStyle, setCurrentStyle} from "@/store/features/CanvasSlice";

const Configuration = ({
                         width,
                         height,
                         radius,
                         handleWidthChange,
                         handleHeightChange,
                         handleRadiusChange,
                         isShape,
                         selectedPath
                       }: {
  width: number
  height: number
  radius: number
  handleWidthChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleHeightChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleRadiusChange: (event: ChangeEvent<HTMLInputElement>) => void
  isShape: boolean
  selectedPath: CanvasPath | null
}) => {
  const dispatch = useAppDispatch();
  const currentStyle = useAppSelector(selectCurrentStyle)

  const handleFillChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(setCurrentStyle({fill: event.target.value}))
  }

  const handleStrokeChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(setCurrentStyle({stroke: event.target.value}))
  }

  const handleStrokeWidthChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(setCurrentStyle({strokeWidth: parseInt(event.target.value, 10)}))
  }

  const handleOpacityChange = (event: ChangeEvent<HTMLInputElement>) => {
    const opacity = Math.max(0, Math.min(100, parseInt(event.target.value, 10)))
    dispatch(setCurrentStyle({opacity}))
  }

  return (
    <div className="flex flex-col gap-2 h-full w-full font-bold text-base py-2">
      <div className="flex flex-col gap-1">
        <span className="block text-sm font-medium text-neutral-900">Layout</span>
        <div className="flex gap-2 h-8 select-none">
          <label htmlFor="config-X" className="relative w-16 font-input-label">
            <input type="text" id="config-X" className="absolute block w-full bg-neutral-100 rounded p-1 pl-5 top-0" />
            <span className="absolute z-10 top-1 left-1.5">X</span>
          </label>
          <label htmlFor="config-Y" className="relative w-16 font-input-label">
            <input type="text" id="config-Y" className="absolute block w-full bg-neutral-100 rounded p-1 pl-5 top-0" />
            <span className="absolute z-10 top-1 left-1.5">Y</span>
          </label>
          <div className="border-l-1 border-neutral-200 h-6"></div>
          {/* <label htmlFor="config-W" className="relative w-16 font-input-label">
            <input
              id="config-W"
              className="absolute block w-full bg-neutral-100 rounded p-1 pl-5 top-0"
              type="number"
              min="1"
              value={width}
              onChange={handleWidthChange}
            />
            <span className="absolute z-10 top-1 left-1">W</span>
          </label>
          <label htmlFor="config-H" className="relative w-16 font-input-label">
            <input
              id="config-H"
              className="absolute block w-full bg-neutral-100 rounded p-1 pl-5 top-0"
              type="number"
              min="1"
              value={height}
              onChange={handleHeightChange}
            />
            <span className="absolute z-10 top-1 left-1.5">H</span>
          </label> */}
          {isShape && selectedPath && selectedPath.shapeType === 'rectangle' && (
            <>
              <label htmlFor="config-W" className="relative w-16 font-input-label">
                <input
                  id="config-W"
                  className="absolute block w-full bg-neutral-100 rounded p-1 pl-5 top-0"
                  type="number"
                  min="1"
                  value={width}
                  onChange={handleWidthChange}
                />
                <span className="absolute z-10 top-1 left-1">W</span>
              </label>
              <label htmlFor="config-H" className="relative w-16 font-input-label">
                <input
                  id="config-H"
                  className="absolute block w-full bg-neutral-100 rounded p-1 pl-5 top-0"
                  type="number"
                  min="1"
                  value={height}
                  onChange={handleHeightChange}
                />
                <span className="absolute z-10 top-1 left-1.5">H</span>
              </label>
            </>
          )}
          {isShape && selectedPath && selectedPath.shapeType === 'circle' && (
            <>
              <label htmlFor="config-R" className="relative w-16 font-input-label">
                <input
                  id="config-R"
                  className="absolute block w-full bg-neutral-100 rounded p-1 pl-5 top-0"
                  type="number"
                  min="1"
                  value={radius}
                  onChange={handleRadiusChange}
                />
                <span className="absolute z-10 top-1 left-1">R</span>
              </label>
            </>
          )}
        </div>
      </div>
      {
        currentStyle.fill !== 'none' &&
        <div className="flex flex-col gap-1">
        <span className="block text-sm font-medium text-neutral-900">Fill</span>
        <div className="flex gap-2 h-8 select-none">
          <label htmlFor="config-fill" className="relative w-24 font-input-label">
            <input
              type="text"
              id="config-fill"
              className="absolute block w-full bg-neutral-100 rounded p-1 pl-7 top-0"
              value={currentStyle.fill.toUpperCase()}
              onChange={handleFillChange}
            />
            <input
              type="color"
              value={currentStyle.fill}
              onChange={handleFillChange}
              className="absolute z-10 top-0 left-1 block w-5 h-6 border-0"
            />
          </label>

          <label htmlFor="config-opacity" className="relative w-18 font-input-label">
            <input
              type="text"
              id="config-opacity"
              className="absolute block w-full bg-neutral-100 rounded p-1 pl-7 top-0"
              value={(currentStyle.opacity * 100).toFixed(0)}
              onChange={handleOpacityChange}
            />
            <span className="absolute z-10 top-1 left-1 block material-symbols-outlined icon-input-label">opacity</span>
            <span className="absolute z-10 top-1 left-14 block">%</span>
          </label>
        </div>
      </div>}

      {currentStyle.stroke !== 'none' &&
        <div className="flex flex-col gap-1">
        <span className="block text-sm font-medium text-neutral-900">Stroke</span>
        <div className="flex gap-2 h-8 select-none">
          <label htmlFor="config-stroke" className="relative w-24 font-input-label">
            <input
              type="text"
              id="config-stroke"
              className="absolute block w-full bg-neutral-100 rounded p-1 pl-7 top-0"
              value={currentStyle.stroke.toUpperCase()}
              onChange={handleStrokeChange}
            />
            <input
              type="color"
              value={currentStyle.stroke}
              onChange={handleStrokeChange}
              className="absolute z-10 top-0 left-1 block w-5 h-6 border-0"
            />
          </label>

          <label htmlFor="config-stroke-width" className="relative w-18 font-input-label">
            <input
              type="text"
              id="config-stroke-width"
              className="absolute block w-full bg-neutral-100 rounded p-1 pl-7 top-0"
              value={currentStyle.strokeWidth}
              onChange={handleStrokeWidthChange}
            />
            <span className="absolute z-10 top-1 left-1 block material-symbols-outlined icon-input-label">
              line_weight
            </span>
          </label>
        </div>
      </div>}
    </div>
  )
}

export default Configuration;