import React, {useState, useMemo, useCallback, useEffect} from 'react';
import {UtteranceSample} from "@/types";
import {useAppDispatch, useAppSelector} from "@/store";
import {selectUtteranceSamples, setUtteranceSample} from "@/store/features/CorpusSlice";
import {testUtteranceSample} from "@/app/corpus/model";

interface CorpusTableProps {
  data: UtteranceSample[];
}

interface SortConfig {
  key: keyof UtteranceSample;
  direction: 'asc' | 'desc';
}

export default function CorpusTable({data}: CorpusTableProps) {
  const dispatch = useAppDispatch();
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'id',
    direction: 'asc'
  });

  const utteranceSamples = useAppSelector(selectUtteranceSamples);

  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      const valueA = a[sortConfig.key] || '';
      const valueB = b[sortConfig.key] || '';
      if (valueA < valueB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [data, sortConfig]);

  const handleSort = (key: keyof UtteranceSample) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleTestSample = useCallback((sample: UtteranceSample) => () => {
    const id = sample.id;
    const sampleIndex = utteranceSamples.findIndex((sample) => sample.id === id);
    dispatch(setUtteranceSample({id: id, sample: {...utteranceSamples[sampleIndex], tested: 'pending'}}));

    testUtteranceSample(sample).then((result) => {
      dispatch(setUtteranceSample({id: id, sample: result}));
    })

  }, [dispatch, utteranceSamples]);

  useEffect(() => {
    const nTested = utteranceSamples.filter(s => s.tested === 'yes').length
    const nPending = utteranceSamples.filter(s => s.tested === 'pending').length
    if (nTested > 0 && nPending < 3) {
      // find first not tested sample
      const sample = utteranceSamples.find(s => s.tested === 'no');
      if (sample) {
        handleTestSample(sample)();
      }
    }
  }, [handleTestSample, utteranceSamples]);

  return (<>
      <div className='min-w-full flex justify-end items-center'>
        <button className='flex items-center justify-center h-9 w-9 mr-2 rounded-full hover:bg-gray-200 cursor-pointer'
          onClick={() => {
            handleTestSample(utteranceSamples[0])();
          }}
        >
          <span className='material-symbols-outlined text-green-600 m-auto'>fast_forward</span>
        </button>
      </div>
      {data[0] &&
          <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                  <thead>
                  <tr className="bg-gray-100">
                    {
                      Object.keys(data[0]).map((key) => (
                        <th
                          key={key}
                          className="border px-4 py-2 cursor-pointer hover:bg-gray-200"
                          onClick={() => handleSort(key as keyof UtteranceSample)}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </th>
                      ))
                    }
                  </tr>
                  </thead>
                  <tbody>
                  {sortedData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {Object.values(row).map((cell, cellIndex) => (
                        cellIndex === Object.values(row).length - 1 ?
                          <td key={cellIndex} className="border text-center select-none cursor-pointer"
                              title={'Click to test this sample'}
                              onClick={handleTestSample(row)}
                          >
                            {cell === 'yes' ? '✔'
                              : (cell === 'no') ? '✗'
                                // a spinning icon
                                : <span className='material-symbols-outlined text-gray-400 animate-spin mt-1'>
                            progress_activity
                          </span>
                            }
                          </td>
                          :
                          <td key={cellIndex} className="border px-4 py-2">
                            {(typeof cell === 'number' && cellIndex > 0) ? cell.toFixed(2) : cell}
                          </td>
                      ))}
                    </tr>
                  ))}
                  </tbody>
              </table>
          </div>}
    </>
  );
}
