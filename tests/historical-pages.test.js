import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["index.html", "pepperoni.html", "margherita.html", "artichoke.html", "meat-lovers.html", "vegetarian.html", "build-your-own.html", "cart.html", "checkout.html", "account.html", "confirmation.html"];

test("historical multi-page structure is present", async () => {
  await Promise.all(pages.map((page) => access(resolve(root, page))));
  assert.equal(pages.filter((page) => page.endsWith(".html")).length, 11);
});

test("home preserves the archived video and animated logo", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  assert.match(html, /ufp-home-video\.mp4/);
  assert.match(html, /urban-fire-pizza-logo\.gif/);
  await access(resolve(root, "Urban Fire Pizza_files", "ufp-home-video.mp4"));
  await access(resolve(root, "Urban Fire Pizza_files", "urban-fire-pizza-logo.gif"));
});

test("every pizza page preserves the historical option interface", async () => {
  for (const page of pages.slice(1, 7)) {
    const html = await readFile(resolve(root, page), "utf8");
    assert.equal((html.match(/type="radio"/g) || []).length, 17, page);
    assert.equal((html.match(/type="checkbox"/g) || []).length, 14, page);
    assert.match(html, /id="input-quantity"/, page);
    assert.match(html, /id="button-cart"/, page);
    assert.match(html, /Available Options/, page);
  }
});

test("public files contain no captured payment metadata or live site endpoint", async () => {
  const candidates = [...pages, "static-demo.js", "static-demo.css"];
  const combined = (await Promise.all(candidates.map((file) => readFile(resolve(root, file), "utf8")))).join("\n");
  assert.doesNotMatch(combined, /facilitatorAccessToken|client-id=|urbanfirepizza\.one|paypal\.com|fetch\(|XMLHttpRequest/i);
});
