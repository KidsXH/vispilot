const Canvas = () => {
  return (
    <div className='flex flex-col p-2 relative'>
      <div className='font-bold text-xl'>Canvas</div>
      <div className='grow bg-slate-50/50 border border-neutral-300 h-[700px] mt-1'></div>
      <div className='absolute bottom-10 left-1/2 -ml-36'>
        <ToolBox />
      </div>
    </div>
  );
};

export default Canvas;

const ToolBox = () => {
  return (
    <>
      <div className='flex items-center justify-around px-2 h-12 w-72 shadow-md border border-neutral-100 rounded bg-white text-neutral-600'>
        <WidgetButton name='left_click' />
        <WidgetButton name='ink_selection' />
        <div className="border border-neutral-400 h-6"></div>
        <WidgetButton name='stylus_note' />
        <WidgetButton name='shapes' />
        <WidgetButton name='shuffle' />
        <WidgetButton name='text_fields_alt' />
        <div className="border border-neutral-400 h-6"></div>
        <WidgetButton name='palette' />
      </div>
    </>
  );
};

const WidgetButton = ({name}: {name: string}) => {
  return (
    <>
      <span className='material-symbols-outlined rounded p-1 hover:bg-neutral-100 select-none cursor-pointer'>
        {name}
      </span>
    </>
  );
};
