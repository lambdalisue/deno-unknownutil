import { assertEquals } from "@std/assert";
import { assertSnapshot } from "@std/testing/snapshot";
import { assertType } from "@std/testing/types";
import type { Equal } from "./_testutil.ts";
import { is } from "./is.ts";
import { as } from "./as.ts";

Deno.test("as.Optional<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(t, as.Optional(is.Number).name);
    // Nesting does nothing
    await assertSnapshot(
      t,
      as.Optional(as.Optional(is.Number)).name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = undefined;
    if (is.ObjectOf({ foo: as.Optional(is.Number) })(a)) {
      assertType<Equal<typeof a, { foo?: number }>>(true);
    }
    if (is.TupleOf([as.Optional(is.Number)] as const)(a)) {
      assertType<Equal<typeof a, [number | undefined]>>(true);
    }
    if (is.ParametersOf([as.Optional(is.Number)] as const)(a)) {
      assertType<Equal<typeof a, [number?]>>(true);
    }
  });
  await t.step("with is.ObjectOf", () => {
    const pred = is.ObjectOf({ foo: as.Optional(is.String) });
    assertEquals(pred({}), true, "omit");
    assertEquals(pred({ foo: undefined }), true, "undefined");
    assertEquals(pred({ foo: "string" }), true, "valid");
    assertEquals(pred({ foo: 0 }), false, "invalid");
  });
  await t.step("with is.TupleOf", () => {
    const pred = is.TupleOf([as.Optional(is.String)]);
    assertEquals(pred([]), false, "omit");
    assertEquals(pred([undefined]), true, "undefined");
    assertEquals(pred(["string"]), true, "valid");
    assertEquals(pred([0]), false, "invalid");
  });
  await t.step("with is.ParametersOf", () => {
    const pred = is.ParametersOf([as.Optional(is.String)]);
    assertEquals(pred([]), true, "omit");
    assertEquals(pred([undefined]), true, "undefined");
    assertEquals(pred(["string"]), true, "valid");
    assertEquals(pred([0]), false, "invalid");
  });
});

Deno.test("as.Required<T>", async (t) => {
  await t.step("returns properly named function", async (t) => {
    await assertSnapshot(
      t,
      as.Required(as.Optional(is.Number)).name,
    );
    // Non optional does nothing
    await assertSnapshot(t, as.Required(is.Number).name);
    // Nesting does nothing
    await assertSnapshot(
      t,
      as.Required(as.Required(as.Optional(is.Number))).name,
    );
  });
  await t.step("returns proper type predicate", () => {
    const a: unknown = undefined;
    if (is.ObjectOf({ foo: as.Required(as.Optional(is.Number)) })(a)) {
      assertType<Equal<typeof a, { foo: number }>>(true);
    }
    if (is.TupleOf([as.Required(as.Optional(is.Number))] as const)(a)) {
      assertType<Equal<typeof a, [number]>>(true);
    }
    if (is.ParametersOf([as.Required(as.Optional(is.Number))] as const)(a)) {
      assertType<Equal<typeof a, [number]>>(true);
    }
  });
  await t.step("with is.ObjectOf", () => {
    const pred = is.ObjectOf({ foo: as.Required(as.Optional(is.String)) });
    assertEquals(pred({}), false, "omit");
    assertEquals(pred({ foo: undefined }), false, "undefined");
    assertEquals(pred({ foo: "string" }), true, "valid");
    assertEquals(pred({ foo: 0 }), false, "invalid");
  });
  await t.step("with is.TupleOf", () => {
    const pred = is.TupleOf([as.Required(as.Optional(is.String))]);
    assertEquals(pred([]), false, "omit");
    assertEquals(pred([undefined]), false, "undefined");
    assertEquals(pred(["string"]), true, "valid");
    assertEquals(pred([0]), false, "invalid");
  });
  await t.step("with is.ParametersOf", () => {
    const pred = is.ParametersOf([as.Required(as.Optional(is.String))]);
    assertEquals(pred([]), false, "omit");
    assertEquals(pred([undefined]), false, "undefined");
    assertEquals(pred(["string"]), true, "valid");
    assertEquals(pred([0]), false, "invalid");
  });
});
