"use client";

import { useUser } from "@clerk/nextjs";
import DashboardView from "./components/DashboardView";
import PublicView from "./components/PublicView";

export default function Page() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <p style={{padding:20}}>Initialisation Clerk...</p>;
  return isSignedIn ? <DashboardView /> : <PublicView />;
}
