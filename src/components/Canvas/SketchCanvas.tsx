import GlowingText from '@/components/Canvas/GlowingText'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectTool, selectVegaEmbeds, setTool, ShapeType } from '@/store/features/CanvasSlice'
import { CanvasPath, Message } from '@/types'
import { motion } from 'framer-motion'
import { PointerEvent, useCallback, useEffect, useRef, useState } from 'react'
import { TopLevelSpec } from 'vega-lite'

export default function SketchPad({
  color,
  thickness,
  opacity,
  setIsShape,
  setSelectedPath
}: {
  color: string
  thickness: number
  opacity: number
  setIsShape: (isShape: boolean) => void
  setSelectedPath: (path: CanvasPath | null) => void
}) {
  const dispatch = useAppDispatch()
  const tool = useAppSelector(selectTool)

  const [paths, setPaths] = useState<CanvasPath[]>([])
  const [currentPath, setCurrentPath] = useState<CanvasPath | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const [selectedShapeType, setSelectedShapeType] = useState<'rectangle' | 'circle' | null>(null)
  const [selectedPathId, setSelectedPathId] = useState<number | null>(null)
  const [editingPathId, setEditingPathId] = useState<number | null>(null)
  const [isEditingText, setIsEditingText] = useState(false)
  const [coordinates, setCoordinates] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // 获取鼠标在SVG中的相对坐标
  const getCoordinates = (event: PointerEvent) => {
    const svg = svgRef.current
    if (svg) {
      const point = svg.createSVGPoint()
      point.x = event.clientX
      point.y = event.clientY
      const ctm = svg.getScreenCTM()
      if (ctm) {
        const inversedCTM = ctm.inverse()
        const relativePoint = point.matrixTransform(inversedCTM)
        return [relativePoint.x, relativePoint.y]
      }
    }
    return [0, 0]
  }

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      if (tool != 'select') {
        setSelectedPathId(null)
      }

      const [x, y] = getCoordinates(event)
      setCoordinates({ x, y })

      setIsShape(false)
      setSelectedPath(null)

      if (isEditingText) {
        setIsEditingText(false)
        return
      }

      if (tool === 'pencil') {
        setIsDrawing(true)
        setCurrentPath({
          id: Date.now(),
          points: [[x, y]],
          color: 'black',
          width: 2,
          pressure: event.pressure || 1,
          opacity: 1,
          type: 'pencil' as const
        })
      } else if (tool === 'axis') {
        setIsDrawing(true)
        setCurrentPath({
          id: Date.now(),
          points: [[x, y]],
          color: 'black',
          width: 2,
          pressure: event.pressure || 1,
          opacity: 1,
          type: 'axis' as const
        })
      } else if (tool === 'shape') {
        setIsDrawing(true)
        setCurrentPath({
          id: Date.now(),
          points: [[x, y]],
          color: 'black',
          width: 2,
          pressure: event.pressure || 1,
          opacity: 1,
          type: 'shape' as const,
          shapeType: selectedShapeType
        })
      } else if (tool === 'note') {
        setIsEditingText(true)
        setIsDrawing(true)
        setCurrentPath({
          id: Date.now(),
          points: [[x, y]],
          color: 'black',
          width: 2,
          pressure: event.pressure || 1,
          opacity: 1,
          type: 'note' as const,
          text: ''
        })
      } else if (tool === 'select') {
        setIsDrawing(true)
        const path = paths.find(path => {
          return isPointInPath(path, [x, y])
        })
        if (path) {
          if (path.type === 'shape') {
            setIsShape(true)
            setSelectedPath(path)
          }
          setSelectedPathId(path.id)
          setCurrentPath(path)
        } else {
          setSelectedPathId(null)
        }
      }
    },
    [tool, selectedShapeType, isEditingText, paths]
  )

  useEffect(() => {
    if (color && selectedPathId) {
      const path = paths.find(path => path.id === selectedPathId)
      if (path) {
        path.color = color
        setPaths(prevPaths => prevPaths.map(p => (p.id === selectedPathId ? path : p)))
      }
    }
  }, [color])

  useEffect(() => {
    if (thickness && selectedPathId) {
      const path = paths.find(path => path.id === selectedPathId)
      if (path) {
        path.width = thickness
        setPaths(prevPaths => prevPaths.map(p => (p.id === selectedPathId ? path : p)))
      }
    }
  }, [thickness])

  useEffect(() => {
    if (opacity && selectedPathId) {
      const path = paths.find(path => path.id === selectedPathId)
      if (path) {
        path.opacity = opacity
        setPaths(prevPaths => prevPaths.map(p => (p.id === selectedPathId ? path : p)))
      }
    }
  }, [opacity])

  const handlePointerMove = (event: PointerEvent) => {
    if (!isDrawing || !currentPath) return

    const [x, y] = getCoordinates(event)

    if (tool === 'pencil') {
      const newPath = {
        ...currentPath,
        points: [...currentPath.points, [x, y]],
        pressure: event.pressure || 1,
        type: 'pencil' as const
      }
      setCurrentPath(newPath)
    } else if (tool === 'axis') {
      const newPath = {
        ...currentPath,
        points: [currentPath.points[0], [x, y]],
        pressure: event.pressure || 1,
        type: 'axis' as const
      }
      setCurrentPath(newPath)
    } else if (tool === 'shape') {
      const newPath = {
        ...currentPath,
        points: [currentPath.points[0], [x, y]],
        pressure: event.pressure || 1,
        type: 'shape' as const,
        shapeType: selectedShapeType
      }
      setCurrentPath(newPath)
    } else if (tool === 'select') {
      const path = paths.find(path => path.id === selectedPathId)
      if (path) {
        const dx = x - coordinates.x
        const dy = y - coordinates.y
        const newPoints = path.points.map(([px, py]) => [px + dx, py + dy])
        const newPath = {
          ...path,
          points: newPoints
        }
        setPaths(prevPaths => prevPaths.map(p => (p.id === selectedPathId ? newPath : p)))
      }
    }
    setCoordinates({ x, y })
  }

  const handlePointerUp = () => {
    if (currentPath) {
      if (tool === 'pencil' || tool === 'axis' || tool === 'shape' || tool === 'note') {
        setPaths([...paths, currentPath])
        dispatch(addHistory({
          type: 'canvas',
          content: currentPath
        }))
      }
    }
    setIsDrawing(false)
    setCurrentPath(null)
  }

  // 渲染路径
  const renderPath = (pathData: CanvasPath) => {
    if (pathData.type === 'axis') {
      const points = Array.from(pathData.points)
      if (points.length < 2) return ''
      const [startX, startY] = points[0]
      const [endX, endY] = points[1]
      const dx = endX - startX
      const dy = endY - startY
      const angle = Math.atan2(dy, dx)

      // 箭头线
      const line = `M ${startX},${startY} L ${endX},${endY}`

      // 箭头头部
      const arrowLength = 10
      const arrowHead1 = `M ${endX},${endY} L ${endX - arrowLength * Math.cos(angle - Math.PI / 6)},${
        endY - arrowLength * Math.sin(angle - Math.PI / 6)
      }`
      const arrowHead2 = `M ${endX},${endY} L ${endX - arrowLength * Math.cos(angle + Math.PI / 6)},${
        endY - arrowLength * Math.sin(angle + Math.PI / 6)
      }`

      return `${line} ${arrowHead1} ${arrowHead2}`
    } else if (pathData.type === 'pencil') {
      const points = Array.from(pathData.points)
      return points.length > 1 ? `M ${points.map(point => point.join(',')).join(' L ')}` : ''
    } else if (pathData.type === 'shape') {
      if (pathData.points.length < 2) return ''
      let x, y
      switch (pathData.shapeType) {
        case 'rectangle':
          ;[x, y] = pathData.points[0]
          const [endX, endY] = pathData.points[1]
          return `M ${x},${y} L ${endX},${y} L ${endX},${endY} L ${x},${endY} Z`
        case 'circle':
          ;[x, y] = pathData.points[0]
          const [endXCircle, endYCircle] = pathData.points[1]
          const radius = Math.sqrt((endXCircle - x) ** 2 + (endYCircle - y) ** 2)
          return `M ${x},${y - radius} A ${radius},${radius} 0 1,0 ${x},${
            y + radius
          } A ${radius},${radius} 0 1,0 ${x},${y - radius}`
        default:
          return ''
      }
    } else if (pathData.type === 'note') {
      return ''
    }
  }

  const handleTextChange = (e: React.FormEvent<HTMLDivElement>, currentPathId: number) => {
    const text = e.currentTarget.textContent || ''
    if (text.trim() === '') {
      const updatedPaths = paths.filter(path => path.id !== currentPathId)
      setPaths(updatedPaths)
    } else {
      const updatedPaths = paths.map(path => (path.id === currentPathId ? { ...path, text } : path))
      setPaths(updatedPaths)
    }
  }

  const isPointInPath = (path: CanvasPath, point: [number, number]): boolean => {
    if (path.type === 'note') {
      const [x, y] = point
      const [startX, startY] = path.points[0]
      let isOk = x >= startX - 10 && x <= startX + 100 + 10 && y >= startY - 10 && y <= startY + 45 + 10
      return isOk
    } else if (path.type === 'pencil') {
      const [x, y] = point
      const points = Array.from(path.points)
      for (let i = 0; i < points.length - 1; i++) {
        const [startX, startY] = points[i]
        const [endX, endY] = points[i + 1]
        const distance = distanceToSegment(x, y, startX, startY, endX, endY)

        if (distance < 10) {
          return true
        }
      }
      return false
    } else if (path.type === 'shape') {
      const [x, y] = point
      const [startX, startY] = path.points[0]
      const [endX, endY] = path.points[1]
      if (path.shapeType === 'circle') {
        const radius = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2)
        return Math.abs((x - startX) ** 2 + (y - startY) ** 2 - radius ** 2) < 1000
      } else if (path.shapeType === 'rectangle') {
        return distanceToRectangle(x, y, startX, startY, endX, endY)
      }
      return false
    } else if (path.type === 'axis') {
      const [x, y] = point
      const [startX, startY] = path.points[0]
      const [endX, endY] = path.points[1]
      const distance = distanceToSegment(x, y, startX, startY, endX, endY)
      return distance < 10
    }
    return false
  }

  // 撤销功能
  const handleUndo = () => {
    setPaths(prev => prev.slice(0, -1))
  }

  // 清空画布
  const handleClear = () => {
    setPaths([])
  }

  const messages = useAppSelector(selectMessages)
  const handleAskVisPilot = useCallback(() => {
    const svgElem = svgRef.current
    if (svgElem) {
      svgToBase64Png(svgElem, 1250, 700)
        .then(base64 => {
          const imageUrl = base64 as string
          const message: Message = {
            id: messages.length + 1,
            role: 'user',
            sender: 'user',
            content: [
              // { type: 'text', text: 'Please recommend a visualization based on the sketch below.' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
          dispatch(addMessage(message))
          dispatch(setState('waiting'))
          sendRequest([...messages, message]).then(response => {
            dispatch(addMessage(response))
            dispatch(setState('idle'))
          })
        })
        .catch(console.error)
    }
  }, [dispatch, messages])

  const shapeToolList: ToolButtonInfo[] = [
    {
      name: 'rectangle',
      icon: 'rectangle',
      title: 'Rectangle',
      handleClick: () => setSelectedShapeType('rectangle')
    },
    {
      name: 'circle',
      icon: 'circle',
      title: 'Circle',
      handleClick: () => setSelectedShapeType('circle')
    }
  ]

  const toolList: ToolButtonInfo[][] = [
    [
      {
        name: 'undo',
        icon: 'undo',
        title: 'Undo',
        handleClick: handleUndo
      },
      {
        name: 'redo',
        icon: 'redo',
        title: 'Redo',
        handleClick: () => {}
      }
    ],
    [
      {
        name: 'pencil',
        icon: 'stylus_note',
        title: 'Pencil',
        handleClick: () => {
          dispatch(setTool('pencil'))
        }
      },
      {
        name: 'shape',
        icon: 'shapes',
        title: 'Shape',
        handleClick: () => {
          dispatch(setTool('shape'))
        }
      },
      {
        name: 'axis',
        icon: 'shuffle',
        title: 'Axis',
        handleClick: () => {
          dispatch(setTool('axis'))
        }
      },
      {
        name: 'note',
        icon: 'sticky_note',
        title: 'Text',
        handleClick: () => {
          dispatch(setTool('note'))
        }
      }
    ],
    [
      {
        name: 'select',
        icon: 'left_click',
        title: 'Select',
        handleClick: () => {
          dispatch(setTool('select'))
        }
      },
      {
        name: 'selectArea',
        icon: 'ink_selection',
        title: 'Select area',
        handleClick: () => {
          dispatch(setTool('selectArea'))
        }
      }
    ]
  ]

  return (
    <div className="relative">
      {/*Top buttons*/}
      <div className="absolute top-4 right-4 flex z-10 text-neutral-600">
        <button
          className="flex items-center justify-center space-x-2 h-9 w-[9.5rem] rounded bg-gray-200 font-bold hover:bg-gray-300 cursor-pointer"
          onClick={handleAskVisPilot}>
          <GlowingText>
            <span className="material-symbols-outlined">emoji_objects</span>
          </GlowingText>
          <span> Ask VisPilot</span>
        </button>
      </div>
      <div className="absolute top-4 left-4 flex z-10 text-neutral-600 gap-3">
        <button
          className="flex items-center h-9 w-[5rem] px-2 py-1 space-x-1 rounded bg-gray-200 font-bold hover:bg-gray-300 cursor-pointer"
          onClick={handleClear}>
          <span className="material-symbols-outlined icon-small">delete</span>
          <span>Clear</span>
        </button>

        <button
          className="flex items-center h-9 w-[6rem] px-2 py-1 space-x-1 rounded bg-gray-200 font-bold hover:bg-gray-300 cursor-pointer"
          onClick={undefined}>
          <span className="material-symbols-outlined icon-small">download</span>
          <span>Export</span>
        </button>
      </div>

      {/*Toolbox*/}
      <div className="absolute bottom-10 left-1/2 -ml-32">
        <ToolBox
          toolList={toolList}
          shapeToolList={shapeToolList}
          selectedShapeType={selectedShapeType}
          setSelectedShapeType={setSelectedShapeType}
        />
      </div>

      {/*Path svg*/}
      <svg
        ref={svgRef}
        className="w-full h-[700px] touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'none' }}>
        {/* 已完成的路径 */}
        {paths.map((path: CanvasPath) => (
          <motion.path
            key={path.id}
            d={renderPath(path)}
            fill="none"
            stroke={path.color}
            strokeWidth={selectedPathId === path.id ? path.width * path.pressure * 2 : path.width * path.pressure}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={path.opacity}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
            style={{ cursor: 'pointer' }}
          />
        ))}

        {/* 文本路径 */}
        {paths.map(path => (
          <g key={path.id} onClick={e => e.stopPropagation()}>
            {path.type === 'note' && tool === 'note' ? (
              editingPathId === path.id ? (
                <foreignObject x={path.points[0][0]} y={path.points[0][1]} width="100" height="45">
                  <div
                    contentEditable={true}
                    className={`w-full h-full p-2 rounded bg-transparent outline-none border-2 ${
                      isEditingText && editingPathId === path.id ? 'border-black' : 'border-transparent'
                    }`}
                    style={{ color: path.color, fontWeight: path.width * 100, opacity: path.opacity }}
                    onInput={e => {
                      const inputText = e.currentTarget.textContent || ''
                      handleTextChange(e, path.id)
                    }}
                    onFocus={e => {
                      setIsEditingText(true)
                      setEditingPathId(path.id)
                      e.currentTarget.classList.remove('border-transparent')
                      e.currentTarget.classList.add('border-black')
                    }}
                    onBlur={e => {
                      setIsEditingText(false)
                      if (!e.currentTarget.textContent?.trim()) {
                        const updatedPaths = paths.filter(p => p.id !== path.id)
                        setPaths(updatedPaths)
                      } else {
                        e.currentTarget.classList.remove('border-black')
                        e.currentTarget.classList.add('border-transparent')
                      }
                      setEditingPathId(null)
                    }}
                    autoFocus
                  />
                </foreignObject>
              ) : (
                <foreignObject x={path.points[0][0]} y={path.points[0][1]} width="100" height="45">
                  <div
                    contentEditable={true}
                    className={`w-full h-full p-2 rounded bg-transparent outline-none border-2 ${
                      isEditingText && editingPathId === path.id ? 'border-black' : 'border-transparent'
                    }`}
                    style={{ color: path.color, fontWeight: path.width * 100, opacity: path.opacity }}
                    onInput={e => {
                      const inputText = e.currentTarget.textContent || ''
                      handleTextChange(e, path.id)
                    }}
                    onFocus={e => {
                      setIsEditingText(true)
                      setEditingPathId(path.id)
                      e.currentTarget.classList.remove('border-transparent')
                      e.currentTarget.classList.add('border-black')
                    }}
                    onBlur={e => {
                      setIsEditingText(false)
                      if (!e.currentTarget.textContent?.trim()) {
                        const updatedPaths = paths.filter(p => p.id !== path.id)
                        setPaths(updatedPaths)
                      } else {
                        e.currentTarget.classList.remove('border-black')
                        e.currentTarget.classList.add('border-transparent')
                      }
                      setEditingPathId(null)
                    }}
                    autoFocus>
                    {path.text}
                  </div>
                </foreignObject>
              )
            ) : (
              <text
                key={path.id}
                x={path.points[0][0]}
                y={path.points[0][1]}
                fill={path.color}
                opacity={path.opacity}
                fontWeight={path.width * 100}
                style={{
                  cursor: 'pointer',
                  background: selectedPathId === path.id ? 'rgba(0, 0, 0, 0.1)' : 'none',
                  transition: 'background 0.3s ease'
                }}
                onClick={e => {
                  e.stopPropagation()
                  setSelectedPathId(path.id)
                }}>
                {path.text}
              </text>
            )}
          </g>
        ))}

        {/* 当前正在绘制的路径 */}
        {currentPath && (
          <path
            d={renderPath(currentPath)}
            fill="none"
            stroke={currentPath.color}
            opacity={currentPath.opacity}
            strokeWidth={
              selectedPathId === currentPath.id
                ? currentPath.width * currentPath.pressure * 2
                : currentPath.width * currentPath.pressure
            }
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ cursor: 'pointer' }}
          />
        )}
      </svg>

      {/*Embed Vega Views*/}
      <EmbedVegaViews />
    </div>
  )
}

interface ToolButtonInfo {
  name: string
  icon: string
  title: string
  handleClick: () => void
}

const ToolBox = ({
  toolList,
  shapeToolList,
  selectedShapeType,
  setSelectedShapeType
}: {
  toolList: ToolButtonInfo[][]
  shapeToolList: ToolButtonInfo[]
  selectedShapeType: ShapeType | null
  setSelectedShapeType: (shapeType: ShapeType | null) => void
}) => {
  const tool = useAppSelector(selectTool)
  return (
    <>
      <div className="flex flex-col items-center justify-center space-y-2">
        {/* 形状选择器 */}
        {tool === 'shape' && (
          <div className="flex items-center justify-center px-2 h-12 w-[90px] shadow-md border border-neutral-100 rounded bg-white text-neutral-600">
            <div className="flex items-center space-x-1">
              {shapeToolList.map((toolInfo, i) => (
                <button key={`shape-tool-${i}`} onClick={() => setSelectedShapeType(toolInfo.name as ShapeType)}>
                  <ToolIcon icon={toolInfo.icon} text={toolInfo.title} active={selectedShapeType === toolInfo.name} />
                </button>
              ))}
            </div>
          </div>
        )}
        {/* 主工具栏 */}
        <div className="flex items-center justify-center px-2 h-12 w-[345px] shadow-md border border-neutral-100 rounded bg-white text-neutral-600">
          {toolList.map((toolGroup, index) => (
            <div className="flex items-center space-x-1" key={index}>
              {index > 0 && <div className="border border-neutral-300 h-6 ml-2.5 mr-2"></div>}
              {toolGroup.map((toolInfo, i) => (
                <button key={`tool-${index}-${i}`} onClick={toolInfo.handleClick}>
                  <ToolIcon icon={toolInfo.icon} text={toolInfo.title} active={tool === toolInfo.name} />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

const ToolIcon = ({
  className,
  icon,
  active,
  text
}: {
  className?: string
  icon: string
  active?: boolean
  text?: string
}) => {
  return (
    <>
      <span
        className={`material-symbols-outlined rounded p-1 select-none cursor-pointer ${
          active ? 'bg-blue-300 text-white' : 'hover:bg-gray-100'
        } ${className}`}
        title={text}>
        {icon}
      </span>
    </>
  )
}

import { sendRequest } from '@/model'
import { addMessage, selectMessages, setState } from '@/store/features/ChatSlice'
import vegaEmbed from 'vega-embed'
import { compile } from 'vega-lite'
import {addHistory} from "@/store/features/HistorySlice";

const EmbedVegaViews = () => {
  const vegaEmbeds = useAppSelector(selectVegaEmbeds)

  return (
    <div className="absolute top-0 left-0">
      {vegaEmbeds.vegaSpecs.map((spec: TopLevelSpec, index: number) => (
        <div
          key={index}
          id={`canvas-vega-${index}`}
          className="absolute"
          style={{ top: vegaEmbeds.positions[index][1], left: vegaEmbeds.positions[index][0] }}>
          <VegaLite spec={spec} />
        </div>
      ))}
    </div>
  )
}

const VegaLite = ({ spec }: { spec: TopLevelSpec }) => {
  const visRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (visRef.current) {
      const sp = compile(structuredClone(spec)).spec
      vegaEmbed(visRef.current, sp).then().catch(console.error)
    }
  })

  return (
    <div className={'canvas-vega-embed flex items-center justify-center hover:shadow-lg p-2 pt-4'} ref={visRef}></div>
  )
}

function svgToBase64Png(svgElement: SVGSVGElement, width: number, height: number) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      canvas.width = width || svgElement.clientWidth || svgElement.getBoundingClientRect().width
      canvas.height = height || svgElement.clientHeight || svgElement.getBoundingClientRect().height

      // 克隆 SVG 元素以避免修改原始元素
      const svgClone = svgElement.cloneNode(true)

      // 创建背景矩形
      const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      background.setAttribute('width', '100%')
      background.setAttribute('height', '100%')
      background.setAttribute('fill', 'white')

      // 将背景插入到 SVG 的最前面
      svgClone.insertBefore(background, svgClone.firstChild)

      const svgString = new XMLSerializer().serializeToString(svgClone)
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)

      const img = new Image()
      img.onload = () => {
        ctx.fillStyle = 'white' // 设置 canvas 背景色为白色
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const base64String = canvas.toDataURL('image/png')
        URL.revokeObjectURL(url)
        resolve(base64String)
      }

      img.onerror = error => {
        URL.revokeObjectURL(url)
        reject(error)
      }

      img.src = url
    } catch (error) {
      reject(error)
    }
  })
}

function distanceToTopEdge(x: number, y: number, startY: number): number {
  return Math.abs(y - startY)
}
function distanceToRightEdge(x: number, y: number, endX: number): number {
  return Math.abs(x - endX)
}
function distanceToBottomEdge(x: number, y: number, endY: number): number {
  return Math.abs(y - endY)
}
function distanceToLeftEdge(x: number, y: number, startX: number): number {
  return Math.abs(x - startX)
}
function distanceToRectangle(
  x: number,
  y: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): boolean {
  const distances = [
    distanceToTopEdge(x, y, startY),
    distanceToRightEdge(x, y, endX),
    distanceToBottomEdge(x, y, endY),
    distanceToLeftEdge(x, y, startX)
  ]
  const edgeXLeft = Math.min(startX, endX)
  const edgeXRight = Math.max(startX, endX)
  const edgeYTop = Math.max(startY, endY)
  const edgeYBottom = Math.min(startY, endY)
  let isOk = false
  isOk =
    (distances[0] < 10 && x >= edgeXLeft - 10 && x <= edgeXRight + 10) ||
    (distances[1] < 10 && y >= edgeYBottom - 10 && y <= edgeYTop + 10) ||
    (distances[2] < 10 && x >= edgeXLeft - 10 && x <= edgeXRight + 10) ||
    (distances[3] < 10 && y >= edgeYBottom - 10 && y <= edgeYTop + 10)
  return isOk
}
function distanceToSegment(px: number, py: number, startX: number, startY: number, endX: number, endY: number): number {
  const dx = endX - startX
  const dy = endY - startY
  const segmentLengthSquared = dx * dx + dy * dy

  if (segmentLengthSquared === 0) {
    return Math.sqrt((px - startX) ** 2 + (py - startY) ** 2)
  }

  // 计算投影参数 t
  const t = ((px - startX) * dx + (py - startY) * dy) / segmentLengthSquared

  if (t < 0) {
    // 投影点在线段起点之外，计算点到起点的距离
    return Math.sqrt((px - startX) ** 2 + (py - startY) ** 2)
  } else if (t > 1) {
    // 投影点在线段终点之外，计算点到终点的距离
    return Math.sqrt((px - endX) ** 2 + (py - endY) ** 2)
  } else {
    // 投影点在线段上，计算点到直线的距离
    const projectionX = startX + t * dx
    const projectionY = startY + t * dy
    return Math.sqrt((px - projectionX) ** 2 + (py - projectionY) ** 2)
  }
}
