import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
}

function isErrorBody(value: unknown): value is ErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'statusCode' in value &&
    'code' in value &&
    'message' in value
  );
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (isErrorBody(body)) {
        response.status(status).json(body);
        return;
      }
      const documentRequest = request.path.startsWith('/api/v1/documents');
      if (documentRequest && status === 413) {
        response.status(status).json({
          statusCode: status,
          code: 'DOCUMENT_FILE_TOO_LARGE',
          message: 'Soubor překračuje povolenou velikost.',
        } satisfies ErrorBody);
        return;
      }
      if (
        documentRequest &&
        status === 400 &&
        typeof body === 'object' &&
        'message' in body &&
        typeof body.message === 'string' &&
        /(?:unexpected field|too many)/i.test(body.message)
      ) {
        response.status(status).json({
          statusCode: status,
          code: 'DOCUMENT_INVALID_FILE',
          message: 'Nahrajte právě jeden soubor a povolená textová pole.',
        } satisfies ErrorBody);
        return;
      }
      response.status(status).json({
        statusCode: status,
        code: 'REQUEST_FAILED',
        message:
          status >= 500
            ? 'Požadavek se nepodařilo zpracovat.'
            : 'Požadavek nemá platný formát.',
      } satisfies ErrorBody);
      return;
    }
    this.logger.error(
      'Unhandled application error',
      exception instanceof Error ? exception.stack : undefined,
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Nastala neočekávaná chyba.',
    } satisfies ErrorBody);
  }
}
