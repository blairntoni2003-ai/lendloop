import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes accessibles sans connexion.
// /sign-in et /sign-up restent publiques pour éviter une boucle de redirection.
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
      await auth.protect();
        }
        });

        export const config = {
          matcher: [
              // Ignore les fichiers internes de Next.js et les fichiers statiques
                  "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
                      // Toujours exécuter pour les routes API
                          "/(api|trpc)(.*)",
                            ],
                            };