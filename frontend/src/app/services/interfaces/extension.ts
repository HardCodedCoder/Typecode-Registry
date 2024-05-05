export interface Extension {
  project_id: number;
  name: string;
  scope: string;
  description: string;
}

export interface ExtensionsAPIResponse {
  extensions: ExtensionResponse[];
}

export interface ExtensionResponse {
  id: number;
  project_id: number;
  name: string;
  scope: string;
  description: string;
  creation_date: Date;
  item_count?: number;
}
