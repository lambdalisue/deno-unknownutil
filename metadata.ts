import type { Predicate } from "./is/type.ts";
import { inspect } from "./inspect.ts";

/**
 * A type that has metadata.
 */
export type WithMetadata<T> = {
  __unknownutil_metadata: T;
};

/**
 * Get typeof the metadata
 */
export type GetMetadata<T> = T extends WithMetadata<infer M> ? M : never;

/**
 * Get metadata from the given value
 */
export function getMetadata<T>(v: unknown): T | undefined {
  if (v == null) return undefined;
  // deno-lint-ignore no-explicit-any
  return (v as any).__unknownutil_metadata;
}

/**
 * Metadata of a predicate factory function.
 */
export type PredicateFactoryMetadata = {
  name: string;
  args: unknown[];
};

/**
 * Set metadata to a predicate factory function.
 */
export function setPredicateFactoryMetadata<
  P extends Predicate<unknown>,
  M extends PredicateFactoryMetadata,
>(
  pred: P,
  metadata: M,
): P & WithMetadata<M> {
  let cachedName: string | undefined;
  return Object.defineProperties(pred, {
    __unknownutil_metadata: {
      value: metadata,
      configurable: true,
    },
    name: {
      get: () => {
        if (cachedName) return cachedName;
        const { name, args } = metadata;
        cachedName = `${name}(${args.map((v) => inspect(v)).join(", ")})`;
        return cachedName;
      },
    },
  }) as P & WithMetadata<M>;
}

/**
 * Get metadata from a predicate factory function.
 */
export function getPredicateFactoryMetadata<M extends PredicateFactoryMetadata>(
  v: WithMetadata<M>,
): M {
  return getMetadata(v) as M;
}
