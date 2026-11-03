// Production ignores this switch even if the variable is present.
export function crashAfterExecutionEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.FAULT_AFTER_EXECUTION === "crash"
  );
}
