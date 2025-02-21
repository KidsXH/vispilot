'use client'

import {compile, Config, TopLevelSpec} from 'vega-lite';
import vegaEmbed from 'vega-embed';
import {useEffect, useRef} from "react";

const VegaLite = () => {
  const visRef = useRef<HTMLDivElement>(null);
  const vegaLiteSpec: TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: [
        {a: 'A', b: 28},
        {a: 'B', b: 55},
        {a: 'C', b: 43},
        {a: 'D', b: 91},
        {a: 'E', b: 81},
        {a: 'F', b: 53},
        {a: 'G', b: 19},
        {a: 'H', b: 87},
        {a: 'I', b: 52}
      ]
    },
    mark: 'bar',
    encoding: {
      x: {field: 'a', type: 'nominal', axis: {labelAngle: 0}},
      y: {field: 'b', type: 'quantitative'}
    },
    width: 230,
    height: 110,
    padding: 0,
  };

  const config: Config = {
    bar: {
    },
  };

  const spec = compile(vegaLiteSpec, {config}).spec;

  useEffect(() => {
    vegaEmbed(visRef.current!, spec, {actions: false})
      .then(function (result) {
        // add class on the visref
        if (visRef.current) {
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