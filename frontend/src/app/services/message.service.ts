import { Inject, Injectable } from '@angular/core';
import { TuiAlertService } from '@taiga-ui/core';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  constructor(
    @Inject(TuiAlertService) private readonly alertService: TuiAlertService
  ) {}

  /**
   * Displays a success notification for various actions.
   * @param {string} action - The action performed ('created' or 'deleted').
   * @param object - The type of object affected (Item, Extension, ...).
   * @param {number} itemId - The ID of the item affected.
   * @returns {void}
   */
  public showSuccessMessage(
    action: string,
    object: string,
    itemId: number | undefined
  ): void {
    let message = action;
    if (itemId !== undefined) {
      message = `${object} with ID: ${itemId} ${action}!`;
    }

    this.alertService
      .open(message, {
        label: '🎉 Success 🎉',
        status: 'success',
      })
      .subscribe();
  }

  /**
   * Displays a failure notification for various actions.
   * @param {string} errorMessage - The custom error message to display.
   * @returns {void}
   */
  public showFailureMessage(errorMessage: string): void {
    this.alertService
      .open(errorMessage, {
        label: '❌ Failure ❌',
        status: 'error',
      })
      .subscribe();
  }

  /**
   * Shows an information notification.
   */
  public showInformationNotification(): void {
    this.alertService
      .open('Please populate the database.', {
        label: '💡 Information 💡',
        status: 'info',
      })
      .subscribe();
  }
}
