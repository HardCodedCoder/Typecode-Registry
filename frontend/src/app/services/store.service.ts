import { Injectable } from '@angular/core';
import { ExtensionResponse } from './interfaces/extension';
import { ProjectResponse } from './interfaces/project';
import { ItemResponse } from './interfaces/items';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  constructor() {}

  public projectExtensions: ExtensionResponse[] = [];
  public sharedExtensions: ExtensionResponse[] = [];
  public projects: ProjectResponse[] = [];
  public items: ItemResponse[] | null = [];
  public hasShown204Error: boolean = false;

  /**
   * Gets the extension ID of a shared extension.
   * @param name - The name of the shared extension.
   * @returns The ID of the shared extension.
   */
  getSharedExtensionId(name: string): number | undefined {
    return this.sharedExtensions.find(extension => extension.name === name)?.id;
  }

  /**
   * Gets the project extension ID of a project extension.
   * @param projectName - The name of the project.
   * @param extensionName - The name of the extension.
   * @returns The ID of the project.
   * @returns Undefined if the project does not exist.
   */
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
