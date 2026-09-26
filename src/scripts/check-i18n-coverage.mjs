#!/usr/bin/env node
// Fails (non-zero exit) if any locale is missing keys the others have, or has
// extra keys the others don't — run this after adding new UI text to catch
// translation gaps automatically instead of relying on manual review.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, "..", "src", "locales");

const files = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith(".json"));
const keysByLocale = {};

for (const file of files) {
    const lang = file.replace(".json", "");
    const data = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), "utf8"));
    keysByLocale[lang] = new Set(Object.keys(data));
}

const allKeys = new Set();
Object.values(keysByLocale).forEach((set) => set.forEach((k) => allKeys.add(k)));

let hasGap = false;
for (const [lang, keys] of Object.entries(keysByLocale)) {
    const missing = [...allKeys].filter((k) => !keys.has(k));
    if (missing.length > 0) {
        hasGap = true;
        console.error(`❌ ${lang}.json is missing ${missing.length} key(s):`);
        missing.forEach((k) => console.error(`   - ${k}`));
    }
}

if (hasGap) {
    process.exit(1);
} else {
    console.log(`✅ All ${files.length} locales have the same ${allKeys.size} keys.`);
}