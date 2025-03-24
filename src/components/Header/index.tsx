import React, {useState} from "react";
import {Settings, X} from "lucide-react";
import {useAppDispatch, useAppSelector} from "@/store";
import {selectVegaLiteSize, setVegaLiteSize} from "@/store/features/AppSlice";

const Header = () => {
  const [showSetting, setShowSetting] = useState(false);
  return <>
    <span>VisPilot</span>
    <button className="flex text-white hover:text-neutral-100 cursor-pointer select-none"
            onClick={() => setShowSetting(!showSetting)}
    >
      <span className="material-symbols-outlined m-auto">settings</span>
    </button>
    <SettingModal isOpen={showSetting} onClose={() => setShowSetting(false)}/>
  </>
}

export default Header;

const SettingModal = ({isOpen, onClose}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch()
  const vegaLiteSize = useAppSelector(selectVegaLiteSize)
  return (isOpen &&
      <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50 text-base">
          <div className="bg-white rounded-lg shadow-lg w-[480px] max-w-full select-none">
              <div className="flex justify-between items-center p-4 border-b text-slate-700">
                  <h2 className="text-xl font-semibold flex items-center">
                      <Settings size={18} className="mr-2"/>
                      Settings
                  </h2>
                  <button onClick={onClose} className="text-slate-500 hover:text-slate-700 cursor-pointer">
                      <X size={20}/>
                  </button>
              </div>

              <div className="p-4 border-b">
                  <div className="text-slate-700">Generated Visualization Size</div>
                  <div className="flex gap-4 text-sm mt-2 text-gray-500">
                      <label htmlFor='VLWidth'
                             className='flex items-center p-2 gap-2'
                      >
                          <span>Width:</span>
                          <input id='VLWidth' type='text' className='w-20 outline-none bg-neutral-100 py-0.5 px-1'
                                 value={vegaLiteSize[0]}
                                 onChange={(e) => {
                                   let newWidth = parseInt(e.target.value)
                                   if (isNaN(newWidth)) {
                                     dispatch(setVegaLiteSize(['auto', vegaLiteSize[1]]))
                                   }
                                   else {
                                     newWidth = Math.max(0, newWidth)
                                     dispatch(setVegaLiteSize([newWidth, vegaLiteSize[1]]))
                                   }
                                 }}
                          />
                      </label>
                      <label htmlFor='VLHeight'
                             className='flex items-center p-2 gap-2'
                      >
                          <span>Height:</span>
                          <input id='VLHeight' type='text' className='w-20 outline-none bg-neutral-100 py-0.5 px-1'
                                 value={vegaLiteSize[1]}
                                 onChange={(e) => {
                                   let newHeight = parseInt(e.target.value)
                                    if (isNaN(newHeight)) {
                                      dispatch(setVegaLiteSize([vegaLiteSize[0], 'auto']))
                                    }
                                    else {
                                      newHeight = Math.max(0, newHeight)
                                      dispatch(setVegaLiteSize([vegaLiteSize[0], newHeight]))
                                    }
                                 }}
                          />
                      </label>
                  </div>
              </div>

              <div className="p-4 flex justify-end">
                  <button
                      className="px-2 py-1 rounded text-white bg-blue-500 hover:bg-blue-600 flex items-center cursor-pointer"
                      onClick={() => onClose()}
                  >
                      OK
                  </button>
              </div>
          </div>
      </div>
  );
}