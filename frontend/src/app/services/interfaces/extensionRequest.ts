export interface ExtensionsAPIResponse {
  extensions: ExtensionResponse[];
}

export interface ExtensionAPIResponse {
  extension: ExtensionResponse;
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

export interface ExtensionRequest {
  project_id?: number;
  name: string;
  scope: string;
  description: string;
}
