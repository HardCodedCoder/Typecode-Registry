import { Injectable } from '@angular/core';
import { ExtensionResponse } from './interfaces/extension';
import { ProjectResponse } from './interfaces/project';
import { ItemDetailResponse, ItemResponse } from './interfaces/items';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  constructor() {}

  public projectExtensions: ExtensionResponse[] = [];
  public sharedExtensions: ExtensionResponse[] = [];
  public projects: ProjectResponse[] = [];
  public items: ItemResponse[] = [];
  public details: ItemDetailResponse[] | null = [];
  public hasShown204Error: boolean = false;

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
