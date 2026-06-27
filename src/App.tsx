/**
 * GasCondomínio v3
 * - Sem módulo de faturas (valor por apartamento vai direto para administradora)
 * - Layout 100% responsivo (celular e desktop)
 * - Inputs com alto contraste e boa visibilidade
 * - Fórmula: Consumo m³ × Taxa de Conversão = kg → kg × Preço/kg = Valor R$
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const S = {
  get: k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
const fmtN = (n, d = 3) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtR = n => `R$ ${Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtM = ym => { if (!ym) return ""; const [y, m] = ym.split("-"); return ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][+m - 1] + "/" + y; };
const sortApts = (a, b) => (a.numero || "").localeCompare(b.numero || "", undefined, { numeric: true });

// ─── SEED com dados reais da planilha ─────────────────────────────────────────
const seedData = () => {
  if (S.get("gc3_ok")) return;
  S.set("gc3_cfg", { precoKg: 9.55, taxaConversao: 2.30, precoServico: 0 });
  S.set("gc3_apts", [
    { id:"a1",  numero:"101", medidor:"A16L0011281D",  morador:"", ativo:true },
    { id:"a2",  numero:"102", medidor:"A22L0050687D",  morador:"", ativo:true },
    { id:"a3",  numero:"201", medidor:"A16L0011328D",  morador:"", ativo:true },
    { id:"a4",  numero:"202", medidor:"A16L0011325D",  morador:"", ativo:true },
    { id:"a5",  numero:"301", medidor:"A22L0050682D",  morador:"", ativo:true },
    { id:"a6",  numero:"302", medidor:"A16L0011327D",  morador:"", ativo:true },
    { id:"a7",  numero:"401", medidor:"B22LL0015457D", morador:"", ativo:true },
    { id:"a8",  numero:"402", medidor:"A22L0050688D",  morador:"", ativo:true },
    { id:"a9",  numero:"501", medidor:"A16L0011329D",  morador:"", ativo:true },
    { id:"a10", numero:"502", medidor:"B22L0013089D",  morador:"", ativo:true },
    { id:"a11", numero:"601", medidor:"A16L0011330D",  morador:"", ativo:true },
  ]);
  const raw = [
    ["a1",182.237,182.888],["a2",13.955,15.513],["a3",149.943,154.315],
    ["a4",243.34,243.34],["a5",55.261,56.837],["a6",2.429,5.72],
    ["a7",143.123,148.291],["a8",31.065,31.583],["a9",265.245,265.970],
    ["a10",59.909,62.192],["a11",2.95,3.80],
  ];
  S.set("gc3_leituras", raw.map(([aptId, leitAnt, leitAtu]) => ({
    id: uid(), aptId, mes: "2025-12",
    dataAnt: "2025-11-01", dataAtu: "2025-11-30",
    leitAnt, leitAtu, status: "Faturar"
  })));
  S.set("gc3_ok", true);
};

// ─── CÁLCULO ──────────────────────────────────────────────────────────────────
const calcular = (l, cfg) => {
  const m3  = Math.max(0, (l.leitAtu || 0) - (l.leitAnt || 0));
  const kg  = m3 * (cfg.taxaConversao || 2.3);
  const val = kg * (cfg.precoKg || 9.55) + (cfg.precoServico || 0);
  return { m3: +m3.toFixed(4), kg: +kg.toFixed(4), val: +val.toFixed(4) };
};

// ─── ESTILOS BASE ─────────────────────────────────────────────────────────────
const INP = {
  width: "100%", padding: "10px 12px",
  border: "1.5px solid #334155",
  borderRadius: 8, fontSize: 14,
  background: "#1e293b",
  color: "#f1f5f9",
  boxSizing: "border-box",
};
const SEL = { ...INP };

const BTN = {
  primary:   { background: "#1D9E75", color: "#fff", border: "none" },
  secondary: { background: "#1e293b", color: "#94a3b8", border: "1.5px solid #334155" },
  danger:    { background: "rgba(226,75,74,.15)", color: "#f87171", border: "1px solid rgba(226,75,74,.4)" },
};

// ─── COMPONENTES ──────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "1rem 1.25rem", ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, v = "primary", disabled, style = {}, type = "button" }) => (
  <button type={type} onClick={onClick} disabled={disabled}
    style={{ padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap", ...BTN[v], ...style }}>
    {children}
  </button>
);

const Fld = ({ label, req, children, half }) => (
  <div style={{ marginBottom: 14, flex: half ? "1 1 140px" : "1 1 100%" }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {label}{req && <span style={{ color: "#f87171" }}> *</span>}
    </label>
    {children}
  </div>
);

const Badge = ({ txt, color = "#1D9E75" }) => (
  <span style={{ background: `${color}25`, color, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{txt}</span>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 540, maxHeight: "92vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: "1px solid #1e293b", position: "sticky", top: 0, background: "#0f172a", zIndex: 1 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: "#64748b", lineHeight: 1 }}>×</button>
      </div>
      <div style={{ padding: "1.25rem" }}>{children}</div>
    </div>
  </div>
);

const Toast = ({ msg, type }) => (
  <div style={{
    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
    zIndex: 9999, background: type === "error" ? "#991b1b" : type === "warning" ? "#92400e" : "#065f46",
    color: "#fff", padding: "12px 22px", borderRadius: 40, fontSize: 14, fontWeight: 600,
    boxShadow: "0 4px 24px rgba(0,0,0,.4)", whiteSpace: "nowrap", maxWidth: "90vw"
  }}>
    {type === "error" ? "❌ " : type === "warning" ? "⚠️ " : "✅ "}{msg}
  </div>
);

const MetricCard = ({ label, value, sub, color = "#1D9E75" }) => (
  <div style={{ background: "#1e293b", borderRadius: 10, padding: ".875rem 1rem" }}>
    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{sub}</div>}
  </div>
);

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [nav,   setNav]   = useState("leituras");
  const [toast, setToast] = useState(null);
  const [menu,  setMenu]  = useState(false);

  useEffect(() => { seedData(); }, []);

  const notify = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const MENU = [
    { id: "leituras",     icon: "🔢", label: "Leituras"     },
    { id: "apartamentos", icon: "🏠", label: "Apartamentos" },
    { id: "relatorio",    icon: "📋", label: "Relatório"    },
    { id: "historico",    icon: "📅", label: "Histórico"    },
    { id: "configuracao", icon: "⚙️", label: "Configuração" },
  ];

  const PAGES = { leituras: PgLeituras, apartamentos: PgApartamentos, relatorio: PgRelatorio, historico: PgHistorico, configuracao: PgConfiguracao };
  const Page  = PAGES[nav] || PgLeituras;
  const label = MENU.find(m => m.id === nav)?.label || "";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", fontFamily: "'Inter',system-ui,sans-serif", color: "#f1f5f9" }}>
      {/* TOPBAR MOBILE */}
      <div style={{ background: "#0f1923", borderBottom: "1px solid #1e293b", padding: "0 1rem", height: 52, display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 50 }}>
        <span style={{ fontSize: 20 }}>🔥</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1D9E75", flex: 1 }}>GasCondomínio</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>{label}</span>
        <button onClick={() => setMenu(o => !o)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer", padding: 4 }}>☰</button>
      </div>

      {/* MENU DRAWER MOBILE */}
      {menu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={() => setMenu(false)}>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 220, background: "#0f1923", borderLeft: "1px solid #1e293b", padding: "1rem 0" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "0 1rem 1rem", borderBottom: "1px solid #1e293b", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1D9E75" }}>🔥 GasCondomínio</div>
            </div>
            {MENU.map(m => (
              <button key={m.id} onClick={() => { setNav(m.id); setMenu(false); }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 1rem", border: "none", background: nav === m.id ? "rgba(29,158,117,.2)" : "transparent", color: nav === m.id ? "#1D9E75" : "#94a3b8", cursor: "pointer", fontSize: 14, fontWeight: nav === m.id ? 700 : 400, borderLeft: nav === m.id ? "3px solid #1D9E75" : "3px solid transparent" }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* NAV INFERIOR MOBILE */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0f1923", borderTop: "1px solid #1e293b", display: "flex", zIndex: 50 }}>
        {MENU.map(m => (
          <button key={m.id} onClick={() => setNav(m.id)}
            style={{ flex: 1, padding: "8px 4px", border: "none", background: "transparent", color: nav === m.id ? "#1D9E75" : "#475569", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 18 }}>{m.icon}</span>
            <span style={{ fontSize: 9, fontWeight: nav === m.id ? 700 : 400, whiteSpace: "nowrap" }}>{m.label}</span>
          </button>
        ))}
      </div>

      {/* CONTEÚDO */}
      <div style={{ padding: "1rem", paddingBottom: "70px" }}>
        <Page notify={notify} />
      </div>

      {toast && <Toast {...toast} />}
    </div>
  );
}

// ─── LEITURAS ─────────────────────────────────────────────────────────────────
function PgLeituras({ notify }) {
  const [leituras, setLeituras] = useState(S.get("gc3_leituras") || []);
  const [apts,     setApts]     = useState(S.get("gc3_apts")     || []);
  const [cfg]                   = useState(S.get("gc3_cfg")      || { precoKg: 9.55, taxaConversao: 2.3, precoServico: 0 });
  const [mes,      setMes]      = useState(() => [...new Set((S.get("gc3_leituras") || []).map(l => l.mes))].sort().reverse()[0] || new Date().toISOString().slice(0, 7));
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState({});

  const meses       = [...new Set(leituras.map(l => l.mes))].sort().reverse();
  const leiturasDoMes = useMemo(() => leituras.filter(l => l.mes === mes), [leituras, mes]);

  const totais = useMemo(() => leiturasDoMes.reduce((acc, l) => {
    const c = calcular(l, cfg);
    return { m3: acc.m3 + c.m3, kg: acc.kg + c.kg, val: acc.val + c.val };
  }, { m3: 0, kg: 0, val: 0 }), [leiturasDoMes, cfg]);

  const reload = () => { setLeituras(S.get("gc3_leituras") || []); };

  const abrirNova = () => {
    const hoje = new Date().toISOString().slice(0, 10);
    setEditing(null);
    setForm({ aptId: apts[0]?.id || "", mes, dataAnt: hoje, dataAtu: hoje, leitAnt: "", leitAtu: "", status: "Faturar" });
    setModal(true);
  };

  const abrirEdit = l => {
    setEditing(l);
    setForm({ aptId: l.aptId, mes: l.mes, dataAnt: l.dataAnt, dataAtu: l.dataAtu, leitAnt: l.leitAnt, leitAtu: l.leitAtu, status: l.status || "Faturar" });
    setModal(true);
  };

  const salvar = () => {
    if (!form.aptId || form.leitAnt === "" || form.leitAtu === "") return notify("Preencha todos os campos obrigatórios", "error");
    const ant = parseFloat(form.leitAnt), atu = parseFloat(form.leitAtu);
    if (atu < ant) return notify("Leitura atual não pode ser menor que a anterior!", "error");
    const lista = S.get("gc3_leituras") || [];
    if (editing) {
      S.set("gc3_leituras", lista.map(l => l.id === editing.id ? { ...l, ...form, leitAnt: ant, leitAtu: atu } : l));
      notify("Leitura atualizada!");
    } else {
      if (lista.find(l => l.aptId === form.aptId && l.mes === form.mes)) return notify("Já existe leitura para este apartamento neste mês!", "warning");
      lista.push({ id: uid(), ...form, leitAnt: ant, leitAtu: atu });
      S.set("gc3_leituras", lista);
      notify("Leitura registrada!");
    }
    setModal(false); reload();
  };

  const remover = l => {
    if (!confirm(`Remover leitura do Apto ${apts.find(a => a.id === l.aptId)?.numero}?`)) return;
    S.set("gc3_leituras", (S.get("gc3_leituras") || []).filter(x => x.id !== l.id));
    reload(); notify("Leitura removida!", "warning");
  };

  const novoMes = () => {
    if (!mes) return;
    const [y, m] = mes.split("-");
    const d = new Date(+y, +m, 1);
    const prox = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const lista = S.get("gc3_leituras") || [];
    if (lista.find(l => l.mes === prox)) return notify("Mês já existe!", "warning");
    const novas = apts.map(apt => {
      const ult = lista.filter(l => l.mes === mes && l.aptId === apt.id).sort((a, b) => b.leitAtu - a.leitAtu)[0];
      return { id: uid(), aptId: apt.id, mes: prox, dataAnt: ult?.dataAtu || "", dataAtu: "", leitAnt: ult?.leitAtu || 0, leitAtu: ult?.leitAtu || 0, status: "Faturar" };
    });
    S.set("gc3_leituras", [...lista, ...novas]);
    reload(); setMes(prox);
    notify(`Mês ${fmtM(prox)} criado! Leituras anteriores já preenchidas.`);
  };

  const prevCalc = useMemo(() => {
    if (form.leitAnt === "" || form.leitAtu === "") return null;
    return calcular({ leitAnt: parseFloat(form.leitAnt) || 0, leitAtu: parseFloat(form.leitAtu) || 0 }, cfg);
  }, [form.leitAnt, form.leitAtu, cfg]);

  const linhas = [...leiturasDoMes].sort((a, b) => sortApts(apts.find(x => x.id === a.aptId) || {}, apts.find(x => x.id === b.aptId) || {}));

  return (
    <div>
      {/* CONTROLES */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <select value={mes} onChange={e => setMes(e.target.value)} style={{ ...SEL, width: "auto", flex: "1 1 130px" }}>
          {meses.map(m => <option key={m} value={m}>{fmtM(m)}</option>)}
        </select>
        <Btn v="secondary" onClick={novoMes}>+ Novo mês</Btn>
        <Btn onClick={abrirNova}>+ Leitura</Btn>
      </div>

      {/* BADGES DE CONFIGURAÇÃO */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ background: "rgba(29,158,117,.15)", border: "1px solid rgba(29,158,117,.3)", borderRadius: 7, padding: "5px 12px", fontSize: 12, color: "#34d399", fontWeight: 600 }}>💰 {fmtR(cfg.precoKg)}/kg</span>
        <span style={{ background: "rgba(55,138,221,.15)", border: "1px solid rgba(55,138,221,.3)", borderRadius: 7, padding: "5px 12px", fontSize: 12, color: "#60a5fa", fontWeight: 600 }}>🔄 Taxa: {cfg.taxaConversao}</span>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 8, marginBottom: 12 }}>
        <MetricCard label="Consumo m³" value={`${fmtN(totais.m3)} m³`} sub={fmtM(mes)} />
        <MetricCard label="Consumo kg" value={`${fmtN(totais.kg)} kg`} color="#60a5fa" />
        <MetricCard label="Total a cobrar" value={fmtR(totais.val)} color="#34d399" />
        <MetricCard label="Aptos" value={`${leiturasDoMes.length}/${apts.length}`} color="#a78bfa" />
      </div>

      {/* CARDS DE APARTAMENTOS (mobile-first) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginBottom: 12 }}>
        {linhas.map(l => {
          const apt  = apts.find(a => a.id === l.aptId);
          const c    = calcular(l, cfg);
          const cor  = l.status === "Pago" ? "#34d399" : l.status === "Isento" ? "#60a5fa" : "#fbbf24";
          return (
            <div key={l.id} style={{ background: "#1e293b", borderRadius: 12, padding: "1rem", border: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>Apto {apt?.numero || "-"}</div>
                  <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{apt?.medidor || "-"}</div>
                  {apt?.morador && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{apt.morador}</div>}
                </div>
                <Badge txt={l.status || "Faturar"} color={cor} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                <div style={{ background: "#0f172a", borderRadius: 7, padding: "7px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#64748b" }}>Consumo</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{fmtN(c.m3)}</div>
                  <div style={{ fontSize: 9, color: "#475569" }}>m³</div>
                </div>
                <div style={{ background: "#0f172a", borderRadius: 7, padding: "7px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#64748b" }}>Em kg</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#60a5fa" }}>{fmtN(c.kg)}</div>
                  <div style={{ fontSize: 9, color: "#475569" }}>kg</div>
                </div>
                <div style={{ background: "#0f172a", borderRadius: 7, padding: "7px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#64748b" }}>Valor</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#34d399" }}>{fmtR(c.val)}</div>
                  <div style={{ fontSize: 9, color: "#475569" }}>R$</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>
                Ant: {fmtN(l.leitAnt)} → Atu: {fmtN(l.leitAtu)} · {l.dataAnt||"-"} → {l.dataAtu||"-"}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn v="secondary" onClick={() => abrirEdit(l)} style={{ flex: 1, padding: "7px" }}>✏️ Editar</Btn>
                <button onClick={() => {
                  const lista = S.get("gc3_leituras") || [];
                  const upd   = lista.map(x => x.id === l.id ? { ...x, status: x.status === "Pago" ? "Faturar" : "Pago" } : x);
                  S.set("gc3_leituras", upd); reload();
                }} style={{ flex: 1, padding: "7px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", background: l.status === "Pago" ? "rgba(251,191,36,.15)" : "rgba(52,211,153,.15)", color: l.status === "Pago" ? "#fbbf24" : "#34d399", border: "1px solid currentColor" }}>
                  {l.status === "Pago" ? "✓ Pago" : "Marcar pago"}
                </button>
                <button onClick={() => remover(l)} style={{ padding: "7px 10px", borderRadius: 8, fontSize: 13, cursor: "pointer", background: "rgba(239,68,68,.1)", color: "#f87171", border: "1px solid rgba(239,68,68,.3)" }}>🗑️</button>
              </div>
            </div>
          );
        })}
        {linhas.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "2rem", color: "#475569", fontSize: 14 }}>
            Nenhuma leitura para {fmtM(mes)}<br />
            <span style={{ fontSize: 12 }}>Clique em "+ Novo mês" ou "+ Leitura" para começar</span>
          </div>
        )}
      </div>

      {/* MODAL */}
      {modal && (
        <Modal title={editing ? "Editar Leitura" : "Nova Leitura"} onClose={() => setModal(false)}>
          <Fld label="Apartamento" req>
            <select style={SEL} value={form.aptId} onChange={e => setForm(f => ({ ...f, aptId: e.target.value }))}>
              {apts.map(a => <option key={a.id} value={a.id}>Apto {a.numero} — {a.medidor}</option>)}
            </select>
          </Fld>
          <Fld label="Mês de referência" req>
            <input style={INP} type="month" value={form.mes} onChange={e => setForm(f => ({ ...f, mes: e.target.value }))} />
          </Fld>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Fld label="Data leitura anterior" half>
              <input style={INP} type="date" value={form.dataAnt} onChange={e => setForm(f => ({ ...f, dataAnt: e.target.value }))} />
            </Fld>
            <Fld label="Data leitura atual" half>
              <input style={INP} type="date" value={form.dataAtu} onChange={e => setForm(f => ({ ...f, dataAtu: e.target.value }))} />
            </Fld>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Fld label="Leitura anterior (m³)" req half>
              <input style={INP} type="number" step="0.001" value={form.leitAnt} onChange={e => setForm(f => ({ ...f, leitAnt: e.target.value }))} placeholder="0.000" />
            </Fld>
            <Fld label="Leitura atual (m³)" req half>
              <input style={INP} type="number" step="0.001" value={form.leitAtu} onChange={e => setForm(f => ({ ...f, leitAtu: e.target.value }))} placeholder="0.000" />
            </Fld>
          </div>

          {/* Preview de cálculo */}
          {prevCalc !== null && (
            <div style={{ borderRadius: 10, padding: "12px 14px", marginBottom: 14, background: prevCalc.m3 < 0 ? "rgba(239,68,68,.1)" : "rgba(29,158,117,.1)", border: `1px solid ${prevCalc.m3 < 0 ? "rgba(239,68,68,.4)" : "rgba(29,158,117,.4)"}` }}>
              {prevCalc.m3 < 0
                ? <div style={{ color: "#f87171", fontWeight: 600 }}>⚠️ Leitura inválida — atual menor que anterior</div>
                : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                    <div><div style={{ fontSize: 10, color: "#64748b" }}>Consumo</div><div style={{ fontWeight: 700, color: "#f1f5f9" }}>{fmtN(prevCalc.m3)} m³</div></div>
                    <div><div style={{ fontSize: 10, color: "#64748b" }}>Em kg</div><div style={{ fontWeight: 700, color: "#60a5fa" }}>{fmtN(prevCalc.kg)} kg</div></div>
                    <div><div style={{ fontSize: 10, color: "#64748b" }}>Valor</div><div style={{ fontWeight: 700, color: "#34d399" }}>{fmtR(prevCalc.val)}</div></div>
                  </div>
              }
            </div>
          )}

          <Fld label="Status">
            <select style={SEL} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option>Faturar</option><option>Pago</option><option>Isento</option>
            </select>
          </Fld>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <Btn v="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn onClick={salvar} disabled={prevCalc?.m3 < 0}>Salvar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── APARTAMENTOS ─────────────────────────────────────────────────────────────
function PgApartamentos({ notify }) {
  const [apts,   setApts]   = useState(S.get("gc3_apts") || []);
  const [modal,  setModal]  = useState(false);
  const [editing,setEditing]= useState(null);
  const [form,   setForm]   = useState({ numero: "", medidor: "", morador: "", ativo: true });

  const reload = () => setApts(S.get("gc3_apts") || []);

  const salvar = () => {
    if (!form.numero || !form.medidor) return notify("Número e medidor são obrigatórios", "error");
    const lista = S.get("gc3_apts") || [];
    if (editing) {
      S.set("gc3_apts", lista.map(a => a.id === editing.id ? { ...a, ...form } : a));
      notify("Apartamento atualizado!");
    } else {
      if (lista.find(a => a.numero === form.numero)) return notify("Número já cadastrado!", "warning");
      lista.push({ id: uid(), ...form });
      S.set("gc3_apts", lista);
      notify("Apartamento cadastrado!");
    }
    setModal(false); reload();
  };

  const remover = a => {
    if (!confirm(`Remover Apto ${a.numero}?`)) return;
    S.set("gc3_apts", (S.get("gc3_apts") || []).filter(x => x.id !== a.id));
    reload(); notify("Removido!", "warning");
  };

  const abrir = a => {
    setEditing(a || null);
    setForm(a ? { numero: a.numero, medidor: a.medidor, morador: a.morador || "", ativo: a.ativo } : { numero: "", medidor: "", morador: "", ativo: true });
    setModal(true);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Btn onClick={() => abrir(null)}>+ Novo Apartamento</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
        {[...apts].sort(sortApts).map(a => (
          <div key={a.id} style={{ background: "#1e293b", borderRadius: 12, padding: "1rem", border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>Apto {a.numero}</div>
              <Badge txt={a.ativo ? "Ativo" : "Inativo"} color={a.ativo ? "#34d399" : "#f87171"} />
            </div>
            <div style={{ fontSize: 12, fontFamily: "monospace", color: "#64748b", marginBottom: 4 }}>{a.medidor}</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>{a.morador || <span style={{ color: "#334155", fontStyle: "italic" }}>Sem morador</span>}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn v="secondary" onClick={() => abrir(a)} style={{ flex: 1 }}>✏️ Editar</Btn>
              <button onClick={() => remover(a)} style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer", background: "rgba(239,68,68,.1)", color: "#f87171", border: "1px solid rgba(239,68,68,.3)" }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={editing ? "Editar Apartamento" : "Novo Apartamento"} onClose={() => setModal(false)}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Fld label="Número do Apartamento" req half>
              <input style={INP} value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} placeholder="101" />
            </Fld>
            <Fld label="Número do Medidor" req half>
              <input style={INP} value={form.medidor} onChange={e => setForm(f => ({ ...f, medidor: e.target.value }))} placeholder="A16L0011281D" />
            </Fld>
          </div>
          <Fld label="Nome do Morador">
            <input style={INP} value={form.morador} onChange={e => setForm(f => ({ ...f, morador: e.target.value }))} placeholder="Nome completo (opcional)" />
          </Fld>
          <Fld label="Status">
            <select style={SEL} value={String(form.ativo)} onChange={e => setForm(f => ({ ...f, ativo: e.target.value === "true" }))}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </Fld>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn v="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn onClick={salvar}>Salvar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── RELATÓRIO ────────────────────────────────────────────────────────────────
function PgRelatorio({ notify }) {
  const leituras = S.get("gc3_leituras") || [];
  const apts     = S.get("gc3_apts")     || [];
  const cfg      = S.get("gc3_cfg")      || { precoKg: 9.55, taxaConversao: 2.3, precoServico: 0 };
  const meses    = [...new Set(leituras.map(l => l.mes))].sort().reverse();
  const [mes, setMes] = useState(meses[0] || "");
  const [gerandoPDF, setGerandoPDF] = useState(false);

  const linhas = leituras.filter(l => l.mes === mes)
    .map(l => { const apt = apts.find(a => a.id === l.aptId); const c = calcular(l, cfg); return { ...l, apt, ...c }; })
    .sort((a, b) => sortApts(a.apt || {}, b.apt || {}));

  const totM3  = linhas.reduce((s, r) => s + r.m3,  0);
  const totKg  = linhas.reduce((s, r) => s + r.kg,  0);
  const totVal = linhas.reduce((s, r) => s + r.val, 0);

  // ─── EXPORTAR CSV ──────────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = "Apto\tMedidor\tMorador\tData Ant.\tLeit. Ant.\tData Atu.\tLeit. Atu.\tPreço/kg\tTaxa Conv.\tCons. m³\tCons. kg\tStatus\tValor R$\n";
    const rows   = linhas.map(r => [r.apt?.numero || "-", r.apt?.medidor || "-", r.apt?.morador || "-", r.dataAnt || "-", r.leitAnt.toFixed(3), r.dataAtu || "-", r.leitAtu.toFixed(3), cfg.precoKg.toFixed(2), cfg.taxaConversao, r.m3.toFixed(3), r.kg.toFixed(3), r.status || "Faturar", r.val.toFixed(2)].join("\t")).join("\n");
    const total  = `\t\t\t\t\t\t\tTOTAL\t\t${totM3.toFixed(3)}\t${totKg.toFixed(3)}\t\t${totVal.toFixed(2)}`;
    const blob   = new Blob(["\ufeff" + header + rows + "\n" + total], { type: "text/csv;charset=utf-8;" });
    const a      = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `gas_${mes}.csv`; a.click();
    notify("CSV exportado! Abra no Excel.");
  };

  // ─── EXPORTAR PDF ──────────────────────────────────────────────────────────
  const exportPDF = async () => {
    setGerandoPDF(true);
    try {
      // Carrega jsPDF dinamicamente
      await new Promise((resolve, reject) => {
        if (window.jspdf) return resolve();
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
      await new Promise((resolve, reject) => {
        if (window.jspdf?.jsPDF?.API?.autoTable || window.jspdf?.autoTable) return resolve();
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();

      // ── CABEÇALHO ─────────────────────────────────────────────────────────
      doc.setFillColor(15, 25, 35);
      doc.rect(0, 0, W, 32, "F");

      doc.setTextColor(29, 158, 117);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("GasCondomínio", 14, 13);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Sistema de Gestão de Consumo de Gás", 14, 20);

      doc.setTextColor(241, 245, 249);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(`Relatório de Consumo — ${fmtM(mes)}`, 14, 28);

      // Data de geração
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const agora = new Date().toLocaleString("pt-BR");
      doc.text(`Gerado em: ${agora}`, W - 14, 28, { align: "right" });

      // ── PARÂMETROS ────────────────────────────────────────────────────────
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(14, 36, W - 28, 18, 2, 2, "F");
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text("PARÂMETROS DO MÊS", 20, 43);
      doc.setTextColor(241, 245, 249);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Preço/kg: ${fmtR(cfg.precoKg)}`, 20, 50);
      doc.text(`Taxa conversão: ${cfg.taxaConversao}`, 75, 50);
      doc.text(`Período: ${mes}`, 135, 50);

      // ── TOTAIS ────────────────────────────────────────────────────────────
      const boxY = 58;
      const boxW = (W - 28 - 8) / 3;
      const boxes = [
        { label: "Consumo Total",   value: `${fmtN(totM3)} m³`,  sub: "metros cúbicos",    cor: [29, 158, 117] },
        { label: "Consumo em kg",   value: `${fmtN(totKg)} kg`,  sub: "quilogramas",       cor: [55, 138, 221] },
        { label: "Total a Cobrar",  value: fmtR(totVal),         sub: "valor total",        cor: [29, 158, 117] },
      ];
      boxes.forEach((b, i) => {
        const x = 14 + i * (boxW + 4);
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(x, boxY, boxW, 20, 2, 2, "F");
        doc.setTextColor(...b.cor);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(b.label.toUpperCase(), x + 4, boxY + 6);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(241, 245, 249);
        doc.text(b.value, x + 4, boxY + 13);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(b.sub, x + 4, boxY + 18);
      });

      // ── TABELA DETALHADA ──────────────────────────────────────────────────
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(148, 163, 184);
      doc.text("DETALHAMENTO POR APARTAMENTO", 14, 86);

      const tableBody = linhas.map(r => [
        r.apt?.numero || "-",
        r.apt?.medidor || "-",
        r.apt?.morador || "—",
        r.dataAnt || "-",
        fmtN(r.leitAnt),
        r.dataAtu || "-",
        fmtN(r.leitAtu),
        fmtN(r.m3),
        fmtN(r.kg),
        r.status || "Faturar",
        fmtR(r.val),
      ]);

      // Linha de total
      tableBody.push([
        { content: "TOTAL", colSpan: 7, styles: { fontStyle: "bold", halign: "right", fillColor: [15, 25, 35], textColor: [148, 163, 184] } },
        { content: fmtN(totM3), styles: { fontStyle: "bold", fillColor: [15, 25, 35], textColor: [241, 245, 249] } },
        { content: fmtN(totKg), styles: { fontStyle: "bold", fillColor: [15, 25, 35], textColor: [96, 165, 250] } },
        { content: "", styles: { fillColor: [15, 25, 35] } },
        { content: fmtR(totVal), styles: { fontStyle: "bold", fillColor: [15, 25, 35], textColor: [52, 211, 153] } },
      ]);

      doc.autoTable({
        startY: 90,
        head: [["Apto", "Medidor", "Morador", "Data Ant.", "Leit. Ant.", "Data Atu.", "Leit. Atu.", "Cons. m³", "Cons. kg", "Status", "Valor R$"]],
        body: tableBody,
        theme: "plain",
        styles: {
          fontSize: 8,
          cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
          textColor: [241, 245, 249],
          fillColor: [30, 41, 59],
          lineColor: [51, 65, 85],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [15, 25, 35],
          textColor: [148, 163, 184],
          fontStyle: "bold",
          fontSize: 7.5,
        },
        alternateRowStyles: { fillColor: [15, 23, 42] },
        columnStyles: {
          0:  { fontStyle: "bold", cellWidth: 12 },
          1:  { cellWidth: 28, fontSize: 7 },
          2:  { cellWidth: 28 },
          3:  { cellWidth: 18, fontSize: 7 },
          4:  { cellWidth: 18, halign: "right" },
          5:  { cellWidth: 18, fontSize: 7 },
          6:  { cellWidth: 18, halign: "right" },
          7:  { cellWidth: 16, halign: "right" },
          8:  { cellWidth: 16, halign: "right", textColor: [96, 165, 250] },
          9:  { cellWidth: 14 },
          10: { cellWidth: 20, halign: "right", textColor: [52, 211, 153], fontStyle: "bold" },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Rodapé em cada página
          const pageH = doc.internal.pageSize.getHeight();
          doc.setFillColor(15, 25, 35);
          doc.rect(0, pageH - 10, W, 10, "F");
          doc.setFontSize(7);
          doc.setTextColor(71, 85, 105);
          doc.text("GasCondomínio — Sistema de Gestão de Consumo de Gás", 14, pageH - 3);
          doc.text(`Pág. ${data.pageNumber}`, W - 14, pageH - 3, { align: "right" });
        },
      });

      // ── RESUMO SIMPLIFICADO (segunda folha para administradora) ───────────
      doc.addPage();
      const pH = doc.internal.pageSize.getHeight();

      doc.setFillColor(15, 25, 35);
      doc.rect(0, 0, W, 28, "F");
      doc.setTextColor(29, 158, 117);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("GasCondomínio", 14, 12);
      doc.setTextColor(241, 245, 249);
      doc.setFontSize(12);
      doc.text(`Resumo para Administradora — ${fmtM(mes)}`, 14, 22);

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(agora, W - 14, 22, { align: "right" });

      // Instrução
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(14, 32, W - 28, 10, 2, 2, "F");
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text(`Preço/kg: ${fmtR(cfg.precoKg)}   ·   Taxa de conversão: ${cfg.taxaConversao}   ·   Total geral: ${fmtR(totVal)}`, 20, 38.5);

      // Tabela resumida
      doc.autoTable({
        startY: 46,
        head: [["Apartamento", "Morador", "Consumo (m³)", "Consumo (kg)", "Valor a Cobrar"]],
        body: [
          ...linhas.map(r => [
            `Apto ${r.apt?.numero || "-"}`,
            r.apt?.morador || "—",
            fmtN(r.m3) + " m³",
            fmtN(r.kg) + " kg",
            fmtR(r.val),
          ]),
          [
            { content: "TOTAL", colSpan: 2, styles: { fontStyle: "bold", halign: "right", fillColor: [15, 25, 35], textColor: [148, 163, 184] } },
            { content: fmtN(totM3) + " m³", styles: { fontStyle: "bold", fillColor: [15, 25, 35], textColor: [241, 245, 249] } },
            { content: fmtN(totKg) + " kg", styles: { fontStyle: "bold", fillColor: [15, 25, 35], textColor: [96, 165, 250] } },
            { content: fmtR(totVal), styles: { fontStyle: "bold", fillColor: [15, 25, 35], textColor: [52, 211, 153], fontSize: 11 } },
          ]
        ],
        theme: "plain",
        styles: {
          fontSize: 10,
          cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
          textColor: [241, 245, 249],
          fillColor: [30, 41, 59],
          lineColor: [51, 65, 85],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [15, 25, 35],
          textColor: [148, 163, 184],
          fontStyle: "bold",
          fontSize: 9,
        },
        alternateRowStyles: { fillColor: [15, 23, 42] },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 30 },
          1: { cellWidth: 60 },
          2: { halign: "right", cellWidth: 32 },
          3: { halign: "right", cellWidth: 32, textColor: [96, 165, 250] },
          4: { halign: "right", fontStyle: "bold", textColor: [52, 211, 153] },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          doc.setFillColor(15, 25, 35);
          doc.rect(0, pH - 10, W, 10, "F");
          doc.setFontSize(7);
          doc.setTextColor(71, 85, 105);
          doc.text("GasCondomínio — Sistema de Gestão de Consumo de Gás", 14, pH - 3);
          doc.text(`Pág. ${data.pageNumber}`, W - 14, pH - 3, { align: "right" });
        },
      });

      doc.save(`relatorio_gas_${mes}.pdf`);
      notify("PDF gerado com sucesso!");
    } catch (err) {
      console.error(err);
      notify("Erro ao gerar PDF. Tente novamente.", "error");
    } finally {
      setGerandoPDF(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <select style={{ ...SEL, width: "auto", flex: "1 1 130px" }} value={mes} onChange={e => setMes(e.target.value)}>
          {meses.map(m => <option key={m} value={m}>{fmtM(m)}</option>)}
        </select>
        <Btn v="secondary" onClick={exportCSV}>⬇️ CSV (Excel)</Btn>
        <Btn v="primary" onClick={exportPDF} disabled={gerandoPDF} style={{ background: "#dc2626" }}>
          {gerandoPDF ? "⏳ Gerando..." : "📄 Exportar PDF"}
        </Btn>
      </div>

      {/* TOTAIS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        <MetricCard label="Total m³" value={`${fmtN(totM3)} m³`} />
        <MetricCard label="Total kg" value={`${fmtN(totKg)} kg`} color="#60a5fa" />
        <MetricCard label="Total R$" value={fmtR(totVal)} color="#34d399" />
      </div>

      {/* LISTA PARA ADMINISTRADORA */}
      <Card>
        <h3 style={{ margin: "0 0 1rem", fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>📋 Valores por apartamento — {fmtM(mes)}</h3>
        {linhas.map((r, i) => {
          const cor = r.status === "Pago" ? "#34d399" : r.status === "Isento" ? "#60a5fa" : "#fbbf24";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: i < linhas.length - 1 ? "1px solid #1e293b" : "none", gap: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 16, minWidth: 50, color: "#f1f5f9" }}>Apto {r.apt?.numero || "-"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>{r.apt?.morador || "—"} · {fmtN(r.m3)} m³ · {fmtN(r.kg)} kg</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#34d399" }}>{fmtR(r.val)}</div>
                <Badge txt={r.status || "Faturar"} color={cor} />
              </div>
            </div>
          );
        })}
        {linhas.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", borderTop: "1px solid #334155", marginTop: 8 }}>
            <span style={{ fontWeight: 700, color: "#94a3b8" }}>TOTAL</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: "#34d399" }}>{fmtR(totVal)}</span>
          </div>
        )}
      </Card>

      {/* AVISO */}
      <div style={{ marginTop: 10, background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#fca5a5" }}>
        📄 O PDF gerado tem <strong>2 páginas</strong>: a primeira com todos os detalhes técnicos e a segunda com o <strong>resumo simplificado para enviar à administradora</strong>.
      </div>
    </div>
  );
}

// ─── HISTÓRICO ────────────────────────────────────────────────────────────────
function PgHistorico() {
  const leituras = S.get("gc3_leituras") || [];
  const apts     = S.get("gc3_apts")     || [];
  const cfg      = S.get("gc3_cfg")      || { precoKg: 9.55, taxaConversao: 2.3 };
  const [aptFiltro, setAptFiltro] = useState("todos");

  const meses = [...new Set(leituras.map(l => l.mes))].sort();

  const dados = useMemo(() => {
    const lista = aptFiltro === "todos" ? leituras : leituras.filter(l => l.aptId === aptFiltro);
    return meses.map(mes => {
      const lMes = lista.filter(l => l.mes === mes);
      const kg   = lMes.reduce((s, l) => s + calcular(l, cfg).kg,  0);
      const val  = lMes.reduce((s, l) => s + calcular(l, cfg).val, 0);
      return { mes: fmtM(mes), kg: +kg.toFixed(3), val: +val.toFixed(2) };
    });
  }, [leituras, aptFiltro, cfg]);

  const CORES = ["#1D9E75", "#378ADD", "#D85A30", "#7F77DD", "#BA7517", "#D4537E"];

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <select style={{ ...SEL, maxWidth: 300 }} value={aptFiltro} onChange={e => setAptFiltro(e.target.value)}>
          <option value="todos">Todos os apartamentos</option>
          {[...apts].sort(sortApts).map(a => <option key={a.id} value={a.id}>Apto {a.numero} — {a.medidor}</option>)}
        </select>
      </div>

      <Card style={{ marginBottom: 10 }}>
        <h3 style={{ margin: "0 0 .875rem", fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>Consumo histórico (kg)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
            <Tooltip formatter={v => [`${fmtN(v)} kg`, "Consumo"]} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
            <Bar dataKey="kg" radius={[4, 4, 0, 0]}>
              {dados.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 style={{ margin: "0 0 .875rem", fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>Valor mensal (R$)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
            <Tooltip formatter={v => [fmtR(v), "Valor"]} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
            <Line type="monotone" dataKey="val" stroke="#34d399" strokeWidth={2} dot={{ r: 4, fill: "#34d399" }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
function PgConfiguracao({ notify }) {
  const [form, setForm] = useState(S.get("gc3_cfg") || { precoKg: 9.55, taxaConversao: 2.3, precoServico: 0 });

  const salvar = () => {
    if (!form.precoKg || !form.taxaConversao) return notify("Preencha todos os campos", "error");
    S.set("gc3_cfg", { precoKg: +form.precoKg, taxaConversao: +form.taxaConversao, precoServico: +(form.precoServico || 0) });
    notify("Configuração salva! Todos os cálculos foram atualizados.");
  };

  const ex    = { leitAnt: 0, leitAtu: 2.5 };
  const exC   = calcular(ex, { precoKg: +form.precoKg || 9.55, taxaConversao: +form.taxaConversao || 2.3, precoServico: +(form.precoServico || 0) });

  return (
    <div style={{ maxWidth: 480 }}>
      <Card style={{ marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>⚙️ Parâmetros de cálculo</h3>
        <div style={{ background: "rgba(55,138,221,.1)", border: "1px solid rgba(55,138,221,.25)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#60a5fa" }}>
          📐 Consumo m³ × Taxa = kg → kg × Preço/kg = Valor R$
        </div>
        <Fld label="Preço por kg do gás (R$)" req>
          <input style={INP} type="number" step="0.01" value={form.precoKg} onChange={e => setForm(f => ({ ...f, precoKg: e.target.value }))} />
          <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Valor na sua planilha: R$ 9,55</div>
        </Fld>
        <Fld label="Taxa de conversão m³ → kg" req>
          <input style={INP} type="number" step="0.01" value={form.taxaConversao} onChange={e => setForm(f => ({ ...f, taxaConversao: e.target.value }))} />
          <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Valor na sua planilha: 2,30</div>
        </Fld>
        <Fld label="Taxa de serviço por apartamento (R$)">
          <input style={INP} type="number" step="0.01" value={form.precoServico} onChange={e => setForm(f => ({ ...f, precoServico: e.target.value }))} placeholder="0,00" />
          <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Deixe 0 se não cobrar separado</div>
        </Fld>
        <Btn onClick={salvar} style={{ width: "100%", padding: 12, fontSize: 14 }}>💾 Salvar configuração</Btn>
      </Card>

      <Card>
        <h3 style={{ margin: "0 0 1rem", fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>🧮 Exemplo com {fmtN(ex.leitAtu - ex.leitAnt)} m³</h3>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontSize: 13, alignItems: "center" }}>
          <span style={{ color: "#64748b" }}>Consumo:</span>         <strong>{fmtN(exC.m3)} m³</strong>
          <span style={{ color: "#64748b" }}>× Taxa {form.taxaConversao}:</span> <strong style={{ color: "#60a5fa" }}>{fmtN(exC.kg)} kg</strong>
          <span style={{ color: "#64748b" }}>× Preço {fmtR(+form.precoKg||0)}/kg:</span> <strong style={{ color: "#34d399", fontSize: 16 }}>{fmtR(exC.val)}</strong>
        </div>
      </Card>
    </div>
  );
}
