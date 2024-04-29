import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  HttpStatusCode,
  HttpStatusDetails,
  httpStatusCodes,
} from '../services/interfaces/http-status-codes';

@Component({
  selector: 'app-error-display',
  templateUrl: './error-display.component.html',
  styleUrl: './error-display.component.scss',
})
export class ErrorDisplayComponent implements OnInit {
  errorCode: HttpStatusCode = HttpStatusCode.UnknownError;
  errorDetails: HttpStatusDetails = httpStatusCodes['520'];
  errorOrigin: string = '';
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.errorCode = params['code'] as HttpStatusCode;
      this.checkErrorCode();
      this.setErrorDetails(this.errorCode);
      if (history.state.errorOrigin) {
        this.errorOrigin = history.state.errorOrigin;
      }
    });
  }

  /**
   * Check if the error code is valid by comparing it to the HttpStatusCode enum.
   *
   * If the error code is not valid, set it to HttpStatusCode.UnknownError.
   */
  checkErrorCode() {
    if (!Object.values(HttpStatusCode).includes(this.errorCode)) {
      this.errorCode = HttpStatusCode.UnknownError;
    }
  }

  /**
   * Set the error details based on the error code after checking if it is valid.
   *
   * @param errorCode - The error code to set the error details for.
   */
  setErrorDetails(errorCode: HttpStatusCode) {
    this.errorDetails = httpStatusCodes[errorCode];
  }
}
