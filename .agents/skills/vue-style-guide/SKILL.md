---
name: vue-style-guide
description: "Vue を書くときは基本的に参考にしてください。 個人的に気に入っている ubgeeei 氏の Vue.js のスタイルガイドです。"
# thanks to: https://github.com/ubugeeei/style-guide.vue/blob/8a37d151f2c38640c6aa2f51805d8821476c15bd/README.md
---

# ubugeeei/style-guide.vue

One of Vue.js's greatest strengths is that it lets you write code the way _you_ want to. There is no single correct style — and that flexibility is a feature, not a bug.

This guide is purely **[@ubugeeei](https://github.com/ubugeeei)'s personal preference**. It does not represent the consensus of the Vue.js core team or the official recommendation of the project.

Take what resonates, ignore what doesn't.

---

## General

- Use SFC (.vue) + TypeScript
- Use `<script setup lang="ts">` as default
- Extract things unsuitable for setup (e.g. utility functions) into `<script lang="ts">` or a separate `.ts` file
- Do not use auto imports. Always write explicit imports
- Use `import type` as a separate declaration, not inline `import { type T }`. Set `verbatimModuleSyntax: true` in `tsconfig.json`
- Set `noUncheckedIndexedAccess: true` in `tsconfig.json` to make index access return `T | undefined`
- Do not use implicit globals in `<template>` (`$router`, `$t`, etc.). Bind them explicitly from `<script setup>`
- Always explicitly import components in `<script setup>`. Do not rely on global registration
- Do not use custom directives or custom blocks
- Do not use JavaScript classes. Prefer plain objects and functions
- Prefer controlled components. Avoid uncontrolled components that manage their own state internally
- When handling URLs, always read `baseUrl` from configuration. Never hardcode it
- Use pnpm, oxlint, oxfmt, tsdown, and Vitest as the standard toolchain
- Minimize third-party dependencies. Apart from Pinia, Pinia Colada, and Vue Router, implement it yourself whenever possible
- Do not introduce layered architecture until truly necessary. Use msw or similar for API mocking instead of abstracting layers for testability
- Consolidate navigation guards into a single `router.ts` file for a bird's-eye view of routing behavior
- Always validate values from external boundaries (route params, localStorage, API responses, etc.) — especially user-controllable inputs. Never trust them as-is

## SFC Block Order

```vue
<!-- only when needed -->
<script lang="ts"></script>

<script setup lang="ts"></script>

<template></template>

<style scoped></style>

<!-- only when global styles are needed -->
<style></style>
```

## Component Layers

Think in two layers. Atomic Design is overkill.

1. **Primitive** — Generic UI building blocks (`Button`, `Card`, `Dialog`, etc.). No business logic
2. **Feature** — Components that compose primitives and contain business logic

## Colocation

Colocate implementation. Do not create classification directories like `components/` or `composables/`.

Place related files in the same directory.

```
features/
  todo/
    TodoPage.vue
    TodoItem.vue
    useTodo.ts
    todo.ts         # Pure TS logic
    todo.test.ts
```

## State Design

- Use ADTs (Algebraic Data Types) to eliminate impossible state combinations at the type level
- Only define essential state. Derive everything else with `computed`
- Do not use implicit reactivity (`reactive()`). Use `ref()` and `Ref<T>`
- Use `let` for mutable variables that do not need reactivity. Not everything needs to be a `ref` (e.g. `let timerId: ReturnType<typeof setTimeout>`)
- Use nominal typing with `unique symbol` for IDs, timestamps, dimensions, etc. Avoid bare `string` or `number` to prevent mixing up units or identifiers
- Do not use `defineModel`

```ts
declare const UserIdMarker: unique symbol;
type UserId = string & { readonly [UserIdMarker]: never };

declare const PxMarker: unique symbol;
type Px = number & { readonly [PxMarker]: never };
```

```ts
// Bad: impossible combinations can exist
const isLoading = ref(false);
const error = ref<Error | null>(null);
const data = ref<Data | null>(null);

// Good: represent state transitions with ADT
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "ok"; data: Data };

const state = ref<State>({ status: "idle" });

// Good: derive with computed
const isLoading = computed(() => state.value.status === "loading");
```

## Reactivity Layer vs Pure TypeScript

Think in terms of MVVM. Separate logic into two layers:

1. **Pure TypeScript (Model)** — Framework-independent pure functions and type definitions. Easy to test
2. **Reactivity Binding (ViewModel)** — Connects the Model to the View (template) via `ref`, `computed`, `watch`

Push as much logic as possible into the Model layer. The ViewModel should be a thin binding layer, not the home of business logic.

In the Pure TS layer, use arrow functions for a functional style. Use `function` declarations in setup and composables.

Separate type declarations and function signatures from implementation. When beneficial, extract signatures into a `.def.ts` file — this is especially useful for Agentic Coding, where the agent can read the definition file to understand the contract without scanning the full implementation.

```ts
// todo.ts — Pure TS

// --- Types & Signatures ---
export type Todo = { id: string; title: string; done: boolean };
export type toggleTodo = (todo: Todo) => Todo;
export type remaining = (todos: Todo[]) => number;

// --- Implementation ---
export const toggleTodo: toggleTodo = (todo) => ({
  ...todo,
  done: !todo.done,
});

export const remaining: remaining = (todos) => todos.filter((t) => !t.done).length;
```

```ts
// useTodo.ts — Reactivity Binding
import type { Ref } from "vue";
import { ref, computed } from "vue";
import type { Todo } from "./todo";
import { toggleTodo, remaining } from "./todo";

export function useTodo(initial: Todo[]) {
  const todos: Ref<Todo[]> = ref(initial);
  const remainingCount = computed(() => remaining(todos.value));

  function toggle(id: string) {
    todos.value = todos.value.map((t) => (t.id === id ? toggleTodo(t) : t));
  }

  return { todos, remainingCount, toggle };
}
```

## Composable

- Use `function` declarations for top-level functions in setup and composables (not arrow functions)
- Before writing a composable, first define the required states and their transitions at the type level
- Be mindful of Vue lifecycle hooks (`onMounted`, `onUnmounted` for cleanup, etc.)
- Must be Server-Client Universal. Do not access client globals like `window` at the top level
- Avoid `useRouter`, `inject`, or other implicit dependencies inside composables. They force hidden contracts on callers. Instead, accept the essential values and callbacks as arguments. Exception: `provide`/`inject` inside a composable is acceptable when the usage pattern is well-established, the caller should not need to be aware of it, and it simplifies the API

```ts
// Bad: hidden dependency on router
function useTodoNav() {
  const router = useRouter();
  const id = computed(() => router.currentRoute.value.params.id as string);
  function goToDetail(id: string) {
    router.push(`/todo/${id}`);
  }
  return { id, goToDetail };
}

// Good: explicit inputs, no implicit context
function useTodoNav(currentId: Readonly<Ref<string>>, onSelectTodo: (id: string) => void) {
  // ...
}
```

- Do not blindly destructure when calling `use*`. Preserve cohesion

```ts
// Bad: cohesion is lost
const { data, error, isLoading, refetch, abort } = useFetch("/api/todos");

// Good: concerns stay grouped
const todosQuery = useFetch("/api/todos");
todosQuery.data; // reference is also clear
```

> **Trade-off:** Keeping the object intact means `.value` is required in `<template>` bindings (e.g. `todosQuery.data.value`). This approach pays off when the composable surface is large; for simple cases with few return values, destructuring may be more pragmatic.

## Readonly & Mutation Boundary

- Use `readonly()` to control the public surface of state
- When passing stateful values across functions, default to `readonly`
- Functions that intentionally mutate must have a `Mut` suffix with documented rationale

```ts
import type { Ref } from "vue";
import { readonly } from "vue";

function useCounter() {
  const count = ref(0);

  /** Mut: callers need to reset after form submission */
  function resetMut(c: Ref<number>) {
    c.value = 0;
  }

  return { count: readonly(count), resetMut };
}
```

## Side Effects

- Do not use `watch` / `watchEffect` until truly necessary
- If you need `nextTick`, revisit your design first
- All async operations must handle race conditions. Use `AbortController` to cancel stale requests and guard against stale closures
- Design error handling deliberately and document it. `throw`, `onErrorCaptured`, and error boundaries are hard to reason about — make error flows explicit and traceable
- Avoid direct DOM access via template refs or `document.*`. Raw DOM manipulation introduces scheduler coupling and makes `nextTick` issues harder to reason about
- When using template refs, always define `defineExpose` to make the public interface explicit

## Props, Emits & Slots

Always use type-only declarations for `defineProps`, `defineEmits`, and `defineSlots`. Always use Props Destructure. For `defineEmits`, use the tuple syntax (not the call signature form).

```vue
<script setup lang="ts">
const { title, count = 0 } = defineProps<{
  title: string;
  count?: number;
}>();

const emit = defineEmits<{
  "click:avatar": [];
  "update:nickname": [value: string];
}>();

defineSlots<{
  default: (props: { item: Item }) => unknown;
  header: () => unknown;
}>();
</script>
```

## Events

Scope event handlers with `:` as a namespace separator.

- For native-like interactions (`click`, `update`, etc.), use the event name as the prefix — groups interaction types for easy scanning
- For domain-specific notifications, use the domain as the prefix — makes the subject clear

```vue
<template>
  <UserCard
    @click:avatar="onClickAvatar"
    @click:follow-button="onClickFollowButton"
    @update:nickname="onUpdateNickname"
  />

  <AudioPlayer @audio:play="onAudioPlay" @audio:pause="onAudioPause" @audio:end="onAudioEnd" />
</template>
```

## Provide / Inject & Global Store

Keep to an absolute minimum. If props and emit suffice, use those.

When using Provide/Inject, always use `InjectionKey<T>` with `Symbol` for type safety.

```ts
import type { InjectionKey } from "vue";

export const ThemeKey: InjectionKey<Theme> = Symbol("Theme");
```

When using global state, always document the state lifecycle: transitions and scope of usage.

## Template Optimization

- Do not use `v-memo` or `v-once`. These are likely to become obsolete with future optimizations like Vapor
- Do not use `KeepAlive` until truly necessary. Cache invalidation adds significant complexity
- Leverage `:key` to reset component state instead of manual cleanup logic
- Do not use `shallowRef` or async components (`defineAsyncComponent`) until truly necessary. Premature optimization adds complexity without proven benefit

## CSS

- Do not use CSS pre-processors (SCSS, Sass, etc.)
- Do not use utility classes (Tailwind, etc.)
- Do not use `v-bind` in `<style>`
- Avoid `:style` bindings. Prefer CSS variables and class switching
- Avoid magic values. Use CSS custom properties (`var(--*)`) instead of hardcoded literals
- Prefer semantic selectors (`article`, `nav`, `h2`, `[aria-expanded]`, etc.) over class-heavy markup
- Use CSS Nesting (use Lightning CSS for downcompilation if needed)

```vue
<style scoped>
.card {
  border: 1px solid var(--color-border);

  & .title {
    font-size: 1.25rem;
  }

  &:hover {
    border-color: var(--color-primary);
  }
}
</style>
```

## Testing

- Write unit / integration tests in Vitest for TypeScript logic
- **Do not write component tests**
- Use E2E tests and VRT (Visual Regression Testing) instead
- Testing is easy because logic lives in the Pure TS layer

```ts
// todo.test.ts
import { describe, it, expect } from "vitest";
import { toggleTodo, remaining } from "./todo";

describe("toggleTodo", () => {
  it("toggles done", () => {
    const todo = { id: "1", title: "test", done: false };
    expect(toggleTodo(todo).done).toBe(true);
  });
});
```
