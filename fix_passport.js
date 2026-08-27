const fs = require("fs");
const path = require("path");

const file = path.join(
  process.cwd(),
  "app",
  "passport",
  "page.js"
);

if (!fs.existsSync(file)) {
  console.log(
    "ERROR: app/passport/page.js nahi mili"
  );
  process.exit(1);
}

let code = fs.readFileSync(
  file,
  "utf8"
);

/*
  Generator ki wajah se:
  \`  ko `
  aur
  \${ ko ${
  banana hai.
*/

code = code.replace(
  /\\`/g,
  "`"
);

code = code.replace(
  /\\\$\{/g,
  "${"
);

fs.writeFileSync(
  file,
  code,
  "utf8"
);

console.log("");
console.log("============================");
console.log("PASSPORT FILE FIXED");
console.log("============================");
console.log("");
console.log(
  "Ab command chalao: npm run build"
);