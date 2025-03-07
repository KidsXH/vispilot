'use client'

import {useAppDispatch, useAppSelector} from "@/store";
import {selectDataSource, setDataSource} from "@/store/features/DataSlice";

const DataTable = () => {

  return (
    <>
      <div className='flex flex-col p-2 w-full'>
        <div className="flex h-8 justify-between border-b-2 border-neutral-200">
          <div className='font-bold text-xl'>Data Table</div>
          <div>
            <DataSourceLabel/>
          </div>
        </div>
        <div className='max-w-[320px] h-[320px] overflow-auto no-scrollbar'>
          <CSVReader/>
        </div>
      </div>
    </>
  );
};

export default DataTable;

const DataSourceLabel = () => {
  const dataSource = useAppSelector(selectDataSource)

  return <div className='flex items-center justify-between'>
    <span>Source:</span>
    <span
      className='ml-1 px-1 min-w-6 text-center bg-gray-200 hover:bg-gray-100 rounded-sm text-base text-neutral-600 cursor-pointer select-none'>{dataSource}</span>
  </div>
}

import React, {ChangeEvent, useCallback, useState} from 'react';
import {Upload} from 'lucide-react';
import {generateCSVPrompt, generateSystemPrompt, generateSystemPromptWithCSV} from "@/prompts";
import {addMessage, selectMessages, setState} from "@/store/features/ChatSlice";
import {sendRequest} from "@/model";
import {Message} from "@/types";

const CSVReader = () => {
  const dispatch = useAppDispatch();
  const messages = useAppSelector(selectMessages);
  const lastMessageID = messages.length > 0 ? messages[messages.length - 1].id : 0;
  const [csvData, setCsvData] = useState<{ [key: string]: string }[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  const handleFileUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files === null) return;

    const file = e.target.files[0];
    const filename = file.name;
    dispatch(setDataSource(filename));

    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target && event.target.result) {
        const text = event.target.result as string;
        const rows = text.split('\n');

        // Get headers from first row
        const headers = rows[0].split(',').map(header => header.trim());
        setHeaders(headers);

        // Parse data rows
        const parsedData = rows.slice(1).map(row => {
          const values = row.split(',').map(value => value.trim());
          return headers.reduce((obj: { [key: string]: string }, header, index) => {
            obj[header] = values[index];
            return obj;
          }, {});
        });

        setCsvData(parsedData);

        const systemPrompt = generateSystemPrompt();
        const csvPrompt = generateCSVPrompt({filename, csvData: parsedData, headers});
        const systemMessage: Message = {
          id: 0,
          role: 'system',
          sender: 'system',
          content: [{type: 'text', text: systemPrompt}]
        }
        const userMessage: Message = {
          id: 1,
          role: 'user',
          sender: 'system',
          content: [{type: 'text', text: csvPrompt}],
        }
        dispatch(addMessage(systemMessage));
        dispatch(addMessage(userMessage));
        dispatch(setState('waiting'));
        sendRequest([systemMessage, userMessage]).then(response => {
          dispatch(addMessage(response));
          dispatch(setState('idle'));
        });
      }
    };

    reader.readAsText(file);
  }, [dispatch]);

  return (
    <div className="max-w-4xl mx-auto select-none">
      {
        csvData.length === 0 &&
          <div className="mt-24">
              <label
                  htmlFor="csvInput"
                  className="flex items-center justify-center w-full h-32 px-2 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none"
              >
                  <div className="flex flex-col items-center space-y-2">
                      <Upload className="w-8 h-8 text-gray-400"/>
                      <span className="font-bold text-sm text-gray-400">Drop or click to upload CSV file</span>
                  </div>
                  <input
                      id="csvInput"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileUpload}
                  />
              </label>
          </div>
      }

      {csvData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-30 truncate"
                  title={header}
                >
                  {header}
                </th>
              ))}
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {csvData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((header, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-3 py-2 whitespace-nowrap text-sm text-gray-500 max-w-30 truncate`}
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
      )}
    </div>
  );
}
