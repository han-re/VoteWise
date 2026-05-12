import type { ReactNode } from "react";
import type { Metadata } from "next";
import { ProShell } from "./components/ProShell";

export const metadata: Metadata = {
  title: "VoteWise Pro — analytics for newsrooms",
  description:
    "Donations and spending tracker, Stormont attendance and engagement, "
    + "and a feed of plenary sessions. For journalists and political-research organisations.",
};

export default function ProLayout({ children }: { children: ReactNode }) {
  return <ProShell>{children}</ProShell>;
}
