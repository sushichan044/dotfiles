import getStdin from "get-stdin";

type HookPermissionMode = "acceptEdits" | "bypassPermissions" | "default" | "dontAsk" | "plan";

type StopHookInput = {
  cwd: string;
  hook_event_name: "Stop";
  last_assistant_message: string | null;
  model: string;
  permission_mode: HookPermissionMode;
  session_id: string;
  stop_hook_active: boolean;
  transcript_path: string | null;
};

type HookJsonOutputBase = {
  continue?: boolean;
  stopReason?: string | null;
  suppressOutput?: boolean;
  systemMessage?: string | null;
};

type StopHookBlockOutput = HookJsonOutputBase & {
  continue?: true;
  decision: "block";
  reason: string;
};

type StopHookPassOutput = HookJsonOutputBase & {
  continue?: true;
  decision?: undefined;
  reason?: undefined;
};

async function main() {
  const stdin = await getStdin();

  const input = JSON.parse(stdin) as StopHookInput;

  if (input.stop_hook_active) {
    console.log(JSON.stringify({} satisfies StopHookPassOutput));
    return process.exit(0);
  }

  console.log(
    JSON.stringify({
      decision: "block",
      reason: [
        'Before completing the task, execute the "polish" skill to refine the code and ensure the final deliverable is of high quality and meets project standards.',
        'If you receive these instructions again after executing the "polish" skill, you may disregard them.',
      ].join("\n"),
    } satisfies StopHookBlockOutput),
  );
  return process.exit(0);
}

if (import.meta.main) {
  await main();
}
