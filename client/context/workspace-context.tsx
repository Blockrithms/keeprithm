"use client";

import React, { createContext, useContext } from "react";
import { User, WorkspaceLoaderResponse } from "~/types";

interface WorkspaceContextType {
  workspace: WorkspaceLoaderResponse["workspace"];
  user: User;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({
  workspace,
  user,
  children,
}: {
  workspace: any;
  user: any;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceContext.Provider value={{ workspace, user }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}
