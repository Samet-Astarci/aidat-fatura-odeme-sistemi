export class Router {
  constructor({ onRoute, notFound }) {
    this.onRoute = onRoute;
    this.notFound = notFound;
    window.addEventListener("hashchange", () => this.resolve());
  }

  parse() {
    const hash = location.hash.replace(/^#/, "") || "/login";
    const [path, qs] = hash.split("?");
    const params = new URLSearchParams(qs || "");
    const parts = path.split("/").filter(Boolean);
    return { hash, path, parts, params };
  }

  go(path) {
    if (!path.startsWith("#")) location.hash = "#" + path;
    else location.hash = path;
  }

  resolve() {
    const ctx = this.parse();
    if (this.onRoute) this.onRoute(ctx);
  }
}
