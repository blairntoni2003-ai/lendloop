import { httpRouter } from "convex/server";
import { v } from "convex/values";
import {
  httpAction,
    internalMutation,
      internalQuery,
      } from "./_generated/server";
      import { internal } from "./_generated/api";

      const http = httpRouter();

      /* ---------- Helpers ---------- */

      function json(data: unknown, status = 200): Response {
        return new Response(JSON.stringify(data), {
            status,
                headers: { "Content-Type": "application/json" },
                  });
                  }

                  // Comparaison en temps constant (évite les attaques par timing)
                  function safeEqual(a: string, b: string): boolean {
                    const enc = new TextEncoder();
                      const x = enc.encode(a);
                        const y = enc.encode(b);
                          const len = Math.max(x.length, y.length);
                            let diff = x.length ^ y.length;
                              for (let i = 0; i < len; i++) {
                                  diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
                                    }
                                      return diff === 0;
                                      }

                                      // Renvoie une Response d'erreur si le secret est absent/invalide, sinon null
                                      function checkSecret(request: Request): Response | null {
                                        const expected = process.env.N8N_SECRET;
                                          if (!expected) {
                                              return json({ error: "N8N_SECRET non configuré sur Convex" }, 500);
                                                }
                                                  const received = request.headers.get("x-n8n-secret") ?? "";
                                                    if (!safeEqual(received, expected)) {
                                                        return json({ error: "Non autorisé" }, 401);
                                                          }
                                                            return null;
                                                            }

                                                            /* ---------- Fonctions internes (un HTTP Action n'accède pas à la DB directement) ---------- */

                                                            export const listOverdueLoans = internalQuery({
                                                              args: { now: v.number() },
                                                                handler: async (ctx, { now }) => {
                                                                    const loans = await ctx.db
                                                                          .query("loans")
                                                                                .withIndex("by_overdue", (q) =>
                                                                                        q.eq("status", "approved").eq("reminderSent", false).lt("endDate", now),
                                                                                              )
                                                                                                    .take(100); // plafond de sécurité : le reste passe au prochain appel

                                                                                                        return await Promise.all(
                                                                                                              loans.map(async (loan) => {
                                                                                                                      const [tool, borrower] = await Promise.all([
                                                                                                                                ctx.db.get(loan.toolId),
                                                                                                                                          ctx.db.get(loan.borrowerId),
                                                                                                                                                  ]);
                                                                                                                                                          return {
                                                                                                                                                                    loanId: loan._id,
                                                                                                                                                                              toolName: tool?.name ?? null,
                                                                                                                                                                                        borrowerName: borrower?.name ?? null,
                                                                                                                                                                                                  borrowerEmail: borrower?.email ?? null,
                                                                                                                                                                                                            startDate: loan.startDate,
                                                                                                                                                                                                                      endDate: loan.endDate,
                                                                                                                                                                                                                              };
                                                                                                                                                                                                                                    }),
                                                                                                                                                                                                                                        );
                                                                                                                                                                                                                                          },
                                                                                                                                                                                                                                          });

                                                                                                                                                                                                                                          export const markReminded = internalMutation({
                                                                                                                                                                                                                                            args: { loanId: v.string() },
                                                                                                                                                                                                                                              handler: async (ctx, { loanId }) => {
                                                                                                                                                                                                                                                  const id = ctx.db.normalizeId("loans", loanId);
                                                                                                                                                                                                                                                      if (id === null) return "invalid_id" as const;

                                                                                                                                                                                                                                                          const loan = await ctx.db.get(id);
                                                                                                                                                                                                                                                              if (loan === null) return "not_found" as const;

                                                                                                                                                                                                                                                                  if (!loan.reminderSent) {
                                                                                                                                                                                                                                                                        await ctx.db.patch(id, { reminderSent: true });
                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                return "ok" as const;
                                                                                                                                                                                                                                                                                  },
                                                                                                                                                                                                                                                                                  });

                                                                                                                                                                                                                                                                                  /* ---------- Routes HTTP ---------- */

                                                                                                                                                                                                                                                                                  // GET /overdue-loans
                                                                                                                                                                                                                                                                                  http.route({
                                                                                                                                                                                                                                                                                    path: "/overdue-loans",
                                                                                                                                                                                                                                                                                      method: "GET",
                                                                                                                                                                                                                                                                                        handler: httpAction(async (ctx, request) => {
                                                                                                                                                                                                                                                                                            const denied = checkSecret(request);
                                                                                                                                                                                                                                                                                                if (denied) return denied;

                                                                                                                                                                                                                                                                                                    const loans = await ctx.runQuery(internal.http.listOverdueLoans, {
                                                                                                                                                                                                                                                                                                          now: Date.now(),
                                                                                                                                                                                                                                                                                                              });
                                                                                                                                                                                                                                                                                                                  return json(loans);
                                                                                                                                                                                                                                                                                                                    }),
                                                                                                                                                                                                                                                                                                                    });

                                                                                                                                                                                                                                                                                                                    // POST /mark-reminded   body : { "loanId": "..." }
                                                                                                                                                                                                                                                                                                                    http.route({
                                                                                                                                                                                                                                                                                                                      path: "/mark-reminded",
                                                                                                                                                                                                                                                                                                                        method: "POST",
                                                                                                                                                                                                                                                                                                                          handler: httpAction(async (ctx, request) => {
                                                                                                                                                                                                                                                                                                                              const denied = checkSecret(request);
                                                                                                                                                                                                                                                                                                                                  if (denied) return denied;

                                                                                                                                                                                                                                                                                                                                      let body: { loanId?: unknown } | null;
                                                                                                                                                                                                                                                                                                                                          try {
                                                                                                                                                                                                                                                                                                                                                body = await request.json();
                                                                                                                                                                                                                                                                                                                                                    } catch {
                                                                                                                                                                                                                                                                                                                                                          return json({ error: "Corps JSON invalide" }, 400);
                                                                                                                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                                                                                                                                  const loanId = body?.loanId;
                                                                                                                                                                                                                                                                                                                                                                      if (typeof loanId !== "string" || loanId === "") {
                                                                                                                                                                                                                                                                                                                                                                            return json({ error: "loanId (string) requis" }, 400);
                                                                                                                                                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                                                                                                                                                    const result = await ctx.runMutation(internal.http.markReminded, {
                                                                                                                                                                                                                                                                                                                                                                                          loanId,
                                                                                                                                                                                                                                                                                                                                                                                              });
                                                                                                                                                                                                                                                                                                                                                                                                  if (result === "invalid_id") return json({ error: "loanId invalide" }, 400);
                                                                                                                                                                                                                                                                                                                                                                                                      if (result === "not_found") return json({ error: "Prêt introuvable" }, 404);
                                                                                                                                                                                                                                                                                                                                                                                                          return json({ ok: true, loanId });
                                                                                                                                                                                                                                                                                                                                                                                                            }),
                                                                                                                                                                                                                                                                                                                                                                                                            });

                                                                                                                                                                                                                                                                                                                                                                                                            export default http;