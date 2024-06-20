/**
 * @see https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml for more status codes.
 */

export enum HttpStatusCode {
  NoStatus = '0',
  NoContent = '204',
  NotFound = '404',
  InternalServerError = '500',
  UnknownError = '520',
}

export interface HttpStatusDetails {
  errorText: string;
  playfulMessage: string;
  description: string;
  guidance: string[];
  buttonText: string;
  buttonLink: string;
  imgName: string;
}

export const httpStatusCodes: Record<HttpStatusCode, HttpStatusDetails> = {
  '0': {
    // no connection to the server
    errorText: 'Sails without Wind',
    playfulMessage: `The ship is pristine, the crew is ready, but with no connection, there's no wind to carry us forward.`,
    description: `The server is not responding. This is a common error when the server is down, or the connection to the server is lost.`,
    guidance: [
      'Check your internet connection to ensure you have an active and stable connection.',
      'Try refreshing your browser or restarting your app to see if the connection can be re-established.',
      "Inspect your firewall and proxy settings to ensure they aren't blocking the connection to the server.",
      'Use network debugging tools like Wireshark or Fiddler to diagnose the connection issue.',
    ],
    buttonText: 'Try Again',
    buttonLink: '/',
    imgName: 'ship_wind.svg',
  },
  '204': {
    // requested data is empty
    errorText: 'Treasure Chest Empty',
    playfulMessage: `The map led to the spot, the chest was unearthed, but inside, a hollow echo — no content found.`,
    description: `The server has successfully processed the request, but is not returning any content. This status is typically used for successful requests 
    where the response is intentionally left with no content, like after a DELETE operation, or when the requested resource is empty.`,
    guidance: [
      'Confirm the API endpoint is designed to return content under the current conditions.',
      'Review the server logs to ensure that the request is being processed correctly and no data should be returned.',
      'Adjust the query or request parameters to test different responses from the server.',
    ],
    buttonText: 'Continue',
    // buttonLink is set in error-display-component.ts
    buttonLink: '/',
    imgName: 'treasure_chest.png',
  },
  '404': {
    // resource not found
    errorText: 'Ocean Not Found',
    playfulMessage: `You've ventured beyond the sea chart's edge.`,
    description: `The server can't find the requested resource. This is a common error when the URL is misspelled, or the resource has been moved or deleted.`,
    guidance: [
      'Ensure the URL and endpoints are correctly specified in your API calls.',
      'Verify that the server routes and resource identifiers are configured correctly.',
      "Check server or API documentation to ensure the endpoint still exists and hasn't been deprecated or moved.",
    ],
    buttonText: 'Return to Items',
    buttonLink: '/',
    imgName: 'diver.png',
  },
  '500': {
    // server unexpectedly cannot respond (also no connection to the database)
    errorText: 'Cabin Fever Confusion',
    playfulMessage: `The ship's inner workings are in a state of cabin fever, leading to a tumultuous internal error.`,
    description: `An unexpected issue occurred within the server while processing the request. This may also occur when there is no connection to the database.`,
    guidance: [
      'Check the server logs for any unhandled exceptions or errors that could give insight into the issue.',
      'Ensure all server dependencies are correctly installed and configured.',
      `Use debugging tools to trace the server's execution flow and identify what might be causing the internal error.`,
    ],
    buttonText: 'Try Again',
    buttonLink: '/',
    imgName: 'ship_engine.png',
  },
  '520': {
    // default error message
    errorText: 'Crew Caught Off Guard',
    playfulMessage: `Uhm, the crew didn't prepare for this.`,
    description: `This error signifies an unforeseen complication during the request processing, without specific details provided. This is a generic error message.`,
    guidance: [
      'Review the full error response and server logs for any clues about what went wrong.',
      'Validate your request payload and headers to ensure they conform to the expected formats.',
      'If using third-party services, check their status pages for any ongoing issues that could affect your requests.',
    ],
    buttonText: 'Return to Items',
    buttonLink: '/',
    imgName: 'crew.png',
  },
};
