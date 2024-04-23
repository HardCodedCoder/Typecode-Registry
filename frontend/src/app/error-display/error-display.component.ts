import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { httpStatusCodes } from './http-status-codes';

@Component({
  selector: 'app-error-display',
  templateUrl: './error-display.component.html',
  styleUrl: './error-display.component.scss',
})
export class ErrorDisplayComponent implements OnInit {
  httpStatusCodes = httpStatusCodes;
  errorCode: string = '';
  errorText: string = '';
  playfulMessage: string = '';
  description: string = '';
  guidance: string[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // this.route.params.subscribe(params => {
    //   this.errorCode = params['code'];
    this.setErrorDetails(this.errorCode);
    // });
  }

  setErrorDetails(errorCode: string) {
    console.log(this.httpStatusCodes[errorCode]);
    console.log(this.httpStatusCodes['unknownError']);

    if (this.httpStatusCodes[errorCode]) {
      this.errorText = this.httpStatusCodes[errorCode].errorText;
      this.playfulMessage = this.httpStatusCodes[errorCode].playfulMessage;
      this.description = this.httpStatusCodes[errorCode].description;
      this.guidance = this.httpStatusCodes[errorCode].guidance;
    } else {
      this.errorCode = 'Unknown Error';
      this.errorText = this.httpStatusCodes['unknownError'].errorText;
      this.playfulMessage = this.httpStatusCodes['unknownError'].playfulMessage;
      this.description = this.httpStatusCodes['unknownError'].description;
      this.guidance = this.httpStatusCodes['unknownError'].guidance;
    }
  }
}
