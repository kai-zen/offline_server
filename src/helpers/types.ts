export interface printerDataType {
  id?: number;
  name: string;
  title: string;
  paper_width: string;
  factor_type: string;
  categories: {
    name: string;
    row: number;
    _id: string;
  }[];
  types: number[];
  is_common: boolean;
}
