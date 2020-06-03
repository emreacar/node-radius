export declare namespace IDictionary {
  type AttrEntry = {
    id: number
    attr: string
    vendor: number
  }

  type DictEntry = {
    id: number
    attr: string
    vendor: number
    type: string
    flags?: Array<string>
    values?: Map<any, any>
  }

  type Attr = Map<any, AttrEntry>
  type Dict = Map<number, Map<any, DictEntry>>
  type Vendor = Map<any, any>
}
