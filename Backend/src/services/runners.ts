import { ExecutionContract, Language } from "../types";
import { parseArguments } from "./contracts";
export function runtimeProgram(
  language: Language,
  code: string,
  input: string,
  contract: ExecutionContract,
): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(contract.functionName))
    throw new Error("Invalid function name");
  const args = JSON.stringify(parseArguments(input, contract));
  if (language === Language.PYTHON)
    return `import json, sys, typing
from typing import *
try:
    compiled = compile(${JSON.stringify(code)}, '<solution>', 'exec')
except SyntaxError:
    sys.exit(42)
namespace = {}
exec(compiled, namespace)
fn = getattr(namespace['Solution'](), ${JSON.stringify(contract.functionName)})
result = fn(*json.loads(${JSON.stringify(args)}))
sys.stdout.write(json.dumps(result, ensure_ascii=False, separators=(',', ':')))
`;
  return `const fs = require('node:fs');
process.stdout.write = (chunk, encoding, callback) => {
  const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), typeof encoding === 'string' ? encoding : 'utf8');
  let offset = 0;
  while (offset < buffer.length) {
    try {
      offset += fs.writeSync(1, buffer, offset);
    } catch (error) {
      if (error && (error.code === 'EAGAIN' || error.code === 'EWOULDBLOCK')) continue;
      if (error && error.code === 'EPIPE') process.exit(0);
      throw error;
    }
  }
  if (typeof encoding === 'function') encoding();
  else if (typeof callback === 'function') callback();
  return true;
};
const vm = require('node:vm');
let script;
try { script = new vm.Script(${JSON.stringify(code + "\n;globalThis.__nx_fn = " + contract.functionName + ";")}); } catch (e) { process.exit(42); }
// vm is a function-contract adapter only; the container provides isolation.
script.runInThisContext();
Promise.resolve(globalThis.__nx_fn(...JSON.parse(${JSON.stringify(args)}))).then(value => process.stdout.write(JSON.stringify(value === undefined ? null : value))).catch(() => process.exit(1));
`;
}
