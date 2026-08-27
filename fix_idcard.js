const fs = require("fs");
const path = require("path");

const file = path.join(
  process.cwd(),
  "app",
  "id-card",
  "page.js"
);

if (!fs.existsSync(file)) {
  console.log("ERROR: app/id-card/page.js nahi mili");
  process.exit(1);
}

let code = fs.readFileSync(
  file,
  "utf8"
);

// Remove useSearchParams import
code = code.replace(
  "import { useSearchParams } from 'next/navigation'\n",
  ""
);

// Remove params declaration
code = code.replace(
  `  const params = useSearchParams()

  const cardType =
    params.get('type') === 'pan'
      ? 'PAN'
      : 'Aadhaar'`,
  `  const [cardType, setCardType] =
    useState('Aadhaar')

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      )

    setCardType(
      params.get('type') === 'pan'
        ? 'PAN'
        : 'Aadhaar'
    )
  }, [])`
);

// useEffect import add
code = code.replace(
  "import { useState } from 'react'",
  "import { useEffect, useState } from 'react'"
);

fs.writeFileSync(
  file,
  code,
  "utf8"
);

console.log("");
console.log("ID CARD FIX COMPLETE");
console.log("");
console.log("Ab run karo:");
console.log("npm run build");