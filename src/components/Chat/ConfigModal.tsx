import React, {useState, useEffect, useCallback} from 'react';
import {X, Settings} from 'lucide-react';
import {useAppDispatch, useAppSelector} from "@/store";
import {
  setState,
  setModel,
  selectModel,
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

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

const ConfigModal: React.FC<ConfigModalProps> = ({isOpen, onClose}) => {
  const currentModel = useAppSelector(selectModel);
  const [modelName, setModelName] = useState(currentModel.name);
  const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState(currentModel.baseURL || DEFAULT_BASE_URL);
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | null }>({text: '', type: null});

  const chatMessages = useAppSelector(selectMessages);

  const dispatch = useAppDispatch();

  const suggestedModels = [
    {id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI'},
    {id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI'},
    {id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic'},
    {id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google'},
    {id: 'google/gemini-2.5-pro-preview-03-25', name: 'Gemini 2.5 Pro', provider: 'Google'},
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
    if (!apiKey.trim()) {
      setMessage({text: 'Please enter an API key', type: 'error'});
      return;
    }

    if (!modelName.trim()) {
      setMessage({text: 'Please enter a model name', type: 'error'});
      return;
    }

    setIsSaving(true);
    try {
      // Save settings to localStorage
      localStorage.setItem('llm_api_key', apiKey);
      localStorage.setItem('llm_base_url', baseURL);
      localStorage.setItem('llm_model_name', modelName);

      // Update the selected model in the store
      dispatch(setModel({name: modelName, key: apiKey, baseURL: baseURL}));

      // Update state to indicate API key is configured
      dispatch(setState('idle'));

      setMessage({text: '', type: null});
      onClose();
    } catch (error) {
      setMessage({text: 'Failed to save settings', type: 'error'});
    } finally {
      setIsSaving(false);
    }
  }, [apiKey, baseURL, dispatch, modelName, onClose])

  // Load saved settings
  useEffect(() => {
    if (isOpen) {
      setModelName(currentModel.name);
      setBaseURL(currentModel.baseURL || DEFAULT_BASE_URL);
      const savedKey = localStorage.getItem('llm_api_key') || '';
      const savedBaseURL = localStorage.getItem('llm_base_url') || DEFAULT_BASE_URL;
      const savedModelName = localStorage.getItem('llm_model_name') || currentModel.name;
      setApiKey(savedKey);
      setBaseURL(savedBaseURL);
      setModelName(savedModelName);
      setMessage({text: '', type: null});
    }
  }, [isOpen, currentModel]);

  // When model changes from dropdown, keep other settings
  useEffect(() => {
    // No need to reload API key when model changes since we use a single key
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                      <input
                          type="text"
                          value={baseURL}
                          onChange={(e) => setBaseURL(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://openrouter.ai/api/v1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                          OpenAI-compatible API endpoint. Default: OpenRouter
                      </p>
                  </div>

                  <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                      <input
                          type="text"
                          value={modelName}
                          onChange={(e) => setModelName(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="openai/gpt-4o"
                          list="suggested-models"
                      />
                      <datalist id="suggested-models">
                        {suggestedModels.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name} ({model.provider})
                          </option>
                        ))}
                      </datalist>
                      <p className="text-xs text-gray-500 mt-1">
                          Enter model name or select from suggestions. For OpenRouter, use format: provider/model-name
                      </p>
                  </div>

                  <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                      <div className="relative">
                          <input
                              type={showKey ? "text" : "password"}
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="Enter your API key"
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
                          Your API key will be stored locally.
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