import { Injectable } from '@angular/core';
import { ExtensionResponse } from './interfaces/extensionRequest';
import { ProjectResponse } from './interfaces/project';
import { ItemResponse } from './interfaces/items';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  public projectExtensions: ExtensionResponse[] = [];
  public sharedExtensions: ExtensionResponse[] = [];
  public allExtensions: ExtensionResponse[] | null = [];
  public projects: ProjectResponse[] = [];
  public items: ItemResponse[] | null = [];
  public hasShown204ErrorItems: boolean = false;
  public hasShown204ErrorExtensions: boolean = false;

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

  /**
   * Returns the names of the projects to be displayed in the combobox.
   *
   * @returns The names of the projects to be displayed in the combobox.
   */
  get projectNames(): string[] {
    return this.projects ? this.projects.map(project => project.name) : [];
  }

  getProjectName(project_id: number): string | undefined {
    return this.projects.find(project => project.id === project_id)?.name;
  }
}
