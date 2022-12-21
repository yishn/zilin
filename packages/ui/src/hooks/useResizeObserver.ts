import { Ref, useEffect, useState } from "preact/hooks";

export function useResizeObserver(
  elementRef: Ref<HTMLElement>,
): { width: number; height: number } | undefined {
  const [size, setSize] = useState<{ width: number; height: number }>();

  useEffect(
    function updateSize() {
      const element = elementRef.current;
      if (element == null) return;

      let lastUpdateTimeout: number;

      const observer = new ResizeObserver((entries) => {
        clearTimeout(lastUpdateTimeout);

        if (entries.some((entry) => entry.target === element)) {
          lastUpdateTimeout = setTimeout(() => {
            setSize({
              width: element.offsetWidth,
              height: element.offsetHeight,
            });
          }, 30);
        }
      });

      observer.observe(element);

      return () => observer.disconnect();
    },
    [elementRef.current],
  );

  return size;
}
