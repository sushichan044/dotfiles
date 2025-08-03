import type * as v from "jsr:@valibot/valibot";

/**
 * Extract the output type from unknown schema types.
 *
 * @internal
 */
export type ExtractInferSchemaOutput<TSchema> =
  TSchema extends ValibotSchemaLike ? v.InferOutput<TSchema> : never;

/**
 * A type that represents a Valibot schema.
 */
export type ValibotSchemaLike = v.BaseSchema<
  unknown,
  unknown,
  v.BaseIssue<unknown>
>;
