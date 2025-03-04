import VLJsonView from '@/components/DesignPanel/VLJsonView'

const DesignPanel = () => {
  return (
    <div className="flex flex-col p-2">
      <div className="font-bold text-xl border-b-2 border-neutral-200 pb-2">Design Panel</div>
      <div className="h-72 border-b border-neutral-200 mt-1 font-bold text-base">Configuration</div>
      <div className="font-bold text-base mt-1">Vega-Lite Code</div>
      <div className="mt-2 max-h-[660px] overflow-auto no-scrollbar whitespace-pre">
        <VLJsonView />
      </div>
    </div>
  )
}

export default DesignPanel
