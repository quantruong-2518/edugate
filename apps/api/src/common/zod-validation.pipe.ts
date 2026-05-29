import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

/**
 * Parses an incoming payload against a Zod schema. Failures become a 400
 * with the API_SPEC §1.6 envelope: `code: VALIDATION_FAILED`, with the
 * Zod-formatted field error tree in `details.fields`.
 *
 * Usage at the parameter level:
 *
 *   create(@Body(new ZodValidationPipe(SubmitSchema)) body: SubmitInput) {…}
 *
 * Pipe-per-call keeps schemas next to controllers and avoids the
 * class-validator dance.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: "VALIDATION_FAILED",
        message: "Dữ liệu không hợp lệ.",
        details: { fields: result.error.format() },
      });
    }
    return result.data;
  }
}
