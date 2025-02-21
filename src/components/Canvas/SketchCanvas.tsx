import React, {useState, useRef, PointerEvent, useCallback, useEffect} from 'react';
import {motion} from 'framer-motion';
import {CanvasPath} from "@/types";
import {useAppDispatch, useAppSelector} from "@/store";
import {selectVegaEmbeds, selectTool, setTool} from "@/store/features/CanvasSlice";
import GlowingText from "@/components/Canvas/GlowingText";
import {TopLevelSpec} from "vega-lite";

export default function SketchPad() {
  const dispatch = useAppDispatch();
  const tool = useAppSelector(selectTool);

  const [paths, setPaths] = useState<CanvasPath[]>([]);
  const [currentPath, setCurrentPath] = useState<CanvasPath | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // 获取鼠标在SVG中的相对坐标
  const getCoordinates = (event: PointerEvent) => {
    const svg = svgRef.current;
    if (svg) {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const inversedCTM = ctm.inverse();
        const relativePoint = point.matrixTransform(inversedCTM);
        return [relativePoint.x, relativePoint.y];
      }
    }
    return [0, 0];
  };

  const handlePointerDown = useCallback((event: PointerEvent) => {
    if (tool !== 'pencil') return;
    const [x, y] = getCoordinates(event);
    setIsDrawing(true);
    setCurrentPath({
      id: Date.now(),
      points: [[x, y]],
      color: 'black',
      width: 2,
      pressure: event.pressure || 1
    });
  }, [tool]);

  const handlePointerMove = (event: PointerEvent) => {
    if (!isDrawing || !currentPath) return;

    const [x, y] = getCoordinates(event);
    const pressure = event.pressure || 1;

    const newPath = {
      ...currentPath,
      points: [...currentPath.points, [x, y]],
      pressure: pressure
    }

    setCurrentPath(newPath);
  };

  const handlePointerUp = () => {
    if (currentPath) {
      setPaths([...paths, currentPath]);
    }
    setIsDrawing(false);
    setCurrentPath(null);
  };

  // 渲染路径
  const renderPath = (pathData: CanvasPath) => {
      return pathData.points.length > 1
        ? `M ${pathData.points.map(point => point.join(',')).join(' L ')}`
        : '';
  };

  // 撤销功能
  const handleUndo = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  // 清空画布
  const handleClear = () => {
    setPaths([]);
  };

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
      },
    ],
    [
      {
        name: 'pencil',
        icon: 'stylus_note',
        title: 'Pencil',
        handleClick: () => {dispatch(setTool('pencil'))}
      },
      {
        name: 'shape',
        icon: 'shapes',
        title: 'Shape',
        handleClick: () => {dispatch(setTool('shape'))}
      },
      {
        name: 'axis',
        icon: 'shuffle',
        title: 'Axis',
        handleClick: () => {dispatch(setTool('axis'))}
      },
      {
        name: 'note',
        icon: 'sticky_note',
        title: 'Text',
        handleClick: () => {dispatch(setTool('note'))}
      }
    ],
    [
      {
        name: 'select',
        icon: 'left_click',
        title: 'Select',
        handleClick: () => {dispatch(setTool('select'))}
      },
      {
        name: 'selectArea',
        icon: 'ink_selection',
        title: 'Select area',
        handleClick: () => {dispatch(setTool('selectArea'))}
      }
    ]
  ]

  return (
    <div className="relative">
      {/*Top buttons*/}
      <div className="absolute top-4 right-4 flex z-10 text-neutral-600">
        <button
          className="flex items-center justify-center space-x-2 h-9 w-[9.5rem] rounded bg-gray-200 font-bold hover:bg-gray-300 cursor-pointer"
        >
          <GlowingText>
            <span className="material-symbols-outlined">emoji_objects</span>
          </GlowingText>
          <span> Ask VisPilot</span>
        </button>
      </div>
      <div className="absolute top-4 left-4 flex z-10 text-neutral-600 gap-3">
        <button
          className="flex items-center h-9 w-[5rem] px-2 py-1 space-x-1 rounded bg-gray-200 font-bold hover:bg-gray-300 cursor-pointer"
          onClick={handleClear}
        >
          <span className="material-symbols-outlined icon-small">delete</span>
          <span>Clear</span>
        </button>

        <button
          className="flex items-center h-9 w-[6rem] px-2 py-1 space-x-1 rounded bg-gray-200 font-bold hover:bg-gray-300 cursor-pointer"
          onClick={undefined}
        >
          <span className="material-symbols-outlined icon-small">download</span>
          <span>Export</span>
        </button>
      </div>

      {/*Toolbox*/}
      <div className='absolute bottom-10 left-1/2 -ml-32'>
        <ToolBox toolList={toolList}/>
      </div>

      {/*Path svg*/}
      <svg
        ref={svgRef}
        className="w-full h-[700px] touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{touchAction: 'none'}}
      >
        {/* 已完成的路径 */}
        {paths.map((path: CanvasPath) => (
          <motion.path
            key={path.id}
            d={renderPath(path)}
            fill="none"
            stroke={path.color}
            strokeWidth={path.width * path.pressure}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{pathLength: 0}}
            animate={{pathLength: 1}}
            transition={{duration: 0.5}}
          />
        ))}

        {/* 当前正在绘制的路径 */}
        {currentPath && (
          <path
            d={renderPath(currentPath)}
            fill="none"
            stroke={currentPath.color}
            strokeWidth={currentPath.width * currentPath.pressure}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/*Embed Vega Views*/}
      <EmbedVegaViews />
    </div>
  );
}

interface ToolButtonInfo {
  name:string,
  icon: string,
  title: string,
  handleClick: () => void,
}

const ToolBox = ({toolList}: {
  toolList: ToolButtonInfo[][]
}) => {
  const tool = useAppSelector(selectTool);
  return (
    <>
      <div
        className='flex items-center justify-center px-2 h-12 w-[345px] shadow-md border border-neutral-100 rounded bg-white text-neutral-600'>
        {
          toolList.map((toolGroup, index) => (
            <div className="flex items-center space-x-1" key={index}>
              {
                index > 0 && <div className="border border-neutral-300 h-6 ml-2.5 mr-2"></div>
              }
              {
                toolGroup.map((toolInfo, i) => (
                  <button
                    key={`tool-${index}-${i}`}
                    onClick={toolInfo.handleClick}
                  >
                    <ToolIcon icon={toolInfo.icon} text={toolInfo.title} active={tool === toolInfo.name}/>
                  </button>
                ))
              }
            </div>
          ))
        }
      </div>
    </>
  );
};

const ToolIcon = ({className, icon, active, text}: {
  className?: string,
  icon: string,
  active?: boolean,
  text?: string
}) => {
  return (
    <>
      <span
        className={`material-symbols-outlined rounded p-1 select-none cursor-pointer ${active ? 'bg-blue-300 text-white' : 'hover:bg-gray-100'} ${className}`}
        title={text}
      >
        {icon}
      </span>
    </>
  );
};

import vegaEmbed from 'vega-embed';
import {compile, Config} from 'vega-lite';

const EmbedVegaViews = () => {
  const vegaEmbeds = useAppSelector(selectVegaEmbeds);

  return <div className="absolute top-0 left-0">
    {
      vegaEmbeds.vegaSpecs.map((spec: TopLevelSpec, index: number) => (
        <div key={index} id={`canvas-vega-${index}`} className="absolute" style={{top: vegaEmbeds.positions[index][1], left: vegaEmbeds.positions[index][0]}}>
          <VegaLite spec={spec}/>
        </div>
      ))
    }
  </div>
}

const VegaLite = ({spec}: {spec: TopLevelSpec}) => {
  const visRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (visRef.current) {
        const sp = compile(structuredClone(spec)).spec;
        vegaEmbed(visRef.current, sp)
          .then()
          .catch(console.error);
      }
    }
  )

  return (
    <div className={"canvas-vega-embed flex items-center justify-center hover:shadow-lg p-2 pt-4"} ref={visRef}></div>
  );
}