export declare namespace IDictionary {
  type DictEntry = {
    id: number
    name: string
    type: string
    flags?: Array<string>
    values?: Map<any, any>
  }

  type AttrEntry = {
    id: number
    attr: string
    vendor: number
  }

  type Attr = Map<any, AttrEntry>
  type Dict = Map<number, Map<any, DictEntry>>
  type Vendor = Map<any, any>
}
