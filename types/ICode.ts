export declare namespace ICode {
  type CodeEntry = {
    id: number
    name: string
    eventName?: string
    default?: number
    accept?: number
    reject?: number
    allows?: Array<number>
  }
  type Code = Array<CodeEntry>
}
