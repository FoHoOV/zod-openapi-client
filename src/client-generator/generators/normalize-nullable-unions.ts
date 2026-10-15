type JsonObject = Record<string, unknown>;

const UNION_KEYWORDS = ["anyOf", "oneOf"] as const;

function isObject(value: unknown): value is JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullSchema(schema: unknown) {
	return isObject(schema) && schema.type === "null" && Object.keys(schema).length === 1;
}

function normalizeNode(node: JsonObject) {
	for (const keyword of UNION_KEYWORDS) {
		const members = node[keyword];
		if (!Array.isArray(members) || !members.some(isNullSchema)) {
			continue;
		}

		const nonNullMembers = members.filter((member) => !isNullSchema(member));
		const [onlyMember] = nonNullMembers;
		if (nonNullMembers.length !== 1 || !isObject(onlyMember) || "$ref" in onlyMember) {
			continue;
		}

		// openapi-zod-client drops validations (minLength, maximum, ...) on union members,
		// so `X | null` is rewritten to the OpenAPI 3.0 form `{ ...X, nullable: true }`.
		delete node[keyword];
		Object.assign(node, { ...onlyMember, ...node, nullable: true });
	}
}

/**
 * Rewrites every `anyOf`/`oneOf` made of exactly one inline schema plus `{ type: "null" }`
 * (e.g. FastAPI's `str | None`) into that schema with `nullable: true`, in place.
 * Unions with a `$ref` member or several non-null members are left as they are.
 */
export function normalizeNullableUnions<T>(document: T): T {
	const visit = (value: unknown) => {
		if (Array.isArray(value)) {
			value.forEach(visit);
			return;
		}
		if (!isObject(value)) {
			return;
		}
		Object.values(value).forEach(visit);
		normalizeNode(value);
	};

	visit(document);
	return document;
}
