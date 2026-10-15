import { describe, expect, test } from "vitest";
import { normalizeNullableUnions } from "$/client-generator/generators/normalize-nullable-unions";

const NULL = { type: "null" };

describe("normalizeNullableUnions", () => {
	test("merges a single inline schema with null into a nullable schema", () => {
		const property = {
			anyOf: [{ type: "string", minLength: 1, maxLength: 100 }, NULL],
			title: "Title"
		};

		expect(normalizeNullableUnions(property)).toEqual({
			type: "string",
			minLength: 1,
			maxLength: 100,
			nullable: true,
			title: "Title"
		});
	});

	test("handles oneOf the same way", () => {
		expect(normalizeNullableUnions({ oneOf: [NULL, { type: "integer", minimum: 0 }] })).toEqual({
			type: "integer",
			minimum: 0,
			nullable: true
		});
	});

	test("keeps the outer keywords when they collide with the member's", () => {
		const property = {
			anyOf: [{ type: "string", description: "inner" }, NULL],
			description: "outer"
		};

		expect(normalizeNullableUnions(property)).toMatchObject({
			description: "outer",
			nullable: true
		});
	});

	test("normalizes nested schemas (properties, items, components)", () => {
		const document = {
			components: {
				schemas: {
					Update: {
						type: "object",
						properties: {
							tags: {
								anyOf: [
									{
										type: "array",
										minItems: 1,
										items: { anyOf: [{ type: "string", maxLength: 5 }, NULL] }
									},
									NULL
								]
							}
						}
					}
				}
			}
		};

		expect(normalizeNullableUnions(document).components.schemas.Update.properties.tags).toEqual({
			type: "array",
			minItems: 1,
			items: { type: "string", maxLength: 5, nullable: true },
			nullable: true
		});
	});

	test.each([
		["a $ref member", { anyOf: [{ $ref: "#/components/schemas/Other" }, NULL] }],
		["several non-null members", { anyOf: [{ type: "string" }, { type: "integer" }, NULL] }],
		["no null member", { anyOf: [{ type: "string" }, { type: "integer" }] }],
		["only null", { anyOf: [NULL] }]
	])("leaves unions with %s untouched", (_, schema) => {
		const original = structuredClone(schema);

		expect(normalizeNullableUnions(schema)).toEqual(original);
	});
});
