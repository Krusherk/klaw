import { cn } from "@/lib/utils";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/12 bg-[rgba(17,17,19,0.8)] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_56px_-42px_rgba(220,38,38,0.58)] backdrop-blur-sm transition duration-200 hover:border-rose-300/35",
        className,
      )}
    >
      {children}
    </section>
  );
}
