import { once } from "node:events";
import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

export const ARTICLE_TITLE = "Fixture Article";
export const ARTICLE_PARAGRAPHS = [
  "The first paragraph explains why sourdough needs a mature starter, fed twice a day for a week before the first bake, so the yeast and bacteria are balanced.",
  "The second paragraph covers hydration. A dough at seventy percent water is easier to shape, while eighty percent gives a more open crumb but spreads on the peel.",
  "The third paragraph is about the bulk ferment, which runs four to six hours at room temperature, with a set of stretch and folds every half hour for the first two hours.",
  "The fourth paragraph describes baking in a preheated dutch oven, lid on for twenty minutes to trap steam, then lid off until the crust is deep brown.",
];
export const NAV_TEXT = "Home Recipes Contact";
export const FOOTER_TEXT = "Copyright Fixture Kitchen";

const article = `<!doctype html>
<html>
  <head><title>${ARTICLE_TITLE}</title></head>
  <body>
    <nav><a href="/">Home</a> <a href="/recipes">Recipes</a> <a href="/contact">Contact</a></nav>
    <article>
      <h1>${ARTICLE_TITLE}</h1>
      ${ARTICLE_PARAGRAPHS.map((paragraph) => `<p>${paragraph}</p>`).join("\n      ")}
    </article>
    <footer>${FOOTER_TEXT}</footer>
  </body>
</html>`;

const routes = new Map<string, (res: ServerResponse) => void>([
  [
    "/article",
    (res) => res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(article),
  ],
  [
    "/redirect-blocked",
    (res) => res.writeHead(302, { location: "http://169.254.169.254/latest/meta-data/" }).end(),
  ],
  [
    "/slow",
    (res) => {
      setTimeout(() => res.writeHead(200, { "content-type": "text/html" }).end(article), 1000);
    },
  ],
  // No content-length: node sends it chunked, so only the streamed byte count can stop it.
  [
    "/large",
    (res) => {
      res.writeHead(200, { "content-type": "text/html" });
      // The fetcher aborts at 5 MB, so later writes can hit a destroyed socket.
      res.on("error", () => {});
      const megabyte = `<p>${"x".repeat(1024 * 1024 - 7)}</p>`;
      for (let i = 0; i < 6; i++) res.write(megabyte);
      res.end();
    },
  ],
  ["/file.pdf", (res) => res.writeHead(200, { "content-type": "application/pdf" }).end("%PDF-1.7")],
  ["/empty", (res) => res.writeHead(200, { "content-type": "text/html" }).end()],
  [
    "/long.txt",
    (res) =>
      res.writeHead(200, { "content-type": "text/plain" }).end("lorem ipsum ".repeat(10_000)),
  ],
  // The 100,000-char cut lands between the two UTF-16 halves of the emoji.
  [
    "/emoji.txt",
    (res) =>
      res
        .writeHead(200, { "content-type": "text/plain" })
        .end(`${"a".repeat(99_999)}\u{1F600} and more text`),
  ],
  ["/redirect-file", (res) => res.writeHead(302, { location: "file:///etc/passwd" }).end()],
  [
    "/windows-1252.txt",
    (res) =>
      res
        .writeHead(200, { "content-type": "text/plain; charset=windows-1252" })
        .end(Buffer.from([0x63, 0x61, 0x66, 0xe9])),
  ],
]);

export async function startFixtureServer() {
  const server = createServer((req, res) => {
    const route = routes.get(req.url ?? "");
    if (route) route(res);
    else res.writeHead(404).end();
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  // SAFETY: a server listening on a TCP port reports an AddressInfo, never a pipe name.
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    async close() {
      server.close();
      // Drops a held /slow response, which would otherwise keep close() waiting.
      server.closeAllConnections();
      await once(server, "close");
    },
  };
}
