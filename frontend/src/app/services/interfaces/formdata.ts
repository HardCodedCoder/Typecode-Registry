import { ItemResponse } from './items';

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
 * Represents an error message.
 * @interface Error
 * @property {boolean} error - Indicates if an error occurred.
 * @property {string} message - The error message.
 */
export interface Error {
  error: boolean;
  message: string;
}
