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
