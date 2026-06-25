/**
 * GasCondomínio — Sistema de Gestão de Consumo de Gás
 * React SPA com persistência em localStorage
 * Pronto para integração com API REST (Node.js + Express + PostgreSQL)
 */

 import { useState, useEffect, useMemo, useCallback } from "react";
 import {
   BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
   Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
 } from "recharts";
 
 // ─── STORAGE SERVICE ──────────────────────────────────────────────────────────
 const db = {
   get: (key) => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } },
   set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
   seed: () => {
     if (db.get("gc_seeded")) return;
     const condo = [{ id: "c1", nome: "Residencial Solar do Norte", cnpj: "12.345.678/0001-99", endereco: "Rua das Acácias, 100, Parnamirim/RN", totalBlocos: 2, createdAt: "2024-01-01" }];
     const blocos = [
       { id: "b1", condominioId: "c1", nome: "Bloco A", andares: 4 },
       { id: "b2", condominioId: "c1", nome: "Bloco B", andares: 4 },
     ];
     const apts = [
       { id: "a1", blocoId: "b1", numero: "101", andar: 1, area: 65, tipo: "2 quartos" },
       { id: "a2", blocoId: "b1", numero: "102", andar: 1, area: 65, tipo: "2 quartos" },
       { id: "a3", blocoId: "b1", numero: "201", andar: 2, area: 80, tipo: "3 quartos" },
       { id: "a4", blocoId: "b1", numero: "202", andar: 2, area: 80, tipo: "3 quartos" },
       { id: "a5", blocoId: "b2", numero: "101", andar: 1, area: 55, tipo: "1 quarto" },
       { id: "a6", blocoId: "b2", numero: "102", andar: 1, area: 55, tipo: "1 quarto" },
       { id: "a7", blocoId: "b2", numero: "201", andar: 2, area: 70, tipo: "2 quartos" },
       { id: "a8", blocoId: "b2", numero: "202", andar: 2, area: 70, tipo: "2 quartos" },
     ];
     const moradores = [
       { id: "m1", aptId: "a1", nome: "Carlos Eduardo Souza", cpf: "123.456.789-00", email: "carlos@email.com", telefone: "(84) 99999-1111", proprietario: true },
       { id: "m2", aptId: "a2", nome: "Ana Paula Ferreira", cpf: "234.567.890-11", email: "ana@email.com", telefone: "(84) 99999-2222", proprietario: true },
       { id: "m3", aptId: "a3", nome: "Roberto Lima Santos", cpf: "345.678.901-22", email: "roberto@email.com", telefone: "(84) 99999-3333", proprietario: false },
       { id: "m4", aptId: "a4", nome: "Fernanda Costa Melo", cpf: "456.789.012-33", email: "fernanda@email.com", telefone: "(84) 99999-4444", proprietario: true },
       { id: "m5", aptId: "a5", nome: "João Pedro Alves", cpf: "567.890.123-44", email: "joao@email.com", telefone: "(84) 99999-5555", proprietario: true },
       { id: "m6", aptId: "a6", nome: "Maria Claudia Torres", cpf: "678.901.234-55", email: "maria@email.com", telefone: "(84) 99999-6666", proprietario: false },
       { id: "m7", aptId: "a7", nome: "Paulo Henrique Nobre", cpf: "789.012.345-66", email: "paulo@email.com", telefone: "(84) 99999-7777", proprietario: true },
       { id: "m8", aptId: "a8", nome: "Juliana Ramos Barros", cpf: "890.123.456-77", email: "juliana@email.com", telefone: "(84) 99999-8888", proprietario: true },
     ];
     const medidores = [
       { id: "med1", aptId: "a1", numero: "MED-001", marca: "Elster", instalacao: "2023-01-15", ativo: true },
       { id: "med2", aptId: "a2", numero: "MED-002", marca: "Elster", instalacao: "2023-01-15", ativo: true },
       { id: "med3", aptId: "a3", numero: "MED-003", marca: "Itron", instalacao: "2023-01-15", ativo: true },
       { id: "med4", aptId: "a4", numero: "MED-004", marca: "Itron", instalacao: "2023-01-15", ativo: true },
       { id: "med5", aptId: "a5", numero: "MED-005", marca: "Elster", instalacao: "2023-01-15", ativo: true },
       { id: "med6", aptId: "a6", numero: "MED-006", marca: "Elster", instalacao: "2023-01-15", ativo: true },
       { id: "med7", aptId: "a7", numero: "MED-007", marca: "Itron", instalacao: "2023-01-15", ativo: true },
       { id: "med8", aptId: "a8", numero: "MED-008", marca: "Itron", instalacao: "2023-01-15", ativo: true },
     ];
     // Leituras dos últimos 4 meses
     const baseReadings = [10, 22, 18, 30, 8, 15, 25, 12];
     const meses = ["2025-03", "2025-04", "2025-05", "2025-06"];
     let leituras = [];
     let faturas = [];
     let lid = 1, fid = 1;
     meses.forEach((mes, mi) => {
       let totalConsumo = 0;
       medidores.forEach((med, idx) => {
         const anterior = mi === 0 ? baseReadings[idx] * 10 : (baseReadings[idx] * 10 + baseReadings[idx] * (mi * 1.1));
         const atual = anterior + baseReadings[idx] + Math.round(Math.random() * 5);
         const consumo = parseFloat((atual - anterior).toFixed(3));
         totalConsumo += consumo;
         leituras.push({
           id: `l${lid++}`, medidorId: med.id, aptId: med.aptId,
           mes, dataLeitura: `${mes}-28`,
           leituraAnterior: parseFloat(anterior.toFixed(3)),
           leituraAtual: parseFloat(atual.toFixed(3)),
           consumo, observacao: ""
         });
       });
       const valorTotal = 180 + mi * 12 + Math.round(Math.random() * 20);
       faturas.push({
         id: `f${fid++}`, condominioId: "c1", mes,
         valorTotalFatura: valorTotal,
         consumoTotalConcessionaria: parseFloat(totalConsumo.toFixed(3)),
         valorM3: parseFloat((valorTotal / totalConsumo).toFixed(4)),
         status: mi < 3 ? "pago" : "aberto",
         createdAt: `${mes}-01`
       });
     });
     const pagamentos = [
       { id: "pg1", faturaId: "f1", aptId: "a1", valor: 28.5, status: "pago", dataPagamento: "2025-04-05" },
       { id: "pg2", faturaId: "f1", aptId: "a2", valor: 31.2, status: "pago", dataPagamento: "2025-04-03" },
       { id: "pg3", faturaId: "f2", aptId: "a1", valor: 29.8, status: "pago", dataPagamento: "2025-05-06" },
     ];
     const usuarios = [
       { id: "u1", nome: "Administrador", email: "admin@gascondominio.com", senha: "admin123", perfil: "admin" },
       { id: "u2", nome: "Síndico", email: "sindico@gascondominio.com", senha: "sindico123", perfil: "funcionario" },
     ];
     const logs = [];
     db.set("gc_condominios", condo);
     db.set("gc_blocos", blocos);
     db.set("gc_apartamentos", apts);
     db.set("gc_moradores", moradores);
     db.set("gc_medidores", medidores);
     db.set("gc_leituras", leituras);
     db.set("gc_faturas", faturas);
     db.set("gc_pagamentos", pagamentos);
     db.set("gc_usuarios", usuarios);
     db.set("gc_logs", logs);
     db.set("gc_seeded", true);
   }
 };
 
 // ─── UTILITIES ────────────────────────────────────────────────────────────────
 const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
 const fmt = (n, decimals = 2) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
 const fmtBRL = (n) => `R$ ${fmt(n)}`;
 const fmtMes = (ym) => { if (!ym) return ""; const [y, m] = ym.split("-"); const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]; return `${meses[+m-1]}/${y}`; };
 const logOp = (acao, entidade, id, detalhes) => {
   const logs = db.get("gc_logs") || [];
   logs.unshift({ id: uid(), acao, entidade, entidadeId: id, detalhes, usuario: "admin", timestamp: new Date().toISOString() });
   db.set("gc_logs", logs.slice(0, 200));
 };
 
 // ─── COLORS ───────────────────────────────────────────────────────────────────
 const COLORS = ["#1D9E75","#378ADD","#D85A30","#D4537E","#BA7517","#7F77DD","#E24B4A","#639922"];
 const STATUS_COLOR = { pago: "#1D9E75", aberto: "#BA7517", vencido: "#E24B4A" };
 
 // ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
 const useAuth = () => {
   const [user, setUser] = useState(() => db.get("gc_session"));
   const login = (email, senha) => {
     const users = db.get("gc_usuarios") || [];
     const found = users.find(u => u.email === email && u.senha === senha);
     if (found) { const s = { id: found.id, nome: found.nome, email: found.email, perfil: found.perfil }; db.set("gc_session", s); setUser(s); return true; }
     return false;
   };
   const logout = () => { db.set("gc_session", null); setUser(null); };
   return { user, login, logout };
 };
 
 // ─── MAIN APP ─────────────────────────────────────────────────────────────────
 export default function App() {
   const { user, login, logout } = useAuth();
   const [nav, setNav] = useState("dashboard");
   const [sideOpen, setSideOpen] = useState(true);
   const [toast, setToast] = useState(null);
 
   useEffect(() => { db.seed(); }, []);
 
   const notify = useCallback((msg, type = "success") => {
     setToast({ msg, type });
     setTimeout(() => setToast(null), 3500);
   }, []);
 
   if (!user) return <LoginPage login={login} />;
 
   const MENU = [
     { id: "dashboard", icon: "⬡", label: "Dashboard" },
     { id: "condominios", icon: "🏢", label: "Condomínio" },
     { id: "blocos", icon: "🏗️", label: "Blocos" },
     { id: "apartamentos", icon: "🏠", label: "Apartamentos" },
     { id: "moradores", icon: "👥", label: "Moradores" },
     { id: "medidores", icon: "🔢", label: "Medidores" },
     { id: "leituras", icon: "📊", label: "Leituras" },
     { id: "faturas", icon: "💰", label: "Faturas" },
     { id: "relatorios", icon: "📈", label: "Relatórios" },
     { id: "logs", icon: "📋", label: "Logs" },
   ];
 
   const pages = { dashboard: Dashboard, condominios: CondominioPage, blocos: BlocosPage, apartamentos: ApartamentosPage, moradores: MoradoresPage, medidores: MedidoresPage, leituras: LeiturasPage, faturas: FaturasPage, relatorios: RelatoriosPage, logs: LogsPage };
   const Page = pages[nav] || Dashboard;
 
   return (
     <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter',system-ui,sans-serif", background: "var(--color-background-tertiary)", color: "var(--color-text-primary)" }}>
       {/* SIDEBAR */}
       <aside style={{ width: sideOpen ? 220 : 64, flexShrink: 0, background: "#0f1923", color: "#e2e8f0", display: "flex", flexDirection: "column", transition: "width .2s ease", overflow: "hidden" }}>
         <div style={{ padding: "1rem", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,.08)", minHeight: 60 }}>
           <span style={{ fontSize: 22, flexShrink: 0 }}>🔥</span>
           {sideOpen && <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: .5, whiteSpace: "nowrap", color: "#1D9E75" }}>GasCondomínio</span>}
         </div>
         <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
           {MENU.map(m => (
             <button key={m.id} onClick={() => setNav(m.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", border: "none", background: nav === m.id ? "rgba(29,158,117,.18)" : "transparent", color: nav === m.id ? "#1D9E75" : "#94a3b8", cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: nav === m.id ? 600 : 400, borderLeft: nav === m.id ? "3px solid #1D9E75" : "3px solid transparent", transition: "all .15s" }}>
               <span style={{ fontSize: 16, flexShrink: 0 }}>{m.icon}</span>
               {sideOpen && <span style={{ whiteSpace: "nowrap" }}>{m.label}</span>}
             </button>
           ))}
         </nav>
         <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
           {sideOpen && <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, whiteSpace: "nowrap" }}>👤 {user.nome} ({user.perfil})</div>}
           <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(226,75,74,.15)", border: "1px solid rgba(226,75,74,.3)", color: "#f09595", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12, width: "100%" }}>
             <span>🚪</span>{sideOpen && "Sair"}
           </button>
         </div>
       </aside>
 
       {/* MAIN */}
       <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
         {/* TOPBAR */}
         <header style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0 1.5rem", height: 56, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
           <button onClick={() => setSideOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--color-text-secondary)", padding: 4 }}>☰</button>
           <h1 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>{MENU.find(m => m.id === nav)?.label}</h1>
           <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-text-tertiary)" }}>{new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
         </header>
 
         {/* PAGE CONTENT */}
         <main style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
           <Page notify={notify} user={user} />
         </main>
       </div>
 
       {/* TOAST */}
       {toast && (
         <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: toast.type === "success" ? "#0F6E56" : toast.type === "error" ? "#A32D2D" : "#854F0B", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,.25)", maxWidth: 340 }}>
           {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "⚠️"} {toast.msg}
         </div>
       )}
     </div>
   );
 }
 
 // ─── LOGIN ────────────────────────────────────────────────────────────────────
 function LoginPage({ login }) {
   const [email, setEmail] = useState("admin@gascondominio.com");
   const [senha, setSenha] = useState("admin123");
   const [err, setErr] = useState("");
   const [loading, setLoading] = useState(false);
 
   const handleLogin = async (e) => {
     e.preventDefault();
     setLoading(true);
     setTimeout(() => {
       if (!login(email, senha)) setErr("Credenciais inválidas.");
       setLoading(false);
     }, 600);
   };
 
   return (
     <div style={{ minHeight: "100vh", background: "#0f1923", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif" }}>
       <div style={{ width: 380, background: "#162030", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "2.5rem", boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
         <div style={{ textAlign: "center", marginBottom: "2rem" }}>
           <div style={{ fontSize: 48, marginBottom: 12 }}>🔥</div>
           <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#e2e8f0" }}>GasCondomínio</h1>
           <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>Gestão de consumo de gás</p>
         </div>
         <form onSubmit={handleLogin}>
           <div style={{ marginBottom: 16 }}>
             <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>E-mail</label>
             <input value={email} onChange={e => setEmail(e.target.value)} type="email" required style={{ width: "100%", padding: "10px 12px", background: "#0f1923", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, color: "#e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
           </div>
           <div style={{ marginBottom: 20 }}>
             <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Senha</label>
             <input value={senha} onChange={e => setSenha(e.target.value)} type="password" required style={{ width: "100%", padding: "10px 12px", background: "#0f1923", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, color: "#e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
           </div>
           {err && <p style={{ color: "#f09595", fontSize: 13, marginBottom: 12 }}>{err}</p>}
           <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? "wait" : "pointer" }}>
             {loading ? "Autenticando..." : "Entrar"}
           </button>
         </form>
         <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#475569" }}>
           admin@gascondominio.com / admin123
         </p>
       </div>
     </div>
   );
 }
 
 // ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
 function Card({ children, style = {} }) {
   return <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "1.25rem", ...style }}>{children}</div>;
 }
 
 function MetricCard({ label, value, sub, icon, color = "#1D9E75" }) {
   return (
     <div style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: 4 }}>
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
         <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500 }}>{label}</span>
         <span style={{ fontSize: 20 }}>{icon}</span>
       </div>
       <span style={{ fontSize: 26, fontWeight: 600, color: "var(--color-text-primary)" }}>{value}</span>
       {sub && <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{sub}</span>}
     </div>
   );
 }
 
 function Table({ cols, rows, empty = "Nenhum registro encontrado." }) {
   if (!rows.length) return <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-tertiary)", fontSize: 14 }}>{empty}</div>;
   return (
     <div style={{ overflowX: "auto" }}>
       <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
         <thead>
           <tr style={{ background: "var(--color-background-secondary)" }}>
             {cols.map((c, i) => <th key={i} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 500, color: "var(--color-text-secondary)", whiteSpace: "nowrap", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{c.label}</th>)}
           </tr>
         </thead>
         <tbody>
           {rows.map((r, ri) => (
             <tr key={ri} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
               {cols.map((c, ci) => <td key={ci} style={{ padding: "10px 12px", color: "var(--color-text-primary)" }}>{c.render ? c.render(r) : r[c.key]}</td>)}
             </tr>
           ))}
         </tbody>
       </table>
     </div>
   );
 }
 
 function Badge({ children, color = "#1D9E75", bg }) {
   return <span style={{ background: bg || `${color}22`, color, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20 }}>{children}</span>;
 }
 
 function Modal({ title, onClose, children, width = 520 }) {
   return (
     <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
       <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto" }}>
         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
           <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{title}</h2>
           <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--color-text-secondary)" }}>×</button>
         </div>
         <div style={{ padding: "1.25rem" }}>{children}</div>
       </div>
     </div>
   );
 }
 
 function FormField({ label, required, children }) {
   return (
     <div style={{ marginBottom: 16 }}>
       <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>{label}{required && <span style={{ color: "#E24B4A" }}> *</span>}</label>
       {children}
     </div>
   );
 }
 
 const inputStyle = { width: "100%", padding: "9px 11px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 7, fontSize: 14, background: "var(--color-background-primary)", color: "var(--color-text-primary)", boxSizing: "border-box" };
 const selectStyle = { ...inputStyle };
 
 function Btn({ children, onClick, variant = "primary", disabled, type = "button", style = {} }) {
   const styles = {
     primary: { background: "#1D9E75", color: "#fff", border: "none" },
     danger: { background: "#E24B4A", color: "#fff", border: "none" },
     secondary: { background: "var(--color-background-secondary)", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)" },
   };
   return <button type={type} onClick={onClick} disabled={disabled} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .6 : 1, ...styles[variant], ...style }}>{children}</button>;
 }
 
 // ─── DASHBOARD ────────────────────────────────────────────────────────────────
 function Dashboard({ notify }) {
   const leituras = db.get("gc_leituras") || [];
   const faturas = db.get("gc_faturas") || [];
   const apts = db.get("gc_apartamentos") || [];
   const moradores = db.get("gc_moradores") || [];
   const medidores = db.get("gc_medidores") || [];
 
   const meses = [...new Set(leituras.map(l => l.mes))].sort();
   const ultimoMes = meses[meses.length - 1];
   const leiturasUltimo = leituras.filter(l => l.mes === ultimoMes);
   const consumoTotal = leiturasUltimo.reduce((s, l) => s + (l.consumo || 0), 0);
   const faturaAtual = faturas.find(f => f.mes === ultimoMes);
 
   // Consumo por mês para gráfico
   const consumoMensal = meses.map(mes => ({
     mes: fmtMes(mes),
     consumo: parseFloat(leituras.filter(l => l.mes === mes).reduce((s, l) => s + (l.consumo || 0), 0).toFixed(2)),
     fatura: (faturas.find(f => f.mes === mes)?.valorTotalFatura || 0),
   }));
 
   // Top consumidores
   const ranking = apts.map(apt => {
     const lApt = leiturasUltimo.filter(l => l.aptId === apt.id);
     const consumo = lApt.reduce((s, l) => s + l.consumo, 0);
     const morador = moradores.find(m => m.aptId === apt.id);
     return { apt: apt.numero, bloco: apt.blocoId, morador: morador?.nome || "-", consumo };
   }).sort((a, b) => b.consumo - a.consumo).slice(0, 5);
 
   const mediaConsumo = consumoTotal / (leiturasUltimo.length || 1);
 
   return (
     <div>
       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
         <MetricCard label="Consumo total" value={`${fmt(consumoTotal)} m³`} sub={`Ref: ${fmtMes(ultimoMes)}`} icon="⛽" />
         <MetricCard label="Valor da fatura" value={fmtBRL(faturaAtual?.valorTotalFatura || 0)} sub="Mês atual" icon="💰" color="#378ADD" />
         <MetricCard label="Valor do m³" value={fmtBRL(faturaAtual?.valorM3 || 0)} sub="Custo unitário" icon="📐" color="#D85A30" />
         <MetricCard label="Consumo médio" value={`${fmt(mediaConsumo)} m³`} sub="Por apartamento" icon="📊" color="#D4537E" />
         <MetricCard label="Apartamentos" value={apts.length} sub={`${medidores.filter(m => m.ativo).length} medidores ativos`} icon="🏠" color="#7F77DD" />
         <MetricCard label="Moradores" value={moradores.length} sub="Cadastrados" icon="👥" color="#BA7517" />
       </div>
 
       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
         <Card>
           <h3 style={{ margin: "0 0 1rem", fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)" }}>Evolução mensal de consumo</h3>
           <ResponsiveContainer width="100%" height={220}>
             <LineChart data={consumoMensal}>
               <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.15)" />
               <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }} />
               <YAxis tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }} />
               <Tooltip formatter={(v) => [`${fmt(v)} m³`, "Consumo"]} />
               <Line type="monotone" dataKey="consumo" stroke="#1D9E75" strokeWidth={2} dot={{ r: 4 }} />
             </LineChart>
           </ResponsiveContainer>
         </Card>
 
         <Card>
           <h3 style={{ margin: "0 0 1rem", fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)" }}>Fatura mensal (R$)</h3>
           <ResponsiveContainer width="100%" height={220}>
             <BarChart data={consumoMensal}>
               <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.15)" />
               <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }} />
               <YAxis tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }} />
               <Tooltip formatter={(v) => [fmtBRL(v), "Valor"]} />
               <Bar dataKey="fatura" fill="#378ADD" radius={[4, 4, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
         </Card>
       </div>
 
       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
         <Card>
           <h3 style={{ margin: "0 0 1rem", fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)" }}>🏆 Maiores consumidores — {fmtMes(ultimoMes)}</h3>
           {ranking.map((r, i) => (
             <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
               <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{["🥇","🥈","🥉","4️⃣","5️⃣"][i]}</span>
               <div style={{ flex: 1 }}>
                 <div style={{ fontSize: 13, fontWeight: 500 }}>Apto {r.apt} — {r.morador}</div>
                 <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Bloco {r.bloco === "b1" ? "A" : "B"}</div>
               </div>
               <div style={{ textAlign: "right" }}>
                 <div style={{ fontSize: 14, fontWeight: 600, color: i === 0 ? "#D85A30" : "var(--color-text-primary)" }}>{fmt(r.consumo)} m³</div>
               </div>
             </div>
           ))}
         </Card>
 
         <Card>
           <h3 style={{ margin: "0 0 1rem", fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)" }}>Status das faturas</h3>
           {faturas.slice().reverse().map(f => (
             <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
               <div>
                 <div style={{ fontSize: 13, fontWeight: 500 }}>{fmtMes(f.mes)}</div>
                 <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{fmt(f.consumoTotalConcessionaria)} m³ · {fmtBRL(f.valorTotalFatura)}</div>
               </div>
               <Badge color={STATUS_COLOR[f.status]} >{f.status.toUpperCase()}</Badge>
             </div>
           ))}
         </Card>
       </div>
     </div>
   );
 }
 
 // ─── CONDOMÍNIO ───────────────────────────────────────────────────────────────
 function CondominioPage({ notify }) {
   const [data, setData] = useState(db.get("gc_condominios") || []);
   const [modal, setModal] = useState(false);
   const [form, setForm] = useState({ nome: "", cnpj: "", endereco: "", totalBlocos: 1 });
   const [editing, setEditing] = useState(null);
 
   const save = () => {
     if (!form.nome) return notify("Nome obrigatório", "error");
     const list = db.get("gc_condominios") || [];
     if (editing) {
       const updated = list.map(i => i.id === editing.id ? { ...i, ...form } : i);
       db.set("gc_condominios", updated); setData(updated);
       logOp("editar", "condominio", editing.id, form.nome);
       notify("Condomínio atualizado!");
     } else {
       const novo = { id: uid(), ...form, createdAt: new Date().toISOString().slice(0, 10) };
       const updated = [...list, novo]; db.set("gc_condominios", updated); setData(updated);
       logOp("criar", "condominio", novo.id, form.nome);
       notify("Condomínio cadastrado!");
     }
     setModal(false); setEditing(null); setForm({ nome: "", cnpj: "", endereco: "", totalBlocos: 1 });
   };
 
   const remove = (item) => {
     if (!confirm(`Remover "${item.nome}"?`)) return;
     const updated = (db.get("gc_condominios") || []).filter(i => i.id !== item.id);
     db.set("gc_condominios", updated); setData(updated);
     logOp("excluir", "condominio", item.id, item.nome);
     notify("Condomínio removido!", "warning");
   };
 
   const openEdit = (item) => { setEditing(item); setForm({ nome: item.nome, cnpj: item.cnpj, endereco: item.endereco, totalBlocos: item.totalBlocos }); setModal(true); };
 
   return (
     <div>
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
         <div />
         <Btn onClick={() => { setEditing(null); setForm({ nome: "", cnpj: "", endereco: "", totalBlocos: 1 }); setModal(true); }}>+ Novo Condomínio</Btn>
       </div>
       <Card>
         <Table
           cols={[
             { key: "nome", label: "Nome" },
             { key: "cnpj", label: "CNPJ" },
             { key: "endereco", label: "Endereço" },
             { key: "totalBlocos", label: "Blocos" },
             { key: "createdAt", label: "Cadastro" },
             { label: "Ações", render: (r) => <div style={{ display: "flex", gap: 6 }}><Btn variant="secondary" onClick={() => openEdit(r)}>Editar</Btn><Btn variant="danger" onClick={() => remove(r)}>Remover</Btn></div> },
           ]}
           rows={data}
         />
       </Card>
       {modal && (
         <Modal title={editing ? "Editar Condomínio" : "Novo Condomínio"} onClose={() => setModal(false)}>
           <FormField label="Nome do Condomínio" required><input style={inputStyle} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></FormField>
           <FormField label="CNPJ"><input style={inputStyle} value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" /></FormField>
           <FormField label="Endereço"><input style={inputStyle} value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} /></FormField>
           <FormField label="Total de Blocos"><input style={inputStyle} type="number" min="1" value={form.totalBlocos} onChange={e => setForm(f => ({ ...f, totalBlocos: +e.target.value }))} /></FormField>
           <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
             <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
             <Btn onClick={save}>Salvar</Btn>
           </div>
         </Modal>
       )}
     </div>
   );
 }
 
 // ─── BLOCOS ───────────────────────────────────────────────────────────────────
 function BlocosPage({ notify }) {
   const [data, setData] = useState(db.get("gc_blocos") || []);
   const condominios = db.get("gc_condominios") || [];
   const [modal, setModal] = useState(false);
   const [form, setForm] = useState({ condominioId: "", nome: "", andares: 4 });
   const [editing, setEditing] = useState(null);
 
   const save = () => {
     if (!form.nome || !form.condominioId) return notify("Preencha todos os campos", "error");
     const list = db.get("gc_blocos") || [];
     if (editing) {
       const updated = list.map(i => i.id === editing.id ? { ...i, ...form } : i);
       db.set("gc_blocos", updated); setData(updated); logOp("editar", "bloco", editing.id, form.nome); notify("Bloco atualizado!");
     } else {
       const novo = { id: uid(), ...form };
       const updated = [...list, novo]; db.set("gc_blocos", updated); setData(updated); logOp("criar", "bloco", novo.id, form.nome); notify("Bloco cadastrado!");
     }
     setModal(false); setEditing(null); setForm({ condominioId: "", nome: "", andares: 4 });
   };
   const remove = (item) => {
     if (!confirm(`Remover Bloco "${item.nome}"?`)) return;
     const updated = (db.get("gc_blocos") || []).filter(i => i.id !== item.id);
     db.set("gc_blocos", updated); setData(updated); logOp("excluir", "bloco", item.id, item.nome); notify("Bloco removido!", "warning");
   };
   const openEdit = (item) => { setEditing(item); setForm({ condominioId: item.condominioId, nome: item.nome, andares: item.andares }); setModal(true); };
 
   return (
     <div>
       <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
         <Btn onClick={() => { setEditing(null); setForm({ condominioId: condominios[0]?.id || "", nome: "", andares: 4 }); setModal(true); }}>+ Novo Bloco</Btn>
       </div>
       <Card>
         <Table
           cols={[
             { label: "Condomínio", render: r => condominios.find(c => c.id === r.condominioId)?.nome || "-" },
             { key: "nome", label: "Bloco" },
             { key: "andares", label: "Andares" },
             { label: "Apartamentos", render: r => (db.get("gc_apartamentos") || []).filter(a => a.blocoId === r.id).length },
             { label: "Ações", render: r => <div style={{ display: "flex", gap: 6 }}><Btn variant="secondary" onClick={() => openEdit(r)}>Editar</Btn><Btn variant="danger" onClick={() => remove(r)}>Remover</Btn></div> },
           ]}
           rows={data}
         />
       </Card>
       {modal && (
         <Modal title={editing ? "Editar Bloco" : "Novo Bloco"} onClose={() => setModal(false)}>
           <FormField label="Condomínio" required>
             <select style={selectStyle} value={form.condominioId} onChange={e => setForm(f => ({ ...f, condominioId: e.target.value }))}>
               <option value="">Selecione...</option>
               {condominios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
             </select>
           </FormField>
           <FormField label="Nome do Bloco" required><input style={inputStyle} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Bloco A" /></FormField>
           <FormField label="Nº de Andares"><input style={inputStyle} type="number" min="1" value={form.andares} onChange={e => setForm(f => ({ ...f, andares: +e.target.value }))} /></FormField>
           <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
             <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
             <Btn onClick={save}>Salvar</Btn>
           </div>
         </Modal>
       )}
     </div>
   );
 }
 
 // ─── APARTAMENTOS ─────────────────────────────────────────────────────────────
 function ApartamentosPage({ notify }) {
   const [data, setData] = useState(db.get("gc_apartamentos") || []);
   const blocos = db.get("gc_blocos") || [];
   const [modal, setModal] = useState(false);
   const [form, setForm] = useState({ blocoId: "", numero: "", andar: 1, area: 60, tipo: "2 quartos" });
   const [editing, setEditing] = useState(null);
 
   const save = () => {
     if (!form.blocoId || !form.numero) return notify("Preencha os campos obrigatórios", "error");
     const list = db.get("gc_apartamentos") || [];
     if (editing) {
       const updated = list.map(i => i.id === editing.id ? { ...i, ...form } : i);
       db.set("gc_apartamentos", updated); setData(updated); logOp("editar", "apartamento", editing.id, `Apto ${form.numero}`); notify("Apartamento atualizado!");
     } else {
       const novo = { id: uid(), ...form };
       const updated = [...list, novo]; db.set("gc_apartamentos", updated); setData(updated); logOp("criar", "apartamento", novo.id, `Apto ${form.numero}`); notify("Apartamento cadastrado!");
     }
     setModal(false); setEditing(null);
   };
   const remove = (item) => {
     if (!confirm(`Remover Apto ${item.numero}?`)) return;
     const updated = (db.get("gc_apartamentos") || []).filter(i => i.id !== item.id);
     db.set("gc_apartamentos", updated); setData(updated); logOp("excluir", "apartamento", item.id, `Apto ${item.numero}`); notify("Apartamento removido!", "warning");
   };
   const openEdit = (item) => { setEditing(item); setForm({ blocoId: item.blocoId, numero: item.numero, andar: item.andar, area: item.area, tipo: item.tipo }); setModal(true); };
   const getMorador = (aptId) => (db.get("gc_moradores") || []).find(m => m.aptId === aptId)?.nome || "-";
 
   return (
     <div>
       <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
         <Btn onClick={() => { setEditing(null); setForm({ blocoId: blocos[0]?.id || "", numero: "", andar: 1, area: 60, tipo: "2 quartos" }); setModal(true); }}>+ Novo Apartamento</Btn>
       </div>
       <Card>
         <Table
           cols={[
             { label: "Bloco", render: r => blocos.find(b => b.id === r.blocoId)?.nome || "-" },
             { key: "numero", label: "Nº" },
             { key: "andar", label: "Andar" },
             { key: "tipo", label: "Tipo" },
             { label: "Área (m²)", render: r => r.area },
             { label: "Morador", render: r => getMorador(r.id) },
             { label: "Medidor", render: r => { const m = (db.get("gc_medidores") || []).find(m => m.aptId === r.id); return m ? <Badge>{m.numero}</Badge> : <Badge color="#E24B4A">Sem medidor</Badge>; } },
             { label: "Ações", render: r => <div style={{ display: "flex", gap: 6 }}><Btn variant="secondary" onClick={() => openEdit(r)}>Editar</Btn><Btn variant="danger" onClick={() => remove(r)}>Remover</Btn></div> },
           ]}
           rows={data}
         />
       </Card>
       {modal && (
         <Modal title={editing ? "Editar Apartamento" : "Novo Apartamento"} onClose={() => setModal(false)}>
           <FormField label="Bloco" required>
             <select style={selectStyle} value={form.blocoId} onChange={e => setForm(f => ({ ...f, blocoId: e.target.value }))}>
               <option value="">Selecione...</option>
               {blocos.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
             </select>
           </FormField>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
             <FormField label="Número" required><input style={inputStyle} value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} placeholder="101" /></FormField>
             <FormField label="Andar"><input style={inputStyle} type="number" min="1" value={form.andar} onChange={e => setForm(f => ({ ...f, andar: +e.target.value }))} /></FormField>
           </div>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
             <FormField label="Área (m²)"><input style={inputStyle} type="number" min="1" value={form.area} onChange={e => setForm(f => ({ ...f, area: +e.target.value }))} /></FormField>
             <FormField label="Tipo">
               <select style={selectStyle} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                 {["1 quarto", "2 quartos", "3 quartos", "Cobertura"].map(t => <option key={t} value={t}>{t}</option>)}
               </select>
             </FormField>
           </div>
           <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
             <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
             <Btn onClick={save}>Salvar</Btn>
           </div>
         </Modal>
       )}
     </div>
   );
 }
 
 // ─── MORADORES ────────────────────────────────────────────────────────────────
 function MoradoresPage({ notify }) {
   const [data, setData] = useState(db.get("gc_moradores") || []);
   const apts = db.get("gc_apartamentos") || [];
   const blocos = db.get("gc_blocos") || [];
   const [modal, setModal] = useState(false);
   const [form, setForm] = useState({ aptId: "", nome: "", cpf: "", email: "", telefone: "", proprietario: true });
   const [editing, setEditing] = useState(null);
 
   const save = () => {
     if (!form.nome || !form.aptId) return notify("Nome e apartamento são obrigatórios", "error");
     const list = db.get("gc_moradores") || [];
     if (editing) {
       const updated = list.map(i => i.id === editing.id ? { ...i, ...form } : i);
       db.set("gc_moradores", updated); setData(updated); logOp("editar", "morador", editing.id, form.nome); notify("Morador atualizado!");
     } else {
       const novo = { id: uid(), ...form };
       const updated = [...list, novo]; db.set("gc_moradores", updated); setData(updated); logOp("criar", "morador", novo.id, form.nome); notify("Morador cadastrado!");
     }
     setModal(false); setEditing(null);
   };
   const remove = (item) => {
     if (!confirm(`Remover "${item.nome}"?`)) return;
     const updated = (db.get("gc_moradores") || []).filter(i => i.id !== item.id);
     db.set("gc_moradores", updated); setData(updated); logOp("excluir", "morador", item.id, item.nome); notify("Morador removido!", "warning");
   };
   const getAptLabel = (aptId) => { const a = apts.find(x => x.id === aptId); const b = blocos.find(x => x.id === a?.blocoId); return a ? `${b?.nome || ""} ${a.numero}` : "-"; };
   const openEdit = (item) => { setEditing(item); setForm({ aptId: item.aptId, nome: item.nome, cpf: item.cpf, email: item.email, telefone: item.telefone, proprietario: item.proprietario }); setModal(true); };
 
   return (
     <div>
       <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
         <Btn onClick={() => { setEditing(null); setForm({ aptId: apts[0]?.id || "", nome: "", cpf: "", email: "", telefone: "", proprietario: true }); setModal(true); }}>+ Novo Morador</Btn>
       </div>
       <Card>
         <Table
           cols={[
             { key: "nome", label: "Nome" },
             { key: "cpf", label: "CPF" },
             { label: "Apartamento", render: r => getAptLabel(r.aptId) },
             { key: "telefone", label: "Telefone" },
             { key: "email", label: "E-mail" },
             { label: "Tipo", render: r => r.proprietario ? <Badge color="#1D9E75">Proprietário</Badge> : <Badge color="#378ADD">Inquilino</Badge> },
             { label: "Ações", render: r => <div style={{ display: "flex", gap: 6 }}><Btn variant="secondary" onClick={() => openEdit(r)}>Editar</Btn><Btn variant="danger" onClick={() => remove(r)}>Remover</Btn></div> },
           ]}
           rows={data}
         />
       </Card>
       {modal && (
         <Modal title={editing ? "Editar Morador" : "Novo Morador"} onClose={() => setModal(false)}>
           <FormField label="Apartamento" required>
             <select style={selectStyle} value={form.aptId} onChange={e => setForm(f => ({ ...f, aptId: e.target.value }))}>
               <option value="">Selecione...</option>
               {apts.map(a => <option key={a.id} value={a.id}>{getAptLabel(a.id)}</option>)}
             </select>
           </FormField>
           <FormField label="Nome Completo" required><input style={inputStyle} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></FormField>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
             <FormField label="CPF"><input style={inputStyle} value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" /></FormField>
             <FormField label="Telefone"><input style={inputStyle} value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" /></FormField>
           </div>
           <FormField label="E-mail"><input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></FormField>
           <FormField label="Vínculo">
             <select style={selectStyle} value={form.proprietario ? "true" : "false"} onChange={e => setForm(f => ({ ...f, proprietario: e.target.value === "true" }))}>
               <option value="true">Proprietário</option>
               <option value="false">Inquilino</option>
             </select>
           </FormField>
           <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
             <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
             <Btn onClick={save}>Salvar</Btn>
           </div>
         </Modal>
       )}
     </div>
   );
 }
 
 // ─── MEDIDORES ────────────────────────────────────────────────────────────────
 function MedidoresPage({ notify }) {
   const [data, setData] = useState(db.get("gc_medidores") || []);
   const apts = db.get("gc_apartamentos") || [];
   const blocos = db.get("gc_blocos") || [];
   const [modal, setModal] = useState(false);
   const [form, setForm] = useState({ aptId: "", numero: "", marca: "", instalacao: "", ativo: true });
   const [editing, setEditing] = useState(null);
 
   const getAptLabel = (aptId) => { const a = apts.find(x => x.id === aptId); const b = blocos.find(x => x.id === a?.blocoId); return a ? `${b?.nome || ""} ${a.numero}` : "-"; };
   const save = () => {
     if (!form.aptId || !form.numero) return notify("Apartamento e número são obrigatórios", "error");
     const list = db.get("gc_medidores") || [];
     if (editing) {
       const updated = list.map(i => i.id === editing.id ? { ...i, ...form } : i);
       db.set("gc_medidores", updated); setData(updated); logOp("editar", "medidor", editing.id, form.numero); notify("Medidor atualizado!");
     } else {
       const novo = { id: uid(), ...form };
       const updated = [...list, novo]; db.set("gc_medidores", updated); setData(updated); logOp("criar", "medidor", novo.id, form.numero); notify("Medidor cadastrado!");
     }
     setModal(false); setEditing(null);
   };
   const remove = (item) => {
     if (!confirm(`Remover medidor ${item.numero}?`)) return;
     const updated = (db.get("gc_medidores") || []).filter(i => i.id !== item.id);
     db.set("gc_medidores", updated); setData(updated); logOp("excluir", "medidor", item.id, item.numero); notify("Medidor removido!", "warning");
   };
   const openEdit = (item) => { setEditing(item); setForm({ aptId: item.aptId, numero: item.numero, marca: item.marca, instalacao: item.instalacao, ativo: item.ativo }); setModal(true); };
 
   return (
     <div>
       <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
         <Btn onClick={() => { setEditing(null); setForm({ aptId: apts[0]?.id || "", numero: "", marca: "Elster", instalacao: "", ativo: true }); setModal(true); }}>+ Novo Medidor</Btn>
       </div>
       <Card>
         <Table
           cols={[
             { key: "numero", label: "Número" },
             { label: "Apartamento", render: r => getAptLabel(r.aptId) },
             { key: "marca", label: "Marca" },
             { key: "instalacao", label: "Instalação" },
             { label: "Status", render: r => r.ativo ? <Badge color="#1D9E75">Ativo</Badge> : <Badge color="#E24B4A">Inativo</Badge> },
             { label: "Ações", render: r => <div style={{ display: "flex", gap: 6 }}><Btn variant="secondary" onClick={() => openEdit(r)}>Editar</Btn><Btn variant="danger" onClick={() => remove(r)}>Remover</Btn></div> },
           ]}
           rows={data}
         />
       </Card>
       {modal && (
         <Modal title={editing ? "Editar Medidor" : "Novo Medidor"} onClose={() => setModal(false)}>
           <FormField label="Apartamento" required>
             <select style={selectStyle} value={form.aptId} onChange={e => setForm(f => ({ ...f, aptId: e.target.value }))}>
               <option value="">Selecione...</option>
               {apts.map(a => <option key={a.id} value={a.id}>{getAptLabel(a.id)}</option>)}
             </select>
           </FormField>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
             <FormField label="Número do Medidor" required><input style={inputStyle} value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} placeholder="MED-001" /></FormField>
             <FormField label="Marca"><input style={inputStyle} value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} placeholder="Elster, Itron..." /></FormField>
           </div>
           <FormField label="Data de Instalação"><input style={inputStyle} type="date" value={form.instalacao} onChange={e => setForm(f => ({ ...f, instalacao: e.target.value }))} /></FormField>
           <FormField label="Status">
             <select style={selectStyle} value={form.ativo ? "true" : "false"} onChange={e => setForm(f => ({ ...f, ativo: e.target.value === "true" }))}>
               <option value="true">Ativo</option>
               <option value="false">Inativo</option>
             </select>
           </FormField>
           <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
             <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
             <Btn onClick={save}>Salvar</Btn>
           </div>
         </Modal>
       )}
     </div>
   );
 }
 
 // ─── LEITURAS ─────────────────────────────────────────────────────────────────
 function LeiturasPage({ notify }) {
   const [leituras, setLeituras] = useState(db.get("gc_leituras") || []);
   const medidores = db.get("gc_medidores") || [];
   const apts = db.get("gc_apartamentos") || [];
   const blocos = db.get("gc_blocos") || [];
   const [modal, setModal] = useState(false);
   const [editing, setEditing] = useState(null);
   const [filterMes, setFilterMes] = useState("");
   const [form, setForm] = useState({ medidorId: "", mes: "", dataLeitura: "", leituraAnterior: "", leituraAtual: "", observacao: "" });
 
   const getLabel = (medId) => {
     const m = medidores.find(x => x.id === medId);
     if (!m) return "-";
     const a = apts.find(x => x.id === m.aptId);
     const b = blocos.find(x => x.id === a?.blocoId);
     return `${m.numero} — ${b?.nome || ""} ${a?.numero || ""}`;
   };
 
   const consumo = useMemo(() => {
     const a = parseFloat(form.leituraAtual) || 0;
     const ant = parseFloat(form.leituraAnterior) || 0;
     return parseFloat((a - ant).toFixed(3));
   }, [form.leituraAtual, form.leituraAnterior]);
 
   const save = () => {
     if (!form.medidorId || !form.mes || !form.leituraAtual || !form.leituraAnterior) return notify("Preencha todos os campos", "error");
     if (consumo < 0) return notify("Leitura atual não pode ser menor que a anterior!", "error");
     const med = medidores.find(m => m.id === form.medidorId);
     const list = db.get("gc_leituras") || [];
     if (editing) {
       const updated = list.map(i => i.id === editing.id ? { ...i, ...form, consumo, aptId: med?.aptId } : i);
       db.set("gc_leituras", updated); setLeituras(updated); logOp("editar", "leitura", editing.id, `${form.mes}`); notify("Leitura atualizada!");
     } else {
       // Check if already exists for this medidor+mes
       const existe = list.find(l => l.medidorId === form.medidorId && l.mes === form.mes);
       if (existe) return notify("Já existe uma leitura para este medidor neste mês!", "warning");
       const novo = { id: uid(), ...form, consumo, aptId: med?.aptId };
       const updated = [...list, novo]; db.set("gc_leituras", updated); setLeituras(updated); logOp("criar", "leitura", novo.id, `${form.mes}`); notify("Leitura registrada!");
     }
     setModal(false); setEditing(null);
   };
   const remove = (item) => {
     if (!confirm("Remover esta leitura?")) return;
     const updated = (db.get("gc_leituras") || []).filter(i => i.id !== item.id);
     db.set("gc_leituras", updated); setLeituras(updated); logOp("excluir", "leitura", item.id, item.mes); notify("Leitura removida!", "warning");
   };
   const openEdit = (item) => { setEditing(item); setForm({ medidorId: item.medidorId, mes: item.mes, dataLeitura: item.dataLeitura, leituraAnterior: item.leituraAnterior, leituraAtual: item.leituraAtual, observacao: item.observacao || "" }); setModal(true); };
   const openNew = () => {
     const today = new Date().toISOString().slice(0, 10);
     const mes = today.slice(0, 7);
     setEditing(null);
     setForm({ medidorId: medidores[0]?.id || "", mes, dataLeitura: today, leituraAnterior: "", leituraAtual: "", observacao: "" });
     setModal(true);
   };
 
   const meses = [...new Set(leituras.map(l => l.mes))].sort().reverse();
   const filtered = filterMes ? leituras.filter(l => l.mes === filterMes) : leituras;
 
   return (
     <div>
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: 12 }}>
         <select style={{ ...selectStyle, width: "auto", minWidth: 160 }} value={filterMes} onChange={e => setFilterMes(e.target.value)}>
           <option value="">Todos os meses</option>
           {meses.map(m => <option key={m} value={m}>{fmtMes(m)}</option>)}
         </select>
         <Btn onClick={openNew}>+ Registrar Leitura</Btn>
       </div>
       <Card>
         <Table
           cols={[
             { label: "Mês", render: r => fmtMes(r.mes) },
             { label: "Medidor / Apto", render: r => getLabel(r.medidorId) },
             { key: "dataLeitura", label: "Data" },
             { label: "Ant. (m³)", render: r => fmt(r.leituraAnterior, 3) },
             { label: "Atual (m³)", render: r => fmt(r.leituraAtual, 3) },
             { label: "Consumo (m³)", render: r => <strong style={{ color: r.consumo > 30 ? "#D85A30" : "var(--color-text-primary)" }}>{fmt(r.consumo, 3)}</strong> },
             { label: "Obs", render: r => <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{r.observacao || "-"}</span> },
             { label: "Ações", render: r => <div style={{ display: "flex", gap: 6 }}><Btn variant="secondary" onClick={() => openEdit(r)}>✏️</Btn><Btn variant="danger" onClick={() => remove(r)}>🗑️</Btn></div> },
           ]}
           rows={filtered.sort((a, b) => b.mes.localeCompare(a.mes))}
         />
       </Card>
       {modal && (
         <Modal title={editing ? "Corrigir Leitura" : "Nova Leitura"} onClose={() => setModal(false)}>
           <FormField label="Medidor" required>
             <select style={selectStyle} value={form.medidorId} onChange={e => setForm(f => ({ ...f, medidorId: e.target.value }))}>
               {medidores.map(m => <option key={m.id} value={m.id}>{getLabel(m.id)}</option>)}
             </select>
           </FormField>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
             <FormField label="Mês de referência" required>
               <input style={inputStyle} type="month" value={form.mes} onChange={e => setForm(f => ({ ...f, mes: e.target.value }))} />
             </FormField>
             <FormField label="Data da leitura">
               <input style={inputStyle} type="date" value={form.dataLeitura} onChange={e => setForm(f => ({ ...f, dataLeitura: e.target.value }))} />
             </FormField>
           </div>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
             <FormField label="Leitura Anterior (m³)" required>
               <input style={inputStyle} type="number" step="0.001" value={form.leituraAnterior} onChange={e => setForm(f => ({ ...f, leituraAnterior: e.target.value }))} />
             </FormField>
             <FormField label="Leitura Atual (m³)" required>
               <input style={inputStyle} type="number" step="0.001" value={form.leituraAtual} onChange={e => setForm(f => ({ ...f, leituraAtual: e.target.value }))} />
             </FormField>
           </div>
           <div style={{ background: consumo < 0 ? "rgba(226,75,74,.1)" : "rgba(29,158,117,.1)", border: `1px solid ${consumo < 0 ? "#E24B4A" : "#1D9E75"}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
             <span style={{ fontSize: 13, color: consumo < 0 ? "#E24B4A" : "#0F6E56" }}>
               {consumo < 0 ? "⚠️ Leitura inválida — atual menor que anterior" : `✅ Consumo calculado: ${fmt(consumo, 3)} m³`}
             </span>
           </div>
           <FormField label="Observação"><input style={inputStyle} value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Leitura corrigida, estimada..." /></FormField>
           <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
             <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
             <Btn onClick={save} disabled={consumo < 0}>Salvar</Btn>
           </div>
         </Modal>
       )}
     </div>
   );
 }
 
 // ─── FATURAS ──────────────────────────────────────────────────────────────────
 function FaturasPage({ notify }) {
   const [faturas, setFaturas] = useState(db.get("gc_faturas") || []);
   const [detalhe, setDetalhe] = useState(null);
   const [modal, setModal] = useState(false);
   const [form, setForm] = useState({ mes: "", valorTotalFatura: "", consumoTotalConcessionaria: "" });
 
   const leituras = db.get("gc_leituras") || [];
   const apts = db.get("gc_apartamentos") || [];
   const blocos = db.get("gc_blocos") || [];
   const moradores = db.get("gc_moradores") || [];
 
   const calcDetalhes = (fatura) => {
     const leits = leituras.filter(l => l.mes === fatura.mes);
     const consumoTotal = leits.reduce((s, l) => s + l.consumo, 0);
     return apts.map(apt => {
       const lApt = leits.filter(l => l.aptId === apt.id);
       const consumoApt = lApt.reduce((s, l) => s + l.consumo, 0);
       const proporcao = consumoTotal > 0 ? consumoApt / consumoTotal : 0;
       const valor = proporcao * fatura.valorTotalFatura;
       const morador = moradores.find(m => m.aptId === apt.id);
       const bloco = blocos.find(b => b.id === apt.blocoId);
       return { apt, bloco, morador, consumoApt, proporcao, valor };
     }).filter(d => d.consumoApt > 0).sort((a, b) => b.consumoApt - a.consumoApt);
   };
 
   const save = () => {
     if (!form.mes || !form.valorTotalFatura) return notify("Mês e valor são obrigatórios", "error");
     const existe = faturas.find(f => f.mes === form.mes);
     if (existe) return notify("Já existe uma fatura para este mês!", "warning");
     const leits = leituras.filter(l => l.mes === form.mes);
     const consumoTotal = leits.reduce((s, l) => s + l.consumo, 0) || parseFloat(form.consumoTotalConcessionaria) || 1;
     const valorM3 = parseFloat(form.valorTotalFatura) / consumoTotal;
     const nova = { id: uid(), condominioId: "c1", mes: form.mes, valorTotalFatura: parseFloat(form.valorTotalFatura), consumoTotalConcessionaria: parseFloat(form.consumoTotalConcessionaria || consumoTotal), valorM3, status: "aberto", createdAt: new Date().toISOString().slice(0, 10) };
     const updated = [...faturas, nova].sort((a, b) => a.mes.localeCompare(b.mes));
     db.set("gc_faturas", updated); setFaturas(updated); logOp("criar", "fatura", nova.id, form.mes); notify("Fatura gerada!");
     setModal(false); setForm({ mes: "", valorTotalFatura: "", consumoTotalConcessionaria: "" });
   };
 
   const toggleStatus = (fat) => {
     const updated = faturas.map(f => f.id === fat.id ? { ...f, status: f.status === "pago" ? "aberto" : "pago" } : f);
     db.set("gc_faturas", updated); setFaturas(updated); notify(`Fatura marcada como ${fat.status === "pago" ? "aberta" : "paga"}`);
   };
 
   return (
     <div>
       <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
         <Btn onClick={() => { setForm({ mes: new Date().toISOString().slice(0, 7), valorTotalFatura: "", consumoTotalConcessionaria: "" }); setModal(true); }}>+ Nova Fatura</Btn>
       </div>
       <Card>
         <Table
           cols={[
             { label: "Mês", render: r => <strong>{fmtMes(r.mes)}</strong> },
             { label: "Consumo concessionária (m³)", render: r => fmt(r.consumoTotalConcessionaria, 3) },
             { label: "Valor total (R$)", render: r => fmtBRL(r.valorTotalFatura) },
             { label: "Valor m³ (R$)", render: r => fmtBRL(r.valorM3) },
             { label: "Status", render: r => <Badge color={STATUS_COLOR[r.status]}>{r.status.toUpperCase()}</Badge> },
             { label: "Ações", render: r => <div style={{ display: "flex", gap: 6 }}><Btn variant="secondary" onClick={() => setDetalhe(r)}>Ver detalhes</Btn><Btn variant={r.status === "pago" ? "secondary" : "primary"} onClick={() => toggleStatus(r)}>{r.status === "pago" ? "Reabrir" : "Marcar paga"}</Btn></div> },
           ]}
           rows={faturas.slice().reverse()}
         />
       </Card>
       {modal && (
         <Modal title="Nova Fatura Mensal" onClose={() => setModal(false)}>
           <div style={{ background: "rgba(29,158,117,.08)", border: "1px solid rgba(29,158,117,.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#0F6E56" }}>
             ℹ️ O sistema calculará automaticamente o valor por m³ e o rateio por apartamento com base nas leituras do mês.
           </div>
           <FormField label="Mês de referência" required><input style={inputStyle} type="month" value={form.mes} onChange={e => setForm(f => ({ ...f, mes: e.target.value }))} /></FormField>
           <FormField label="Valor total da conta de gás (R$)" required><input style={inputStyle} type="number" step="0.01" value={form.valorTotalFatura} onChange={e => setForm(f => ({ ...f, valorTotalFatura: e.target.value }))} placeholder="0,00" /></FormField>
           <FormField label="Consumo informado pela concessionária (m³)"><input style={inputStyle} type="number" step="0.001" value={form.consumoTotalConcessionaria} onChange={e => setForm(f => ({ ...f, consumoTotalConcessionaria: e.target.value }))} placeholder="Deixe vazio para usar soma das leituras" /></FormField>
           {form.mes && form.valorTotalFatura && (() => {
             const leits = leituras.filter(l => l.mes === form.mes);
             const consumo = leits.reduce((s, l) => s + l.consumo, 0);
             const vm3 = consumo > 0 ? parseFloat(form.valorTotalFatura) / consumo : 0;
             return <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
               <div>Leituras encontradas: <strong>{leits.length}</strong></div>
               <div>Consumo total das leituras: <strong>{fmt(consumo, 3)} m³</strong></div>
               <div>Valor estimado do m³: <strong style={{ color: "#1D9E75" }}>{fmtBRL(vm3)}</strong></div>
             </div>;
           })()}
           <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
             <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
             <Btn onClick={save}>Gerar Fatura</Btn>
           </div>
         </Modal>
       )}
       {detalhe && (
         <Modal title={`Rateio — ${fmtMes(detalhe.mes)}`} onClose={() => setDetalhe(null)} width={680}>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
             <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
               <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Valor total</div>
               <div style={{ fontSize: 20, fontWeight: 600 }}>{fmtBRL(detalhe.valorTotalFatura)}</div>
             </div>
             <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
               <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Consumo total</div>
               <div style={{ fontSize: 20, fontWeight: 600 }}>{fmt(detalhe.consumoTotalConcessionaria, 3)} m³</div>
             </div>
             <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
               <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Valor do m³</div>
               <div style={{ fontSize: 20, fontWeight: 600, color: "#1D9E75" }}>{fmtBRL(detalhe.valorM3)}</div>
             </div>
           </div>
           <Table
             cols={[
               { label: "Bloco / Apto", render: r => `${r.bloco?.nome || ""} ${r.apt.numero}` },
               { label: "Morador", render: r => r.morador?.nome || "-" },
               { label: "Consumo (m³)", render: r => fmt(r.consumoApt, 3) },
               { label: "% do total", render: r => `${fmt(r.proporcao * 100, 1)}%` },
               { label: "Valor (R$)", render: r => <strong style={{ color: "#1D9E75" }}>{fmtBRL(r.valor)}</strong> },
             ]}
             rows={calcDetalhes(detalhe)}
           />
         </Modal>
       )}
     </div>
   );
 }
 
 // ─── RELATÓRIOS ───────────────────────────────────────────────────────────────
 function RelatoriosPage({ notify }) {
   const [tab, setTab] = useState("consumo");
   const leituras = db.get("gc_leituras") || [];
   const faturas = db.get("gc_faturas") || [];
   const apts = db.get("gc_apartamentos") || [];
   const blocos = db.get("gc_blocos") || [];
   const moradores = db.get("gc_moradores") || [];
   const [mesRelatorio, setMesRelatorio] = useState(() => [...new Set(leituras.map(l => l.mes))].sort().reverse()[0] || "");
 
   const meses = [...new Set(leituras.map(l => l.mes))].sort().reverse();
 
   // Consumo por apartamento no mês selecionado
   const consumoPorApt = apts.map(apt => {
     const lApt = leituras.filter(l => l.aptId === apt.id && (!mesRelatorio || l.mes === mesRelatorio));
     const consumo = lApt.reduce((s, l) => s + l.consumo, 0);
     const morador = moradores.find(m => m.aptId === apt.id);
     const bloco = blocos.find(b => b.id === apt.blocoId);
     return { nome: `${bloco?.nome || ""} ${apt.numero}`, consumo: parseFloat(consumo.toFixed(3)), morador: morador?.nome || "-" };
   }).filter(x => x.consumo > 0).sort((a, b) => b.consumo - a.consumo);
 
   // Histórico mensal
   const historico = meses.map(mes => {
     const fat = faturas.find(f => f.mes === mes);
     const consumo = leituras.filter(l => l.mes === mes).reduce((s, l) => s + l.consumo, 0);
     return { mes: fmtMes(mes), consumo: parseFloat(consumo.toFixed(2)), valor: fat?.valorTotalFatura || 0, m3: fat?.valorM3 || 0 };
   }).reverse();
 
   const exportCSV = () => {
     const header = "Apartamento,Morador,Consumo (m³)\n";
     const rows = consumoPorApt.map(r => `${r.nome},${r.morador},${r.consumo}`).join("\n");
     const blob = new Blob([header + rows], { type: "text/csv" });
     const url = URL.createObjectURL(blob);
     const a = document.createElement("a"); a.href = url; a.download = `consumo_${mesRelatorio}.csv`; a.click();
     notify("Exportação CSV realizada!");
   };
 
   const TABS = [{ id: "consumo", label: "Consumo por Apto" }, { id: "historico", label: "Histórico Mensal" }, { id: "ranking", label: "Ranking" }, { id: "evolucao", label: "Evolução Gráfica" }];
 
   return (
     <div>
       <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
         {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 16px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: tab === t.id ? "#1D9E75" : "var(--color-background-secondary)", color: tab === t.id ? "#fff" : "var(--color-text-primary)", fontSize: 13, cursor: "pointer", fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</button>)}
         <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
           <select style={{ ...selectStyle, width: "auto" }} value={mesRelatorio} onChange={e => setMesRelatorio(e.target.value)}>
             {meses.map(m => <option key={m} value={m}>{fmtMes(m)}</option>)}
           </select>
           <Btn variant="secondary" onClick={exportCSV}>⬇️ Exportar CSV</Btn>
         </div>
       </div>
 
       {tab === "consumo" && (
         <Card>
           <Table
             cols={[
               { label: "#", render: (r, i) => i + 1 },
               { key: "nome", label: "Apartamento" },
               { key: "morador", label: "Morador" },
               { label: "Consumo (m³)", render: r => <strong>{fmt(r.consumo, 3)}</strong> },
               { label: "Barra", render: r => { const max = consumoPorApt[0]?.consumo || 1; return <div style={{ background: "rgba(29,158,117,.1)", borderRadius: 4, height: 8, width: "100%", minWidth: 80 }}><div style={{ background: "#1D9E75", height: 8, borderRadius: 4, width: `${(r.consumo / max) * 100}%` }} /></div>; } },
             ]}
             rows={consumoPorApt.map((r, i) => ({ ...r, _i: i }))}
           />
         </Card>
       )}
 
       {tab === "historico" && (
         <Card>
           <Table
             cols={[
               { key: "mes", label: "Mês" },
               { label: "Consumo total (m³)", render: r => fmt(r.consumo, 2) },
               { label: "Valor fatura (R$)", render: r => fmtBRL(r.valor) },
               { label: "Valor m³ (R$)", render: r => fmtBRL(r.m3) },
             ]}
             rows={historico}
           />
         </Card>
       )}
 
       {tab === "ranking" && (
         <Card>
           <h3 style={{ margin: "0 0 1rem", fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)" }}>Ranking de consumo — {fmtMes(mesRelatorio)}</h3>
           {consumoPorApt.map((r, i) => (
             <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
               <span style={{ fontSize: 20, width: 30, textAlign: "center" }}>{["🥇","🥈","🥉"][i] || `${i + 1}º`}</span>
               <div style={{ flex: 1 }}>
                 <div style={{ fontSize: 14, fontWeight: 500 }}>{r.nome} — <span style={{ fontWeight: 400, color: "var(--color-text-secondary)" }}>{r.morador}</span></div>
                 <div style={{ background: "var(--color-background-secondary)", borderRadius: 4, height: 10, marginTop: 4 }}>
                   <div style={{ background: i === 0 ? "#D85A30" : i === 1 ? "#378ADD" : "#1D9E75", height: 10, borderRadius: 4, width: `${(r.consumo / (consumoPorApt[0]?.consumo || 1)) * 100}%`, transition: "width .3s" }} />
                 </div>
               </div>
               <span style={{ fontWeight: 700, fontSize: 16, color: i === 0 ? "#D85A30" : "var(--color-text-primary)", minWidth: 80, textAlign: "right" }}>{fmt(r.consumo, 3)} m³</span>
             </div>
           ))}
         </Card>
       )}
 
       {tab === "evolucao" && (
         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
           <Card>
             <h3 style={{ margin: "0 0 1rem", fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)" }}>Consumo total por mês (m³)</h3>
             <ResponsiveContainer width="100%" height={260}>
               <BarChart data={historico}>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.15)" />
                 <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                 <YAxis tick={{ fontSize: 11 }} />
                 <Tooltip formatter={v => [`${fmt(v, 2)} m³`, "Consumo"]} />
                 <Bar dataKey="consumo" fill="#1D9E75" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </Card>
           <Card>
             <h3 style={{ margin: "0 0 1rem", fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)" }}>Valor do m³ ao longo do tempo</h3>
             <ResponsiveContainer width="100%" height={260}>
               <LineChart data={historico}>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.15)" />
                 <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                 <YAxis tick={{ fontSize: 11 }} />
                 <Tooltip formatter={v => [fmtBRL(v), "Valor m³"]} />
                 <Line type="monotone" dataKey="m3" stroke="#D85A30" strokeWidth={2} dot={{ r: 4 }} />
               </LineChart>
             </ResponsiveContainer>
           </Card>
           <Card style={{ gridColumn: "1 / -1" }}>
             <h3 style={{ margin: "0 0 1rem", fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)" }}>Consumo por apartamento — {fmtMes(mesRelatorio)}</h3>
             <ResponsiveContainer width="100%" height={280}>
               <BarChart data={consumoPorApt} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.15)" horizontal={false} />
                 <XAxis type="number" tick={{ fontSize: 11 }} />
                 <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={90} />
                 <Tooltip formatter={v => [`${fmt(v, 3)} m³`, "Consumo"]} />
                 <Bar dataKey="consumo" radius={[0, 4, 4, 0]}>
                   {consumoPorApt.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </Card>
         </div>
       )}
     </div>
   );
 }
 
 // ─── LOGS ─────────────────────────────────────────────────────────────────────
 function LogsPage() {
   const logs = db.get("gc_logs") || [];
   const ICON = { criar: "➕", editar: "✏️", excluir: "🗑️" };
   const COLOR = { criar: "#1D9E75", editar: "#378ADD", excluir: "#E24B4A" };
   return (
     <Card>
       {logs.length === 0 ? <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-tertiary)" }}>Nenhuma operação registrada.</div> : (
         <div>
           {logs.map(log => (
             <div key={log.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
               <span style={{ fontSize: 18 }}>{ICON[log.acao] || "📝"}</span>
               <div style={{ flex: 1 }}>
                 <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                   <Badge color={COLOR[log.acao]}>{log.acao.toUpperCase()}</Badge>
                   <span style={{ fontSize: 13, fontWeight: 500 }}>{log.entidade}</span>
                   <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{log.detalhes}</span>
                 </div>
                 <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 3 }}>
                   {new Date(log.timestamp).toLocaleString("pt-BR")} · por {log.usuario}
                 </div>
               </div>
             </div>
           ))}
         </div>
       )}
     </Card>
   );
 }