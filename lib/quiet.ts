const emit = process.emitWarning.bind(process);
process.emitWarning = ((warning: unknown, ...args: unknown[]) => {
  const msg = typeof warning === "string" ? warning : (warning as { message?: string })?.message ?? "";
  const type = typeof args[0] === "string" ? args[0] : (warning as { name?: string })?.name;
  if (String(type).includes("Experimental") && String(msg).includes("SQLite")) return;
  return (emit as (...a: unknown[]) => void)(warning, ...args);
}) as typeof process.emitWarning;
