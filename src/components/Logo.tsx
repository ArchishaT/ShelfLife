import mark from "@/assets/shelflife-mark.png";
import { cn } from "@/lib/utils";

export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <img
      src={mark}
      alt="ShelfLife"
      width={size}
      height={size}
      className={cn("object-contain dark:brightness-150", className)}
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Logo size={26} />
      <span className="wordmark text-[22px] leading-none">ShelfLife</span>
    </div>
  );
}
