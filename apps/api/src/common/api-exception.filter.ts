import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Maps every uncaught exception to the API_SPEC §1.6 error envelope:
 *   { error: { code, message, details?, requestId } }
 *
 * Never returns a raw stack or DB message to the client. The original error
 * is logged with the request id so it stays traceable in Loki / Sentry.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("ApiException");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const req = ctx.getRequest<FastifyRequest>();
    const requestId = (req.id as string | undefined) ?? "unknown";

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_ERROR";
    let message = "Có lỗi không mong muốn xảy ra.";
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
        code = mapStatusToCode(status);
      } else if (typeof body === "object" && body !== null) {
        const b = body as Record<string, unknown>;
        code = (b["code"] as string | undefined) ?? mapStatusToCode(status);
        message =
          (b["message"] as string | undefined) ??
          (Array.isArray(b["message"])
            ? (b["message"] as string[]).join("; ")
            : message);
        // If the thrown body included its own `details`, use that directly
        // instead of wrapping every other field — keeps the envelope flat
        // and avoids `details.details.fields` when a service throws
        // BadRequest({ code, message, details }).
        if (
          b["details"] &&
          typeof b["details"] === "object" &&
          b["details"] !== null
        ) {
          details = b["details"] as Record<string, unknown>;
        } else {
          const rest = { ...b };
          delete rest["code"];
          delete rest["message"];
          delete rest["statusCode"];
          delete rest["error"];
          if (Object.keys(rest).length > 0) details = rest;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        { requestId, err: exception.message, stack: exception.stack },
        "Unhandled exception",
      );
    }

    const body = { error: { code, message, details, requestId } };
    if (typeof (reply as { status?: unknown }).status === "function") {
      void reply
        .status(status)
        .header("x-request-id", requestId)
        .send(body);
    } else {
      // Exceptions thrown inside a Nest middleware reach the filter with a raw
      // http.ServerResponse instead of FastifyReply. Fall back to the raw API
      // so the client still gets the standard envelope.
      const raw = reply as unknown as {
        statusCode: number;
        setHeader: (k: string, v: string) => void;
        end: (chunk: string) => void;
      };
      raw.statusCode = status;
      raw.setHeader("content-type", "application/json; charset=utf-8");
      raw.setHeader("x-request-id", requestId);
      raw.end(JSON.stringify(body));
    }
  }
}

function mapStatusToCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return "VALIDATION_FAILED";
    case HttpStatus.UNAUTHORIZED:
      return "UNAUTHENTICATED";
    case HttpStatus.FORBIDDEN:
      return "FORBIDDEN";
    case HttpStatus.NOT_FOUND:
      return "RESOURCE_NOT_FOUND";
    case HttpStatus.CONFLICT:
      return "CONFLICT";
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return "BUSINESS_RULE_VIOLATED";
    case HttpStatus.TOO_MANY_REQUESTS:
      return "RATE_LIMITED";
    default:
      return "INTERNAL_ERROR";
  }
}
