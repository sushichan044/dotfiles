type ExtractPromptParams<
  T extends string,
  Acc extends string[] = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
> = T extends `${infer _Start}$\{${infer Param}\}${infer Rest}`
  ? ExtractPromptParams<Rest, [...Acc, Param]>
  : Acc;

type PromptRenderer<T extends string> = (
  params: Record<ExtractPromptParams<T>[number], string>,
) => string;

export function preparePrompt<const T extends string>(prompt: T): PromptRenderer<T> {
  return (params) => {
    let rendered: string = prompt;
    for (const key in params) {
      const value = params[key as keyof typeof params];
      rendered = rendered.replaceAll(`\${${key}}`, value);
    }
    return rendered;
  };
}
