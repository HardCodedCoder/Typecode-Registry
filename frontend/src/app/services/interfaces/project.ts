export interface ProjectsAPIResponse {
  projects: ProjectResponse[];
}

export interface ProjectAPIResponse {
  project: ProjectResponse;
}

export interface ProjectResponse {
  id: number;
  name: string;
  description: string;
  creation_date: Date;
}

export interface ProjectRequest {
  name: string;
  description: string;
}

/**
 * Interface representing a request to update an existing project.
 *
 * This interface is used to define the structure of the data required
 * to update the properties of an existing project. The properties
 * are optional, allowing for partial updates.
 */
export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
}
