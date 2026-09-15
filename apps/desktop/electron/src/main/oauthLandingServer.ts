import http from "node:http";
import { bootLog, bootWarn } from "./bootstrapLog.js";

/** Fixed loopback port — must match Supabase Redirect URL allow-list. */
export const OAUTH_LANDING_PORT = 47821;

export const OAUTH_LANDING_PATH = "/auth/desktop-complete";

export function getOAuthLandingRedirectUrl(port = OAUTH_LANDING_PORT) {
  return `http://127.0.0.1:${port}${OAUTH_LANDING_PATH}`;
}

/**
 * Static success page for the system browser after Google OAuth.
 * - Never renders code/token in the DOM
 * - Clears query from the address bar via history.replaceState
 * - Hands off to cosmobusiness://auth/callback (deep link unchanged)
 */
function buildLandingHtml() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Login concluído — Cosmo Business</title>
  <style>
    :root { color-scheme: light; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: "Segoe UI", system-ui, sans-serif;
      background: linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0ea5e9 140%);
      color: #0f172a;
    }
    .card {
      width: min(420px, 92vw); background: #fff; border-radius: 20px;
      padding: 28px 24px; box-shadow: 0 24px 60px rgba(2, 6, 23, 0.35);
      text-align: center;
    }
    .mark {
      width: 48px; height: 48px; margin: 0 auto 14px; border-radius: 14px;
      display: grid; place-items: center; color: #fff; font-weight: 800; font-size: 22px;
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
    }
    h1 { margin: 0 0 8px; font-size: 1.35rem; }
    p { margin: 0 0 10px; color: #475569; line-height: 1.45; font-size: 0.95rem; }
    .ok { color: #047857; font-weight: 700; }
    .err { color: #b91c1c; font-weight: 700; }
    .hint { font-size: 0.85rem; color: #64748b; }
  </style>
</head>
<body>
  <main class="card" role="status">
    <div class="mark" aria-hidden="true">C</div>
    <h1 id="title">Concluindo login…</h1>
    <p id="body">Abrindo o Cosmo Business AI.</p>
    <p class="hint" id="hint">Se o navegador pedir permissão para abrir o aplicativo, permita.</p>
  </main>
  <script>
    (function () {
      var title = document.getElementById("title");
      var body = document.getElementById("body");
      var hint = document.getElementById("hint");
      var params = new URLSearchParams(window.location.search);
      var code = params.get("code");
      var error = params.get("error_description") || params.get("error");
      var state = params.get("state");

      try {
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {}

      function showSuccess() {
        title.textContent = "Login concluído com sucesso";
        title.className = "ok";
        body.textContent = "O Cosmo Business já foi aberto. Você pode fechar esta aba e voltar ao aplicativo.";
        hint.textContent = "Esta página não mostra dados da sua sessão.";
      }

      function showError(msg) {
        title.textContent = "Não foi possível concluir o login";
        title.className = "err";
        body.textContent = msg;
        hint.textContent = "Feche esta aba e tente novamente no Cosmo Business.";
      }

      if (error) {
        showError("O provedor de login cancelou ou retornou um erro.");
        return;
      }

      if (!code) {
        showError("Código de autorização ausente. Volte ao aplicativo e tente de novo.");
        return;
      }

      var deep = "cosmobusiness://auth/callback?code=" + encodeURIComponent(code);
      if (state) deep += "&state=" + encodeURIComponent(state);

      showSuccess();
      window.setTimeout(function () {
        window.location.href = deep;
      }, 120);
    })();
  </script>
</body>
</html>`;
}

let server: http.Server | null = null;
let startedPort: number | null = null;

export function isOAuthLandingServerRunning() {
  return Boolean(server && startedPort);
}

export function getActiveOAuthLandingRedirectUrl(): string | null {
  if (!startedPort) return null;
  return getOAuthLandingRedirectUrl(startedPort);
}

export function ensureOAuthLandingServer(): Promise<{
  ok: boolean;
  redirectUrl?: string;
  error?: string;
}> {
  if (server && startedPort) {
    return Promise.resolve({
      ok: true,
      redirectUrl: getOAuthLandingRedirectUrl(startedPort),
    });
  }

  return new Promise((resolve) => {
    const next = http.createServer((req, res) => {
      try {
        const host = "127.0.0.1";
        const url = new URL(req.url || "/", `http://${host}`);
        if (req.method === "GET" && url.pathname === OAUTH_LANDING_PATH) {
          const html = buildLandingHtml();
          res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
          });
          res.end(html);
          return;
        }

        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
      } catch {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Error");
      }
    });

    next.once("error", (error) => {
      bootWarn("OAuth landing server falhou", error);
      server = null;
      startedPort = null;
      resolve({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    next.listen(OAUTH_LANDING_PORT, "127.0.0.1", () => {
      server = next;
      startedPort = OAUTH_LANDING_PORT;
      bootLog(
        "OAuth landing server",
        getOAuthLandingRedirectUrl(OAUTH_LANDING_PORT)
      );
      resolve({
        ok: true,
        redirectUrl: getOAuthLandingRedirectUrl(OAUTH_LANDING_PORT),
      });
    });
  });
}

export function stopOAuthLandingServer() {
  if (!server) return;
  try {
    server.close();
  } catch {
    /* ignore */
  }
  server = null;
  startedPort = null;
}
