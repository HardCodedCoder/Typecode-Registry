export type HttpStatusCode = '0' | '204' | '404' | '500' | 'unknownError';

export interface HttpStatusDetails {
  errorText: string;
  playfulMessage: string;
  description: string;
  guidance: string[];
}

export const httpStatusCodes: Record<HttpStatusCode, HttpStatusDetails> = {
  '0': {
    errorText: '0ERROR',
    playfulMessage: `0PLAYFULMESSAGE`,
    description: `0DESCRIPTION`,
    guidance: ['0GUIDANCE', '1GUIDANCE', '2GUIDANCE'],
  },
  '204': {
    errorText: '204ERROR',
    playfulMessage: `204PLAYFULMESSAGE`,
    description: `204DESCRIPTION`,
    guidance: ['204GUIDANCE', '1GUIDANCE', '2GUIDANCE'],
  },
  '404': {
    errorText: '404ERROR',
    playfulMessage: `404PLAYFULMESSAGE`,
    description: `404DESCRIPTION`,
    guidance: ['404GUIDANCE', '1GUIDANCE', '2GUIDANCE'],
  },
  '500': {
    errorText: '500ERROR',
    playfulMessage: `500PLAYFULMESSAGE`,
    description: `500DESCRIPTION`,
    guidance: ['500GUIDANCE', '1GUIDANCE', '2GUIDANCE'],
  },
  unknownError: {
    errorText: 'UNKNOWNERROR',
    playfulMessage: `UNKNOWNPLAYFULMESSAGE`,
    description: `UNKNOWNDESCRIPTION`,
    guidance: ['UNKNOWNGUIDANCE', '1GUIDANCE', '2GUIDANCE'],
  },
};
