export interface ItemAPIResponse {
  item: ItemResponse;
}
export interface ItemsAPIResponse {
  items: ItemResponse[];
}

export interface ItemsDetailsAPIResponse {
  details: ItemDetailResponse[];
}

export interface ItemDetailAPIResponse {
  detail: ItemDetailResponse;
}

export interface ItemResponse {
  id: number;
  name: string;
  table_name: string;
  typecode: number;
  extensionId: number;
  creation_date: string;
}

export interface ItemDetailResponse {
  scope: string;
  project: string;
  extension: string;
  item_name: string;
  item_table_name: string;
  typecode: number;
}
