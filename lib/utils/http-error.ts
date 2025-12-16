export interface HttpErrorOptions {
  status: number;
  message: string;
  payload?: unknown;
}

export class HttpError extends Error {
  status: number;
  payload?: unknown;

  constructor({ status, message, payload }: HttpErrorOptions) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}
