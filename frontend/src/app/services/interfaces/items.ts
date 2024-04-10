export interface ItemAPIResponse {
  item: ItemResponse;
}

export interface ItemResponse {
  id: number;
  name: string;
  table_name: string;
  extensionId: number;
  creation_date: string;
}
