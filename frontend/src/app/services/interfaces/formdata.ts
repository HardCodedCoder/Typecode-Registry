import { ItemResponse } from './items';

export interface FormData {
  extensionComboBox: string;
  extensionScope: string;
  itemName: string;
  itemTable: string;
  projectComboBox: string;
}

export interface UpdateItemFormData {
  item: ItemResponse;
  new_item_name: string;
  new_table_name: string;
}
