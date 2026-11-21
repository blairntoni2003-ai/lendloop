"use client";

import { useQuery } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";

export default function PublicView() {
  const tools = useQuery(api.tools.listPublicTools);

    return (
        <main className="mx-auto max-w-3xl px-4 py-12 text-center">
              <h1 className="text-4xl font-bold tracking-tight">LendLoop</h1>
                    <p className="mt-3 text-lg text-slate-600">
                            Prêtez et empruntez des outils entre voisins en toute confiance.
                                  </p>
                                        <SignInButton mode="modal">
                                                <button className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
                                                          Se connecter pour prêter ou emprunter
                                                                  </button>
                                                                        </SignInButton>

                                                                              <h2 className="mb-3 mt-12 text-left font-semibold">Outils disponibles</h2>
                                                                                    {tools === undefined ? (
                                                                                            <p className="text-slate-500">Chargement…</p>
                                                                                                  ) : tools.length === 0 ? (
                                                                                                          <p className="text-slate-500">Aucun outil disponible pour le moment.</p>
                                                                                                                ) : (
                                                                                                                        <ul className="grid gap-3 text-left sm:grid-cols-2">
                                                                                                                                  {tools.map((t) => (
                                                                                                                                              <li key={t._id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                                                                                                                                            <b>{t.name}</b>
                                                                                                                                                                          <p className="text-sm text-slate-500">{t.category} · {t.condition}</p>
                                                                                                                                                                                      </li>
                                                                                                                                                                                                ))}
                                                                                                                                                                                                        </ul>
                                                                                                                                                                                                              )}
                                                                                                                                                                                                                  </main>
                                                                                                                                                                                                                    );
                                                                                                                                                                                                                    }