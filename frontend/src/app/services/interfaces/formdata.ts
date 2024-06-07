import { ItemResponse } from './items';
import { ExtensionResponse } from './extensionRequest';
import { ProjectResponse } from './project';

/**
 * Represents the form data for the add item form.
 * @interface FormData
 * @property {string} extensionComboBox - The selected extension.
 * @property {string} extensionScope - The selected scope.
 * @property {string} itemName - The item name.
 * @property {string} itemTable - The name of the table.
 * @property {string} projectComboBox - The selected project.
 */
export interface FormData {
  extensionComboBox: string;
  extensionScope: string;
  itemName: string;
  itemTable: string;
  projectComboBox: string;
}

/**
 * Represents the form data for creating or editing an extension.
 * @interface ExtensionFormData
 * @property {string} extensionName - The name of the extension.
 * @property {string} extensionDescription - The description of the extension.
 * @property {string} extensionScope - The scope of the extension.
 * @property {string} projectComboBox - The selected project.
 */
export interface ExtensionFormData {
  extensionName: string;
  extensionDescription: string;
  extensionScope: string;
  projectComboBox: string;
}

/**
 * Represents the form data for the update item form.
 * @interface UpdateItemFormData
 * @property {ItemResponse} item - The item to update.
 * @property {string} new_item_name - The new item name.
 * @property {string} new_table_name - The new table name.
 * @property {Error} error - Representing if an error occurred.
 */
export interface UpdateItemFormData {
  item: ItemResponse;
  new_item_name: string;
  new_table_name: string;
  wasCanceled: boolean;
  error?: Error;
}

/**
 * Represents the form data for updating an extension.
 * @interface UpdateExtensionFormData
 * @property {ExtensionResponse} extension - The extension to update.
 * @property {string} [name] - The new name for the extension. Optional.
 * @property {string} [description] - The new description for the extension. Optional.
 * @property {Error} error - Representing if an error occurred.
 */
export interface UpdateExtensionFormData {
  extension: ExtensionResponse;
  new_name?: string;
  new_description?: string;
  error?: Error;
}

/**
 * Represents an error message.
 * @interface Error
 * @property {boolean} error - Indicates if an error occurred.
 * @property {string} message - The error message.
 */
export interface Error {
  error: boolean;
  message: string;
}

/**
 * Represents the form data for creating or editing a project.
 * @interface ProjectFormData
 * @property {string} projectName - The name of the project.
 * @property {string} projectDescription - The description of the project.
 */
export interface ProjectFormData {
  projectName: string;
  projectDescription: string;
  error?: Error;
}

/**
 * Represents the form data for updating a project.
 * @interface UpdateProjectFormData
 * @property {ProjectResponse} project - The project to update.
 * @property {string} [name] - The new name for the project. Optional.
 * @property {string} [description] - The new description for the project. Optional.
 * @property {Error} error - Representing if an error occurred.
 */
export interface UpdateProjectFormData {
  project: ProjectResponse;
  new_name?: string;
  new_description?: string;
  error?: Error;
}
