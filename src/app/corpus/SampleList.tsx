import {useState, useRef, useEffect} from 'react';
import {UtteranceSample} from "@/types";
import dynamic from 'next/dynamic';
import vegaEmbed from 'vega-embed';
import {githubLightTheme} from "@uiw/react-json-view/githubLight";
import {useAppSelector} from "@/store";
import {selectFilteredIDs, selectUtteranceSamples} from "@/store/features/CorpusSlice";

// Dynamically import ReactJson to avoid SSR issues
const ReactJson = dynamic(() => import('@uiw/react-json-view'), {ssr: false});

const SampleList = () => {
  const filteredIDs = useAppSelector(selectFilteredIDs);
  const samples = useAppSelector(selectUtteranceSamples);
  const filteredSamples = filteredIDs.length === 0 ? samples : samples.filter(s => filteredIDs.find(id => id === s.id))
  const [selectedSample, setSelectedSample] = useState<UtteranceSample | null>(null);
  const [previewTab, setPreviewTab] = useState<'rawData' | 'visualization'>('visualization');
  const gtVizRef = useRef<HTMLDivElement>(null);
  const genVizRef = useRef<HTMLDivElement>(null);

  const [sortKey, setSortKey] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (selectedSample && previewTab === 'visualization') {
      if (gtVizRef.current && selectedSample.groundTruth) {
        const dataset = `/vispilot/data/${selectedSample.dataset.toLowerCase()}.csv`;
        const spec = {
          ...selectedSample.groundTruth,
          data: {url: dataset}
        }
        vegaEmbed(gtVizRef.current, spec, {actions: false}).then().catch(console.log);
      }
      if (genVizRef.current && selectedSample.vegaLite) {
        const dataset = `/vispilot/data/${selectedSample.dataset.toLowerCase()}.csv`;
        const spec = {
          ...selectedSample.vegaLite,
          data: {url: dataset}
        }
        vegaEmbed(genVizRef.current, spec, {actions: false}).then().catch(console.log);
      }
    }
  }, [selectedSample, previewTab]);

  const handleRowClick = (sample: UtteranceSample) => {
    setSelectedSample(sample);
  };

  return (
    <div>
      <div className="flex py-2 font-bold text-neutral-600">
        Utterance Samples
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left side: Table */}
        <div className="col-span-6 overflow-auto max-h-[70vh]">
          <table className="min-w-full border-collapse">
            <thead>
            <tr className="bg-gray-100 font-bold select-none">
              <th className="px-4 py-2 text-left text-sm text-gray-600 cursor-pointer"
                onClick={() => {
                  setSortKey('id');
                  const newDirection = sortKey === 'id' && sortDirection === 'asc' ? 'desc' : 'asc';
                  setSortDirection(newDirection);
                }}
              >ID</th>
              <th className="px-4 py-2 text-left text-sm text-gray-600">Utterance</th>
              <th className="px-4 py-2 text-left text-sm text-gray-600">Dataset</th>
              <th className="px-4 py-2 text-center text-sm text-gray-600 cursor-pointer"
                  onClick={() => {
                    setSortKey('data');
                    const newDirection = sortKey === 'data' && sortDirection === 'asc' ? 'desc' : 'asc';
                    setSortDirection(newDirection);
                  }}>
                <div className="bg-specdim-dataschema text-data px-2 py-1 rounded">Data</div>
              </th>
              <th className="px-4 py-2 text-center text-sm text-gray-600 cursor-pointer"
                  onClick={() => {
                    setSortKey('mark');
                    const newDirection = sortKey === 'mark' && sortDirection === 'asc' ? 'desc' : 'asc';
                    setSortDirection(newDirection);
                  }}>
                <div className="bg-specdim-mark text-mark px-2 py-1 rounded">Mark</div>
              </th>
              <th className="px-4 py-2 text-center text-sm text-gray-600 cursor-pointer">
                <div className="bg-specdim-encoding text-encoding px-2 py-1 rounded"
                     onClick={() => {
                       setSortKey('encoding');
                       const newDirection = sortKey === 'encoding' && sortDirection === 'asc' ? 'desc' : 'asc';
                       setSortDirection(newDirection);
                     }}>Encoding</div>
              </th>
              <th className="px-4 py-2 text-center text-sm text-gray-600 cursor-pointer"
                  onClick={() => {
                    setSortKey('design');
                    const newDirection = sortKey === 'design' && sortDirection === 'asc' ? 'desc' : 'asc';
                    setSortDirection(newDirection);
                  }}>
                <div className="bg-specdim-design text-design px-2 py-1 rounded">Design</div>
              </th>
            </tr>
            </thead>
            <tbody>
            {filteredSamples
              .toSorted(
                (a, b) => {
                  if (sortKey === 'id') {
                    return sortDirection === 'asc' ? a.id - b.id : b.id - a.id;
                  }
                  if (sortKey === 'data') {
                    return sortDirection === 'asc' ? a.accuracy.dataSchema - b.accuracy.dataSchema : b.accuracy.dataSchema - a.accuracy.dataSchema;
                  }
                  if (sortKey === 'mark') {
                    return sortDirection === 'asc' ? a.accuracy.mark - b.accuracy.mark : b.accuracy.mark - a.accuracy.mark;
                  }
                  if (sortKey === 'encoding') {
                    return sortDirection === 'asc' ? a.accuracy.encoding - b.accuracy.encoding : b.accuracy.encoding - a.accuracy.encoding;
                  }
                  if (sortKey === 'design') {
                    return sortDirection === 'asc' ? a.accuracy.design - b.accuracy.design : b.accuracy.design - a.accuracy.design;
                  }
                  return sortDirection === 'asc' ? a.id - b.id : b.id - a.id;
                }
              )
              .map((sample) => (
              <tr
                key={sample.id}
                onClick={() => handleRowClick(sample)}
                className={`border-t border-gray-200 hover:bg-gray-50 cursor-pointer ${
                  selectedSample?.id === sample.id ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-4 py-2 text-sm text-gray-500">{sample.id}</td>
                <td className="px-4 py-2 text-sm">{sample.utteranceSet}</td>
                <td className="px-4 py-2 text-sm text-gray-500">{sample.dataset}</td>
                <td className="px-4 py-2 text-center">
                  <AccuracyBadge value={sample.accuracy.dataSchema}/>
                </td>
                <td className="px-4 py-2 text-center">
                  <AccuracyBadge value={sample.accuracy.mark}/>
                </td>
                <td className="px-4 py-2 text-center">
                  <AccuracyBadge value={sample.accuracy.encoding}/>
                </td>
                <td className="px-4 py-2 text-center">
                  <AccuracyBadge value={sample.accuracy.design}/>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>

        {/* Right side: Preview Panel */}
        <div className="col-span-6 border rounded-lg p-4">
          {selectedSample ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-neutral-600">Sample #{selectedSample.id}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPreviewTab('visualization')}
                    className={`px-3 py-1 rounded text-sm ${
                      previewTab === 'visualization'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Visualization
                  </button>
                  <button
                    onClick={() => setPreviewTab('rawData')}
                    className={`px-3 py-1 rounded text-sm ${
                      previewTab === 'rawData'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    VL Code
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm mb-1 px-1 text-neutral-600">Utterance</h4>
                <div className="p-2 bg-gray-50 rounded border text-sm">{selectedSample.utteranceSet}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4" hidden={previewTab === 'rawData'}>
                <div className="border rounded px-2 py-1 w-full">
                  <h4 className="text-sm mb-1 text-neutral-600">Generated Visualization</h4>
                  <div
                    ref={genVizRef}
                    className="flex items-center justify-center corpus-vega"
                  />
                </div>
                <div className="border rounded px-2 py-1 w-full">
                  <h4 className="text-sm mb-1 text-neutral-600">Ground Truth</h4>
                  <div
                    ref={gtVizRef}
                    className="flex items-center justify-center corpus-vega"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4" hidden={previewTab === 'visualization'}>
                <div className='border rounded px-2 py-1'>
                  <h4 className="text-sm mb-1 px-1 text-neutral-600">Generated Vega-Lite</h4>
                  <div className="border rounded overflow-auto max-h-96">
                    <ReactJson
                      value={selectedSample.vegaLite}
                      displayDataTypes={false}
                      style={githubLightTheme}
                      enableClipboard={false}
                    />
                  </div>
                </div>
                <div className='border rounded px-2 py-1'>
                  <h4 className="text-sm mb-1 px-1 text-neutral-600">Ground Truth Vega-Lite</h4>
                  <div className="border rounded overflow-auto max-h-96">
                    <ReactJson
                      value={selectedSample.groundTruth}
                      displayDataTypes={false}
                      style={githubLightTheme}
                      enableClipboard={false}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded px-2 py-1">
                  <h4 className="text-sm mb-1 px-1 text-neutral-600">Generated Specifications</h4>
                  <div className="border rounded overflow-auto max-h-96">
                    <ReactJson
                      value={selectedSample.specGen}
                      displayDataTypes={false}
                      style={githubLightTheme}
                      enableClipboard={false}
                    />
                  </div>
                </div>
                <div className='border rounded px-2 py-1'>
                  <h4 className="text-sm mb-1 px-1 text-neutral-600">Ground Truth Specifications</h4>
                  <div className="border rounded overflow-auto max-h-96">
                    <ReactJson
                      value={selectedSample.specGT}
                      displayDataTypes={false}
                      style={githubLightTheme}
                      enableClipboard={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-400">
              Select a sample to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component for accuracy badges
const AccuracyBadge = ({value}: { value: number }) => {
  let bgColor = 'bg-gray-200';

  if (value === 1) bgColor = 'bg-green-500';
  else if (value >= 0.5) bgColor = 'bg-yellow-400';
  else if (value > 0) bgColor = 'bg-red-500';

  return (
    <span className={`inline-block ${bgColor} text-white text-xs px-2 py-1 rounded-full`}>
      {(value * 100).toFixed(0)}%
    </span>
  );
};

export default SampleList;