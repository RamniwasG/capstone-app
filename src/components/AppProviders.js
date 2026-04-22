"use client";

import { ProjectProvider } from "@/context/ProjectContext";

export default function AppProviders({ children }) {
  return <ProjectProvider>{children}</ProjectProvider>;
}
