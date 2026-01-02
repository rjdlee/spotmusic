import type { ReactNode } from "react";

type NoticeVariant = "error";

const NOTICE_STYLES: Record<NoticeVariant, string> = {
  error: "border-rose-400/40 bg-rose-500/15 text-rose-100",
};

type NoticeProps = {
  children: ReactNode;
  variant?: NoticeVariant;
  className?: string;
};

export default function Notice({
  children,
  variant = "error",
  className,
}: NoticeProps) {
  const classes = [
    "rounded-2xl border px-4 py-3 text-sm",
    NOTICE_STYLES[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
