import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  tone?: "light" | "dark";
  showSymbol?: boolean;
};

export function BrandMark({ tone = "light", showSymbol = false }: BrandMarkProps) {
  const textColor = tone === "light" ? "text-white" : "text-black";

  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-bold">
      {showSymbol ? (
        <Image
          src="/brand/old-folio-mark-v2.png"
          alt=""
          aria-hidden="true"
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
          priority
        />
      ) : null}
      <span className={`whitespace-nowrap font-serif text-xl font-bold leading-none xl:text-2xl ${textColor}`}>The Athenaeum</span>
    </Link>
  );
}
