import { useEffect } from "react";

import { LoginCosmicScene } from "@/components/login-official/LoginCosmicScene";
import { LoginCosmoMark } from "@/components/login-official/LoginCosmoMark";
import "@/components/login-official/styles/login-official.css";
import {
  DOWNLOAD_PLATFORM,
  DOWNLOAD_URLS,
  DOWNLOAD_VERSION,
  hasDownloadUrl,
} from "@/config/downloads";

import "./download.css";

const SEO_TITLE = "Cosmo Business AI — Sistema de Gestão";
const SEO_DESCRIPTION =
  "Baixe o Cosmo Business AI para Windows e gerencie vendas, caixa e operação do seu negócio.";

const INSTALL_STEPS = [
  "Baixe o instalador.",
  "Execute o arquivo.",
  "Instale o Cosmo Business AI.",
  "Abra o sistema e faça login.",
  "Configure sua impressora térmica.",
] as const;

function applyDownloadSeo() {
  const previousTitle = document.title;
  document.title = SEO_TITLE;

  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  const created = !meta;
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }
  const previousDescription = meta.content;
  meta.content = SEO_DESCRIPTION;

  return () => {
    document.title = previousTitle;
    if (created) {
      meta?.remove();
    } else if (meta) {
      meta.content = previousDescription;
    }
  };
}

export default function DownloadPage() {
  useEffect(() => applyDownloadSeo(), []);

  return (
    <div className="download-page">
      <LoginCosmicScene />

      <div className="download-page__scroll">
        <main className="download-page__content">
          <header className="download-page__brand">
            <div className="download-page__beam" aria-hidden />
            <LoginCosmoMark />
            <h1 className="download-page__wordmark">COSMO</h1>
            <p className="download-page__eyebrow">BUSINESS AI</p>
            <p className="download-page__tagline">
              Seu sistema de vendas e gestão para o seu negócio.
            </p>
            <div className="download-page__meta">
              <span className="download-page__chip">
                Versão: <strong>{DOWNLOAD_VERSION}</strong>
              </span>
              <span className="download-page__chip">
                Plataforma: <strong>{DOWNLOAD_PLATFORM}</strong>
              </span>
            </div>
          </header>

          <div className="download-page__actions">
            {hasDownloadUrl(DOWNLOAD_URLS.setup) ? (
              <a
                className="download-page__btn download-page__btn--primary"
                href={DOWNLOAD_URLS.setup}
                rel="noopener noreferrer"
              >
                Baixar para Windows
              </a>
            ) : (
              <span
                className="download-page__btn download-page__btn--primary download-page__btn--disabled"
                aria-disabled="true"
              >
                Baixar para Windows
              </span>
            )}
            {hasDownloadUrl(DOWNLOAD_URLS.portable) ? (
              <a
                className="download-page__btn download-page__btn--secondary"
                href={DOWNLOAD_URLS.portable}
                rel="noopener noreferrer"
              >
                Versão Portable
              </a>
            ) : (
              <span
                className="download-page__btn download-page__btn--secondary download-page__btn--disabled"
                aria-disabled="true"
              >
                Versão Portable
              </span>
            )}
          </div>
          {!hasDownloadUrl(DOWNLOAD_URLS.portable) ? (
            <p className="download-page__note">
              Instalador Windows disponível. A versão Portable ainda não está
              anexada à release v1.0.0-rc.3.
            </p>
          ) : null}

          <section className="download-page__sections">
            <article className="download-page__card">
              <h2>Instalação</h2>
              <ol className="download-page__steps">
                {INSTALL_STEPS.map((step, index) => (
                  <li key={step}>
                    <span className="download-page__step-n" aria-hidden>
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </article>

            <article className="download-page__card">
              <h2>Versão Portable</h2>
              <p>
                A versão Portable não precisa de instalação e pode ser executada
                diretamente. Útil para testar o sistema ou levar o Cosmo Business
                AI em um pen drive, sem alterar o computador.
              </p>
            </article>
          </section>

          <p className="download-page__footer">
            © {new Date().getFullYear()} Cosmo Business AI. Todos os direitos
            reservados.
          </p>
        </main>
      </div>
    </div>
  );
}
