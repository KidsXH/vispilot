import {CheckListCategory, CheckListConfig, UtteranceSample} from "@/types";
import {useCallback, useMemo, useState} from "react";

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {useAppDispatch, useAppSelector} from "@/store";
import {selectChecklist, setChecklist} from "@/store/features/CorpusSlice";

export const defaultCheckList = {
  'data': [
    '(^encoding\\.[^\\.]+\\.field$)',
    '(^encoding\\.[^\\.]+\\.aggregate$)',
    '(^encoding\\.[^\\.]+\\.sort$)',
    '(^encoding\\.[^\\.]+\\.sort\\.order$)',
    '(^encoding\\.[^\\.]+\\.sort\\.encoding$)',
  ],
  'mark': [
    '(^mark$)',
    '(^mark.type$)',
  ],
  'encoding': [
    '(^encoding.x.field$)',
    '(^encoding.y.field$)',
    '(^encoding.color.field$)',
    '(^encoding.column.field$)',
  ],
  'design': [
    '(^mark.tooltip$)',
    '(^mark.filled$)',
    '(^mark.opacity$)',
    '(^encoding\\.[^\\.]+\\.axis\\.title$)',
    '(^encoding\\.[^\\.]+\\.axis\\.format$)',
    '(^encoding\\.[^\\.]+\\.axis\\.labels$)',
    '(^encoding\\.[^\\.]+\\.axis\\.ticks$)',
    '(^encoding\\.[^\\.]+\\.bin$)',
    '(^encoding\\.[^\\.]+\\.timeUnit$)',
    '(^encoding\\.[^\\.]+\\.legend.title$)',
    '(^encoding\\.[^\\.]+\\.scale.rangeStep$)',
  ]
}

const VisSpecList = ({utteranceSamples}: { utteranceSamples: UtteranceSample[] }) => {
  const checkList = useAppSelector(selectChecklist);
  const [selectedSource, setSelectedSource] = useState<'generated' | 'groundTruth'>('groundTruth');
  const [isModalOpen, setIsModalOpen] = useState(false);


  const visSpecList = useMemo(() => {
    // find all unique keys in utteranceSample.groundTruth and utteranceSample.vegaLite
    // the key can be nested, e.g. "mark.type"
    // store keys and corresponding IDs in a map
    const specList = new Map<string, number[]>();

    // Write a recursive function to find all keys in an object
    const findKeys = (obj: any, prefix: string, objID: number) => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            findKeys(obj[key], newKey, objID);
          } else {
            if (!specList.has(newKey)) {
              specList.set(newKey, []);
            }
            specList.get(newKey)?.push(objID);
          }
        }
      }
    };

    // Iterate through each utteranceSample and find keys in groundTruth and vegaLite
    utteranceSamples.forEach(sample => {
      if (sample.groundTruth && selectedSource === 'groundTruth') {
        findKeys(sample.groundTruth, '', sample.id);
      }
      if (sample.vegaLite && selectedSource === 'generated') {
        findKeys(sample.vegaLite, '', sample.id);
      }
    });
    return specList
  }, [selectedSource, utteranceSamples]);

  // Group specs by their top-level namespace
  const groupedSpecs = useMemo(() => {
    const groups: Record<string, string[]> = {};

    Array.from(visSpecList.keys()).forEach(key => {
      const topLevel = key.split('.')[0];
      if (!groups[topLevel]) {
        groups[topLevel] = [];
      }
      groups[topLevel].push(key);
    });

    // Sort keys within each group
    Object.keys(groups).forEach(group => {
      groups[group].sort();
    });

    return groups;
  }, [visSpecList]);

  const groupedSpecsCount = useMemo(() => {
    return Object.keys(groupedSpecs).map(
      group => ({
        group,
        count: groupedSpecs[group].reduce((acc, spec) => Math.max(acc, visSpecList.get(spec)?.length || 0), 0)
      })
    )
  }, [groupedSpecs, visSpecList]);

  // Track expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedSpecs, setExpandedSpecs] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const toggleSpec = (spec: string) => {
    setExpandedSpecs(prev => ({
      ...prev,
      [spec]: !prev[spec]
    }));
  };

  const matchInChecklist = useCallback(
    (spec: string) => {
      const matchList: CheckListCategory[] = []
      Object.keys(checkList).forEach(key => {
        const regex = new RegExp(checkList[key as CheckListCategory].join('|'), 'g');
        if (regex.test(spec)) {
          matchList.push(key as CheckListCategory);
        }
      })
      return matchList;
    }
  , [checkList])

  return (
    <div className="w-full h-full flex flex-col">
      <div className="py-2 font-bold text-neutral-600">Visualization Specification List</div>
      {/* Source selection dropdown */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-500 mr-2">Source:</span>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value as 'generated' | 'groundTruth')}
            className="border p-1 rounded text-sm w-20"
          >
            <option value="generated">Gen</option>
            <option value="groundTruth">GT</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">
          {utteranceSamples.length} instances
        </div>
      </div>

      {/* Checklist */}
      <div className="mb-2 flex text-sm gap-1 items-center">
        <div className="flex gap-1">
          <span className="text-gray-500">CheckList</span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-gray-400 hover:text-gray-600 font-medium material-symbols-outlined cursor-pointer"
            style={{fontSize: "14px"}}
          >
            settings
          </button>
        </div>
        <div className="flex gap-4 ml-auto text-center">
          <div className="flex items-center text-data">
            <span>Data ({checkList.data.length})</span>
          </div>
          <div className="flex items-center text-mark">
            <span>Mark ({checkList.mark.length})</span>
          </div>
          <div className="flex items-center text-encoding">
            <span>Encoding ({checkList.encoding.length})</span>
          </div>
          <div className="flex items-center text-design">
            <span>Design ({checkList.design.length})</span>
          </div>
        </div>
      </div>



      <div className="h-[450px] overflow-auto border rounded">
        {Object.keys(groupedSpecs).sort(
          (b, a) => (groupedSpecsCount.find(g => g.group === a)?.count || 0) - (groupedSpecsCount.find(g => g.group === b)?.count || 0)
        ).map(group => (
          <div key={group} className="border-b last:border-b-0">
            <div
              className="flex items-center px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() => toggleGroup(group)}
            >
              <span className="font-medium">{group}</span>
              <span className="text-gray-500 text-sm ml-2">({groupedSpecs[group].reduce(
                (acc, spec) => Math.max(acc, visSpecList.get(spec)?.length || 0), 0
              )})</span>
              <span className="text-xs ml-auto">{expandedGroups[group] ? '▼' : '►'}</span>
            </div>

            {expandedGroups[group] && (
              <div className="pl-4">
                {groupedSpecs[group]
                  .sort(
                    // sort by the number of instances in descending order
                    (a, b) => (visSpecList.get(b)?.length || 0) - (visSpecList.get(a)?.length || 0)
                  )
                  .map(spec => {
                    const ids = visSpecList.get(spec) || [];
                    return (
                      <div key={spec} className="border-t">
                        <div
                          className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleSpec(spec)}
                        >
                          <span className={`text-sm ${matchInChecklist(spec).length === 0 && 'opacity-40'}`}>{spec.slice(group.length + 1) || '<value>'}</span>
                          {
                            matchInChecklist(spec).map((category, index) => (
                              <div key={index} className={`text-base text-${category}`}>*</div>
                            ))
                          }
                          <span className="text-xs text-gray-500 ml-auto mr-2">{ids.length} instances</span>
                          <span className="text-xs">{expandedSpecs[spec] ? '▼' : '►'}</span>
                        </div>

                        {expandedSpecs[spec] && (
                          <div className="pl-4 py-1 bg-gray-50 text-xs">
                            <div className="flex flex-wrap gap-1 max-h-24 overflow-auto">
                              {ids.map(id => (
                                <span key={id} className="bg-gray-200 px-1.5 rounded">{id}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Add the modal */}
      <ChecklistModal
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        checkList={checkList}
        defaultCheckList={defaultCheckList}
      />
    </div>
  );
};

export default VisSpecList;

interface ChecklistModalProps {
  isOpen: boolean;
  closeModal: () => void;
  checkList: CheckListConfig;
  defaultCheckList: CheckListConfig;
}

const ChecklistModal = ({ isOpen, closeModal, checkList, defaultCheckList }: ChecklistModalProps) => {
  const dispatch = useAppDispatch();
  // Make a working copy of the checklist for the modal
  const [workingCheckList, setWorkingCheckList] = useState<CheckListConfig>(checkList);

  // Reset to default settings
  const resetToDefaults = () => {
    setWorkingCheckList(defaultCheckList);
  };

  // Save changes and close modal
  const saveChanges = () => {
    dispatch(setChecklist(workingCheckList));
    closeModal();
  };

  // Toggle an item in the checklist
  const toggleItem = (category: CheckListCategory, item: string) => {
    setWorkingCheckList(prev => {
      const updatedCategory = prev[category] || [];

      if (updatedCategory.includes(item)) {
        return {
          ...prev,
          [category]: updatedCategory.filter(i => i !== item)
        };
      } else {
        return {
          ...prev,
          [category]: [...updatedCategory, item]
        };
      }
    });
  };

  // Check if an item is selected
  const isItemSelected = (category: CheckListCategory, item: string): boolean => {
    return (workingCheckList[category] || []).includes(item);
  };

  // Get all available items from both workingChecklist and defaultChecklist
  const getAllItems = (category: CheckListCategory): string[] => {
    const workingItems = workingCheckList[category] || [];
    const defaultItems = defaultCheckList[category] || [];
    return Array.from(new Set([...workingItems, ...defaultItems]));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-white/50 bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Configure Checklist
                </Dialog.Title>
                <div className="mt-4 text-sm text-neutral-400">
                  Only the following selected properties will be checked whether they are <span className="font-bold">implicitly</span> inferred or not.
                </div>
                <div className="mt-4 max-h-[60vh] overflow-y-auto">
                  {Object.keys(defaultCheckList).map(category => (
                    <div key={category} className="mb-4">
                      <h4 className="font-medium text-sm mb-2 text-gray-700 capitalize">{category}</h4>
                      <div className="pl-4 space-y-2">
                        {getAllItems(category as CheckListCategory).map(item => (
                          <label key={item} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={isItemSelected(category as CheckListCategory, item)}
                              onChange={() => toggleItem(category as CheckListCategory, item)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    onClick={resetToDefaults}
                  >
                    Reset to Defaults
                  </button>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={saveChanges}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};