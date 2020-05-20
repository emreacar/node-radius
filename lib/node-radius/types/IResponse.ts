export declare namespace IResponse {
  type SocketListener = (
    msg: string | any[] | Uint8Array,
    port?: number,
    address?: string
  ) => void

  type RelationValue = {
    code: number
    name: string
  }

  type Relation = {
    default: RelationValue
    accept?: RelationValue
    reject?: RelationValue
    allows: Array<number>
  }

  type RelationMap = Record<number, Relation>
}
