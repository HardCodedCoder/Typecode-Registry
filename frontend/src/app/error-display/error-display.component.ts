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
      this.setErrorDetails(this.errorCode);
      if (history.state.errorOrigin) {
        this.errorOrigin = history.state.errorOrigin;
      }
    });
  }

  setErrorDetails(errorCode: HttpStatusCode) {
    this.errorDetails = httpStatusCodes[errorCode] || httpStatusCodes['520'];
  }
}
