import type { FlatType, TupleToIntersection, Writable } from "./_typeutil.ts";
import type { Predicate, PredicateType, Primitive } from "./type.ts";
import {
  type GetMetadata,
  getMetadata,
  getPredicateFactoryMetadata,
  type PredicateFactoryMetadata,
  setPredicateFactoryMetadata,
  type WithMetadata,
} from "./metadata.ts";

const objectToString = Object.prototype.toString;
const primitiveSet = new Set([
  "string",
  "number",
  "bigint",
  "boolean",
  "symbol",
]);

/**
 * Assume `x is `any` and always return `true` regardless of the type of `x`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a = "a";
 * if (is.Any(a)) {
 *   // a is narrowed to any
 *   const _: any = a;
 * }
 * ```
 */
// deno-lint-ignore no-explicit-any
function isAny(_x: unknown): _x is any {
  return true;
}

/**
 * Assume `x` is `unknown` and always return `true` regardless of the type of `x`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a = "a";
 * if (is.Unknown(a)) {
 *   // a is narrowed to unknown
 *   const _: unknown = a;
 * }
 * ```
 */
function isUnknown(_x: unknown): _x is unknown {
  return true;
}

/**
 * Return `true` if the type of `x` is `string`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = "a";
 * if (is.String(a)) {
 *   // a is narrowed to string
 *   const _: string = a;
 * }
 * ```
 */
function isString(x: unknown): x is string {
  return typeof x === "string";
}

/**
 * Return `true` if the type of `x` is `number`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = 0;
 * if (is.Number(a)) {
 *   // a is narrowed to number
 *   const _: number = a;
 * }
 * ```
 */
function isNumber(x: unknown): x is number {
  return typeof x === "number";
}

/**
 * Return `true` if the type of `x` is `bigint`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = 0n;
 * if (is.BigInt(a)) {
 *   // a is narrowed to bigint
 *   const _: bigint = a;
 * }
 * ```
 */
function isBigInt(x: unknown): x is bigint {
  return typeof x === "bigint";
}

/**
 * Return `true` if the type of `x` is `boolean`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = true;
 * if (is.Boolean(a)) {
 *   // a is narrowed to boolean
 *   const _: boolean = a;
 * }
 * ```
 */
function isBoolean(x: unknown): x is boolean {
  return typeof x === "boolean";
}

/**
 * Return `true` if the type of `x` is `unknown[]`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = [0, 1, 2];
 * if (is.Array(a)) {
 *   // a is narrowed to unknown[]
 *   const _: unknown[] = a;
 * }
 * ```
 */
function isArray(
  x: unknown,
): x is unknown[] {
  return Array.isArray(x);
}

/**
 * Return `true` if the type of `x` is `Set<unknown>`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = new Set([0, 1, 2]);
 * if (is.Set(a)) {
 *   // a is narrowed to Set<unknown>
 *   const _: Set<unknown> = a;
 * }
 * ```
 */
function isSet(x: unknown): x is Set<unknown> {
  return x instanceof Set;
}

/**
 * Return `true` if the type of `x` is an object instance that satisfies `Record<PropertyKey, unknown>`.
 *
 * Note that this function check if the `x` is an instance of `Object`.
 * Use `isRecordLike` instead if you want to check if the `x` satisfies the `Record<PropertyKey, unknown>` type.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = {"a": 0, "b": 1};
 * if (is.RecordObject(a)) {
 *   // a is narrowed to Record<PropertyKey, unknown>
 *   const _: Record<PropertyKey, unknown> = a;
 * }
 *
 * const b: unknown = new Set();
 * if (is.RecordObject(b)) {
 *   // b is not a raw object, so it is not narrowed
 * }
 * ```
 */
function isRecordObject(
  x: unknown,
): x is Record<PropertyKey, unknown> {
  return x != null && typeof x === "object" && x.constructor === Object;
}

/**
 * Return `true` if the type of `x` satisfies `Record<PropertyKey, unknown>`.
 *
 * Note that this function returns `true` for ambiguous instances like `Set`, `Map`, `Date`, `Promise`, etc.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = {"a": 0, "b": 1};
 * if (is.Record(a)) {
 *   // a is narrowed to Record<PropertyKey, unknown>
 *   const _: Record<PropertyKey, unknown> = a;
 * }
 *
 * const b: unknown = new Set();
 * if (is.Record(b)) {
 *   // b is narrowed to Record<PropertyKey, unknown>
 *   const _: Record<PropertyKey, unknown> = b;
 * }
 * ```
 */
function isRecord(
  x: unknown,
): x is Record<PropertyKey, unknown> {
  return x != null && !Array.isArray(x) && typeof x === "object";
}

/**
 * Return `true` if the type of `x` is `Map<unknown, unknown>`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = new Map([["a", 0], ["b", 1]]);
 * if (is.Map(a)) {
 *   // a is narrowed to Map<unknown, unknown>
 *   const _: Map<unknown, unknown> = a;
 * }
 * ```
 */
function isMap(x: unknown): x is Map<unknown, unknown> {
  return x instanceof Map;
}

/**
 * Return `true` if the type of `x` is `function`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = () => {};
 * if (is.Function(a)) {
 *   // a is narrowed to (...args: unknown[]) => unknown
 *   const _: ((...args: unknown[]) => unknown) = a;
 * }
 * ```
 */
function isFunction(x: unknown): x is (...args: unknown[]) => unknown {
  return x instanceof Function;
}

/**
 * Return `true` if the type of `x` is `function` (non async function).
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = () => {};
 * if (is.Function(a)) {
 *   // a is narrowed to (...args: unknown[]) => unknown
 *   const _: ((...args: unknown[]) => unknown) = a;
 * }
 * ```
 */
function isSyncFunction(
  x: unknown,
): x is (...args: unknown[]) => unknown {
  return objectToString.call(x) === "[object Function]";
}

/**
 * Return `true` if the type of `x` is `function` (async function).
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = async () => {};
 * if (is.Function(a)) {
 *   // a is narrowed to (...args: unknown[]) => Promise<unknown>
 *   const _: ((...args: unknown[]) => unknown) = a;
 * }
 * ```
 */
function isAsyncFunction(
  x: unknown,
): x is (...args: unknown[]) => Promise<unknown> {
  return objectToString.call(x) === "[object AsyncFunction]";
}

/**
 * Return `true` if the type of `x` is `null`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = null;
 * if (is.Null(a)) {
 *   // a is narrowed to null
 *   const _: null = a;
 * }
 * ```
 */
function isNull(x: unknown): x is null {
  return x === null;
}

/**
 * Return `true` if the type of `x` is `undefined`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = undefined;
 * if (is.Undefined(a)) {
 *   // a is narrowed to undefined
 *   const _: undefined = a;
 * }
 * ```
 */
function isUndefined(x: unknown): x is undefined {
  return typeof x === "undefined";
}

/**
 * Return `true` if the type of `x` is `null` or `undefined`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = null;
 * if (is.Nullish(a)) {
 *   // a is narrowed to null | undefined
 *   const _: (null | undefined) = a;
 * }
 * ```
 */
function isNullish(x: unknown): x is null | undefined {
  return x == null;
}

/**
 * Return `true` if the type of `x` is `symbol`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const a: unknown = Symbol("symbol");
 * if (is.Symbol(a)) {
 *   // a is narrowed to symbol
 *   const _: symbol = a;
 * }
 * ```
 */
function isSymbol(x: unknown): x is symbol {
  return typeof x === "symbol";
}

/**
 * Return `true` if the type of `x` is `Primitive`.
 *
 * ```ts
 * import { is, Primitive } from "@core/unknownutil";
 *
 * const a: unknown = 0;
 * if (is.Primitive(a)) {
 *   // a is narrowed to Primitive
 *   const _: Primitive = a;
 * }
 * ```
 */
function isPrimitive(x: unknown): x is Primitive {
  return x == null || primitiveSet.has(typeof x);
}

/**
 * Return `true` if the type of predicate function `x` is annotated as `Optional`
 */
function isOptional<P extends Predicate<unknown>>(
  x: P,
): x is P & WithMetadata<IsOptionalOfMetadata> {
  const m = getMetadata(x);
  if (m == null) return false;
  return (m as PredicateFactoryMetadata).name === "isOptionalOf";
}

/**
 * Return an `Optional` annotated type predicate function that returns `true` if the type of `x` is `T` or `undefined`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.OptionalOf(is.String);
 * const a: unknown = "a";
 * if (isMyType(a)) {
 *   // a is narrowed to string | undefined
 *   const _: string | undefined = a;
 * }
 * ```
 */
function isOptionalOf<T>(
  pred: Predicate<T>,
):
  & Predicate<T | undefined>
  & WithMetadata<IsOptionalOfMetadata> {
  if (isOptional(pred)) {
    return pred as
      & Predicate<T | undefined>
      & WithMetadata<IsOptionalOfMetadata>;
  }
  return Object.defineProperties(
    setPredicateFactoryMetadata(
      (x: unknown): x is T | undefined => x === undefined || pred(x),
      { name: "isOptionalOf", args: [pred] },
    ),
    { optional: { value: true as const } },
  ) as
    & Predicate<T | undefined>
    & WithMetadata<IsOptionalOfMetadata>;
}

type IsOptionalOfMetadata = {
  name: "isOptionalOf";
  args: Parameters<typeof isOptionalOf>;
};

/**
 * Return an `Optional` un-annotated type predicate function that returns `true` if the type of `x` is `T`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.UnwrapOptionalOf(is.OptionalOf(is.String));
 * const a: unknown = "a";
 * if (isMyType(a)) {
 *   // a is narrowed to string
 *   const _: string = a;
 * }
 * ```
 */
function isUnwrapOptionalOf<P extends Predicate<unknown>>(
  pred: P,
): UnwrapOptionalOf<P> {
  if (!isOptional(pred)) return pred as UnwrapOptionalOf<P>;
  const { args } = getPredicateFactoryMetadata(pred);
  return args[0] as UnwrapOptionalOf<P>;
}

type UnwrapOptionalOf<T> = T extends
  Predicate<undefined | infer U> & WithMetadata<IsOptionalOfMetadata>
  ? Predicate<U>
  : T extends Predicate<unknown> ? T
  : never;

/**
 * Return `true` if the type of predicate function `x` is annotated as `Readonly`
 *
 * **This is unstable and may be removed in the future.**
 */
function isReadonly<P extends Predicate<unknown>>(
  x: P,
): x is P & WithMetadata<IsReadonlyOfMetadata> {
  const m = getMetadata(x);
  if (m == null) return false;
  return (m as PredicateFactoryMetadata).name === "isReadonlyOf";
}

/**
 * Return an `Readonly` annotated type predicate function that returns `true` if the type of `x` is `T`.
 *
 * **This is unstable and may be removed in the future.**
 *
 * Note that this function does nothing but annotate the predicate function as `Readonly`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.ReadonlyOf(is.TupleOf([is.String, is.Number]));
 * const a: unknown = ["a", 1];
 * if (isMyType(a)) {
 *   // a is narrowed to readonly [string, number]
 *   const _: readonly [string, number] = a;
 * }
 * ```
 */
function isReadonlyOf<T>(
  pred: Predicate<T>,
):
  & Predicate<Readonly<T>>
  & WithMetadata<IsReadonlyOfMetadata> {
  return setPredicateFactoryMetadata(
    (x: unknown): x is Readonly<T> => pred(x),
    { name: "isReadonlyOf", args: [pred] },
  ) as
    & Predicate<Readonly<T>>
    & WithMetadata<IsReadonlyOfMetadata>;
}

type IsReadonlyOfMetadata = {
  name: "isReadonlyOf";
  args: Parameters<typeof isReadonlyOf>;
};

/**
 * Return an `Readonly` un-annotated type predicate function that returns `true` if the type of `x` is `T`.
 *
 * **This is unstable and may be removed in the future.**
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.UnwrapReadonlyOf(is.ReadonlyOf(is.TupleOf([is.String, is.Number])));
 * const a: unknown = ["a", 1];
 * if (isMyType(a)) {
 *   // a is narrowed to [string, number]
 *   const _: [string, number] = a;
 * }
 * ```
 */
function isUnwrapReadonlyOf<P extends Predicate<unknown>>(
  pred: P,
): UnwrapReadonlyOf<P> {
  if (!isReadonly(pred)) return pred as UnwrapReadonlyOf<P>;
  const { args } = getPredicateFactoryMetadata(pred);
  return args[0] as UnwrapReadonlyOf<P>;
}

type UnwrapReadonlyOf<T> = T extends
  Predicate<infer U> & WithMetadata<IsReadonlyOfMetadata>
  ? Predicate<Writable<U>>
  : T extends Predicate<unknown> ? T
  : never;

/**
 * Return a type predicate function that returns `true` if the type of `x` is `T[]`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.ArrayOf(is.String);
 * const a: unknown = ["a", "b", "c"];
 * if (isMyType(a)) {
 *   // a is narrowed to string[]
 *   const _: string[] = a;
 * }
 * ```
 */
function isArrayOf<T>(
  pred: Predicate<T>,
): Predicate<T[]> & WithMetadata<IsArrayOfMetadata> {
  return setPredicateFactoryMetadata(
    (x: unknown): x is T[] => isArray(x) && x.every(pred),
    { name: "isArrayOf", args: [pred] },
  );
}

type IsArrayOfMetadata = {
  name: "isArrayOf";
  args: Parameters<typeof isArrayOf>;
};

/**
 * Return a type predicate function that returns `true` if the type of `x` is `Set<T>`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.SetOf(is.String);
 * const a: unknown = new Set(["a", "b", "c"]);
 * if (isMyType(a)) {
 *   // a is narrowed to Set<string>
 *   const _: Set<string> = a;
 * }
 * ```
 */
function isSetOf<T>(
  pred: Predicate<T>,
): Predicate<Set<T>> & WithMetadata<IsSetOfMetadata> {
  return setPredicateFactoryMetadata(
    (x: unknown): x is Set<T> => {
      if (!isSet(x)) return false;
      for (const v of x.values()) {
        if (!pred(v)) return false;
      }
      return true;
    },
    { name: "isSetOf", args: [pred] },
  );
}

type IsSetOfMetadata = {
  name: "isSetOf";
  args: Parameters<typeof isSetOf>;
};

/**
 * Return a type predicate function that returns `true` if the type of `x` is `TupleOf<T>` or `TupleOf<T, E>`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.TupleOf([is.Number, is.String, is.Boolean]);
 * const a: unknown = [0, "a", true];
 * if (isMyType(a)) {
 *   // a is narrowed to [number, string, boolean]
 *   const _: [number, string, boolean] = a;
 * }
 * ```
 *
 * With `predElse`:
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.TupleOf(
 *   [is.Number, is.String, is.Boolean],
 *   is.ArrayOf(is.Number),
 * );
 * const a: unknown = [0, "a", true, 0, 1, 2];
 * if (isMyType(a)) {
 *   // a is narrowed to [number, string, boolean, ...number[]]
 *   const _: [number, string, boolean, ...number[]] = a;
 * }
 * ```
 *
 * Depending on the version of TypeScript and how values are provided, it may be necessary to add `as const` to the array
 * used as `predTup`. If a type error occurs, try adding `as const` as follows:
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const predTup = [is.Number, is.String, is.Boolean] as const;
 * const isMyType = is.TupleOf(predTup);
 * const a: unknown = [0, "a", true];
 * if (isMyType(a)) {
 *   // a is narrowed to [number, string, boolean]
 *   const _: [number, string, boolean] = a;
 * }
 * ```
 */
function isTupleOf<
  T extends readonly [Predicate<unknown>, ...Predicate<unknown>[]],
>(
  predTup: T,
): Predicate<TupleOf<T>> & WithMetadata<IsTupleOfMetadata>;
function isTupleOf<
  T extends readonly [Predicate<unknown>, ...Predicate<unknown>[]],
  E extends Predicate<unknown[]>,
>(
  predTup: T,
  predElse: E,
):
  & Predicate<[...TupleOf<T>, ...PredicateType<E>]>
  & WithMetadata<IsTupleOfMetadata>;
function isTupleOf<
  T extends readonly [Predicate<unknown>, ...Predicate<unknown>[]],
  E extends Predicate<unknown[]>,
>(
  predTup: T,
  predElse?: E,
):
  & Predicate<TupleOf<T> | [...TupleOf<T>, ...PredicateType<E>]>
  & WithMetadata<IsTupleOfMetadata> {
  if (!predElse) {
    return setPredicateFactoryMetadata(
      (x: unknown): x is TupleOf<T> => {
        if (!isArray(x) || x.length !== predTup.length) {
          return false;
        }
        return predTup.every((pred, i) => pred(x[i]));
      },
      { name: "isTupleOf", args: [predTup] },
    );
  } else {
    return setPredicateFactoryMetadata(
      (x: unknown): x is [...TupleOf<T>, ...PredicateType<E>] => {
        if (!isArray(x) || x.length < predTup.length) {
          return false;
        }
        const head = x.slice(0, predTup.length);
        const tail = x.slice(predTup.length);
        return predTup.every((pred, i) => pred(head[i])) && predElse(tail);
      },
      { name: "isTupleOf", args: [predTup, predElse] },
    );
  }
}

type TupleOf<T> = {
  -readonly [P in keyof T]: T[P] extends Predicate<infer U> ? U : never;
};

type IsTupleOfMetadata = {
  name: "isTupleOf";
  args: [Parameters<typeof isTupleOf>[0], Parameters<typeof isTupleOf>[1]?];
};

/**
 * Return a type predicate function that returns `true` if the type of `x` is `ParametersOf<T>` or `ParametersOf<T, E>`.
 *
 * This is similar to `TupleOf<T>` or `TupleOf<T, E>`, but if `is.OptionalOf()` is specified at the trailing, the trailing elements becomes optional and makes variable-length tuple.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.ParametersOf([
 *   is.Number,
 *   is.OptionalOf(is.String),
 *   is.Boolean,
 *   is.OptionalOf(is.Number),
 *   is.OptionalOf(is.String),
 *   is.OptionalOf(is.Boolean),
 * ] as const);
 * const a: unknown = [0, undefined, "a"];
 * if (isMyType(a)) {
 *   // a is narrowed to [number, string | undefined, boolean, number?, string?, boolean?]
 *   const _: [number, string | undefined, boolean, number?, string?, boolean?] = a;
 * }
 * ```
 *
 * With `predElse`:
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.ParametersOf(
 *   [
 *     is.Number,
 *     is.OptionalOf(is.String),
 *     is.OptionalOf(is.Boolean),
 *   ] as const,
 *   is.ArrayOf(is.Number),
 * );
 * const a: unknown = [0, "a", true, 0, 1, 2];
 * if (isMyType(a)) {
 *   // a is narrowed to [number, string?, boolean?, ...number[]]
 *   const _: [number, string?, boolean?, ...number[]] = a;
 * }
 * ```
 *
 * Depending on the version of TypeScript and how values are provided, it may be necessary to add `as const` to the array
 * used as `predTup`. If a type error occurs, try adding `as const` as follows:
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const predTup = [is.Number, is.String, is.OptionalOf(is.Boolean)] as const;
 * const isMyType = is.ParametersOf(predTup);
 * const a: unknown = [0, "a"];
 * if (isMyType(a)) {
 *   // a is narrowed to [number, string, boolean?]
 *   const _: [number, string, boolean?] = a;
 * }
 * ```
 */
function isParametersOf<
  T extends readonly [...Predicate<unknown>[]],
>(
  predTup: T,
): Predicate<ParametersOf<T>> & WithMetadata<IsParametersOfMetadata>;
function isParametersOf<
  T extends readonly [...Predicate<unknown>[]],
  E extends Predicate<unknown[]>,
>(
  predTup: T,
  predElse: E,
):
  & Predicate<[...ParametersOf<T>, ...PredicateType<E>]>
  & WithMetadata<IsParametersOfMetadata>;
function isParametersOf<
  T extends readonly [...Predicate<unknown>[]],
  E extends Predicate<unknown[]>,
>(
  predTup: T,
  predElse?: E,
):
  & Predicate<ParametersOf<T> | [...ParametersOf<T>, ...PredicateType<E>]>
  & WithMetadata<IsParametersOfMetadata> {
  const requiresLength = 1 + predTup.findLastIndex((pred) => !isOptional(pred));
  if (!predElse) {
    return setPredicateFactoryMetadata(
      (x: unknown): x is ParametersOf<T> => {
        if (
          !isArray(x) || x.length < requiresLength || x.length > predTup.length
        ) {
          return false;
        }
        return predTup.every((pred, i) => pred(x[i]));
      },
      { name: "isParametersOf", args: [predTup] },
    );
  } else {
    return setPredicateFactoryMetadata(
      (x: unknown): x is [...ParametersOf<T>, ...PredicateType<E>] => {
        if (!isArray(x) || x.length < requiresLength) {
          return false;
        }
        const head = x.slice(0, predTup.length);
        const tail = x.slice(predTup.length);
        return predTup.every((pred, i) => pred(head[i])) && predElse(tail);
      },
      { name: "isParametersOf", args: [predTup, predElse] },
    );
  }
}

type ParametersOf<T> = T extends readonly [] ? []
  : T extends readonly [...infer P, infer R]
  // Tuple of predicates
    ? P extends Predicate<unknown>[]
      ? R extends Predicate<unknown> & WithMetadata<IsOptionalOfMetadata>
        // Last parameter is optional
        ? [...ParametersOf<P>, PredicateType<R>?]
        // Last parameter is NOT optional
      : [...ParametersOf<P>, PredicateType<R>]
    : never
  // Array of predicates
  : TupleOf<T>;

type IsParametersOfMetadata = {
  name: "isParametersOf";
  args: [
    Parameters<typeof isParametersOf>[0],
    Parameters<typeof isParametersOf>[1]?,
  ];
};

/**
 * Return a type predicate function that returns `true` if the type of `x` is `UniformTupleOf<T>`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.UniformTupleOf(5);
 * const a: unknown = [0, 1, 2, 3, 4];
 * if (isMyType(a)) {
 *   // a is narrowed to [unknown, unknown, unknown, unknown, unknown]
 *   const _: [unknown, unknown, unknown, unknown, unknown] = a;
 * }
 * ```
 *
 * With predicate function:
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.UniformTupleOf(5, is.Number);
 * const a: unknown = [0, 1, 2, 3, 4];
 * if (isMyType(a)) {
 *   // a is narrowed to [number, number, number, number, number]
 *   const _: [number, number, number, number, number] = a;
 * }
 * ```
 */
function isUniformTupleOf<T, N extends number>(
  n: N,
  pred: Predicate<T> = isAny,
): Predicate<UniformTupleOf<T, N>> & WithMetadata<IsUniformTupleOfMetadata> {
  return setPredicateFactoryMetadata(
    (x: unknown): x is UniformTupleOf<T, N> => {
      if (!isArray(x) || x.length !== n) {
        return false;
      }
      return x.every((v) => pred(v));
    },
    { name: "isUniformTupleOf", args: [n, pred] },
  );
}

// https://stackoverflow.com/a/71700658/1273406
type UniformTupleOf<
  T,
  N extends number,
  R extends readonly T[] = [],
> = R["length"] extends N ? R : UniformTupleOf<T, N, [T, ...R]>;

type IsUniformTupleOfMetadata = {
  name: "isUniformTupleOf";
  args: Parameters<typeof isUniformTupleOf>;
};

/**
 * Return a type predicate function that returns `true` if the type of `x` is an Object instance that satisfies `Record<K, T>`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * Note that this function check if the `x` is an instance of `Object`.
 * Use `isRecordOf` instead if you want to check if the `x` satisfies the `Record<K, T>` type.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.RecordObjectOf(is.Number);
 * const a: unknown = {"a": 0, "b": 1};
 * if (isMyType(a)) {
 *   // a is narrowed to Record<PropertyKey, number>
 *   const _: Record<PropertyKey, number> = a;
 * }
 * ```
 *
 * With predicate function for keys:
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.RecordObjectOf(is.Number, is.String);
 * const a: unknown = {"a": 0, "b": 1};
 * if (isMyType(a)) {
 *   // a is narrowed to Record<string, number>
 *   const _: Record<string, number> = a;
 * }
 * ```
 */
function isRecordObjectOf<T, K extends PropertyKey = PropertyKey>(
  pred: Predicate<T>,
  predKey?: Predicate<K>,
): Predicate<Record<K, T>> & WithMetadata<IsRecordObjectOfMetadata> {
  return setPredicateFactoryMetadata(
    (x: unknown): x is Record<K, T> => {
      if (!isRecordObject(x)) return false;
      for (const k in x) {
        if (!pred(x[k])) return false;
        if (predKey && !predKey(k)) return false;
      }
      return true;
    },
    { name: "isRecordObjectOf", args: [pred, predKey] },
  );
}

type IsRecordObjectOfMetadata = {
  name: "isRecordObjectOf";
  args: Parameters<typeof isRecordObjectOf>;
};

/**
 * Return a type predicate function that returns `true` if the type of `x` satisfies `Record<K, T>`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.RecordOf(is.Number);
 * const a: unknown = {"a": 0, "b": 1};
 * if (isMyType(a)) {
 *   // a is narrowed to Record<PropertyKey, number>
 *   const _: Record<PropertyKey, number> = a;
 * }
 * ```
 *
 * With predicate function for keys:
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.RecordOf(is.Number, is.String);
 * const a: unknown = {"a": 0, "b": 1};
 * if (isMyType(a)) {
 *   // a is narrowed to Record<string, number>
 *   const _: Record<string, number> = a;
 * }
 * ```
 */
function isRecordOf<T, K extends PropertyKey = PropertyKey>(
  pred: Predicate<T>,
  predKey?: Predicate<K>,
): Predicate<Record<K, T>> & WithMetadata<IsRecordOfMetadata> {
  return setPredicateFactoryMetadata(
    (x: unknown): x is Record<K, T> => {
      if (!isRecord(x)) return false;
      for (const k in x) {
        if (!pred(x[k])) return false;
        if (predKey && !predKey(k)) return false;
      }
      return true;
    },
    { name: "isRecordOf", args: [pred, predKey] },
  );
}

type IsRecordOfMetadata = {
  name: "isRecordOf";
  args: Parameters<typeof isRecordOf>;
};

/**
 * Return a type predicate function that returns `true` if the type of `x` is `Map<K, T>`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.MapOf(is.Number);
 * const a: unknown = new Map([["a", 0], ["b", 1]]);
 * if (isMyType(a)) {
 *   // a is narrowed to Map<unknown, number>
 *   const _: Map<unknown, number> = a;
 * }
 * ```
 *
 * With predicate function for keys:
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.MapOf(is.Number, is.String);
 * const a: unknown = new Map([["a", 0], ["b", 1]]);
 * if (isMyType(a)) {
 *   // a is narrowed to Map<string, number>
 *   const _: Map<string, number> = a;
 * }
 * ```
 */
function isMapOf<T, K>(
  pred: Predicate<T>,
  predKey?: Predicate<K>,
): Predicate<Map<K, T>> & WithMetadata<IsMapOfMetadata> {
  return setPredicateFactoryMetadata(
    (x: unknown): x is Map<K, T> => {
      if (!isMap(x)) return false;
      for (const entry of x.entries()) {
        const [k, v] = entry;
        if (!pred(v)) return false;
        if (predKey && !predKey(k)) return false;
      }
      return true;
    },
    { name: "isMapOf", args: [pred, predKey] },
  );
}

type IsMapOfMetadata = {
  name: "isMapOf";
  args: Parameters<typeof isMapOf>;
};

/**
 * Return a type predicate function that returns `true` if the type of `x` is `ObjectOf<T>`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * If `is.OptionalOf()` is specified in the predicate function, the property becomes optional.
 *
 * The number of keys of `x` must be greater than or equal to the number of keys of `predObj`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.ObjectOf({
 *   a: is.Number,
 *   b: is.String,
 *   c: is.OptionalOf(is.Boolean),
 * });
 * const a: unknown = { a: 0, b: "a", other: "other" };
 * if (isMyType(a)) {
 *   // "other" key in `a` is ignored because of `options.strict` is `false`.
 *   // a is narrowed to { a: number; b: string; c?: boolean | undefined }
 *   const _: { a: number; b: string; c?: boolean | undefined } = a;
 * }
 * ```
 */
function isObjectOf<
  T extends Record<PropertyKey, Predicate<unknown>>,
>(
  predObj: T,
): Predicate<ObjectOf<T>> & WithMetadata<IsObjectOfMetadata>;
function isObjectOf<
  T extends Record<PropertyKey, Predicate<unknown>>,
>(
  predObj: T,
  options?: { strict?: boolean },
): Predicate<ObjectOf<T>> & WithMetadata<IsObjectOfMetadata> {
  if (options?.strict) {
    // deno-lint-ignore no-explicit-any
    return isStrictOf(isObjectOf(predObj)) as any;
  }
  return setPredicateFactoryMetadata(
    (x: unknown): x is ObjectOf<T> => {
      if (
        x == null ||
        typeof x !== "object" && typeof x !== "function" ||
        Array.isArray(x)
      ) return false;
      // Check each values
      for (const k in predObj) {
        if (!predObj[k]((x as T)[k])) return false;
      }
      return true;
    },
    { name: "isObjectOf", args: [predObj] },
  );
}

type WithOptional =
  | WithMetadata<GetMetadata<ReturnType<typeof isOptionalOf>>>
  | { optional: true }; // For backward compatibility

type ObjectOf<T extends Record<PropertyKey, Predicate<unknown>>> = FlatType<
  // Non optional
  & {
    [K in keyof T as T[K] extends WithOptional ? never : K]: T[K] extends
      Predicate<infer U> ? U : never;
  }
  // Optional
  & {
    [K in keyof T as T[K] extends WithOptional ? K : never]?: T[K] extends
      Predicate<infer U> ? U : never;
  }
>;

type IsObjectOfMetadata = {
  name: "isObjectOf";
  args: [Parameters<typeof isObjectOf>[0]];
};

/**
 * Return a type predicate function that returns `true` if the type of `x` is strictly follow the `ObjectOf<T>`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * If `is.OptionalOf()` is specified in the predicate function, the property becomes optional.
 *
 * The number of keys of `x` must be equal to the number of non optional keys of `predObj`.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.StrictOf(is.ObjectOf({
 *   a: is.Number,
 *   b: is.String,
 *   c: is.OptionalOf(is.Boolean),
 * }));
 * const a: unknown = { a: 0, b: "a", other: "other" };
 * if (isMyType(a)) {
 *   // This block will not be executed because of "other" key in `a`.
 * }
 * ```
 */
function isStrictOf<T extends Record<PropertyKey, unknown>>(
  pred:
    & Predicate<T>
    & WithMetadata<IsObjectOfMetadata>,
):
  & Predicate<T>
  & WithMetadata<IsStrictOfMetadata> {
  const { args } = getPredicateFactoryMetadata(pred);
  const s = new Set(Object.keys(args[0]));
  return setPredicateFactoryMetadata(
    (x: unknown): x is T => {
      if (!pred(x)) return false;
      // deno-lint-ignore no-explicit-any
      const ks = Object.keys(x as any);
      return ks.length <= s.size && ks.every((k) => s.has(k));
    },
    { name: "isStrictOf", args: [pred] },
  );
}

type IsStrictOfMetadata = {
  name: "isStrictOf";
  args: Parameters<typeof isStrictOf>;
};

/**
 * Return `true` if the type of `x` is instance of `ctor`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.InstanceOf(Date);
 * const a: unknown = new Date();
 * if (isMyType(a)) {
 *   // a is narrowed to Date
 *   const _: Date = a;
 * }
 * ```
 */
// deno-lint-ignore no-explicit-any
function isInstanceOf<T extends new (...args: any) => unknown>(
  ctor: T,
): Predicate<InstanceType<T>> & WithMetadata<IsInstanceOfMetadata> {
  return setPredicateFactoryMetadata(
    (x: unknown): x is InstanceType<T> => x instanceof ctor,
    { name: "isInstanceOf", args: [ctor] },
  );
}

type IsInstanceOfMetadata = {
  name: "isInstanceOf";
  args: Parameters<typeof isInstanceOf>;
};

/**
 * Return a type predicate function that returns `true` if the type of `x` is a literal type of `pred`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.LiteralOf("hello");
 * const a: unknown = "hello";
 * if (isMyType(a)) {
 *   // a is narrowed to "hello"
 *   const _: "hello" = a;
 * }
 * ```
 */
function isLiteralOf<T extends Primitive>(
  literal: T,
): Predicate<T> & WithMetadata<IsLiteralOfMetadata> {
  return setPredicateFactoryMetadata(
    (x: unknown): x is T => x === literal,
    { name: "isLiteralOf", args: [literal] },
  );
}

type IsLiteralOfMetadata = {
  name: "isLiteralOf";
  args: Parameters<typeof isLiteralOf>;
};

/**
 * Return a type predicate function that returns `true` if the type of `x` is one of literal type in `preds`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.LiteralOneOf(["hello", "world"] as const);
 * const a: unknown = "hello";
 * if (isMyType(a)) {
 *   // a is narrowed to "hello" | "world"
 *   const _: "hello" | "world" = a;
 * }
 * ```
 */
function isLiteralOneOf<T extends readonly Primitive[]>(
  literals: T,
): Predicate<T[number]> & WithMetadata<IsLiteralOneOfMetadata> {
  const s = new Set(literals);
  return setPredicateFactoryMetadata(
    (x: unknown): x is T[number] => s.has(x as T[number]),
    { name: "isLiteralOneOf", args: [literals] },
  );
}

type IsLiteralOneOfMetadata = {
  name: "isLiteralOneOf";
  args: Parameters<typeof isLiteralOneOf>;
};

/**
 * Return a type predicate function that returns `true` if the type of `x` is `UnionOf<T>`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.UnionOf([is.Number, is.String, is.Boolean]);
 * const a: unknown = 0;
 * if (isMyType(a)) {
 *   // a is narrowed to number | string | boolean
 *   const _: number | string | boolean = a;
 * }
 * ```
 *
 * Depending on the version of TypeScript and how values are provided, it may be necessary to add `as const` to the array
 * used as `preds`. If a type error occurs, try adding `as const` as follows:
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const preds = [is.Number, is.String, is.Boolean] as const;
 * const isMyType = is.UnionOf(preds);
 * const a: unknown = 0;
 * if (isMyType(a)) {
 *   // a is narrowed to number | string | boolean
 *   const _: number | string | boolean = a;
 * }
 * ```
 */
function isUnionOf<
  T extends readonly [Predicate<unknown>, ...Predicate<unknown>[]],
>(
  preds: T,
): Predicate<UnionOf<T>> & WithMetadata<IsUnionOfMetadata> {
  return setPredicateFactoryMetadata(
    (x: unknown): x is UnionOf<T> => preds.some((pred) => pred(x)),
    { name: "isUnionOf", args: [preds] },
  );
}

type UnionOf<T> = T extends readonly [Predicate<infer U>, ...infer R]
  ? U | UnionOf<R>
  : never;

type IsUnionOfMetadata = {
  name: "isUnionOf";
  args: Parameters<typeof isUnionOf>;
};

/**
 * Return a type predicate function that returns `true` if the type of `x` is `IntersectionOf<T>`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.IntersectionOf([
 *   is.ObjectOf({ a: is.Number }),
 *   is.ObjectOf({ b: is.String }),
 * ]);
 * const a: unknown = { a: 0, b: "a" };
 * if (isMyType(a)) {
 *   // a is narrowed to { a: number } & { b: string }
 *   const _: { a: number } & { b: string } = a;
 * }
 * ```
 *
 * Depending on the version of TypeScript and how values are provided, it may be necessary to add `as const` to the array
 * used as `preds`. If a type error occurs, try adding `as const` as follows:
 *
 * ```ts
 * import { is } from "@core/unknownutil";
 *
 * const preds = [
 *   is.ObjectOf({ a: is.Number }),
 *   is.ObjectOf({ b: is.String }),
 * ] as const
 * const isMyType = is.IntersectionOf(preds);
 * const a: unknown = { a: 0, b: "a" };
 * if (isMyType(a)) {
 *   // a is narrowed to { a: number } & { b: string }
 *   const _: { a: number } & { b: string } = a;
 * }
 * ```
 */
function isIntersectionOf<
  T extends readonly [
    Predicate<unknown> & WithMetadata<IsObjectOfMetadata>,
    ...(Predicate<unknown> & WithMetadata<IsObjectOfMetadata>)[],
  ],
>(
  preds: T,
): Predicate<IntersectionOf<T>> & WithMetadata<IsObjectOfMetadata>;
function isIntersectionOf<
  T extends readonly [Predicate<unknown>],
>(
  preds: T,
): T[0];
function isIntersectionOf<
  T extends readonly [Predicate<unknown>, ...Predicate<unknown>[]],
>(
  preds: T,
): Predicate<IntersectionOf<T>> & WithMetadata<IsIntersectionOfMetadata>;
function isIntersectionOf<
  T extends readonly [Predicate<unknown>, ...Predicate<unknown>[]],
>(
  preds: T,
):
  | Predicate<unknown>
  | Predicate<IntersectionOf<T>>
    & WithMetadata<IsObjectOfMetadata | IsIntersectionOfMetadata> {
  const predObj = {};
  const restPreds = preds.filter((pred) => {
    const meta = getMetadata(pred);
    if ((meta as IsObjectOfMetadata)?.name !== "isObjectOf") {
      return true;
    }
    Object.assign(predObj, (meta as IsObjectOfMetadata).args[0]);
  });
  if (restPreds.length < preds.length) {
    restPreds.push(isObjectOf(predObj));
  }
  if (restPreds.length === 1) {
    return restPreds[0];
  }
  return setPredicateFactoryMetadata(
    (x: unknown): x is IntersectionOf<T> => restPreds.every((pred) => pred(x)),
    { name: "isIntersectionOf", args: [preds] },
  );
}

type IntersectionOf<T> = TupleToIntersection<TupleOf<T>>;

type IsIntersectionOfMetadata = {
  name: "isIntersectionOf";
  args: Parameters<typeof isIntersectionOf>;
};

/**
 * Return a type predicate function that returns `true` if the type of `x` is `Required<ObjectOf<T>>`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```typescript
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.RequiredOf(is.ObjectOf({
 *   a: is.Number,
 *   b: is.UnionOf([is.String, is.Undefined]),
 *   c: is.OptionalOf(is.Boolean),
 * }));
 * const a: unknown = { a: 0, b: "b", c: true, other: "other" };
 * if (isMyType(a)) {
 *   // 'a' is narrowed to { a: number; b: string | undefined; c: boolean }
 *   const _: { a: number; b: string | undefined; c: boolean } = a;
 * }
 * ```
 */
function isRequiredOf<
  T extends Record<PropertyKey, unknown>,
>(
  pred: Predicate<T> & WithMetadata<IsObjectOfMetadata>,
):
  & Predicate<FlatType<Required<T>>>
  & WithMetadata<IsObjectOfMetadata> {
  const { args } = getPredicateFactoryMetadata(pred);
  const predObj = Object.fromEntries(
    Object.entries(args[0]).map(([k, v]) => [k, isUnwrapOptionalOf(v)]),
  );
  return isObjectOf(predObj) as
    & Predicate<FlatType<Required<T>>>
    & WithMetadata<IsObjectOfMetadata>;
}

/**
 * Return a type predicate function that returns `true` if the type of `x` is `Partial<ObjectOf<T>>`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```typescript
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.PartialOf(is.ObjectOf({
 *   a: is.Number,
 *   b: is.UnionOf([is.String, is.Undefined]),
 *   c: is.OptionalOf(is.Boolean),
 * }));
 * const a: unknown = { a: undefined, other: "other" };
 * if (isMyType(a)) {
 *   // The "other" key in `a` is ignored.
 *   // 'a' is narrowed to { a?: number | undefined; b?: string | undefined; c?: boolean | undefined }
 *   const _: { a?: number | undefined; b?: string | undefined; c?: boolean | undefined } = a;
 * }
 * ```
 */
function isPartialOf<
  T extends Record<PropertyKey, unknown>,
>(
  pred: Predicate<T> & WithMetadata<IsObjectOfMetadata>,
):
  & Predicate<FlatType<Partial<T>>>
  & WithMetadata<IsObjectOfMetadata> {
  const { args } = getPredicateFactoryMetadata(pred);
  const predObj = Object.fromEntries(
    Object.entries(args[0]).map(([k, v]) => [k, isOptionalOf(v)]),
  );
  return isObjectOf(predObj) as
    & Predicate<FlatType<Partial<T>>>
    & WithMetadata<IsObjectOfMetadata>;
}

/**
 * Return a type predicate function that returns `true` if the type of `x` is `Pick<ObjectOf<T>, K>`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```typescript
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.PickOf(is.ObjectOf({
 *   a: is.Number,
 *   b: is.String,
 *   c: is.OptionalOf(is.Boolean),
 * }), ["a", "c"]);
 * const a: unknown = { a: 0, b: "a", other: "other" };
 * if (isMyType(a)) {
 *   // The "b" and "other" key in `a` is ignored.
 *   // 'a' is narrowed to { a: number; c?: boolean | undefined }
 *   const _: { a: number; c?: boolean | undefined } = a;
 * }
 * ```
 */
function isPickOf<
  T extends Record<PropertyKey, unknown>,
  K extends keyof T,
>(
  pred: Predicate<T> & WithMetadata<IsObjectOfMetadata>,
  keys: K[],
):
  & Predicate<FlatType<Pick<T, K>>>
  & WithMetadata<IsObjectOfMetadata> {
  const s = new Set(keys);
  const { args } = getPredicateFactoryMetadata(pred);
  const predObj = Object.fromEntries(
    Object.entries(args[0]).filter(([k]) => s.has(k as K)),
  );
  return isObjectOf(predObj) as
    & Predicate<FlatType<Pick<T, K>>>
    & WithMetadata<IsObjectOfMetadata>;
}

/**
 * Return a type predicate function that returns `true` if the type of `x` is `Omit<ObjectOf<T>, K>`.
 *
 * To enhance performance, users are advised to cache the return value of this function and mitigate the creation cost.
 *
 * ```typescript
 * import { is } from "@core/unknownutil";
 *
 * const isMyType = is.OmitOf(is.ObjectOf({
 *   a: is.Number,
 *   b: is.String,
 *   c: is.OptionalOf(is.Boolean),
 * }), ["a", "c"]);
 * const a: unknown = { a: 0, b: "a", other: "other" };
 * if (isMyType(a)) {
 *   // The "a", "c", and "other" key in `a` is ignored.
 *   // 'a' is narrowed to { b: string }
 *   const _: { b: string } = a;
 * }
 * ```
 */
function isOmitOf<
  T extends Record<PropertyKey, unknown>,
  K extends keyof T,
>(
  pred: Predicate<T> & WithMetadata<IsObjectOfMetadata>,
  keys: K[],
):
  & Predicate<FlatType<Omit<T, K>>>
  & WithMetadata<IsObjectOfMetadata> {
  const s = new Set(keys);
  const { args } = getPredicateFactoryMetadata(pred);
  const predObj = Object.fromEntries(
    Object.entries(args[0]).filter(([k]) => !s.has(k as K)),
  );
  return isObjectOf(predObj) as
    & Predicate<FlatType<Omit<T, K>>>
    & WithMetadata<IsObjectOfMetadata>;
}

export const is = {
  Any: isAny,
  Array: isArray,
  ArrayOf: isArrayOf,
  AsyncFunction: isAsyncFunction,
  BigInt: isBigInt,
  Boolean: isBoolean,
  Function: isFunction,
  InstanceOf: isInstanceOf,
  IntersectionOf: isIntersectionOf,
  LiteralOf: isLiteralOf,
  LiteralOneOf: isLiteralOneOf,
  Map: isMap,
  MapOf: isMapOf,
  Null: isNull,
  Nullish: isNullish,
  Number: isNumber,
  ObjectOf: isObjectOf,
  OmitOf: isOmitOf,
  Optional: isOptional,
  OptionalOf: isOptionalOf,
  ParametersOf: isParametersOf,
  PartialOf: isPartialOf,
  PickOf: isPickOf,
  Primitive: isPrimitive,
  Readonly: isReadonly,
  ReadonlyOf: isReadonlyOf,
  Record: isRecord,
  RecordObject: isRecordObject,
  RecordObjectOf: isRecordObjectOf,
  RecordOf: isRecordOf,
  RequiredOf: isRequiredOf,
  Set: isSet,
  SetOf: isSetOf,
  StrictOf: isStrictOf,
  String: isString,
  Symbol: isSymbol,
  SyncFunction: isSyncFunction,
  TupleOf: isTupleOf,
  Undefined: isUndefined,
  UniformTupleOf: isUniformTupleOf,
  UnionOf: isUnionOf,
  Unknown: isUnknown,
  UnwrapOptionalOf: isUnwrapOptionalOf,
  UnwrapReadonlyOf: isUnwrapReadonlyOf,
};
