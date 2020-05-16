declare namespace Helpers {
  type Listener<T = any> = (type: string, targetPort: number) => T;

  type SpreadableFn = (...args: Array<any>) => void;
}
