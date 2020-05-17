declare namespace Helpers {
  type Listener<T = any> = (type: string, targetPort: number) => T;
}
