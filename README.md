# TypeScript Client Generator CLI

A powerful command-line tool for generating TypeScript API clients and Zod schemas directly from your OpenAPI specifications. This CLI leverages the OpenApiTools engine to create robust clients in both object-oriented (OOP) and functional styles, and it also produces Zod schemas for runtime type validation using [ts-to-zod](https://github.com/fabien0102/ts-to-zod) (credit to Fabien0102).

## Features

- **Generate TypeScript Clients:**  
  Automatically create clients that match your OpenAPI specs in two modes:

  - **OOP Mode (default):** Generates object-oriented clients.
  - **Functional Mode:** Generates functional clients using customizable templates from `/public/templates`.

- **Zod Schema Generation:**  
  In addition to client generation, this CLI also creates Zod schemas from your API types for runtime type validation. This feature uses the [ts-to-zod](https://github.com/fabien0102/ts-to-zod) library (credit to Fabien0102).

- **HTTP Client Options:**  
  Choose between:

  - `fetch` (default)
  - `axios` (with configurable axios version)

- **Endpoint Customization:**  
  Remove prefixes from endpoints and apply regex-based replacements to clean up your API paths.

- **Operation ID Customization:**  
  Modify and format operation IDs based on your requirements using customizable formatters.

- **Flexible Configuration:**  
  Set output directories, skip spec validations, and more with simple CLI options.

## Prerequisites

- **Java:**  
  OpenApiTools requires Java. Ensure you have it installed. [Download Java](https://www.oracle.com/java/technologies/downloads/)

- **Node.js & PNPM:**  
  Make sure Node.js is installed. We recommend using [pnpm](https://pnpm.io/) as your package manager.

## Installation

Install the CLI via pnpm:

```bash
pnpm i @fohoov/ts-client-generator
```

Or run it without installing using:

```bash
pnpm dlx @fohoov/ts-client-generator --help
```

## Usage

To generate a client and corresponding Zod schemas, you must provide the URL of your OpenAPI JSON spec along with optional configuration options.

### Basic Command

```bash
pnpm exec client-generator --uri <your-openapi-spec-url>
```

By default, this command will generate an OOP client using the `fetch` library, create corresponding Zod schemas, and output the generated files to `src/generated-clients`.

## CLI Options

Here’s a breakdown of the available options:

- **`--uri <uri>`**  
  The URL to the OpenAPI JSON specification.  
  _Required._ You can also set this via the `OPENAPI_URL` environment variable.

- **`--mode <string>`**  
  Choose the client generation mode:

  - `oop` (default) – Generates an object-oriented client.
  - `functional` – Generates a functional client using templates from `/public/templates`.
    > if mode is set to functional the `/[generated-path]/base.ts` file exports a functional called `updateGlobalConfiguration` to set your configurations globally

- **`--client <string>`**  
  Select the HTTP client library:

  - `fetch` (default)
  - `axios`

- **`--axios-version <string>`**  
  Specify the axios version to use (applicable only if `--client` is set to axios).  
  _Default:_ `"1.7.0"`

- **`--out <string>`**  
  The output directory for the generated client and schema files.  
  _Default:_ `"src/generated-clients"`

- **`--remove-endpoint-prefix <string>`**  
  Remove a specified prefix from endpoints (e.g., convert `/x/path` to `/path`).

- **`--replace-endpoint-regex <pair...>`**  
  Apply a regex replacement on endpoints before prefix removal.  
  _Example:_ `--replace-endpoint-regex /api/,/account-report-service/`

- **`--skip-spec-validations <boolean>`**  
  Skip OpenAPI specification validations. Refer to [OpenAPI Generator Configuration](https://openapi-generator.tech/docs/configuration/) for details on `skip-validate-spec`.

- **`--customize-operation-id <boolean>`**  
  Customize operation IDs using specific formatters. For instance, for a POST endpoint like `/api/Account/inquiry-account-balance/{account}`, you can use a formatter (e.g., `m_ls_m:camelcase`) to generate a new operation ID (like `postInquiryAccountBalancePost`).  
  _Note:_ Existing operation IDs are ignored unless you also use `--overwrite-existing-operation-ids`.  
  _Current available formatters:_ `${JSON.stringify(CUSTOM_OPERATION_COMMANDS)}`

- **`--overwrite-existing-operation-ids`**  
  Use in combination with `--customize-operation-id` to overwrite any existing operation IDs.

> **Additional Note:**  
> These options might be outdated, to see current available options and their defaults use `--help`

## Examples

### 1. Generate an OOP Client with Fetch and Zod Schemas

```bash
pnpm exec client-generator --uri "https://api.example.com/openapi.json" --mode oop --client fetch --out "./generated-client"
```

### 2. Generate a Functional Client with Axios, Custom Operation IDs, and Zod Schemas

```bash
pnpm exec client-generator --uri "https://api.example.com/openapi.json" --mode functional --customize-operation-id true --overwrite-existing-operation-ids --client axios --axios-version "1.7.0"
```

### 3. Remove an Endpoint Prefix and Apply Regex Replacement

```bash
pnpm exec client-generator --uri "https://api.example.com/openapi.json" --remove-endpoint-prefix "/v1" --replace-endpoint-regex "/api/,/account-report-service/"
```

## Contributing

Contributions are very welcome! If you have suggestions, issues, or improvements, please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
