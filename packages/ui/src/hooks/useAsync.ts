import { Inputs, useEffect, useRef, useState } from "preact/hooks";

export type PromiseHook<T> = {
  fulfilled: boolean;
  previousValue?: T;
  value?: T;
  err?: Error;
} 

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: Inputs,
): PromiseHook<T> {
  const promRef = useRef<Promise<T> | null>(null);
  const [state, setState] = useState<PromiseHook<T>>({
    fulfilled: false,
  });

  useEffect(() => {
    const prom = fn();
    promRef.current = prom;

    setState((state) => ({
      fulfilled: false,
      previousValue: state.value,
    }));

    prom
      .then((value) => ({ value }))
      .catch((err) => ({ err }))
      .then((update) => {
        if (promRef.current !== prom) return;

        setState((state) => ({
          ...state,
          previousValue: state.value,
          fulfilled: true,
          ...update,
        }));
      });
  }, deps);

  return state;
}
