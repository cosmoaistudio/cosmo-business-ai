import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { getDesktopApi, isDesktopApp } from "@/desktop/types";
import "../styles/hardware.css";

type Tab = "printers" | "scales" | "diagnostics";

export function HardwareHubPage() {
  const desktop = isDesktopApp();
  const api = getDesktopApi();
  const [tab, setTab] = useState<Tab>("printers");
  const [message, setMessage] = useState<string>("");
  const [printers, setPrinters] = useState<
    Array<{ name: string; driver: string; status: string; isDefault: boolean }>
  >([]);
  const [brands, setBrands] = useState<Array<{ id: string; label: string; notes: string }>>(
    []
  );
  const [queueSize, setQueueSize] = useState(0);
  const [scaleCaps, setScaleCaps] = useState<
    Array<{ label: string; protocolImplemented: boolean; notes: string; models: string[] }>
  >([]);
  const [ports, setPorts] = useState<Array<{ path: string; label: string }>>([]);
  const [diag, setDiag] = useState<Record<string, unknown> | null>(null);

  const refreshPrinters = useCallback(async () => {
    if (!api) return;
    const detected = await api.printDetect();
    if (detected.ok && detected.data) {
      const data = detected.data as {
        printers: typeof printers;
        brands: typeof brands;
      };
      setPrinters(data.printers ?? []);
      setBrands(data.brands ?? []);
    }
    const status = await api.getStatus();
    setQueueSize(status.printQueueSize);
  }, [api]);

  const refreshScales = useCallback(async () => {
    if (!api) return;
    const caps = await api.scaleCapabilities();
    if (caps.ok) setScaleCaps((caps.data as typeof scaleCaps) ?? []);
    const list = await api.scaleListPorts();
    if (list.ok) setPorts((list.data as typeof ports) ?? []);
  }, [api]);

  useEffect(() => {
    if (!desktop) return;
    void refreshPrinters();
    void refreshScales();
  }, [desktop, refreshPrinters, refreshScales]);

  async function runDiag() {
    if (!api) return;
    const result = await api.hardwareDiagnostics();
    if (result.ok) setDiag((result.data as Record<string, unknown>) ?? null);
    else setMessage(result.error ?? "Falha no diagnóstico");
  }

  if (!desktop) {
    return (
      <div className="cosmo-hw">
        <PageHeader
          title="Hardware"
          subtitle="Print Manager e Scale Manager exigem o app Electron Cosmo Business."
        />
        <section className="cosmo-hw__panel">
          <p className="cosmo-hw__desc">
            Abra pelo instalador/portable ou `npm run desktop`. No browser web
            estas APIs não estão disponíveis (o frontend nunca acessa COM
            diretamente).
          </p>
          <Link to="/diagnostico" className="cosmo-hw__btn">
            Ir para Diagnóstico SaaS
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="cosmo-hw">
      <PageHeader
        title="Hardware"
        subtitle="Configurações → Hardware → Impressoras / Balanças / Diagnóstico"
      />

      <nav className="cosmo-hw__nav">
        {(
          [
            ["printers", "Impressoras"],
            ["scales", "Balanças"],
            ["diagnostics", "Diagnóstico"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={
              tab === id
                ? "cosmo-hw__nav-btn cosmo-hw__nav-btn--active"
                : "cosmo-hw__nav-btn"
            }
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {message ? <p className="cosmo-hw__msg">{message}</p> : null}

      {tab === "printers" ? (
        <section className="cosmo-hw__panel">
          <h2 className="cosmo-hw__title">Print Manager</h2>
          <p className="cosmo-hw__desc">
            Epson · Bematech · Elgin · Daruma (preset ESC/POS) · Windows spooler.
            Fila atual: {queueSize}
          </p>
          <div className="cosmo-hw__actions">
            <button type="button" className="cosmo-hw__btn" onClick={() => void refreshPrinters()}>
              Detectar automaticamente
            </button>
            <button
              type="button"
              className="cosmo-hw__btn"
              onClick={async () => {
                const r = await api?.printTest("cash");
                setMessage(r?.ok ? "Teste enviado à fila" : r?.error ?? "Falha");
              }}
            >
              Imprimir teste
            </button>
            <button
              type="button"
              className="cosmo-hw__btn cosmo-hw__btn--ghost"
              onClick={async () => {
                const r = await api?.printReprintLast();
                setMessage(r?.ok ? "Reimpressão enfileirada" : r?.error ?? "Falha");
              }}
            >
              Reimprimir último ticket
            </button>
            <button
              type="button"
              className="cosmo-hw__btn cosmo-hw__btn--ghost"
              onClick={async () => {
                const q = await api?.getPrintQueue();
                setMessage(`Fila: ${Array.isArray(q) ? q.length : 0} job(s)`);
              }}
            >
              Abrir fila
            </button>
          </div>

          <h3 className="cosmo-hw__subtitle">Impressoras detectadas</h3>
          <div className="cosmo-hw__table">
            {printers.length === 0 ? (
              <p className="cosmo-hw__desc">Nenhuma impressora Windows listada.</p>
            ) : (
              printers.map((p) => (
                <div key={p.name} className="cosmo-hw__row">
                  <div>
                    <strong>{p.name}</strong>
                    <div className="cosmo-hw__desc">
                      Driver: {p.driver} · {p.status}
                      {p.isDefault ? " · Padrão" : ""} · Tipo: Windows
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <h3 className="cosmo-hw__subtitle">Marcas suportadas (arquitetura)</h3>
          <ul className="cosmo-hw__list">
            {brands.map((b) => (
              <li key={b.id}>
                <strong>{b.label}</strong> — {b.notes}
              </li>
            ))}
          </ul>
          <p className="cosmo-hw__desc mt-3">
            Papéis: Caixa / Cozinha / Delivery — configure transport network
            (TCP 9100) ou spooler Windows no arquivo de hardware do Desktop
            Agent (`hardware-config.json`).
          </p>
        </section>
      ) : null}

      {tab === "scales" ? (
        <section className="cosmo-hw__panel">
          <h2 className="cosmo-hw__title">Scale Manager</h2>
          <p className="cosmo-hw__desc">
            Toledo · Prix · Filizola · Urano · Elgin · Genérica. Frontend nunca
            acessa COM — só o Desktop Agent.
          </p>
          <div className="cosmo-hw__actions">
            <button type="button" className="cosmo-hw__btn" onClick={() => void refreshScales()}>
              Detectar portas
            </button>
            <button
              type="button"
              className="cosmo-hw__btn"
              onClick={async () => {
                const r = await api?.scaleConnect();
                setMessage(r?.ok ? JSON.stringify(r.data) : r?.error ?? "Falha");
              }}
            >
              Conectar
            </button>
            <button
              type="button"
              className="cosmo-hw__btn cosmo-hw__btn--ghost"
              onClick={async () => {
                await api?.scaleDisconnect();
                setMessage("Desconectado");
              }}
            >
              Desconectar
            </button>
            <button
              type="button"
              className="cosmo-hw__btn"
              onClick={async () => {
                const r = await api?.scaleRead();
                setMessage(
                  r?.ok
                    ? `Peso: ${JSON.stringify(r.data)}`
                    : r?.error ?? "Leitura indisponível"
                );
              }}
            >
              Ler peso
            </button>
            <button
              type="button"
              className="cosmo-hw__btn cosmo-hw__btn--ghost"
              onClick={async () => {
                const r = await api?.scaleTest();
                setMessage(r?.ok ? JSON.stringify(r.data) : r?.error ?? "Falha");
              }}
            >
              Teste comunicação
            </button>
            <button
              type="button"
              className="cosmo-hw__btn cosmo-hw__btn--ghost"
              onClick={async () => {
                const r = await api?.scaleZero();
                setMessage(r?.ok ? "Zerar solicitado" : r?.error ?? "Falha");
              }}
            >
              Zerar
            </button>
            <button
              type="button"
              className="cosmo-hw__btn cosmo-hw__btn--ghost"
              onClick={async () => {
                const r = await api?.scaleTare();
                setMessage(r?.ok ? "Tara solicitada" : r?.error ?? "Falha");
              }}
            >
              Tara
            </button>
          </div>

          <h3 className="cosmo-hw__subtitle">Portas COM</h3>
          <ul className="cosmo-hw__list">
            {ports.length === 0 ? (
              <li>Nenhuma porta serial detectada</li>
            ) : (
              ports.map((p) => (
                <li key={p.path}>
                  {p.path} — {p.label}
                </li>
              ))
            )}
          </ul>

          <h3 className="cosmo-hw__subtitle">Drivers</h3>
          <ul className="cosmo-hw__list">
            {scaleCaps.map((c) => (
              <li key={c.label}>
                <strong>{c.label}</strong>{" "}
                {c.protocolImplemented ? "(protocolo OK)" : "(docs/SDK pendentes)"}
                <div className="cosmo-hw__desc">{c.notes}</div>
                <div className="cosmo-hw__desc">Modelos: {c.models.join(", ")}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "diagnostics" ? (
        <section className="cosmo-hw__panel">
          <h2 className="cosmo-hw__title">Diagnóstico de hardware</h2>
          <div className="cosmo-hw__actions">
            <button type="button" className="cosmo-hw__btn" onClick={() => void runDiag()}>
              Executar diagnóstico
            </button>
            <button
              type="button"
              className="cosmo-hw__btn cosmo-hw__btn--ghost"
              onClick={async () => {
                const r = await api?.printTest("cash");
                setMessage(r?.ok ? "Teste impressora OK (fila)" : r?.error ?? "Falha");
              }}
            >
              Testar impressora
            </button>
            <button
              type="button"
              className="cosmo-hw__btn cosmo-hw__btn--ghost"
              onClick={async () => {
                const r = await api?.scaleTest();
                setMessage(r?.ok ? JSON.stringify(r.data) : r?.error ?? "Falha");
              }}
            >
              Testar balança
            </button>
          </div>
          {diag ? (
            <pre className="cosmo-hw__pre">{JSON.stringify(diag, null, 2)}</pre>
          ) : (
            <p className="cosmo-hw__desc">
              Inclui Desktop Agent, internet, Supabase, versão, Electron,
              impressoras, balanças, COM e USB (hint).
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
