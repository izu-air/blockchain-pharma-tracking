const fs = require("fs");
const path = require("path");
const solc = require("solc");

const source = fs.readFileSync(path.join(__dirname, "..", "contracts", "SupplyChain.sol"), "utf8");

const input = {
  language: "Solidity",
  sources: {
    "SupplyChain.sol": { content: source }
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode"]
      }
    }
  }
};

function findImports(importPath) {
  const fullPath = path.join(__dirname, "..", "node_modules", importPath);
  if (!fs.existsSync(fullPath)) {
    return { error: `File not found: ${importPath}` };
  }
  return { contents: fs.readFileSync(fullPath, "utf8") };
}

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (output.errors || []).filter((error) => error.severity === "error");

if (errors.length > 0) {
  console.error(errors.map((error) => error.formattedMessage).join("\n"));
  process.exit(1);
}

console.log(`SupplyChain.sol compiled with solc ${solc.version()}`);
