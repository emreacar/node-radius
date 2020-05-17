export declare namespace IResponse {
  type SocketListener = (...args: Array<any>) => void;

  type RelationValue = {
    code: number;
    name: string;
  };

  type Relation = {
    default: RelationValue;
    accept?: RelationValue;
    reject?: RelationValue;
    allows: Array<number>;
  };

  type RelationMap = Record<number, Relation>;
}
