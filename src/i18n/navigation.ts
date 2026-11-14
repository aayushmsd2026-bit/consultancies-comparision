import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Use these instead of next/link and next/navigation.
// They keep the visitor in the language they chose.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
