import type { Predicate, PredicateType } from "./type.ts";
import {
  type GetMetadata,
  getPredicateFactoryMetadata,
  setPredicateFactoryMetadata,
  type WithMetadata,
} from "./metadata.ts";
import { isOptional, isReadonly } from "./is.ts";

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
function asOptional<P extends Predicate<unknown>>(
  pred: P,
): AsOptional<P> {
  if (isOptional(pred)) {
    return pred as AsOptional<P>;
  }
  return setPredicateFactoryMetadata(
    (x: unknown): x is PredicateType<P> | undefined =>
      x === undefined || pred(x),
    { name: "asOptional", args: [pred] },
  ) as AsOptional<P>;
}

export type AsOptional<P> = P extends Predicate<infer U>
  ? Predicate<U | undefined> & GetMetadata<P> & WithMetadata<AsOptionalMetadata>
  : never;

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

function asReadonly<P extends Predicate<unknown>>(
  pred: P,
): AsReadonly<P> {
  if (isReadonly(pred)) {
    return pred as AsReadonly<P>;
  }
  return setPredicateFactoryMetadata(
    (x: unknown): x is PredicateType<P> => pred(x),
    { name: "asReadonly", args: [pred] },
  ) as AsReadonly<P>;
}

export type AsReadonly<P> = P extends Predicate<infer U>
  ? Predicate<U> & WithMetadata<GetMetadata<P> & AsReadonlyMetadata>
  : never;

export type AsReadonlyMetadata = {
  name: "asReadonly";
  args: Parameters<typeof asReadonly>;
};

export const as = {
  Optional: asOptional,
  Readonly: asReadonly,
  Required: asRequired,
};
