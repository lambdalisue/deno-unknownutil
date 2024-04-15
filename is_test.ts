import { assertEquals } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import { assertType } from "@std/testing/types";
import { type Equal, stringify } from "./_testutil.ts";
import type { Predicate, PredicateType } from "./type.ts";
import { is } from "./is.ts";

const examples = {
  string: ["", "Hello world"],
  number: [0, 1234567890],
  bigint: [0n, 1234567890n],
  boolean: [true, false],
  array: [[], [0, 1, 2], ["a", "b", "c"], [0, "a", true]],
  set: [new Set(), new Set([0, 1, 2]), new Set(["a", "b", "c"])],
  record: [{}, { a: 0, b: 1, c: 2 }, { a: "a", b: "b", c: "c" }],
  map: [
    new Map(),
    new Map([["a", 0], ["b", 1], ["c", 2]]),
    new Map([["a", "a"], ["b", "b"], ["c", "c"]]),
  ],
  syncFunction: [function a() {}, () => {}],
  asyncFunction: [async function b() {}, async () => {}],
  null: [null],
  undefined: [undefined],
  symbol: [Symbol("a"), Symbol("b"), Symbol("c")],
  date: [new Date(1690248225000), new Date(0)],
  promise: [new Promise(() => {})],
} as const;

async function testWithExamples<T>(
  t: Deno.TestContext,
  pred: Predicate<T>,
  opts?: {
    validExamples?: (keyof typeof examples)[];
    excludeExamples?: (keyof typeof examples)[];
  },
): Promise<void> {
  const { validExamples = [], excludeExamples = [] } = opts ?? {};
  const exampleEntries = (Object.entries(examples) as unknown as [
    name: keyof typeof examples,
    example: unknown[],
  ][]).filter(([k]) => !excludeExamples.includes(k));
  for (const [name, example] of exampleEntries) {
    const expect = validExamples.includes(name);
    for (const v of example) {
      await t.step(
        `returns ${expect} on ${stringify(v)}`,
        () => {
          assertEquals(pred(v), expect);
        },
      );
    }
  }
}

Deno.test("is.Any", async (t) => {
  await testWithExamples(t, is.Any, {
    validExamples: [
      "string",
      "number",
      "bigint",
      "boolean",
      "array",
      "set",
      "record",
      "map",
      "syncFunction",
      "asyncFunction",
      "null",
      "undefined",
      "symbol",
      "date",
      "promise",
    ],
  });
});

Deno.test("is.Unknown", async (t) => {
  await testWithExamples(t, is.Unknown, {
    validExamples: [
      "string",
      "number",
      "bigint",
      "boolean",
      "array",
      "set",
      "record",
      "map",
      "syncFunction",
      "asyncFunction",
      "null",
      "undefined",
      "symbol",
      "date",
      "promise",
    ],
  });
});

Deno.test("is.String", async (t) => {
  await testWithExamples(t, is.String, { validExamples: ["string"] });
});

Deno.test("is.Number", async (t) => {
  await testWithExamples(t, is.Number, { validExamples: ["number"] });
});

Deno.test("is.BigInt", async (t) => {
  await testWithExamples(t, is.BigInt, { validExamples: ["bigint"] });
});

Deno.test("is.Boolean", async (t) => {
  await testWithExamples(t, is.Boolean, { validExamples: ["boolean"] });
});

Deno.test("is.Array", async (t) => {
  await testWithExamples(t, is.Array, { validExamples: ["array"] });
});

Deno.test("is.Set", async (t) => {
  await testWithExamples(t, is.Set, { validExamples: ["set"] });
});

Deno.test("is.RecordObject", async (t) => {
  await testWithExamples(t, is.RecordObject, {
    validExamples: ["record"],
  });
});

Deno.test("is.Record", async (t) => {
  await testWithExamples(t, is.Record, {
    validExamples: ["record", "date", "promise", "set", "map"],
  });
});

Deno.test("is.Map", async (t) => {
  await testWithExamples(t, is.Map, {
    validExamples: ["map"],
  });
});

Deno.test("is.Function", async (t) => {
  await testWithExamples(t, is.Function, {
    validExamples: ["syncFunction", "asyncFunction"],
  });
});

Deno.test("is.SyncFunction", async (t) => {
  await testWithExamples(t, is.SyncFunction, {
    validExamples: ["syncFunction"],
  });
});

Deno.test("is.AsyncFunction", async (t) => {
  await testWithExamples(t, is.AsyncFunction, {
    validExamples: ["asyncFunction"],
  });
});

Deno.test("is.Null", async (t) => {
  await testWithExamples(t, is.Null, { validExamples: ["null"] });
});

Deno.test("is.Undefined", async (t) => {
  await testWithExamples(t, is.Undefined, { validExamples: ["undefined"] });
});

Deno.test("is.Nullish", async (t) => {
  await testWithExamples(t, is.Nullish, {
    validExamples: ["null", "undefined"],
  });
});

Deno.test("is.Symbol", async (t) => {
  await testWithExamples(t, is.Symbol, { validExamples: ["symbol"] });
});

Deno.test("is.Primitive", async (t) => {
  await testWithExamples(t, is.Primitive, {
    validExamples: [
      "string",
      "number",
      "bigint",
      "boolean",
      "null",
      "undefined",
      "symbol",
    ],
  });
});

Deno.test("is.OptionalOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.OptionalOf(is.Number).name);
    // Nesting does nothing
    await assertSnapshot(t, is.OptionalOf(is.OptionalOf(is.Number)).name);
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = undefined;
    if (is.OptionalOf(is.Number)(a)) {
      assertType<Equal<typeof a, number | undefined>>(true);
    }
  });
  await t.step("with is.String", async (t) => {
    await testWithExamples(t, is.OptionalOf(is.String), {
      validExamples: ["string", "undefined"],
    });
  });
  await t.step("with is.Number", async (t) => {
    await testWithExamples(t, is.OptionalOf(is.Number), {
      validExamples: ["number", "undefined"],
    });
  });
  await t.step("with is.BigInt", async (t) => {
    await testWithExamples(t, is.OptionalOf(is.BigInt), {
      validExamples: ["bigint", "undefined"],
    });
  });
  await t.step("with is.Boolean", async (t) => {
    await testWithExamples(t, is.OptionalOf(is.Boolean), {
      validExamples: ["boolean", "undefined"],
    });
  });
  await t.step("with is.Array", async (t) => {
    await testWithExamples(t, is.OptionalOf(is.Array), {
      validExamples: ["array", "undefined"],
    });
  });
  await t.step("with is.Set", async (t) => {
    await testWithExamples(t, is.OptionalOf(is.Set), {
      validExamples: ["set", "undefined"],
    });
  });
  await t.step("with is.RecordObject", async (t) => {
    await testWithExamples(t, is.OptionalOf(is.RecordObject), {
      validExamples: ["record", "undefined"],
    });
  });
  await t.step("with is.Function", async (t) => {
    await testWithExamples(t, is.OptionalOf(is.Function), {
      validExamples: ["syncFunction", "asyncFunction", "undefined"],
    });
  });
  await t.step("with is.SyncFunction", async (t) => {
    await testWithExamples(t, is.OptionalOf(is.SyncFunction), {
      validExamples: ["syncFunction", "undefined"],
    });
  });
  await t.step("with is.AsyncFunction", async (t) => {
    await testWithExamples(t, is.OptionalOf(is.AsyncFunction), {
      validExamples: ["asyncFunction", "undefined"],
    });
  });
  await t.step("with is.Null", async (t) => {
    await testWithExamples(t, is.OptionalOf(is.Null), {
      validExamples: ["null", "undefined"],
    });
  });
  await t.step("with is.Undefined", async (t) => {
    await testWithExamples(t, is.OptionalOf(is.Undefined), {
      validExamples: ["undefined"],
    });
  });
  await t.step("with is.Symbol", async (t) => {
    await testWithExamples(t, is.OptionalOf(is.Symbol), {
      validExamples: ["symbol", "undefined"],
    });
  });
});

Deno.test("is.UnwrapOptionalOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.UnwrapOptionalOf(is.OptionalOf(is.Number)).name);
    // Non optional does nothing
    await assertSnapshot(t, is.UnwrapOptionalOf(is.Number).name);
    // Nesting does nothing
    await assertSnapshot(
      t,
      is.UnwrapOptionalOf(is.UnwrapOptionalOf(is.OptionalOf(is.Number))).name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = undefined;
    if (is.UnwrapOptionalOf(is.OptionalOf(is.Number))(a)) {
      assertType<Equal<typeof a, number>>(true);
    }
    if (is.UnwrapOptionalOf(is.Number)(a)) {
      assertType<Equal<typeof a, number>>(true);
    }
  });
  await t.step("with is.String", async (t) => {
    await testWithExamples(t, is.UnwrapOptionalOf(is.OptionalOf(is.String)), {
      validExamples: ["string"],
    });
  });
  await t.step("with is.Number", async (t) => {
    await testWithExamples(t, is.UnwrapOptionalOf(is.OptionalOf(is.Number)), {
      validExamples: ["number"],
    });
  });
  await t.step("with is.BigInt", async (t) => {
    await testWithExamples(t, is.UnwrapOptionalOf(is.OptionalOf(is.BigInt)), {
      validExamples: ["bigint"],
    });
  });
  await t.step("with is.Boolean", async (t) => {
    await testWithExamples(t, is.UnwrapOptionalOf(is.OptionalOf(is.Boolean)), {
      validExamples: ["boolean"],
    });
  });
  await t.step("with is.Array", async (t) => {
    await testWithExamples(t, is.UnwrapOptionalOf(is.OptionalOf(is.Array)), {
      validExamples: ["array"],
    });
  });
  await t.step("with is.Set", async (t) => {
    await testWithExamples(t, is.UnwrapOptionalOf(is.OptionalOf(is.Set)), {
      validExamples: ["set"],
    });
  });
  await t.step("with is.RecordObject", async (t) => {
    await testWithExamples(
      t,
      is.UnwrapOptionalOf(is.OptionalOf(is.RecordObject)),
      {
        validExamples: ["record"],
      },
    );
  });
  await t.step("with is.Function", async (t) => {
    await testWithExamples(t, is.UnwrapOptionalOf(is.OptionalOf(is.Function)), {
      validExamples: ["syncFunction", "asyncFunction"],
    });
  });
  await t.step("with is.SyncFunction", async (t) => {
    await testWithExamples(
      t,
      is.UnwrapOptionalOf(is.OptionalOf(is.SyncFunction)),
      {
        validExamples: ["syncFunction"],
      },
    );
  });
  await t.step("with is.AsyncFunction", async (t) => {
    await testWithExamples(
      t,
      is.UnwrapOptionalOf(is.OptionalOf(is.AsyncFunction)),
      {
        validExamples: ["asyncFunction"],
      },
    );
  });
  await t.step("with is.Null", async (t) => {
    await testWithExamples(t, is.UnwrapOptionalOf(is.OptionalOf(is.Null)), {
      validExamples: ["null"],
    });
  });
  await t.step("with is.Undefined", async (t) => {
    await testWithExamples(
      t,
      is.UnwrapOptionalOf(is.OptionalOf(is.Undefined)),
      {
        validExamples: ["undefined"],
      },
    );
  });
  await t.step("with is.Symbol", async (t) => {
    await testWithExamples(t, is.UnwrapOptionalOf(is.OptionalOf(is.Symbol)), {
      validExamples: ["symbol"],
    });
  });
});

Deno.test("is.ReadonlyOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.ReadonlyOf(is.Number).name);
    // Nesting does nothing
    await assertSnapshot(t, is.ReadonlyOf(is.ReadonlyOf(is.Number)).name);
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = undefined;
    if (is.ReadonlyOf(is.Number)(a)) {
      assertType<Equal<typeof a, Readonly<number>>>(true);
    }
    if (is.ReadonlyOf(is.TupleOf([is.String, is.Number, is.Boolean]))(a)) {
      assertType<Equal<typeof a, Readonly<[string, number, boolean]>>>(true);
    }
    if (is.ReadonlyOf(is.UniformTupleOf(3, is.String))(a)) {
      assertType<Equal<typeof a, Readonly<[string, string, string]>>>(true);
    }
    if (
      is.ReadonlyOf(is.ObjectOf({ a: is.String, b: is.Number, c: is.Boolean }))(
        a,
      )
    ) {
      assertType<
        Equal<typeof a, Readonly<{ a: string; b: number; c: boolean }>>
      >(true);
    }
  });
});

Deno.test("is.UnwrapReadonlyOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.UnwrapReadonlyOf(is.ReadonlyOf(is.Number)).name);
    // Nesting does nothing
    await assertSnapshot(
      t,
      is.UnwrapReadonlyOf(is.ReadonlyOf(is.ReadonlyOf(is.Number))).name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = undefined;
    if (is.UnwrapReadonlyOf(is.ReadonlyOf(is.Number))(a)) {
      assertType<Equal<typeof a, number>>(true);
    }
    if (
      is.UnwrapReadonlyOf(
        is.ReadonlyOf(is.TupleOf([is.String, is.Number, is.Boolean])),
      )(a)
    ) {
      assertType<Equal<typeof a, [string, number, boolean]>>(true);
    }
    if (
      is.UnwrapReadonlyOf(is.ReadonlyOf(is.UniformTupleOf(3, is.String)))(a)
    ) {
      assertType<Equal<typeof a, [string, string, string]>>(true);
    }
    if (
      is.UnwrapReadonlyOf(
        is.ReadonlyOf(
          is.ObjectOf({ a: is.String, b: is.Number, c: is.Boolean }),
        ),
      )(a)
    ) {
      assertType<
        Equal<typeof a, { a: string; b: number; c: boolean }>
      >(true);
    }
  });
});

Deno.test("is.ArrayOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.ArrayOf(is.Number).name);
    await assertSnapshot(t, is.ArrayOf((_x): _x is string => false).name);
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = [0, 1, 2];
    if (is.ArrayOf(is.Number)(a)) {
      assertType<Equal<typeof a, number[]>>(true);
    }
  });
  await t.step("returns true on T array", () => {
    assertEquals(is.ArrayOf(is.Number)([0, 1, 2]), true);
    assertEquals(is.ArrayOf(is.String)(["a", "b", "c"]), true);
    assertEquals(is.ArrayOf(is.Boolean)([true, false, true]), true);
  });
  await t.step("returns false on non T array", () => {
    assertEquals(is.ArrayOf(is.String)([0, 1, 2]), false);
    assertEquals(is.ArrayOf(is.Number)(["a", "b", "c"]), false);
    assertEquals(is.ArrayOf(is.String)([true, false, true]), false);
  });
  await testWithExamples(t, is.ArrayOf((_: unknown): _ is unknown => true), {
    excludeExamples: ["array"],
  });
});

Deno.test("is.SetOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.SetOf(is.Number).name);
    await assertSnapshot(t, is.SetOf((_x): _x is string => false).name);
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = new Set([0, 1, 2]);
    if (is.SetOf(is.Number)(a)) {
      assertType<Equal<typeof a, Set<number>>>(true);
    }
  });
  await t.step("returns true on T set", () => {
    assertEquals(is.SetOf(is.Number)(new Set([0, 1, 2])), true);
    assertEquals(is.SetOf(is.String)(new Set(["a", "b", "c"])), true);
    assertEquals(is.SetOf(is.Boolean)(new Set([true, false, true])), true);
  });
  await t.step("returns false on non T set", () => {
    assertEquals(is.SetOf(is.String)(new Set([0, 1, 2])), false);
    assertEquals(is.SetOf(is.Number)(new Set(["a", "b", "c"])), false);
    assertEquals(is.SetOf(is.String)(new Set([true, false, true])), false);
  });
  await testWithExamples(t, is.SetOf((_: unknown): _ is unknown => true), {
    excludeExamples: ["set"],
  });
});

Deno.test("is.TupleOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(
      t,
      is.TupleOf([is.Number, is.String, is.Boolean]).name,
    );
    await assertSnapshot(
      t,
      is.TupleOf([(_x): _x is string => false]).name,
    );
    // Nested
    await assertSnapshot(
      t,
      is.TupleOf([is.TupleOf([is.TupleOf([is.Number, is.String, is.Boolean])])])
        .name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const predTup = [is.Number, is.String, is.Boolean] as const;
    const a: unknown = [0, "a", true];
    if (is.TupleOf(predTup)(a)) {
      assertType<Equal<typeof a, [number, string, boolean]>>(true);
    }
  });
  await t.step("returns true on T tuple", () => {
    const predTup = [is.Number, is.String, is.Boolean] as const;
    assertEquals(is.TupleOf(predTup)([0, "a", true]), true);
  });
  await t.step("returns false on non T tuple", () => {
    const predTup = [is.Number, is.String, is.Boolean] as const;
    assertEquals(is.TupleOf(predTup)([0, 1, 2]), false);
    assertEquals(is.TupleOf(predTup)([0, "a"]), false);
    assertEquals(is.TupleOf(predTup)([0, "a", true, 0]), false);
  });
  await testWithExamples(t, is.TupleOf([(_: unknown): _ is unknown => true]), {
    excludeExamples: ["array"],
  });
});

Deno.test("is.TupleOf<T, E>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(
      t,
      is.TupleOf([is.Number, is.String, is.Boolean], is.Array).name,
    );
    await assertSnapshot(
      t,
      is.TupleOf([(_x): _x is string => false], is.ArrayOf(is.String))
        .name,
    );
    // Nested
    await assertSnapshot(
      t,
      is.TupleOf([
        is.TupleOf(
          [is.TupleOf([is.Number, is.String, is.Boolean], is.Array)],
          is.Array,
        ),
      ]).name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const predTup = [is.Number, is.String, is.Boolean] as const;
    const predElse = is.ArrayOf(is.Number);
    const a: unknown = [0, "a", true, 0, 1, 2];
    if (is.TupleOf(predTup, predElse)(a)) {
      assertType<Equal<typeof a, [number, string, boolean, ...number[]]>>(
        true,
      );
    }
  });
  await t.step("returns true on T tuple", () => {
    const predTup = [is.Number, is.String, is.Boolean] as const;
    const predElse = is.ArrayOf(is.Number);
    assertEquals(is.TupleOf(predTup, predElse)([0, "a", true, 0, 1, 2]), true);
  });
  await t.step("returns false on non T tuple", () => {
    const predTup = [is.Number, is.String, is.Boolean] as const;
    const predElse = is.ArrayOf(is.String);
    assertEquals(is.TupleOf(predTup, predElse)([0, 1, 2, 0, 1, 2]), false);
    assertEquals(is.TupleOf(predTup, predElse)([0, "a", 0, 1, 2]), false);
    assertEquals(
      is.TupleOf(predTup, predElse)([0, "a", true, 0, 0, 1, 2]),
      false,
    );
    assertEquals(is.TupleOf(predTup, predElse)([0, "a", true, 0, 1, 2]), false);
  });
  const predElse = is.Array;
  await testWithExamples(
    t,
    is.TupleOf([(_: unknown): _ is unknown => true], predElse),
    {
      excludeExamples: ["array"],
    },
  );
});

Deno.test("is.ParametersOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(
      t,
      is.ParametersOf([is.Number, is.String, is.OptionalOf(is.Boolean)]).name,
    );
    await assertSnapshot(
      t,
      is.ParametersOf([(_x): _x is string => false]).name,
    );
    await assertSnapshot(
      t,
      is.ParametersOf([]).name,
    );
    // Nested
    await assertSnapshot(
      t,
      is.ParametersOf([
        is.ParametersOf([
          is.ParametersOf([is.Number, is.String, is.OptionalOf(is.Boolean)]),
        ]),
      ]).name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const predTup = [
      is.OptionalOf(is.Number),
      is.String,
      is.OptionalOf(is.String),
      is.OptionalOf(is.Boolean),
    ] as const;
    const a: unknown = [0, "a"];
    if (is.ParametersOf(predTup)(a)) {
      assertType<
        Equal<typeof a, [number | undefined, string, string?, boolean?]>
      >(true);
    }
  });
  await t.step("returns true on T tuple", () => {
    const predTup = [is.Number, is.String, is.OptionalOf(is.Boolean)] as const;
    assertEquals(is.ParametersOf(predTup)([0, "a", true]), true);
    assertEquals(is.ParametersOf(predTup)([0, "a"]), true);
  });
  await t.step("returns false on non T tuple", () => {
    const predTup = [is.Number, is.String, is.OptionalOf(is.Boolean)] as const;
    assertEquals(is.ParametersOf(predTup)([0, 1, 2]), false);
    assertEquals(is.ParametersOf(predTup)([0, "a", true, 0]), false);
  });
  await testWithExamples(
    t,
    is.ParametersOf([(_: unknown): _ is unknown => true]),
    {
      excludeExamples: ["array"],
    },
  );
});

Deno.test("is.ParametersOf<T, E>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(
      t,
      is.ParametersOf(
        [is.Number, is.String, is.OptionalOf(is.Boolean)],
        is.Array,
      )
        .name,
    );
    await assertSnapshot(
      t,
      is.ParametersOf([(_x): _x is string => false], is.ArrayOf(is.String))
        .name,
    );
    // Empty
    await assertSnapshot(
      t,
      is.ParametersOf([], is.ArrayOf(is.String)).name,
    );
    // Nested
    await assertSnapshot(
      t,
      is.ParametersOf([
        is.ParametersOf(
          [is.ParametersOf(
            [is.Number, is.String, is.OptionalOf(is.Boolean)],
            is.Array,
          )],
          is.Array,
        ),
      ]).name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const predTup = [
      is.OptionalOf(is.Number),
      is.String,
      is.OptionalOf(is.String),
      is.OptionalOf(is.Boolean),
    ] as const;
    const predElse = is.ArrayOf(is.Number);
    const a: unknown = [0, "a"];
    if (is.ParametersOf(predTup, predElse)(a)) {
      assertType<
        Equal<
          typeof a,
          [number | undefined, string, string?, boolean?, ...number[]]
        >
      >(
        true,
      );
    }
  });
  await t.step("returns true on T tuple", () => {
    const predTup = [is.Number, is.String, is.OptionalOf(is.Boolean)] as const;
    const predElse = is.ArrayOf(is.Number);
    assertEquals(
      is.ParametersOf(predTup, predElse)([0, "a", true, 0, 1, 2]),
      true,
    );
    assertEquals(
      is.ParametersOf(predTup, predElse)([0, "a", undefined, 0, 1, 2]),
      true,
    );
    assertEquals(is.ParametersOf(predTup, predElse)([0, "a"]), true);
  });
  await t.step("returns false on non T tuple", () => {
    const predTup = [is.Number, is.String, is.OptionalOf(is.Boolean)] as const;
    const predElse = is.ArrayOf(is.String);
    assertEquals(is.ParametersOf(predTup, predElse)([0, 1, 2, 0, 1, 2]), false);
    assertEquals(is.ParametersOf(predTup, predElse)([0, "a", 0, 1, 2]), false);
    assertEquals(
      is.ParametersOf(predTup, predElse)([0, "a", true, 0, 1, 2]),
      false,
    );
    assertEquals(
      is.ParametersOf(predTup, predElse)([0, "a", undefined, 0, 1, 2]),
      false,
    );
    assertEquals(is.ParametersOf(predTup, predElse)([0, "a", "b"]), false);
  });
  const predElse = is.Array;
  await testWithExamples(
    t,
    is.ParametersOf([(_: unknown): _ is unknown => true], predElse),
    {
      excludeExamples: ["array"],
    },
  );
});

Deno.test("is.UniformTupleOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.UniformTupleOf(3).name);
    await assertSnapshot(t, is.UniformTupleOf(3, is.Number).name);
    await assertSnapshot(
      t,
      is.UniformTupleOf(3, (_x): _x is string => false).name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = [0, 1, 2, 3, 4];
    if (is.UniformTupleOf(5)(a)) {
      assertType<
        Equal<typeof a, [unknown, unknown, unknown, unknown, unknown]>
      >(true);
    }

    if (is.UniformTupleOf(5, is.Number)(a)) {
      assertType<Equal<typeof a, [number, number, number, number, number]>>(
        true,
      );
    }
  });
  await t.step("returns true on mono-typed T tuple", () => {
    assertEquals(is.UniformTupleOf(3)([0, 1, 2]), true);
    assertEquals(is.UniformTupleOf(3, is.Number)([0, 1, 2]), true);
  });
  await t.step("returns false on non mono-typed T tuple", () => {
    assertEquals(is.UniformTupleOf(4)([0, 1, 2]), false);
    assertEquals(is.UniformTupleOf(4)([0, 1, 2, 3, 4]), false);
    assertEquals(is.UniformTupleOf(3, is.Number)(["a", "b", "c"]), false);
  });
  await testWithExamples(t, is.UniformTupleOf(4), {
    excludeExamples: ["array"],
  });
});

Deno.test("is.RecordObjectOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.RecordObjectOf(is.Number).name);
    await assertSnapshot(
      t,
      is.RecordObjectOf((_x): _x is string => false).name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = { a: 0 };
    if (is.RecordObjectOf(is.Number)(a)) {
      assertType<Equal<typeof a, Record<PropertyKey, number>>>(true);
    }
  });
  await t.step("returns true on T record", () => {
    assertEquals(is.RecordObjectOf(is.Number)({ a: 0 }), true);
    assertEquals(is.RecordObjectOf(is.String)({ a: "a" }), true);
    assertEquals(is.RecordObjectOf(is.Boolean)({ a: true }), true);
  });
  await t.step("returns false on non T record", () => {
    assertEquals(is.RecordObjectOf(is.String)({ a: 0 }), false);
    assertEquals(is.RecordObjectOf(is.Number)({ a: "a" }), false);
    assertEquals(is.RecordObjectOf(is.String)({ a: true }), false);
  });
  await testWithExamples(
    t,
    is.RecordObjectOf((_: unknown): _ is unknown => true),
    {
      excludeExamples: ["record"],
    },
  );
});

Deno.test("is.RecordObjectOf<T, K>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.RecordObjectOf(is.Number, is.String).name);
    await assertSnapshot(
      t,
      is.RecordObjectOf((_x): _x is string => false, is.String).name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = { a: 0 };
    if (is.RecordObjectOf(is.Number, is.String)(a)) {
      assertType<Equal<typeof a, Record<string, number>>>(true);
    }
  });
  await t.step("returns true on T record", () => {
    assertEquals(is.RecordObjectOf(is.Number, is.String)({ a: 0 }), true);
    assertEquals(is.RecordObjectOf(is.String, is.String)({ a: "a" }), true);
    assertEquals(is.RecordObjectOf(is.Boolean, is.String)({ a: true }), true);
  });
  await t.step("returns false on non T record", () => {
    assertEquals(is.RecordObjectOf(is.String, is.String)({ a: 0 }), false);
    assertEquals(is.RecordObjectOf(is.Number, is.String)({ a: "a" }), false);
    assertEquals(is.RecordObjectOf(is.String, is.String)({ a: true }), false);
  });
  await t.step("returns false on non K record", () => {
    assertEquals(is.RecordObjectOf(is.Number, is.Number)({ a: 0 }), false);
    assertEquals(is.RecordObjectOf(is.String, is.Number)({ a: "a" }), false);
    assertEquals(is.RecordObjectOf(is.Boolean, is.Number)({ a: true }), false);
  });
  await testWithExamples(
    t,
    is.RecordObjectOf((_: unknown): _ is unknown => true),
    {
      excludeExamples: ["record"],
    },
  );
});

Deno.test("is.RecordOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.RecordOf(is.Number).name);
    await assertSnapshot(t, is.RecordOf((_x): _x is string => false).name);
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = { a: 0 };
    if (is.RecordOf(is.Number)(a)) {
      assertType<Equal<typeof a, Record<PropertyKey, number>>>(true);
    }
  });
  await t.step("returns true on T record", () => {
    assertEquals(is.RecordOf(is.Number)({ a: 0 }), true);
    assertEquals(is.RecordOf(is.String)({ a: "a" }), true);
    assertEquals(is.RecordOf(is.Boolean)({ a: true }), true);
  });
  await t.step("returns false on non T record", () => {
    assertEquals(is.RecordOf(is.String)({ a: 0 }), false);
    assertEquals(is.RecordOf(is.Number)({ a: "a" }), false);
    assertEquals(is.RecordOf(is.String)({ a: true }), false);
  });
  await testWithExamples(
    t,
    is.RecordOf((_: unknown): _ is unknown => true),
    {
      excludeExamples: ["record", "date", "promise", "set", "map"],
    },
  );
});

Deno.test("is.RecordOf<T, K>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.RecordOf(is.Number, is.String).name);
    await assertSnapshot(
      t,
      is.RecordOf((_x): _x is string => false, is.String).name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = { a: 0 };
    if (is.RecordOf(is.Number, is.String)(a)) {
      assertType<Equal<typeof a, Record<string, number>>>(true);
    }
  });
  await t.step("returns true on T record", () => {
    assertEquals(is.RecordOf(is.Number, is.String)({ a: 0 }), true);
    assertEquals(is.RecordOf(is.String, is.String)({ a: "a" }), true);
    assertEquals(is.RecordOf(is.Boolean, is.String)({ a: true }), true);
  });
  await t.step("returns false on non T record", () => {
    assertEquals(is.RecordOf(is.String, is.String)({ a: 0 }), false);
    assertEquals(is.RecordOf(is.Number, is.String)({ a: "a" }), false);
    assertEquals(is.RecordOf(is.String, is.String)({ a: true }), false);
  });
  await t.step("returns false on non K record", () => {
    assertEquals(is.RecordOf(is.Number, is.Number)({ a: 0 }), false);
    assertEquals(is.RecordOf(is.String, is.Number)({ a: "a" }), false);
    assertEquals(is.RecordOf(is.Boolean, is.Number)({ a: true }), false);
  });
  await testWithExamples(
    t,
    is.RecordOf((_: unknown): _ is unknown => true),
    {
      excludeExamples: ["record", "date", "promise", "set", "map"],
    },
  );
});

Deno.test("is.MapOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.MapOf(is.Number).name);
    await assertSnapshot(t, is.MapOf((_x): _x is string => false).name);
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = new Map([["a", 0]]);
    if (is.MapOf(is.Number)(a)) {
      assertType<Equal<typeof a, Map<unknown, number>>>(true);
    }
  });
  await t.step("returns true on T map", () => {
    assertEquals(is.MapOf(is.Number)(new Map([["a", 0]])), true);
    assertEquals(is.MapOf(is.String)(new Map([["a", "a"]])), true);
    assertEquals(is.MapOf(is.Boolean)(new Map([["a", true]])), true);
  });
  await t.step("returns false on non T map", () => {
    assertEquals(is.MapOf(is.String)(new Map([["a", 0]])), false);
    assertEquals(is.MapOf(is.Number)(new Map([["a", "a"]])), false);
    assertEquals(is.MapOf(is.String)(new Map([["a", true]])), false);
  });
  await testWithExamples(t, is.MapOf((_: unknown): _ is unknown => true), {
    excludeExamples: ["map"],
  });
});

Deno.test("is.MapOf<T, K>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.MapOf(is.Number, is.String).name);
    await assertSnapshot(
      t,
      is.MapOf((_x): _x is string => false, is.String).name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = new Map([["a", 0]]);
    if (is.MapOf(is.Number, is.String)(a)) {
      assertType<Equal<typeof a, Map<string, number>>>(true);
    }
  });
  await t.step("returns true on T map", () => {
    assertEquals(is.MapOf(is.Number, is.String)(new Map([["a", 0]])), true);
    assertEquals(is.MapOf(is.String, is.String)(new Map([["a", "a"]])), true);
    assertEquals(is.MapOf(is.Boolean, is.String)(new Map([["a", true]])), true);
  });
  await t.step("returns false on non T map", () => {
    assertEquals(is.MapOf(is.String, is.String)(new Map([["a", 0]])), false);
    assertEquals(is.MapOf(is.Number, is.String)(new Map([["a", "a"]])), false);
    assertEquals(is.MapOf(is.String, is.String)(new Map([["a", true]])), false);
  });
  await t.step("returns false on non K map", () => {
    assertEquals(is.MapOf(is.Number, is.Number)(new Map([["a", 0]])), false);
    assertEquals(is.MapOf(is.String, is.Number)(new Map([["a", "a"]])), false);
    assertEquals(
      is.MapOf(is.Boolean, is.Number)(new Map([["a", true]])),
      false,
    );
  });
  await testWithExamples(t, is.MapOf((_: unknown): _ is unknown => true), {
    excludeExamples: ["map"],
  });
});

Deno.test("is.ObjectOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(
      t,
      is.ObjectOf({ a: is.Number, b: is.String, c: is.Boolean }).name,
    );
    await assertSnapshot(
      t,
      is.ObjectOf({ a: (_x): _x is string => false }).name,
    );
    // Nested
    await assertSnapshot(
      t,
      is.ObjectOf({ a: is.ObjectOf({ b: is.ObjectOf({ c: is.Boolean }) }) })
        .name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const predObj = {
      a: is.Number,
      b: is.String,
      c: is.Boolean,
    };
    const a: unknown = { a: 0, b: "a", c: true };
    if (is.ObjectOf(predObj)(a)) {
      assertType<Equal<typeof a, { a: number; b: string; c: boolean }>>(true);
    }
  });
  await t.step("returns true on T object", () => {
    const predObj = {
      a: is.Number,
      b: is.String,
      c: is.Boolean,
    };
    assertEquals(is.ObjectOf(predObj)({ a: 0, b: "a", c: true }), true);
    assertEquals(
      is.ObjectOf(predObj)({ a: 0, b: "a", c: true, d: "ignored" }),
      true,
      "Object have an unknown property",
    );
    assertEquals(
      is.ObjectOf(predObj)(
        Object.assign(() => void 0, { a: 0, b: "a", c: true }),
      ),
      true,
      "Function object",
    );
  });
  await t.step("returns false on non T object", () => {
    const predObj = {
      a: is.Number,
      b: is.String,
      c: is.Boolean,
    };
    assertEquals(is.ObjectOf(predObj)("a"), false, "Value is not an object");
    assertEquals(
      is.ObjectOf(predObj)({ a: 0, b: "a", c: "" }),
      false,
      "Object have a different type property",
    );
    assertEquals(
      is.ObjectOf(predObj)({ a: 0, b: "a" }),
      false,
      "Object does not have one property",
    );
    assertEquals(
      is.ObjectOf({ 0: is.String })(["a"]),
      false,
      "Value is not an object",
    );
  });
  await t.step("returns true on T instance", () => {
    const date = new Date();
    const predObj = {
      getFullYear: is.Function,
    };
    assertEquals(is.ObjectOf(predObj)(date), true, "Value is not an object");
  });
  await testWithExamples(
    t,
    is.ObjectOf({ a: (_: unknown): _ is unknown => false }),
    { excludeExamples: ["record"] },
  );
});

Deno.test("is.StrictOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(
      t,
      is.StrictOf(is.ObjectOf({ a: is.Number, b: is.String, c: is.Boolean }))
        .name,
    );
    await assertSnapshot(
      t,
      is.StrictOf(is.ObjectOf({ a: (_x): _x is string => false })).name,
    );
    // Nested
    await assertSnapshot(
      t,
      is.StrictOf(
        is.ObjectOf({
          a: is.StrictOf(
            is.ObjectOf({ b: is.StrictOf(is.ObjectOf({ c: is.Boolean })) }),
          ),
        }),
      ).name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const predObj = {
      a: is.Number,
      b: is.String,
      c: is.Boolean,
    };
    const a: unknown = { a: 0, b: "a", c: true };
    if (is.StrictOf(is.ObjectOf(predObj))(a)) {
      assertType<Equal<typeof a, { a: number; b: string; c: boolean }>>(true);
    }
  });
  await t.step("returns true on T object", () => {
    const predObj = {
      a: is.Number,
      b: is.String,
      c: is.Boolean,
    };
    assertEquals(
      is.StrictOf(is.ObjectOf(predObj))({ a: 0, b: "a", c: true }),
      true,
    );
  });
  await t.step("returns false on non T object", () => {
    const predObj = {
      a: is.Number,
      b: is.String,
      c: is.Boolean,
    };
    assertEquals(
      is.StrictOf(is.ObjectOf(predObj))({ a: 0, b: "a", c: "" }),
      false,
      "Object have a different type property",
    );
    assertEquals(
      is.StrictOf(is.ObjectOf(predObj))({ a: 0, b: "a" }),
      false,
      "Object does not have one property",
    );
    assertEquals(
      is.StrictOf(is.ObjectOf(predObj))({
        a: 0,
        b: "a",
        c: true,
        d: "invalid",
      }),
      false,
      "Object have an unknown property",
    );
  });
  await testWithExamples(
    t,
    is.StrictOf(is.ObjectOf({ a: (_: unknown): _ is unknown => false })),
    { excludeExamples: ["record"] },
  );
  await t.step("with optional properties", async (t) => {
    await t.step("returns proper type predicate", () => {
      const predObj = {
        a: is.Number,
        b: is.UnionOf([is.String, is.Undefined]),
        c: is.OptionalOf(is.Boolean),
      };
      const a: unknown = { a: 0, b: "a" };
      if (is.StrictOf(is.ObjectOf(predObj))(a)) {
        assertType<
          Equal<typeof a, { a: number; b: string | undefined; c?: boolean }>
        >(true);
      }
    });
    await t.step("returns true on T object", () => {
      const predObj = {
        a: is.Number,
        b: is.UnionOf([is.String, is.Undefined]),
        c: is.OptionalOf(is.Boolean),
      };
      assertEquals(
        is.StrictOf(is.ObjectOf(predObj))({ a: 0, b: "a", c: true }),
        true,
      );
      assertEquals(
        is.StrictOf(is.ObjectOf(predObj))({ a: 0, b: "a" }),
        true,
        "Object does not have an optional property",
      );
      assertEquals(
        is.StrictOf(is.ObjectOf(predObj))({ a: 0, b: "a", c: undefined }),
        true,
        "Object has `undefined` as value of optional property",
      );
    });
    await t.step("returns false on non T object", () => {
      const predObj = {
        a: is.Number,
        b: is.UnionOf([is.String, is.Undefined]),
        c: is.OptionalOf(is.Boolean),
      };
      assertEquals(
        is.StrictOf(is.ObjectOf(predObj))({ a: 0, b: "a", c: "" }),
        false,
        "Object have a different type property",
      );
      assertEquals(
        is.StrictOf(is.ObjectOf(predObj))({ a: 0, b: "a", c: null }),
        false,
        "Object has `null` as value of optional property",
      );
      assertEquals(
        is.StrictOf(is.ObjectOf(predObj))({
          a: 0,
          b: "a",
          c: true,
          d: "invalid",
        }),
        false,
        "Object have an unknown property",
      );
      assertEquals(
        is.StrictOf(is.ObjectOf(predObj))({
          a: 0,
          b: "a",
          d: "invalid",
        }),
        false,
        "Object have the same number of properties but an unknown property exists",
      );
    });
  });
});

Deno.test("is.InstanceOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.InstanceOf(Date).name);
    await assertSnapshot(t, is.InstanceOf(class {}).name);
  });
  await t.step("returns true on T instance", () => {
    class Cls {}
    assertEquals(is.InstanceOf(Cls)(new Cls()), true);
    assertEquals(is.InstanceOf(Date)(new Date()), true);
    assertEquals(is.InstanceOf(Promise<string>)(new Promise(() => {})), true);
  });
  await t.step("with user-defined class", async (t) => {
    class Cls {}
    await testWithExamples(t, is.InstanceOf(Cls));
  });
  await t.step("with Date", async (t) => {
    await testWithExamples(t, is.InstanceOf(Date), { validExamples: ["date"] });
  });
  await t.step("with Promise", async (t) => {
    await testWithExamples(t, is.InstanceOf(Promise), {
      validExamples: ["promise"],
    });
  });
  await t.step("returns proper type predicate", () => {
    class Cls {}
    const a: unknown = new Cls();
    if (is.InstanceOf(Cls)(a)) {
      assertType<Equal<typeof a, Cls>>(true);
    }

    const b: unknown = new Date();
    if (is.InstanceOf(Date)(b)) {
      assertType<Equal<typeof b, Date>>(true);
    }

    const c: unknown = new Promise(() => {});
    if (is.InstanceOf(Promise)(c)) {
      assertType<Equal<typeof c, Promise<unknown>>>(true);
    }
  });
});

Deno.test("is.LiteralOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.LiteralOf("hello").name);
    await assertSnapshot(t, is.LiteralOf(100).name);
    await assertSnapshot(t, is.LiteralOf(100n).name);
    await assertSnapshot(t, is.LiteralOf(true).name);
    await assertSnapshot(t, is.LiteralOf(null).name);
    await assertSnapshot(t, is.LiteralOf(undefined).name);
    await assertSnapshot(t, is.LiteralOf(Symbol("asdf")).name);
  });
  await t.step("returns proper type predicate", () => {
    const pred = "hello";
    const a: unknown = "hello";
    if (is.LiteralOf(pred)(a)) {
      assertType<Equal<typeof a, "hello">>(true);
    }
  });
  await t.step("returns true on literal T", () => {
    const pred = "hello";
    assertEquals(is.LiteralOf(pred)("hello"), true);
  });
  await t.step("returns false on non literal T", async (t) => {
    const pred = "hello";
    await testWithExamples(t, is.LiteralOf(pred));
  });
});

Deno.test("is.LiteralOneOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.LiteralOneOf(["hello", "world"]).name);
  });
  await t.step("returns proper type predicate", () => {
    const preds = ["hello", "world"] as const;
    const a: unknown = "hello";
    if (is.LiteralOneOf(preds)(a)) {
      assertType<Equal<typeof a, "hello" | "world">>(true);
    }
  });
  await t.step("returns true on literal T", () => {
    const preds = ["hello", "world"] as const;
    assertEquals(is.LiteralOneOf(preds)("hello"), true);
    assertEquals(is.LiteralOneOf(preds)("world"), true);
  });
  await t.step("returns false on non literal T", async (t) => {
    const preds = ["hello", "world"] as const;
    await testWithExamples(t, is.LiteralOneOf(preds));
  });
});

Deno.test("is.UnionOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(
      t,
      is.UnionOf([is.Number, is.String, is.Boolean]).name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const preds = [is.Number, is.String, is.Boolean] as const;
    const a: unknown = [0, "a", true];
    if (is.UnionOf(preds)(a)) {
      assertType<Equal<typeof a, number | string | boolean>>(true);
    }
  });
  await t.step("returns proper type predicate (#49)", () => {
    const isFoo = is.ObjectOf({ foo: is.String });
    const isBar = is.ObjectOf({ foo: is.String, bar: is.Number });
    type Foo = PredicateType<typeof isFoo>;
    type Bar = PredicateType<typeof isBar>;
    const preds = [isFoo, isBar] as const;
    const a: unknown = [0, "a", true];
    if (is.UnionOf(preds)(a)) {
      assertType<Equal<typeof a, Foo | Bar>>(true);
    }
  });
  await t.step("returns true on one of T", () => {
    const preds = [is.Number, is.String, is.Boolean] as const;
    assertEquals(is.UnionOf(preds)(0), true);
    assertEquals(is.UnionOf(preds)("a"), true);
    assertEquals(is.UnionOf(preds)(true), true);
  });
  await t.step("returns false on non of T", async (t) => {
    const preds = [is.Number, is.String, is.Boolean] as const;
    await testWithExamples(t, is.UnionOf(preds), {
      excludeExamples: ["number", "string", "boolean"],
    });
  });
});

Deno.test("is.IntersectionOf<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(
      t,
      is.IntersectionOf([
        is.ObjectOf({ a: is.Number }),
        is.ObjectOf({ b: is.String }),
      ]).name,
      "Should return `is.ObjectOf`, if all predicates that",
    );
    await assertSnapshot(
      t,
      is.IntersectionOf([
        is.String,
      ]).name,
      "Should return as is, if there is only one predicate",
    );
    await assertSnapshot(
      t,
      is.IntersectionOf([
        is.Function,
        is.ObjectOf({ b: is.String }),
      ]).name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const objPreds = [
      is.ObjectOf({ a: is.Number }),
      is.ObjectOf({ b: is.String }),
    ] as const;
    const funcPreds = [
      is.Function,
      is.ObjectOf({ b: is.String }),
    ] as const;
    const a: unknown = { a: 0, b: "a" };
    if (is.IntersectionOf(objPreds)(a)) {
      assertType<Equal<typeof a, { a: number } & { b: string }>>(true);
    }
    if (is.IntersectionOf([is.String])(a)) {
      assertType<Equal<typeof a, string>>(true);
    }
    if (is.IntersectionOf(funcPreds)(a)) {
      assertType<
        Equal<
          typeof a,
          & ((...args: unknown[]) => unknown)
          & { b: string }
        >
      >(true);
    }
  });
  await t.step("returns true on all of T", () => {
    const objPreds = [
      is.ObjectOf({ a: is.Number }),
      is.ObjectOf({ b: is.String }),
    ] as const;
    const funcPreds = [
      is.Function,
      is.ObjectOf({ b: is.String }),
    ] as const;
    const f = Object.assign(() => void 0, { b: "a" });
    assertEquals(is.IntersectionOf(objPreds)({ a: 0, b: "a" }), true);
    assertEquals(is.IntersectionOf([is.String])("a"), true);
    assertEquals(is.IntersectionOf(funcPreds)(f), true);
  });
  await t.step("returns false on non of T", async (t) => {
    const preds = [
      is.ObjectOf({ a: is.Number }),
      is.ObjectOf({ b: is.String }),
    ] as const;
    assertEquals(
      is.IntersectionOf(preds)({ a: 0, b: 0 }),
      false,
      "Some properties has wrong type",
    );
    assertEquals(
      is.IntersectionOf(preds)({ a: 0 }),
      false,
      "Some properties does not exists",
    );
    await testWithExamples(t, is.IntersectionOf(preds), {
      excludeExamples: ["record"],
    });
  });
  await t.step("returns false on non of T with any predicates", async (t) => {
    const preds = [
      is.Function,
      is.ObjectOf({ b: is.String }),
    ] as const;
    assertEquals(
      is.IntersectionOf(preds)({ b: "a" }),
      false,
      "Not a function object",
    );
    assertEquals(
      is.IntersectionOf(preds)(() => void 0),
      false,
      "Some properties does not exists in Function object",
    );
    await testWithExamples(t, is.IntersectionOf(preds), {
      excludeExamples: ["record"],
    });
  });
});

Deno.test("is.RequiredOf<T>", async (t) => {
  const pred = is.ObjectOf({
    a: is.Number,
    b: is.UnionOf([is.String, is.Undefined]),
    c: is.OptionalOf(is.Boolean),
  });
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.RequiredOf(pred).name);
    // Nestable (no effect)
    await assertSnapshot(t, is.RequiredOf(is.RequiredOf(pred)).name);
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = { a: 0, b: "a", c: true };
    if (is.RequiredOf(pred)(a)) {
      assertType<
        Equal<typeof a, { a: number; b: string | undefined; c: boolean }>
      >(true);
    }
  });
  await t.step("returns true on Required<T> object", () => {
    assertEquals(
      is.RequiredOf(pred)({ a: undefined, b: undefined, c: undefined }),
      false,
      "Object does not have required properties",
    );
    assertEquals(
      is.RequiredOf(pred)({}),
      false,
      "Object does not have required properties",
    );
  });
  await t.step("returns false on non Required<T> object", () => {
    assertEquals(is.RequiredOf(pred)("a"), false, "Value is not an object");
    assertEquals(
      is.RequiredOf(pred)({ a: 0, b: "a", c: "" }),
      false,
      "Object have a different type property",
    );
  });
});

Deno.test("is.PartialOf<T>", async (t) => {
  const pred = is.ObjectOf({
    a: is.Number,
    b: is.UnionOf([is.String, is.Undefined]),
    c: is.OptionalOf(is.Boolean),
  });
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.PartialOf(pred).name);
    // Nestable (no effect)
    await assertSnapshot(t, is.PartialOf(is.PartialOf(pred)).name);
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = { a: 0, b: "a", c: true };
    if (is.PartialOf(pred)(a)) {
      assertType<
        Equal<typeof a, Partial<{ a: number; b: string; c: boolean }>>
      >(true);
    }
  });
  await t.step("returns true on Partial<T> object", () => {
    assertEquals(
      is.PartialOf(pred)({ a: undefined, b: undefined, c: undefined }),
      true,
    );
    assertEquals(is.PartialOf(pred)({}), true);
  });
  await t.step("returns false on non Partial<T> object", () => {
    assertEquals(is.PartialOf(pred)("a"), false, "Value is not an object");
    assertEquals(
      is.PartialOf(pred)({ a: 0, b: "a", c: "" }),
      false,
      "Object have a different type property",
    );
  });
});

Deno.test("is.PickOf<T, K>", async (t) => {
  const pred = is.ObjectOf({
    a: is.Number,
    b: is.String,
    c: is.Boolean,
  });
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.PickOf(pred, ["a", "c"]).name);
    // Nestable
    await assertSnapshot(t, is.PickOf(is.PickOf(pred, ["a", "c"]), ["a"]).name);
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = { a: 0, b: "a", c: true };
    if (is.PickOf(pred, ["a", "c"])(a)) {
      assertType<
        Equal<typeof a, { a: number; c: boolean }>
      >(true);
    }
    if (is.PickOf(is.PickOf(pred, ["a", "c"]), ["a"])(a)) {
      assertType<
        Equal<typeof a, { a: number }>
      >(true);
    }
  });
  await t.step("returns true on Pick<T, K> object", () => {
    assertEquals(
      is.PickOf(pred, ["a", "c"])({ a: 0, b: undefined, c: true }),
      true,
    );
    assertEquals(is.PickOf(pred, ["a"])({ a: 0 }), true);
  });
  await t.step("returns false on non Pick<T, K> object", () => {
    assertEquals(
      is.PickOf(pred, ["a", "c"])("a"),
      false,
      "Value is not an object",
    );
    assertEquals(
      is.PickOf(pred, ["a", "c"])({ a: 0, b: "a", c: "" }),
      false,
      "Object have a different type property",
    );
  });
});

Deno.test("is.OmitOf<T, K>", async (t) => {
  const pred = is.ObjectOf({
    a: is.Number,
    b: is.String,
    c: is.Boolean,
  });
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, is.OmitOf(pred, ["b"]).name);
    // Nestable
    await assertSnapshot(t, is.OmitOf(is.OmitOf(pred, ["b"]), ["c"]).name);
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = { a: 0, b: "a", c: true };
    if (is.OmitOf(pred, ["b"])(a)) {
      assertType<
        Equal<typeof a, { a: number; c: boolean }>
      >(true);
    }
    if (is.OmitOf(is.OmitOf(pred, ["b"]), ["c"])(a)) {
      assertType<
        Equal<typeof a, { a: number }>
      >(true);
    }
  });
  await t.step("returns true on Omit<T, K> object", () => {
    assertEquals(
      is.OmitOf(pred, ["b"])({ a: 0, b: undefined, c: true }),
      true,
    );
    assertEquals(is.OmitOf(pred, ["b", "c"])({ a: 0 }), true);
  });
  await t.step("returns false on non Omit<T, K> object", () => {
    assertEquals(
      is.OmitOf(pred, ["b"])("a"),
      false,
      "Value is not an object",
    );
    assertEquals(
      is.OmitOf(pred, ["b"])({ a: 0, b: "a", c: "" }),
      false,
      "Object have a different type property",
    );
  });
});
