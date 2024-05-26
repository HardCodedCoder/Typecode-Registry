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

/**
 * Interface representing a request to update an existing extension.
 *
 * This interface is used to define the structure of the data required
 * to update the properties of an existing extension. The properties
 * are optional, allowing for partial updates.
 */
export interface ExtensionUpdateRequest {
  name?: string;
  description?: string;
}
