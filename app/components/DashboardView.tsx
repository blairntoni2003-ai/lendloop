"use client";
import { UserButton, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

export default function DashboardView() {
  const { user } = useUser();
  const storeUser = useMutation(api.users.storeUser);
  const tools = useQuery(api.tools.listPublicTools);
  const createTool = useMutation(api.tools.createTool);
  const requestLoan = useMutation(api.loans.requestLoan);
  const updateStatus = useMutation(api.loans.updateLoanStatus);
  const userLoans = useQuery(api.loans.getUserLoans);
  const [tab, setTab] = useState("catalog");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => { if (user) storeUser({}).catch(() => {}); }, [user, storeUser]);

  return (
    <div style={{ padding: 16, fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <strong style={{ fontSize: 22, color: "#4f46e5" }}>LendLoop</strong>
        <UserButton />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab("catalog")} style={{ flex: 1, padding: 10 }}>Catalogue ({tools?.length || 0})</button>
        <button onClick={() => setTab("loans")} style={{ flex: 1, padding: 10 }}>Prêts / Emprunts</button>
        <button onClick={() => setTab("add")} style={{ flex: 1, padding: 10 }}>+ Prêter</button>
      </div>
      {tab === "add" && (
        <form onSubmit={async (e) => { e.preventDefault(); if (!name.trim()) return; await createTool({ name, description: desc, category: "Bricolage", condition: "Bon état" }); setName(""); setDesc(""); setTab("catalog"); }} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'outil" required style={{ padding: 10 }} />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" style={{ padding: 10 }} />
          <button type="submit" style={{ padding: 12, background: "#4f46e5", color: "#fff" }}>Publier</button>
        </form>
      )}
      {tab === "catalog" && tools?.map((t: any) => (
        <div key={t._id} style={{ background: "#fff", padding: 12, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
          <div><strong>{t.name}</strong><div>{t.description}</div></div>
          <button onClick={async () => { try { await requestLoan({ toolId: t._id }); alert("Demande envoyée !"); setTab("loans"); } catch (err: any) { alert(err.message); } }}>Emprunter</button>
        </div>
      ))}
      {tab === "loans" && (
        <div>
          <h4>Mes prêts reçus</h4>
          {userLoans?.ownerLoans?.map((l: any) => (
            <div key={l._id} style={{ background: "#fff", padding: 10, marginBottom: 6 }}>
              Statut: {l.status} {l.status === "pending" && <button onClick={() => updateStatus({ loanId: l._id, status: "approved" })}>Accepter</button>} {l.status === "approved" && <button onClick={() => updateStatus({ loanId: l._id, status: "returned" })}>Rendu</button>}
            </div>
          ))}
          <h4>Mes emprunts</h4>
          {userLoans?.borrowerLoans?.map((l: any) => (
            <div key={l._id} style={{ background: "#fff", padding: 10, marginBottom: 6 }}>Statut: {l.status}</div>
          ))}
        </div>
      )}
    </div>
  );
}
