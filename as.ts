import type { Predicate } from "./type.ts";
import {
  getPredicateFactoryMetadata,
  setPredicateFactoryMetadata,
  type WithMetadata,
} from "./metadata.ts";
import { isOptional } from "./is.ts";

/**
 * Return an `Optional` annotated type predicate function that returns `true` if the type of `x` is `T` or `undefined`.
 *
 * It is mainly used to annotate fields of `is.ObjectOf()` or parameters of `is.ParametersOf()` that are optional.
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * With `is.ObjectOf()`
 *
 * ```ts
 * import { as, is } from "@core/unknownutil";
 *
 * const isMyType = is.ObjectOf({ foo: as.Optional(is.String) });
 * const a: unknown = { foo: "a" };
 * if (isMyType(a)) {
 *   // a is narrowed to { foo:? string }
 *   const _: { foo?: string } = a;
 * }
 * ```
 *
 * With `is.ParametersOf()`
 *
 * ```ts
 * import { as, is } from "@core/unknownutil";
 *
 * const isMyType = is.ParametersOf([as.Optional(is.String)] as const);
 * const a: unknown = ["a"];
 * if (isMyType(a)) {
 *   // a is narrowed to [string?]
 *   const _: [string?] = a;
 * }
 * ```
 */
function asOptional<T>(
  pred: Predicate<T>,
):
  & Predicate<T | undefined>
  & WithMetadata<AsOptionalMetadata> {
  if (isOptional(pred)) {
    return pred as
      & Predicate<T | undefined>
      & WithMetadata<AsOptionalMetadata>;
  }
  return Object.defineProperties(
    setPredicateFactoryMetadata(
      (x: unknown): x is T | undefined => x === undefined || pred(x),
      { name: "asOptional", args: [pred] },
    ),
    { optional: { value: true as const } },
  ) as
    & Predicate<T | undefined>
    & WithMetadata<AsOptionalMetadata>;
}

export type AsOptionalMetadata = {
  name: "asOptional";
  args: Parameters<typeof asOptional>;
};

/**
 * Return an `Optional` un-annotated type predicate function that returns `true` if the type of `x` is `T`.
 *
 * It is mainly used to annotate fields of `is.ObjectOf()` or parameters of `is.ParametersOf()` that are optional.
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * With `is.ObjectOf()`
 *
 * ```ts
 * import { as, is } from "@core/unknownutil";
 *
 * const isMyType = is.ObjectOf({ foo: as.Required(as.Optional(is.String)) });
 * const a: unknown = { foo: "a" };
 * if (isMyType(a)) {
 *   // a is narrowed to { foo: string }
 *   const _: { foo: string } = a;
 * }
 * ```
 *
 * With `is.ParametersOf()`
 *
 * ```ts
 * import { as, is } from "@core/unknownutil";
 *
 * const isMyType = is.ParametersOf([as.Required(as.Optional(is.String))] as const);
 * const a: unknown = ["a"];
 * if (isMyType(a)) {
 *   // a is narrowed to [string]
 *   const _: [string] = a;
 * }
 */
function asRequired<P extends Predicate<unknown>>(
  pred: P,
): AsRequired<P> {
  if (!isOptional(pred)) return pred as AsRequired<P>;
  const { args } = getPredicateFactoryMetadata(pred);
  return args[0] as AsRequired<P>;
}

export type AsRequired<T> = T extends
  Predicate<undefined | infer U> & WithMetadata<AsOptionalMetadata>
  ? Predicate<U>
  : T extends Predicate<unknown> ? T
  : never;

export const as = {
  Optional: asOptional,
  Required: asRequired,
};
