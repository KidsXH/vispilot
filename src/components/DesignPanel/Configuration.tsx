import {ChangeEvent, useEffect, useState} from "react";
import {useAppDispatch, useAppSelector} from "@/store";
import {
  selectCurrentStyle,
  selectFocusedPathID,
  selectPaths,
  setCurrentStyle,
  updatePathPoints
} from "@/store/features/CanvasSlice";

const Configuration = () => {
  const dispatch = useAppDispatch();
  const paths = useAppSelector(selectPaths);
  const focusedPathID = useAppSelector(selectFocusedPathID)
  const focusedPath = paths.find((path) => path.id === focusedPathID)
  const currentStyle = useAppSelector(selectCurrentStyle)

  const [layoutX, setLayoutX] = useState<number>(0)
  const [layoutY, setLayoutY] = useState<number>(0)
  const [width, setWidth] = useState<number>(100)
  const [height, setHeight] = useState<number>(100)
  const [radius, setRadius] = useState<number>(100)

  useEffect(() => {
    if (focusedPath) {
      const points = focusedPath.points
      setLayoutX(points[0][0])
      setLayoutY(points[0][1])
      if (focusedPath.shapeType === 'rectangle') {
        const startX = Math.min(points[0][0], points[1][0])
        const startY = Math.min(points[0][1], points[1][1])
        const endX = Math.max(points[0][0], points[1][0])
        const endY = Math.max(points[0][1], points[1][1])
        const computedWidth = Math.abs(endX - startX)
        const computedHeight = Math.abs(endY - startY)
        setWidth(Math.floor(computedWidth))
        setHeight(Math.floor(computedHeight))
      } else if (focusedPath.shapeType === 'circle') {
        const [startX, startY] = points[0]
        const [endX, endY] = points[1]
        const computedRadius = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2)
        setRadius(Math.floor(computedRadius))
      }
    }
  }, [focusedPath])

  const handleXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const x = isNaN(parseInt(e.target.value, 10)) ? 0 : parseInt(e.target.value, 10)
    setLayoutX(x)
    if (focusedPath) {
      const points = focusedPath.points
      const dx = x - points[0][0]
      const newPoints = points.map((point) => [point[0] + dx, point[1]])
      dispatch(updatePathPoints({id: focusedPath.id, pathPoints: newPoints}))
    }
  }

  const handleYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const y = isNaN(parseInt(e.target.value, 10)) ? 0 : parseInt(e.target.value, 10)
    setLayoutY(y)
    if (focusedPath) {
      const points = focusedPath.points
      const dy = y - points[0][1]
      const newPoints = points.map((point) => [point[0], point[1] + dy])
      dispatch(updatePathPoints({id: focusedPath.id, pathPoints: newPoints}))
    }
  }

  const handleWidthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const w = isNaN(parseInt(event.target.value, 10)) ? 0 : parseInt(event.target.value, 10)
    const newWidth = Math.max(1, w)

    setWidth(newWidth)
    if (focusedPath && focusedPath.shapeType === 'rectangle') {
      const points = focusedPath.points;
      const startX = Math.min(points[0][0], points[1][0])
      const startY = Math.min(points[0][1], points[1][1])
      const endY = Math.max(points[0][1], points[1][1])

      const newPoint1 = [startX, startY]
      const newPoint2 = [startX + newWidth, endY]

      dispatch(updatePathPoints({id: focusedPath.id, pathPoints: [newPoint1, newPoint2]}))
    }
  }

  const handleHeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    const h = isNaN(parseInt(event.target.value, 10)) ? 0 : parseInt(event.target.value, 10)
    const newHeight = Math.max(1, h)
    console.log(event.target.value, newHeight)
    setHeight(newHeight)
    if (focusedPath && focusedPath.shapeType === 'rectangle') {
      const points = focusedPath.points;
      const startX = Math.min(points[0][0], points[1][0])
      const startY = Math.min(points[0][1], points[1][1])
      const endX = Math.max(points[0][0], points[1][0])
      const newPoint1 = [startX, startY]
      const newPoint2 = [endX, startY + newHeight]
      dispatch(updatePathPoints({id: focusedPath.id, pathPoints: [newPoint1, newPoint2]}))
    }
  }

  const handleRadiusChange = (event: ChangeEvent<HTMLInputElement>) => {
    const r = isNaN(parseInt(event.target.value, 10)) ? 0 : parseInt(event.target.value, 10)
    const newRadius = Math.max(1, r)

    setRadius(newRadius)
    if (focusedPath && focusedPath.shapeType === 'circle') {
      const points = focusedPath.points
      const startX = Math.min(points[0][0], points[1][0])
      const startY = Math.min(points[0][1], points[1][1])
      dispatch(updatePathPoints({id: focusedPath.id, pathPoints: [points[0], [startX + newRadius, startY]]}))
    }
  }

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
    const opacity = Math.max(0, Math.min(100, parseInt(event.target.value, 10))) / 100
    dispatch(setCurrentStyle({opacity}))
  }

  return (
    <div className="flex flex-col gap-2 h-full w-full font-bold text-base py-2">
      <div className="flex flex-col gap-1">
        <span className="block text-sm font-medium text-neutral-900">Layout</span>
        <div className="flex gap-2 h-8 select-none">
          <label htmlFor="config-X" className="relative w-18 font-input-label">
            <input type="number" id="config-X" className="absolute block w-full bg-neutral-100 rounded p-1 pl-5 top-0"
                   value={layoutX}
                   onChange={handleXChange}
            />
            <span className="absolute z-10 top-1 left-1.5">X</span>
          </label>
          <label htmlFor="config-Y" className="relative w-18 font-input-label">
            <input type="number" id="config-Y" className="absolute block w-full bg-neutral-100 rounded p-1 pl-5 top-0"
                   value={layoutY}
                   onChange={handleYChange}
            />
            <span className="absolute z-10 top-1 left-1.5">Y</span>
          </label>
          {focusedPath && focusedPath.shapeType === 'rectangle' && (
            <>
              <div className="border-l-1 border-neutral-200 h-6"></div>
              <label htmlFor="config-W" className="relative w-18 font-input-label">
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
              <label htmlFor="config-H" className="relative w-18 font-input-label">
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
          {focusedPath && focusedPath.shapeType === 'circle' && (
            <>
              <div className="border-l-1 border-neutral-200 h-6"></div>
              <label htmlFor="config-R" className="relative w-18 font-input-label">
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
                      <span
                          className="absolute z-10 top-1 left-1 block material-symbols-outlined icon-input-label">opacity</span>
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