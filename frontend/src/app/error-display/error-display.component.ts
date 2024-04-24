import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  HttpStatusCode,
  HttpStatusDetails,
  httpStatusCodes,
} from './http-status-codes.types';

@Component({
  selector: 'app-error-display',
  templateUrl: './error-display.component.html',
  styleUrl: './error-display.component.scss',
})
export class ErrorDisplayComponent implements OnInit {
  errorCode: HttpStatusCode = 'unknownError';
  errorDetails: HttpStatusDetails = httpStatusCodes['unknownError'];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const code = params['code'] as HttpStatusCode;
      this.setErrorDetails(code);
    });
  }

  setErrorDetails(code: HttpStatusCode) {
    this.errorDetails =
      httpStatusCodes[code] || httpStatusCodes['unknownError'];
  }
}
