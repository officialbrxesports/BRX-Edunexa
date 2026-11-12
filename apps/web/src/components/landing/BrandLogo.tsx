import Image from "next/image";
import Link from "next/link";

export function BrandLogo() {
  return (
    <Link
      href="/"
      aria-label="BRX EduNexa home"
      className="group flex shrink-0 items-center gap-3"
    >
      <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition duration-300 group-hover:scale-105">
        <Image
          src="/images/common/common-1.webp"
          alt=""
          fill
          sizes="44px"
          className="object-contain"
        />
      </span>

      <span className="leading-none">
        <span className="block text-[17px] font-black tracking-tight text-slate-950">
          BRX EduNexa
        </span>

        <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.22em] text-blue-600">
          Education Management
        </span>
      </span>
    </Link>
  );
}
