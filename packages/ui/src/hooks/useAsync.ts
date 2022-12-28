import { Inputs, useEffect, useRef, useState } from "preact/hooks";

export type PromiseHook<T> = {
  promise: Promise<T>;
  fulfilled: boolean;
  previousValue?: T;
  continuousValue?: T;
  value?: T;
  err?: Error;
};

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: Inputs
): PromiseHook<T> {
  let firstTime = false;

  const promRef = useRef<Promise<T>>();
  const [state, setState] = useState<PromiseHook<T>>(() => {
    promRef.current = fn();
    firstTime = true;

    return {
      promise: promRef.current,
      fulfilled: false,
    };
  });

  useEffect(() => {
    const prom = firstTime ? promRef.current! : fn();
    promRef.current = prom;

    setState((state) => ({
      promise: prom,
      fulfilled: false,
      previousValue:
        state.fulfilled && state.err == null
          ? state.value
          : state.previousValue,
      continuousValue: state.continuousValue,
    }));

    prom
      .then((value) => ({ value, err: undefined }))
      .catch((err) => ({ value: undefined, err }))
      .then((update) => {
        if (promRef.current !== prom) return;

        setState((state) => ({
          ...state,
          previousValue: state.value,
          continuousValue: update.err == null ? update.value : state.value,
          fulfilled: true,
          ...update,
        }));
      });
  }, deps);

  return state;
}
