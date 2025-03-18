import React, {useEffect, useRef, useState} from 'react';
import {useAppSelector, useAppDispatch} from "@/store";
import {selectDataSource} from "@/store/features/DataSlice";
import {X} from 'lucide-react';
import {CanvasPath} from "@/types";
import {addPath} from "@/store/features/CanvasSlice";

interface DataTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DataTableModal: React.FC<DataTableModalProps> = ({isOpen, onClose}) => {
  const dispatch = useAppDispatch();
  const dataSource = useAppSelector(selectDataSource);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && selectedColumn) {
      const selectedElement = containerRef.current.querySelector('.selectedColumnHeader');
      console.log(selectedElement)
      if (selectedElement) {
        // set scrollLeft of containerRef
        const container = containerRef.current;
        if (container) {
          const rect = selectedElement.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const scrollLeft = rect.left - containerRect.left + container.scrollLeft + rect.width / 2 - containerRect.width / 2;
          // scroll if selectedElement is not in the view
          if (rect.right > containerRect.right || rect.left < containerRect.left) {
            container.scrollTo({left: scrollLeft, behavior: 'smooth'});
          }
        }
      }
    }
  }, [selectedColumn]);

  // Parse CSV content
  const rows = dataSource.content.split('\n');
  const headers = rows[0].split(',').map(header => header.trim());
  const data = rows.slice(1).map(row => {
    const values = row.split(',').map(value => value.trim());
    return headers.reduce((obj: { [key: string]: string }, header, index) => {
      obj[header] = values[index] || '';
      return obj;
    }, {});
  });

  const handleSelectColumn = (column: string) => {
    setSelectedColumn(column);
  };

  const handleAddAnnotation = () => {
    if (selectedColumn) {
      const newPath: CanvasPath = {
        id: Date.now(),
        type: 'note',
        text: selectedColumn,
        points: [[100, 100]],
        style: {
          fill: '#000000',
          stroke: 'none',
          strokeWidth: 1,
          opacity: 1,
        },
        pressure: 1,
      }
      dispatch(addPath(newPath));
      onClose();
    }
  };

  return (isOpen &&
      <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-4/5 max-w-4xl max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b">
                  <h2 className="text-xl font-semibold">Data Table: {dataSource.filename}</h2>
                  <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                      <X size={20}/>
                  </button>
              </div>

              <div className="p-4 flex-grow overflow-hidden">
                  <div className="mb-4">
                      <h3 className="font-medium mb-2">Quick Note to Canvas:</h3>
                      <div className="flex flex-wrap gap-2">
                        {headers.map((header) => (
                          <button
                            key={header}
                            className={`px-3 py-1 rounded text-sm cursor-pointer ${
                              selectedColumn === header
                                ? 'bg-blue-400 text-white'
                                : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                            onClick={() => handleSelectColumn(header)}
                          >
                            {header}
                          </button>
                        ))}
                      </div>
                  </div>

                  <div className="overflow-x-auto mt-4" ref={containerRef}>
                      <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                          <tr>
                            {headers.map((header, index) => (
                              <th
                                key={index}
                                className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider max-w-30 truncate ${
                                  selectedColumn === header ? 'bg-blue-100 selectedColumnHeader' : ''
                                }`}
                                title={header}
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                          {data.slice(0, 20).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {headers.map((header, colIndex) => (
                                <td
                                  key={colIndex}
                                  className={`px-3 py-2 whitespace-nowrap text-sm text-gray-500 max-w-30 truncate ${
                                    selectedColumn === header ? 'bg-blue-50' : ''
                                  }`}
                                  title={row[header]}
                                >
                                  {row[header]}
                                </td>
                              ))}
                            </tr>
                          ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              <div className="border-t p-4 flex justify-end">
                  <button
                      onClick={onClose}
                      className="px-4 py-2 rounded text-gray-600 bg-gray-200 hover:bg-gray-300 mr-2 cursor-pointer"
                  >
                      Cancel
                  </button>
                  <button
                      onClick={handleAddAnnotation}
                      disabled={!selectedColumn}
                      className={`px-4 py-2 rounded text-white cursor-pointer ${
                        selectedColumn ? 'bg-blue-400 hover:bg-blue-500' : 'bg-blue-300 cursor-not-allowed'
                      }`}
                  >
                      Add to Canvas
                  </button>
              </div>
          </div>
      </div>
  );
};

export default DataTableModal;
