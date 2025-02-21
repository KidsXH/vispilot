import React, {PropsWithChildren} from 'react';
import {useEffect, useState} from 'react';

function GlowingText(props: PropsWithChildren) {
  const [isGlowing, setIsGlowing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlowing(prev => !prev);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`
          flex items-center justify-center
          transition-all
          duration-1000
          ${isGlowing ? 'text-amber-400' : ''}
        `}
    >
        {props.children}
      </span>
  );
}

export default GlowingText;