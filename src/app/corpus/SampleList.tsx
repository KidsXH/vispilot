import {useState, useRef, useEffect} from 'react';
import dynamic from 'next/dynamic';
import vegaEmbed from 'vega-embed';
import {githubLightTheme} from "@uiw/react-json-view/githubLight";
import {useAppSelector} from "@/store";
import {selectFilteredIDs} from "@/store/features/CorpusSlice";
import {ProcessResult} from "@/app/llm-processing/page";

// Dynamically import ReactJson to avoid SSR issues
const ReactJson = dynamic(() => import('@uiw/react-json-view'), {ssr: false});

const SampleList = (props: {data: ProcessResult[]}) => {
  const filteredIDs = useAppSelector(selectFilteredIDs);

  const {data} = props;
  const filteredData = (filteredIDs.length === 0 ? data : data.filter(s => filteredIDs.find(id => id === Number(s.id))))
    .map(result => {
      const {evaluation, vegaLite} = result;
      const matches = evaluation?.categoryMatches;
      return {
        ...result,
        accuracy: {
          dataSchema: matches.DataSchema.total === matches.DataSchema.matched ? 1 : 0,
          mark: matches.Mark.total === matches.Mark.matched ? 1 : 0,
          encoding: matches.Encoding.total === matches.Encoding.matched ? 1 : 0,
          design: evaluation?.similarity || 0,
        },
      };
    })

  const [selectedResult, setSelectedResult] = useState<ProcessResult | null>(null);
  const [previewTab, setPreviewTab] = useState<'rawData' | 'visualization'>('visualization');
  const gtVizRef = useRef<HTMLDivElement>(null);
  const genVizRef = useRef<HTMLDivElement>(null);

  const [sortKey, setSortKey] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'default' | 'inference' | 'accuracy'>('default');

  useEffect(() => {
    if (selectedResult && previewTab === 'visualization') {
      if (gtVizRef.current && selectedResult.groundTruth) {
        const dataset = `/vispilot/data/${selectedResult.dataset.toLowerCase()}.csv`;
        const spec = {
          ...selectedResult.groundTruth,
          data: {url: dataset}
        }
        vegaEmbed(gtVizRef.current, spec, {actions: false}).then().catch(console.log);
      }
      if (genVizRef.current && selectedResult.vegaLite) {
        const dataset = `/vispilot/data/${selectedResult.dataset.toLowerCase()}.csv`;
        const spec = {
          ...JSON.parse(selectedResult.vegaLite),
          data: {url: dataset}
        }
        vegaEmbed(genVizRef.current, spec, {actions: false}).then().catch(console.log);
      }
    }
  }, [selectedResult, previewTab]);

  const handleRowClick = (sample: ProcessResult) => {
    setSelectedResult(sample);
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
            {filteredData
              .toSorted(
                (a, b) => {
                  if (sortKey === 'id') {
                    return sortDirection === 'asc' ? Number(a.id) - Number(b.id) : Number(b.id) - Number(a.id);
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
                  return sortDirection === 'asc' ? Number(a.id) - Number(b.id) : Number(b.id) - Number(a.id);
                }
              )
              .map((result) => (
              <tr
                key={result.id}
                onClick={() => handleRowClick(result)}
                className={`border-t border-gray-200 hover:bg-gray-50 cursor-pointer ${
                  selectedResult?.id === result.id ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-4 py-2 text-sm text-gray-500">{result.id}</td>
                <td className="px-4 py-2 text-sm">{result.utterance}</td>
                <td className="px-4 py-2 text-sm text-gray-500">{result.dataset}</td>
                <td className="px-4 py-2 text-center">
                  <AccuracyBadge value={result.accuracy.dataSchema}/>
                </td>
                <td className="px-4 py-2 text-center">
                  <AccuracyBadge value={result.accuracy.mark}/>
                </td>
                <td className="px-4 py-2 text-center">
                  <AccuracyBadge value={result.accuracy.encoding}/>
                </td>
                <td className="px-4 py-2 text-center">
                  <AccuracyBadge value={result.accuracy.design}/>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>

        {/* Right side: Preview Panel */}
        <div className="col-span-6 border rounded-lg p-4">
          {selectedResult ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-neutral-600">Sample #{selectedResult.id}</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2 justify-end">
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
                  
                  {/* Nested buttons */}
                  <div className="flex space-x-2 justify-end">
                    <button
                      onClick={() => setViewMode('default')}
                      className={`px-2 py-0.5 rounded text-xs ${
                        viewMode === 'default'
                          ? 'bg-indigo-400 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Default
                    </button>
                    <button
                      onClick={() => setViewMode('inference')}
                      className={`px-2 py-0.5 rounded text-xs ${
                        viewMode === 'inference'
                          ? 'bg-indigo-400 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Show Inference
                    </button>
                    <button
                      onClick={() => setViewMode('accuracy')}
                      className={`px-2 py-0.5 rounded text-xs ${
                        viewMode === 'accuracy'
                          ? 'bg-indigo-400 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Show Acc
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm mb-1 px-1 text-neutral-600">Utterance</h4>
                <div className="p-2 bg-gray-50 rounded border text-sm">{selectedResult.utterance}</div>
              </div>

              {/* Visualization or VL Code sections stay the same */}
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
                      value={JSON.parse(selectedResult.vegaLite)}
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
                      value={selectedResult.groundTruth}
                      displayDataTypes={false}
                      style={githubLightTheme}
                      enableClipboard={false}
                    />
                  </div>
                </div>
              </div>

              {/* Default view - Generated and Ground Truth Specifications */}
              {viewMode === 'default' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded px-2 py-1">
                    <h4 className="text-sm mb-1 px-1 text-neutral-600">Generated Specifications</h4>
                    <div className="border rounded overflow-auto max-h-96">
                      <ReactJson
                        value={JSON.parse(selectedResult.vegaLite)}
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
                        value={selectedResult.groundTruth}
                        displayDataTypes={false}
                        style={githubLightTheme}
                        enableClipboard={false}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Inference view - Generated Specifications and Inference Summary */}
              {viewMode === 'inference' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded px-2 py-1">
                    <h4 className="text-sm mb-1 px-1 text-neutral-600">Generated Specifications</h4>
                    <div className="border rounded overflow-auto max-h-96">
                      <ReactJson
                        value={JSON.parse(selectedResult.vegaLite)}
                        displayDataTypes={false}
                        style={githubLightTheme}
                        enableClipboard={false}
                      />
                    </div>
                  </div>
                  <div className='border rounded px-2 py-1'>
                    <h4 className="text-sm mb-1 px-1 text-neutral-600">Inference Summary</h4>
                    <div className="border rounded overflow-auto max-h-96">
                      <ReactJson
                        value={selectedResult.explanation}
                        displayDataTypes={false}
                        style={githubLightTheme}
                        enableClipboard={false}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Accuracy view - Generated and Ground Truth Difference Items */}
              {viewMode === 'accuracy' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded px-2 py-1">
                    <h4 className="text-sm mb-1 px-1 text-neutral-600">Matches ({selectedResult.evaluation?.details.filter(d => d.matched).length})</h4>
                    <div className="border rounded overflow-auto max-h-96">
                      <ReactJson
                        value={selectedResult.evaluation?.details.filter(d => d.matched)}
                        displayDataTypes={false}
                        style={githubLightTheme}
                        enableClipboard={false}
                      />
                    </div>
                  </div>
                  <div className='border rounded px-2 py-1'>
                    <h4 className="text-sm mb-1 px-1 text-neutral-600">Differences  ({selectedResult.evaluation?.details.filter(d => !d.matched).length})</h4>
                    <div className="border rounded overflow-auto max-h-96">
                      <ReactJson
                        value={selectedResult.evaluation?.details.filter(d => !d.matched)}
                        displayDataTypes={false}
                        style={githubLightTheme}
                        enableClipboard={false}
                      />
                    </div>
                  </div>
                </div>
              )}
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