import GlowingText from '@/components/Canvas/GlowingText'
import {useAppDispatch, useAppSelector} from '@/store'
import {
  selectTool,
  selectPaths,
  setTool,
  ShapeType,
  selectCurrentStyle,
  setPath,
  addPath,
  removePath,
  clearPaths,
  setCurrentStyle,
  updatePathPoints,
  selectFocusedPathID, setFocusedPathID, selectVegaElementHighlight, clearVegaElementHighlight, setCanvasSize
} from '@/store/features/CanvasSlice'
import {CanvasPath, Message} from '@/types'
import {PointerEvent, useCallback, useEffect, useRef, useState} from 'react'


export default function SketchPad() {
  const dispatch = useAppDispatch()
  const tool = useAppSelector(selectTool)
  const focusedPathID = useAppSelector(selectFocusedPathID);
  const paths = useAppSelector(selectPaths)
  const currentStyle = useAppSelector(selectCurrentStyle)

  const [currentPath, setCurrentPath] = useState<CanvasPath | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [isPencil, setIsPencil] = useState<boolean>(false)

  const svgRef = useRef<SVGSVGElement | null>(null)
  const svgBBox = svgRef.current?.getBoundingClientRect();

  const [selectedShapeType, setSelectedShapeType] = useState<'rectangle' | 'circle'>('rectangle')
  const [editingPathId, setEditingPathId] = useState<number | null>(null)
  const [isEditingText, setIsEditingText] = useState(false)
  const [coordinates, setCoordinates] = useState<{ x: number; y: number }>({x: 0, y: 0})
  const [textInput, setTextInput] = useState('')

  const vegaElementHighlight = useAppSelector(selectVegaElementHighlight)

  // update default style when tool changes
  useEffect(() => {
    if (tool !== 'select') {
      setIsMoving(false)
      dispatch(setFocusedPathID(null))
    }
    if (tool === 'pencil' || tool === 'axis') {
      const newStyle = {...currentStyle, fill: 'none', stroke: '#000000'}
      dispatch(setCurrentStyle(newStyle))
    }
    if (tool === 'note') {
      const newStyle = {...currentStyle, fill: '#000000', stroke: 'none'}
      dispatch(setCurrentStyle(newStyle))
    }
    if (tool === 'shape') {
      const newStyle = {...currentStyle, fill: '#ffffff', stroke: '#000000'}
      dispatch(setCurrentStyle(newStyle))
    }
  }, [dispatch, tool]);
  useEffect(() => {
    if (focusedPathID) {
      const path = paths.find(path => path.id === focusedPathID)
      if (path) {
        const newPath = {...path, style: {...currentStyle}}
        dispatch(setPath({id: focusedPathID, path: newPath}))
      }
    }
  }, [dispatch, currentStyle]);
  useEffect(() => {
    if (focusedPathID) {
      const style = paths.find(path => path.id === focusedPathID)?.style
      if (style) dispatch(setCurrentStyle(style))
    }
  }, [dispatch, focusedPathID]);

  useEffect(() => {
    if (svgBBox) {
      dispatch(setCanvasSize({width: svgBBox.width, height: svgBBox.height}))
    }
  }, [dispatch, svgBBox]);

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
        return [Math.floor(relativePoint.x), Math.floor(relativePoint.y)]
      }
    }
    return [0, 0]
  }

  const clientXYToCanvasCoords = (pos: [number, number]) => {
    const svg = svgRef.current
    if (svg) {
      const point = svg.createSVGPoint()
      point.x = pos[0]
      point.y = pos[1]
      const ctm = svg.getScreenCTM()
      if (ctm) {
        const inversedCTM = ctm.inverse()
        const relativePoint = point.matrixTransform(inversedCTM)
        return [Math.floor(relativePoint.x), Math.floor(relativePoint.y)]
      }
    }
    return [0, 0]
  }

  const handlePointerDown = useCallback((event: PointerEvent) => {
      // Check if the input is from a pen/stylus
      if (event.pointerType === 'pen') {
        setIsPencil(true)
        // Capture pointer to get events outside canvas
        if (svgRef.current) {
          svgRef.current.setPointerCapture(event.pointerId)
        }
      } else {
        setIsPencil(false)
      }
      const [x, y] = getCoordinates(event)
      setCoordinates({x, y})
      if (tool === 'pencil' || tool === 'axis' || tool === 'shape' || tool === 'note') {
        if (isEditingText) {
          setIsEditingText(false)
        } else if (tool === 'pencil') {
          setIsDrawing(true)
          setCurrentPath({
            id: Date.now(),
            points: [[x, y]],
            style: {...currentStyle},
            pressure: event.pointerType === 'pen' ? event.pressure * 10 || 1 : 1,
            type: 'pencil' as const
          })
        } else if (tool === 'axis') {
          setIsDrawing(true)
          setCurrentPath({
            id: Date.now(),
            points: [[x, y]],
            style: {...currentStyle},
            pressure: 1,
            type: 'axis' as const
          })
        } else if (tool === 'shape') {
          setIsDrawing(true)
          setCurrentPath({
            id: Date.now(),
            points: [[x, y]],
            style: {...currentStyle},
            pressure: 1,
            type: 'shape' as const,
            shapeType: selectedShapeType
          })
        } else if (tool === 'note') {
          setIsEditingText(true)
          setIsDrawing(true)
          const newPath = {
            id: Date.now(),
            points: [[x, y]],
            style: {...currentStyle},
            pressure: 1,
            type: 'note' as const,
            text: ''
          }
          setCurrentPath(newPath)
          dispatch(setFocusedPathID(newPath.id))
        }
      }

    },
    [tool, isEditingText, currentStyle, selectedShapeType, paths]
  )

  const handlePointerMove = useCallback((event: PointerEvent) => {
      const [x, y] = getCoordinates(event)
      if (tool === 'select' && isMoving && focusedPathID) {
        const dx = Math.floor(x - coordinates.x)
        const dy = Math.floor(y - coordinates.y)
        if (dx !== 0 || dy !== 0) {
          const path = paths.find(path => path.id === focusedPathID)
          if (path) {
            const newPoints = path.points.map(([px, py]) => [px + dx, py + dy])
            dispatch(updatePathPoints({id: focusedPathID, pathPoints: newPoints}))
          }
        }
      }

      if (isDrawing && currentPath) {
        if (tool === 'pencil') {
          const newPath = {
            ...currentPath,
            points: [...currentPath.points, [x, y]],
            pressure: isPencil ? event.pressure * 10 || 1 : 1,
            type: 'pencil' as const
          }
          setCurrentPath(newPath)
        } else if (tool === 'axis') {
          const newPath = {
            ...currentPath,
            points: [currentPath.points[0], [x, y]],
            pressure: 1,
            type: 'axis' as const
          }
          setCurrentPath(newPath)
        } else if (tool === 'shape') {
          const newPath = {
            ...currentPath,
            points: [currentPath.points[0], [x, y]],
            pressure: 1,
            type: 'shape' as const,
            shapeType: selectedShapeType
          }
          setCurrentPath(newPath)
        }
      }

      setCoordinates({x, y})
    },
    [dispatch, tool, isMoving, focusedPathID, isDrawing, currentPath, coordinates.x, coordinates.y, paths, isPencil, selectedShapeType])

  const handlePointerUp = useCallback((event: PointerEvent) => {
      if (svgRef.current && isPencil) {
        svgRef.current.releasePointerCapture(event.pointerId)
      }
      if (currentPath) {
        if (tool === 'pencil' || tool === 'axis' || tool === 'shape' || tool === 'note') {
          dispatch(addPath(currentPath))
          dispatch(
            addHistory({
              type: 'canvas',
              content: currentPath
            })
          )
        }
      }
      setIsDrawing(false)
      setCurrentPath(null)
    },
    [isPencil, currentPath, tool, dispatch])

  const handleElementPointerDown = (pathID: number) => {
    if (tool === 'select') {
      setIsMoving(true)
      dispatch(setFocusedPathID(pathID));
    }
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

  const handleTextChange = (inputText: string, currentPathID: number) => {
    const text = inputText;
    if (text.trim() === '') {
      dispatch(removePath(currentPathID))
    } else {
      const path = paths.find(path => path.id === currentPathID)
      if (path) {
        const newPath = {
          ...path,
          text: text
        }
        dispatch(setPath({id: currentPathID, path: newPath}))
      }
    }
  }

  // 撤销功能
  const handleUndo = () => {
    if (paths.length === 0) return
    const lastID = paths[paths.length - 1].id
    dispatch(removePath(lastID))
  }

  // 清空画布
  const handleClear = () => {
    dispatch(clearVegaElementHighlight())
    dispatch(clearPaths())
  }

  const messages = useAppSelector(selectMessages)
  const model = useAppSelector(selectModel)
  const handleAskVisPilot = useCallback(() => {
    const svgElem = svgRef.current
    if (svgElem && svgBBox) {
      svgToBase64Png(svgElem, svgBBox.width, svgBBox.height)
        .then(base64 => {
          const imageUrl = base64 as string

          const messageList = [...messages]

          if (vegaElementHighlight.elements.length > 0) {
            const attachedMessage: Message = {
              id: Date.now(),
              role: 'user',
              sender: 'system',
              content: [
                {
                  type: 'text',
                  text: `**User Actions**: User selects the elements in Vega-Lite Visualization: ${vegaElementHighlight.elements.join(', ')}`
                }
              ]
            }
            dispatch(addMessage(attachedMessage))
            messageList.push(attachedMessage)
          }

          const message: Message = {
            id: Date.now(),
            role: 'user',
            sender: 'user',
            content: [
              {type: 'image', image: imageUrl}
            ]
          }
          dispatch(addMessage(message))
          messageList.push(message)


          dispatch(setState('waiting'))
          sendRequest(messageList, model).then(response => {
            dispatch(addMessage(response))
            dispatch(setState('idle'))
          })
        })
        .catch(console.error)
    }
  }, [dispatch, messages, model, svgBBox, vegaElementHighlight.elements])

  const shapeToolList: ToolButtonInfo[] = [
    {
      name: 'rectangle',
      icon: 'square',
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
        handleClick: () => {
        }
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
        title: 'Select in Chart',
        handleClick: () => {
          dispatch(setTool('selectArea'))
        }
      }
    ]
  ]

  return (
    <div className="relative h-full">
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
      <div className="absolute bottom-10 left-1/2 -ml-[172px]">
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
        className="w-full 2k:h-[700px] h-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{touchAction: 'none'}}>

        {/* 已完成的路径 */}
        {paths.map((path: CanvasPath) => {
          return <g key={path.id}
               fill={path.style.fill}
               stroke={path.style.stroke}
               strokeWidth={focusedPathID === path.id ? path.style.strokeWidth * path.pressure * 4 : path.style.strokeWidth * path.pressure * 2}
               strokeLinecap="round"
               strokeLinejoin="round"
               opacity={path.style.opacity}
               style={{cursor: tool === 'select' ? 'pointer' : 'default'}}
               onPointerDown={() => handleElementPointerDown(path.id)}
               onPointerUp={() => setIsMoving(false)}
            >
              {path.type === 'pencil' || path.type === 'axis' || path.type === 'shape' ?
                <path d={renderPath(path)}/> : (
                  path.type === 'vega' ?
                    <g transform={`translate(${path.points[0][0]}, ${path.points[0][1]})`}
                       fill="none"
                       stroke="none"
                       strokeWidth="1"
                       opacity="1"
                    >
                      <SVGRenderer svgString={path.vegaSVG || ''} selectable={tool === 'selectArea'}/>
                    </g>
                    : path.type === 'note' ? <>
                      <g onClick={e => e.stopPropagation()}>
                        {tool === 'note' ? (
                          <foreignObject x={path.points[0][0]} y={path.points[0][1]} width="180" height="36">
                            <input
                              contentEditable={true}
                              className={`w-full px-2 py-1 rounded outline-none border-1`}
                              style={{color: path.style.fill, fontWeight: 400, opacity: path.style.opacity}}
                              value={
                                path.id === editingPathId && isEditingText ? textInput : path.text
                              }
                              onChange={e => setTextInput(e.target.value)}
                              onFocus={() => {
                                setIsEditingText(true)
                                setTextInput(path.text || '')
                                setEditingPathId(path.id)
                              }}
                              onBlur={() => {
                                setIsEditingText(false)
                                handleTextChange(textInput, path.id)
                                setTextInput('');
                                setEditingPathId(null)
                                dispatch(setTool('select'))
                                dispatch(setFocusedPathID(null))
                              }}
                              onPointerDown={e => e.stopPropagation()}
                              autoFocus={focusedPathID === path.id}
                            />
                          </foreignObject>
                        ) : (
                          <text
                            key={path.id}
                            x={path.points[0][0] + 9}
                            y={path.points[0][1] + 23}
                            fill={path.style.fill}
                            opacity={path.style.opacity}
                            fontWeight={400}
                            textAnchor={'start'}
                            style={{
                              cursor: 'pointer',
                              background: focusedPathID === path.id ? 'rgba(0, 0, 0, 0.1)' : 'none',
                              transition: 'background 0.3s ease'
                            }}
                            onClick={e => {
                              e.stopPropagation()
                              dispatch(setFocusedPathID(path.id))
                            }}>
                            {path.text}
                          </text>
                        )}
                      </g>
                    </> : null
                )}
            </g>

        })
        }

        {/* 当前正在绘制的路径 */}
        {currentPath && (
          <path
            d={renderPath(currentPath)}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{...currentPath.style, cursor: 'default'}}
          />
        )}

        {
          vegaElementHighlight.elements.length > 0 &&
            <rect
                x={clientXYToCanvasCoords(vegaElementHighlight.containerPos)[0] + vegaElementHighlight.bbox[0]}
                y={clientXYToCanvasCoords(vegaElementHighlight.containerPos)[1] + vegaElementHighlight.bbox[1]}
                width={vegaElementHighlight.bbox[2]}
                height={vegaElementHighlight.bbox[3]}
                stroke={'oklch(0.704 0.191 22.216)'}
                strokeWidth={1}
                fill={'oklch(0.704 0.191 22.216)'}
                fillOpacity={0.1}
            />
        }
      </svg>

      {/* Optional: Display indicator that Apple Pencil is being used */}
      {isPencil && currentPath && (
        <div className="absolute bottom-4 right-4 bg-blue-500 text-white px-2 py-1 rounded-md text-sm">
          Pencil (Pressure: {currentPath.pressure.toFixed(2)})
        </div>
      )}
    </div>
  )
}

interface ToolButtonInfo {
  name: string
  icon: string
  title: string
  handleClick: () => void
}

const ToolBox = ({toolList, shapeToolList, selectedShapeType, setSelectedShapeType}: {
  toolList: ToolButtonInfo[][]
  shapeToolList: ToolButtonInfo[]
  selectedShapeType: ShapeType
  setSelectedShapeType: (shapeType: ShapeType) => void
}) => {
  const tool = useAppSelector(selectTool)
  return <>
    <div className="flex flex-col items-center justify-center space-y-2">
      {/* 形状选择器 */}
      {tool === 'shape' && (
        <div
          className="flex items-center justify-center px-2 h-12 w-[90px] shadow-md border border-neutral-100 rounded bg-white text-neutral-600">
          <div className="flex items-center space-x-1">
            {shapeToolList.map((toolInfo, i) => (
              <button key={`shape-tool-${i}`} onClick={() => setSelectedShapeType(toolInfo.name as ShapeType)}>
                <ToolIcon icon={toolInfo.icon} text={toolInfo.title} active={selectedShapeType === toolInfo.name}/>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* 主工具栏 */}
      <div
        className="flex items-center justify-center px-2 h-12 w-[345px] shadow-md border border-neutral-100 rounded bg-white text-neutral-600">
        {toolList.map((toolGroup, index) => (
          <div className="flex items-center space-x-1" key={index}>
            {index > 0 && <div className="border border-neutral-300 h-6 ml-2.5 mr-2"></div>}
            {toolGroup.map((toolInfo, i) => (
              <button key={`tool-${index}-${i}`} onClick={toolInfo.handleClick}>
                <ToolIcon icon={toolInfo.icon} text={toolInfo.title} active={tool === toolInfo.name}/>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  </>
}

const ToolIcon = ({className, icon, active, text}: {
  className?: string
  icon: string
  active?: boolean
  text?: string
}) => {
  return <>
      <span
        className={`material-symbols-outlined rounded p-1 select-none cursor-pointer ${
          active ? 'bg-blue-300 text-white' : 'hover:bg-gray-100'
        } ${className}`}
        title={text}>
        {icon}
      </span>
  </>
}

import {sendRequest} from '@/model'
import {addMessage, selectMessages, selectModel, setState} from '@/store/features/ChatSlice'
import {addHistory} from '@/store/features/HistorySlice'
import SVGRenderer from "@/components/Canvas/SVGRenderer";

const svgToBase64Png = (svgElement: SVGSVGElement, width: number, height: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas with specified dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      canvas.width = width || svgElement.clientWidth || svgElement.getBoundingClientRect().width;
      canvas.height = height || svgElement.clientHeight || svgElement.getBoundingClientRect().height;

      // Create SVG data URL
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});

      // Find all images in the SVG
      const images = Array.from(svgElement.querySelectorAll('image'));

      if (images.length === 0) {
        // No images, proceed with regular conversion
        const DOMURL = window.URL || window.webkitURL || window;
        const url = DOMURL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          // Fill canvas with white background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw SVG onto canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Convert to base64
          const png = canvas.toDataURL('image/png');
          DOMURL.revokeObjectURL(url);
          resolve(png);
        };
        img.onerror = reject;
        img.src = url;
      } else {
        // Create a new SVG with embedded images
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', String(canvas.width));
        svg.setAttribute('height', String(canvas.height));

        // Add white background
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', 'white');
        svg.appendChild(background);

        // Clone the original SVG content
        Array.from(svgElement.childNodes).forEach(node => {
          svg.appendChild(node.cloneNode(true));
        });

        // Wait for all images to be processed
        Promise.all(
          images.map(image => {
            return new Promise<void>((imageResolve) => {
              const href = image.getAttribute('href') || image.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
              if (!href) {
                imageResolve();
                return;
              }

              // Load the image
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                // Create canvas for this image
                const imgCanvas = document.createElement('canvas');
                imgCanvas.width = img.width;
                imgCanvas.height = img.height;
                const imgCtx = imgCanvas.getContext('2d')!;
                imgCtx.drawImage(img, 0, 0);

                // Update href with embedded data
                const imgNode = svg.querySelector(`image[href="${href}"]`) ||
                  svg.querySelector(`image[*|href="${href}"]`);
                if (imgNode) {
                  imgNode.setAttribute('href', imgCanvas.toDataURL());
                }
                imageResolve();
              };
              img.onerror = () => imageResolve(); // Continue even if image fails
              img.src = href;
            });
          })
        ).then(() => {
          // Convert final SVG to data URL
          const finalSvgData = new XMLSerializer().serializeToString(svg);
          const finalSvgBlob = new Blob([finalSvgData], {type: 'image/svg+xml;charset=utf-8'});
          const DOMURL = window.URL || window.webkitURL || window;
          const url = DOMURL.createObjectURL(finalSvgBlob);

          const finalImg = new Image();
          finalImg.onload = () => {
            // Draw complete SVG with embedded images to canvas
            ctx.drawImage(finalImg, 0, 0, canvas.width, canvas.height);
            const png = canvas.toDataURL('image/png');
            DOMURL.revokeObjectURL(url);
            resolve(png);
          };
          finalImg.onerror = reject;
          finalImg.src = url;
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};
