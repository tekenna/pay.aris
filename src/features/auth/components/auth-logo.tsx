import Image from "next/image";
import { cn } from "@/lib/utils";

export function AuthLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/images/logo.svg"
      alt="Aris Pay"
      width={990}
      height={204}
      priority
      className={cn("h-[38px] w-[192px] object-contain object-left", className)}
    />
  );
}
