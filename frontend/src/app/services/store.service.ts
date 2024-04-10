import { Injectable } from '@angular/core';
import { ExtensionResponse } from './interfaces/extension';
import { ProjectResponse } from './interfaces/project';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  constructor() {}

  public projectExtensions: ExtensionResponse[] = [];
  public sharedExtensions: ExtensionResponse[] = [];
  public projects: ProjectResponse[] = [];

  getSharedExtensionId(name: string): number | undefined {
    return this.sharedExtensions.find(extension => extension.name === name)?.id;
  }

  getProjectExtensionId(
    projectName: string,
    extensionName: string
  ): number | undefined {
    const project = this.projects.find(project => project.name === projectName);
    if (project) {
      return this.projectExtensions.find(
        extension =>
          extension.project_id === project.id &&
          extension.name === extensionName
      )?.id;
    }
    return undefined;
  }
}
