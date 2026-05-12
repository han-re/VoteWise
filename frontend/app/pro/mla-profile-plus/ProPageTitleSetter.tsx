"use client";

import { useSetProPage } from "../components/ProPageContext";

export function ProPageTitleSetter({
  title,
  breadcrumb,
}: {
  title: string;
  breadcrumb?: string[];
}) {
  useSetProPage(title, breadcrumb ?? [title]);
  return null;
}
