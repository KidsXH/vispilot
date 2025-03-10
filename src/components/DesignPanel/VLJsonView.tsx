'use client'

import JsonView from '@uiw/react-json-view';
import {githubLightTheme} from '@uiw/react-json-view/githubLight';
import {useEffect, useMemo, useRef} from "react";
import {useAppSelector} from "@/store";
import {selectVegaString} from "@/store/features/DataSlice";

const VLJsonView = () => {
  const editorRef = useRef(null);
  const vegaString = useAppSelector(selectVegaString);
  const vegaSpec = useMemo(() => {
    try {
      const spec = JSON.parse(vegaString);

      if (Object.keys(spec).length === 0) {
        return {};
      }

      spec.data = spec.data.name || ''
      return spec;
    } catch (e) {
      return {};
    }
  }, [vegaString])

  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current as HTMLDivElement;
      // find all elem with classname 'w-rjv-colon', if the elem is the last child of the parent, append a new span with class 'w-rjv-value' and text 'null'
      const colons = editor.querySelectorAll('.w-rjv-colon');
      colons.forEach((colon) => {
        const parent = colon.parentElement;
        if (parent && parent.lastChild === colon) {
          const newDiv = document.createElement('span');
          newDiv.className = 'w-rjv-value';
          newDiv.innerText = 'null';
          newDiv.style.color = 'var(--w-rjv-type-undefined-color, #2aa198)'
          parent.appendChild(newDiv);
        }
      });
    }
  })

  return <JsonView value={vegaSpec}
                   style={githubLightTheme}
                   enableClipboard={false}
                   displayDataTypes={false}
                   ref={editorRef}
  />
}

export default VLJsonView;