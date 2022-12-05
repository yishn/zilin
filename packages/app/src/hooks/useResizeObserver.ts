import { Ref, useEffect, useState } from "preact/hooks";

export function useResizeObserver(
  elementRef: Ref<HTMLDivElement>
): { width: number; height: number } | undefined {
  const [size, setSize] = useState<{ width: number; height: number }>();

  useEffect(
    function updateSize() {
      const element = elementRef.current;
      if (element == null) return;

      let lastUpdateTimestamp = Date.now();

      setSize({
        width: element.offsetWidth,
        height: element.offsetHeight,
      });

      const observer = new ResizeObserver((entries) => {
        if (
          Date.now() - lastUpdateTimestamp > 30 &&
          entries.find((entry) => entry.target === element) != null
        ) {
          setSize({
            width: element.offsetWidth,
            height: element.offsetHeight,
          });

          lastUpdateTimestamp = Date.now();
        }
      });

      observer.observe(element);

      return () => observer.disconnect();
    },
    [elementRef.current]
  );

  return size;
}
