'use client'

import {compile, Config} from 'vega-lite';
import vegaEmbed from 'vega-embed';
import {useEffect, useMemo, useRef} from "react";
import {useAppSelector} from "@/store";
import {selectDataSource} from "@/store/features/DataSlice";

const VegaLite = ({vegaString, width, height}: { vegaString?: string, width?: number, height?: number }) => {
  const visRef = useRef<HTMLDivElement>(null);
  const csvFile = useAppSelector(selectDataSource);

  const config: Config = {
    bar: {}
  }

  // const spec = vegaString ? compile(JSON.parse(vegaString), {config}).spec : compile(vegaLiteSpec, {config}).spec;

  const spec = useMemo(() => {
    try {
      const spec = JSON.parse(vegaString || '{}');
      if (csvFile.content) {
        spec.data = {
          values: csvFile.content,
          format: {
            type: 'csv'
          }
        };
      }
      spec.width = width || 230;
      spec.height = height || 110;
      spec.padding = 5;
      return compile(spec, {config}).spec;
    } catch (e) {
      return null
    }
  }, [vegaString, width, height, config])

  useEffect(() => {
    if (spec) {
      vegaEmbed(visRef.current!, spec, {actions: false}).then().catch(console.error)
    }
  })
  return <div ref={visRef}/>
}

export default VegaLite
