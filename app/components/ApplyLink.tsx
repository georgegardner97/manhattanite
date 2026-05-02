"use client";

import { ReactNode } from "react";

export default function ApplyLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const target = document.getElementById("apply");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <a href="#apply" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
