import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  mutation,
    query,
      type MutationCtx,
        type QueryCtx,
        } from "./_generated/server";

        type Ctx = QueryCtx | MutationCtx;

        /* ---------- Helpers (importés par tools.ts et loans.ts) ---------- */

        async function findByClerkId(ctx: Ctx, clerkId: string) {
          return await ctx.db
              .query("users")
                  .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
                      .unique();
                      }

                      // Utilisateur courant, ou null (non connecté / pas encore enregistré)
                      export async function getAuthUser(ctx: Ctx): Promise<Doc<"users"> | null> {
                        const identity = await ctx.auth.getUserIdentity();
                          if (identity === null) return null;
                            return await findByClerkId(ctx, identity.subject);
                            }

                            // Utilisateur courant, sinon erreur
                            export async function requireUser(ctx: Ctx): Promise<Doc<"users">> {
                              const identity = await ctx.auth.getUserIdentity();
                                if (identity === null) throw new ConvexError("Non authentifié");

                                  const user = await findByClerkId(ctx, identity.subject);
                                    if (user === null) {
                                        throw new ConvexError("Profil introuvable : appelle storeUser d'abord");
                                          }
                                            return user;
                                            }

                                            export async function requireAdmin(ctx: Ctx): Promise<Doc<"users">> {
                                              const user = await requireUser(ctx);
                                                if (user.role !== "admin") {
                                                    throw new ConvexError("Réservé aux administrateurs");
                                                      }
                                                        return user;
                                                        }

                                                        /* ---------- Fonctions Convex ---------- */

                                                        // À appeler une fois après la connexion Clerk
                                                        export const storeUser = mutation({
                                                          args: {},
                                                            handler: async (ctx): Promise<Id<"users">> => {
                                                                const identity = await ctx.auth.getUserIdentity();
                                                                    if (identity === null) throw new ConvexError("Non authentifié");

                                                                        const existing = await findByClerkId(ctx, identity.subject);

                                                                            // Si le token Clerk n'a pas le claim, on garde la valeur existante
                                                                                const name =
                                                                                      identity.name ||
                                                                                            identity.givenName ||
                                                                                                  identity.nickname ||
                                                                                                        existing?.name ||
                                                                                                              "Utilisateur";
                                                                                                                  const email = identity.email || existing?.email || "";

                                                                                                                      if (existing !== null) {
                                                                                                                            if (existing.name !== name || existing.email !== email) {
                                                                                                                                    await ctx.db.patch(existing._id, { name, email });
                                                                                                                                          }
                                                                                                                                                return existing._id;
                                                                                                                                                    }

                                                                                                                                                        // Le tout premier utilisateur inscrit devient admin
                                                                                                                                                            const firstUser = await ctx.db.query("users").first();

                                                                                                                                                                return await ctx.db.insert("users", {
                                                                                                                                                                      clerkId: identity.subject,
                                                                                                                                                                            name,
                                                                                                                                                                                  email,
                                                                                                                                                                                        role: firstUser === null ? "admin" : "user",
                                                                                                                                                                                              isTrustedLender: false,
                                                                                                                                                                                                  });
                                                                                                                                                                                                    },
                                                                                                                                                                                                    });

                                                                                                                                                                                                    export const getCurrentUser = query({
                                                                                                                                                                                                      args: {},
                                                                                                                                                                                                        handler: async (ctx) => {
                                                                                                                                                                                                            return await getAuthUser(ctx);
                                                                                                                                                                                                              },
                                                                                                                                                                                                              });

                                                                                                                                                                                                              // Admin uniquement
                                                                                                                                                                                                              export const listUsers = query({
                                                                                                                                                                                                                args: {},
                                                                                                                                                                                                                  handler: async (ctx) => {
                                                                                                                                                                                                                      await requireAdmin(ctx);
                                                                                                                                                                                                                          return await ctx.db.query("users").collect();
                                                                                                                                                                                                                            },
                                                                                                                                                                                                                            });

                                                                                                                                                                                                                            // Admin uniquement : inverse isTrustedLender, renvoie la nouvelle valeur
                                                                                                                                                                                                                            export const toggleTrustedLender = mutation({
                                                                                                                                                                                                                              args: { userId: v.id("users") },
                                                                                                                                                                                                                                handler: async (ctx, { userId }) => {
                                                                                                                                                                                                                                    await requireAdmin(ctx);

                                                                                                                                                                                                                                        const target = await ctx.db.get(userId);
                                                                                                                                                                                                                                            if (target === null) throw new ConvexError("Utilisateur introuvable");

                                                                                                                                                                                                                                                const isTrustedLender = !target.isTrustedLender;
                                                                                                                                                                                                                                                    await ctx.db.patch(userId, { isTrustedLender });
                                                                                                                                                                                                                                                        return isTrustedLender;
                                                                                                                                                                                                                                                          },
                                                                                                                                                                                                                                                          });