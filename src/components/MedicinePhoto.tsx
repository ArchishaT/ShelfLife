import { Pill } from "lucide-react";
import { useSignedPhoto } from "@/lib/data";
import { cn } from "@/lib/utils";

export function MedicinePhoto({
  path,
  className,
  iconClass,
}: {
  path?: string | null;
  className?: string;
  iconClass?: string;
}) {
  const { data: url, isLoading } = useSignedPhoto(path);

  if (path && (isLoading || url)) {
    return (
      <div className={cn("overflow-hidden bg-muted", className)}>
        {url && (
          <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center bg-muted", className)}>
      <Pill className={cn("h-5 w-5 text-muted-foreground/60", iconClass)} strokeWidth={1.5} />
    </div>
  );
}
