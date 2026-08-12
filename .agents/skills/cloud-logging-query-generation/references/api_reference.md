# LQL syntax reference and guidelines

## Table of contents

- [Boolean operators](#boolean-operators) (L15-L20)
- [Comparison operators and matching patterns](#comparison-operators-and-matching-patterns) (L22-L30)
- [Null values and missing fields](#null-values-and-missing-fields) (L32-L41)
- [Escaping, quotes and case sensitivity](#escaping-quotes-and-case-sensitivity) (L43-L51)
- [Built-in SEARCH function](#built-in-search-function) (L53-L83)
- [Regular expressions](#regular-expressions) (L85-L93)
- [Timestamps and ranges](#timestamps-and-ranges) (L95-L98)
- [Additional built-in functions](#additional-built-in-functions) (L100-L117)
- [Comments](#comments) (L119-L122)

## Boolean operators

- **Implicit comparisons and minus sign:** `AND` can be omitted between
  space-separated expressions. `NOT` can be replaced with `-`.
  - _Example:_ `a="b" AND c="d" AND NOT e="f"` is identical to `a="b" c="d"
-e="f"`.

## Comparison operators and matching patterns

- **Syntax Structure:** `[FIELD_NAME] [OP] [VALUE]`
- **Operators Supported:** `=` (equal), `!=` (not equal), `>`, `<`, `>=`, `<=`
  (numeric ordering), `:` (substring search), `=~` (regex match), `!~` (regex
  non-match).
- **Parenthesized Values:** An operator can be applied to a list of values.
  - _Example:_ `jsonPayload.cat = ("longhair" OR "shorthair")`
  - _Example:_ `jsonPayload.animal : ("nice" AND "pet")`

## Null values and missing fields

- **JSON Null Handling:** Filter for explicit null values using `NULL_VALUE`.
  - _Example:_ `jsonPayload.field = NULL_VALUE`
- **Missing Fields:** If a field is entirely absent from a log entry,
  comparisons return false for equality operations but true for negations.
  - _Example:_ `NOT missingField="some value"` returns `TRUE`.
  - _Example:_ `missingField!="some value"` returns `FALSE`.
- **Field-Exists Check:** Use the `:*` wildcard to verify a field exists.
  - _Example:_ `operation.id:*`

## Escaping, quotes and case sensitivity

- Field paths mapping keys to struct/map fields (like `jsonPayload` and
  `labels`) are **case-sensitive** (for example, `jsonPayload.endTime` vs
  `jsonPayload.end_time`).
- If a field path contains special characters (like slashes or periods), it
  must be inside double quotes: `labels."compute.googleapis.com/resource_id"`.
- Embedded double quotes must be backslash-escaped: `jsonPayload.message =~
"location=\"europe-west.*\""`.

## Built-in SEARCH function

- **Argument Restriction:** The query argument must be a **single string
  literal**.
- **No Boolean Expressions in Arguments:** Do NOT pass boolean expressions
  (using `OR`, `AND`, `NOT` as operators) directly as arguments to the
  `SEARCH` function.
  - _Example:_ `SEARCH("OOM") OR SEARCH("Out of memory")`
  - _Example:_ ``SEARCH("OOM OR `Out of memory`")`` (evaluates "OR" as part
    of the search string, not as a boolean condition)
- Case-insensitive substring search that splits strings into tokens.

  - _Example (Global search):_ Matches log entries containing both tokens
    anywhere.

    ```
    SEARCH("hello world")
    ```

  - _Example (Targeted search):_ Matches log entries containing both tokens
    within `textPayload` field only.

    ```
    SEARCH(textPayload, "hello world")
    ```

  - _Example (Exact phrase):_ Enforces token order and adjacency.

    ```
    SEARCH("`exact phrase match`")
    ```

## Regular expressions

- Regular expressions use RE2 syntax, are case sensitive, and are unanchored.
  - _Example (Anchored matching):_ `logName =~ "^foo"` or `logName =~
"foo$"`
  - _Example (OR condition inside regex):_ `labels.pod_name =~ "(foo|bar)"`
  - _Example (Combined OR on the right side):_ `labels.env =~
("^prod.*server" OR "^staging.*server")`
  - _Example (Case-insensitive flag):_ `labels.subnetwork_name =~ "(?i)foo"`

## Timestamps and ranges

- Strict RFC 3339 bounds: `timestamp >= "2023-11-29T23:00:00Z"`
- Date shortcuts: `timestamp > "2023-11-29"`

## Additional built-in functions

- **`log_id`**: Matches non-URL-encoded log IDs.
  - _Example:_ `log_id("cloudaudit.googleapis.com/activity")`
- **`source`**: Matches logs derived from a specific level of the Google Cloud
  resource hierarchy.
  - _Example:_ `source(folders/folder_123)`
- **`sample`**: Selects a fraction of total log entries using deterministic
  hashing.
  - _Example:_ `sample(insertId, 0.01)`
- **`cast`**: Converts a field into another data type.
  - _Example:_ `cast(timestamp, STRING, TIME_ZONE("America/New_York")) =~
"^2025-04-02.*"`
- **`regexp_extract`**: Extracts part of a field using an RE2 capture group.
  - _Example:_ `CAST(REGEXP_EXTRACT(CAST(timestamp, STRING),
"\\d+:\\d+:(\\d+)"), INT64) < 30`
- **`ip_in_net`**: Determines if an IP address belongs to a subnet block.
  - _Example:_ `ip_in_net(jsonPayload.realClientIP, "10.1.2.0/24")`

## Comments

- Prepend double dashes `--` to add single-line annotations.
  - _Example:_ `-- Looking for logs from "alex"`
