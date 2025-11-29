# Table Tests

## Overview

Vitestを使用したtable test（パラメータライズドテスト）の型安全な書き方について説明します。

## Basic Patterns

### Table Test with `it.each()`

**When to use**: 同じテストロジックを複数のインプットで実行する場合

**Example**:

```typescript
describe("add function", () => {
  const testCases: Array<{name: string; a: number; b: number; expected: number}> = [
    {
      name: "should return the sum of two positive numbers",
      a: 2,
      b: 3,
      expected: 5,
    },
    {
      name: "should return the sum when one number is zero",
      a: 7,
      b: 0,
      expected: 7,
    },
    {
      name: "should return the sum of two negative numbers",
      a: -2,
      b: -3,
      expected: -5,
    },
    {
      name: "should return the sum of a positive and a negative number",
      a: 5,
      b: -2,
      expected: 3,
    },
  ];

  it.each(testCases)(
    "$name",
    ({ a, b, expected }) => {
      const result = add(a, b);
      expect(result).toBe(expected);
    }
  );
});
```

**Notes**:

- `$name` はテストケースの `name` プロパティを参照します
- テスト関数の引数は分割代入で各プロパティにアクセスできます

## Common Issues & Solutions

### Type Inference with `satisfies`

**Problem**: `satisfies` を使うと、型チェックは行われるものの、テスト側で引数として受け取るときの型が正しく推論されません

**Anti-pattern to avoid**:

```typescript
const testCases = [
  { name: "test 1", a: 1, b: 2, expected: 3 },
  { name: "test 2", a: 4, b: 5, expected: 9 },
] satisfies Array<{name: string; a: number; b: number; expected: number}>;

it.each(testCases)(
  "$name",
  ({ a, b, expected }) => {
    // a, b, expected の型が意図しないUNION型になる可能性がある
  }
);
```

**Solution**: `Array<T>` で明示的に型を指定する

```typescript
const testCases: Array<{name: string; a: number; b: number; expected: number}> = [
  {
    name: "should return the sum of two positive numbers",
    a: 2,
    b: 3,
    expected: 5,
  },
];

it.each(testCases)(
  "$name",
  ({ a, b, expected }) => {
    // a: number, b: number, expected: number として正しく推論される
  }
);
```

## Performance Optimization

- table testは大量のケースがある場合でも効率的です
- 各ケースは独立して実行されるため、並列実行の恩恵を受けられます
- `describe.concurrent()` や `it.concurrent()` と組み合わせることで、さらに高速化できます

## Type Usage

### Type-Safe Test Cases

table testで型安全性を確保するには:

1. **明示的な型定義**: `Array<{...}>` を使用
2. **一貫したプロパティ**: すべてのテストケースで同じプロパティを定義
3. **型の再利用**: 複雑な場合は型エイリアスを定義

```typescript
type AddTestCase = {
  name: string;
  a: number;
  b: number;
  expected: number;
};

const testCases: Array<AddTestCase> = [
  // ...
];
```

## References

- Official docs: <https://vitest.dev/api/#test-each>
- Related patterns: <https://vitest.dev/guide/features.html#parameterized-tests>
