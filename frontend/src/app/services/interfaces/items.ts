export interface ItemAPIResponse {
  item: ItemResponse;
}
export interface ItemsAPIResponse {
  items: ItemResponse[];
}

export interface ItemResponse {
  id: number;
  scope: string;
  project: string;
  extension_id: number;
  name: string;
  table_name: string;
  typecode: number;
  creation_date: Date;
}
