export interface ProjectsAPIResponse {
  projects: ProjectResponse[];
}

export interface ProjectResponse {
  id: number;
  name: string;
  description: string;
  creation_date: Date;
}
