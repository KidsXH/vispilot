import React, {useState, useEffect, useCallback} from 'react';
import {X, Settings} from 'lucide-react';
import {useAppDispatch, useAppSelector} from "@/store";
import {
  setState,
  setModel,
  selectModel,
  ChatModels,
  selectMessages,
  clearMessages,
  importMessages
} from "@/store/features/ChatSlice";
import {setVegaString} from "@/store/features/DataSlice";
import {Message} from "@/types";
import {setDesignIdea} from "@/store/features/CanvasSlice";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({isOpen, onClose}) => {
  const currentModel = useAppSelector(selectModel);
  const [modelName, setModelName] = useState(currentModel.name);
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | null }>({text: '', type: null});

  const chatMessages = useAppSelector(selectMessages);

  const dispatch = useAppDispatch();

  const availableModels = [
    {id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI'},
    {id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', provider: 'Google'},
    {id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google'},
    {id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic'}
  ];

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files === null) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && event.target.result) {
        const text = event.target.result as string;
        try {
          const parsedMessages: Message[] = JSON.parse(text);
          dispatch(clearMessages());
          dispatch(setVegaString(''));
          dispatch(setDesignIdea(''));
          dispatch(importMessages(parsedMessages));
          setMessage({text: 'Messages imported successfully', type: 'success'});
        } catch (error) {
          setMessage({text: 'Failed to import messages', type: 'error'});
        }
      }
    };

    reader.readAsText(file);
  }, [dispatch])

  const handleSave = useCallback(() => {
    if (modelName === 'GPT-4o' || modelName === 'Claude 3.7 Sonnet') {
      setMessage({text: `${modelName} is not supported yet. Please use Gemini 2.0 Pro or Flash`, type: 'error'});
      return;
    }

    if (!apiKey.trim()) {
      setMessage({text: 'Please enter an API key', type: 'error'});
      return;
    }

    setIsSaving(true);
    try {
      // Save API key to localStorage or secure storage
      localStorage.setItem(`${modelName.toLowerCase()}_api_key`, apiKey);

      // Update the selected model in the store
      dispatch(setModel({name: modelName, key: apiKey}));

      // Update state to indicate API key is configured
      dispatch(setState('idle'));

      setMessage({text: '', type: null});
      onClose();
    } catch (error) {
      setMessage({text: 'Failed to save settings', type: 'error'});
    } finally {
      setIsSaving(false);
    }
  }, [apiKey, dispatch, modelName, onClose])

  // Load saved API key
  useEffect(() => {
    if (isOpen) {
      setModelName(currentModel.name);
      const savedKey = localStorage.getItem(`${currentModel.name.toLowerCase()}_api_key`) || '';
      setApiKey(savedKey);
      setMessage({text: '', type: null});
    }
  }, [isOpen, currentModel]);

  // When model changes, load its API key
  useEffect(() => {
    const savedKey = localStorage.getItem(`${modelName.toLowerCase()}_api_key`) || '';
    setApiKey(savedKey);
  }, [modelName]);

  return (isOpen &&
      <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[480px] max-w-full select-none">
              <div className="flex justify-between items-center p-4 border-b">
                  <h2 className="text-xl font-semibold flex items-center">
                      <Settings size={18} className="mr-2"/>
                      Chat Configuration
                  </h2>
                  <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                      <X size={20}/>
                  </button>
              </div>

              <div className="p-4 border-b">
                  <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Model</label>
                      <select
                          value={modelName}
                          onChange={(e) => setModelName(e.target.value as ChatModels)}
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {availableModels.map(model => (
                          <option key={model.id} value={model.name}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                  </div>

                  <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                      <div className="relative">
                          <input
                              type={showKey ? "text" : "password"}
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder={`Enter your API key for ${modelName}`}
                          />
                          <button
                              type="button"
                              onClick={() => setShowKey(!showKey)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                          >
                <span className="material-symbols-outlined text-sm">
                  {showKey ? "visibility_off" : "visibility"}
                </span>
                          </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                          Your API key will be stored locally and used for requests to {modelName}.
                      </p>
                  </div>
              </div>

              <div className="p-4 border-b">
                  <div className="text-sm text-gray-600">Chat Messages</div>
                  <div className="flex flex-col gap-1 text-xs mt-2 text-gray-500">
                      <div># Model
                          Responses: {chatMessages.filter(message => message.role === 'assistant').length}</div>
                      <div># User Requests: {chatMessages.filter(message => message.sender === 'user').length}</div>
                  </div>
                  <label htmlFor='msgInput'
                    className='px-2 py-1 rounded text-white bg-gray-400 hover:bg-gray-600 inline-flex items-center text-sm cursor-pointer mt-2.5'
                  >
                      <span>Import Messages</span>
                      <input
                          id="msgInput"
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={handleImport}
                      />
                  </label>
              </div>

            {message.text && (
              <div className={`p-2 rounded text-sm mt-4 ${
                message.type === 'success' ? 'bg-green-100 text-green-800' :
                  message.type === 'error' ? 'bg-red-100 text-red-800' : ''
              }`}>
                {message.text}
              </div>
            )}

              <div className="p-4 flex justify-end">
                  <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 rounded text-white bg-blue-500 hover:bg-blue-600 flex items-center cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <span className="material-symbols-outlined animate-spin mr-1 text-sm">progress_activity</span>
                        Saving...
                      </>
                    ) : "OK"}
                  </button>
              </div>
          </div>
      </div>
  );
};

export default ConfigModal;