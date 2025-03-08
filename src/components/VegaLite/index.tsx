'use client'

import {compile, Config, TopLevelSpec} from 'vega-lite';
import vegaEmbed from 'vega-embed';
import {useEffect, useMemo, useRef} from "react";

const VegaLite = ({vegaString}: {vegaString?: string}) => {
  const visRef = useRef<HTMLDivElement>(null);

  const vegaLiteSpec: TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {url: "/vispilot/data/cars.csv"},
    "mark":"line",
    "encoding": {
        "x": {
            "field":"Year",
            "type":"temporal",
          },
        "y": {
            "field":"MPG",
            "type":"quantitative",
          }
      },
    width: 230,
    height: 110,
    padding: 0,
  };

  const config: Config = {
    bar: {},
  };

  // const spec = vegaString ? compile(JSON.parse(vegaString), {config}).spec : compile(vegaLiteSpec, {config}).spec;

  const spec = useMemo(() => {
    // try catch to compile the vegaString
    try {
      const spec = JSON.parse(vegaString || '{}');
      spec.data = {url: '/vispilot/data/' + spec.data?.name || ''}
      spec.width = 230;
      spec.height = 110;
      spec.padding = 0;
      return compile(spec, {config}).spec;
    } catch (e) {
      console.log('Error parsing vegaString', e);
      return compile(vegaLiteSpec, {config}).spec;
    }
  }, [vegaString, vegaLiteSpec, config]);

  useEffect(() => {
    vegaEmbed(visRef.current!, spec, {actions: false})
      .then(function (result) {
        // add class on the visref
        if (visRef.current) {
          console.log('Render', spec)
          // visRef.current.classList.add('hover:shadow-lg', '!cursor-pointer');
        }
      })
      .catch(console.error);
    }
  )
  return (
    <div className={"hover:shadow-lg !cursor-pointer"} ref={visRef}></div>
  );
}

export default VegaLite;