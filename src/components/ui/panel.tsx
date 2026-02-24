import { cn } from "@/lib/utils";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/12 bg-[rgba(15,18,31,0.72)] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_22px_50px_-28px_rgba(95,82,255,0.65)] backdrop-blur-sm transition duration-200 hover:border-violet-300/30",
        className,
      )}
    >
      {children}
    </section>
  );
}
