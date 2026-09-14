import Link from "next/link";

type BrandMarkProps = {
  tone?: "light" | "dark";
};

export function BrandMark({ tone = "light" }: BrandMarkProps) {
  const textColor = tone === "light" ? "text-white" : "text-black";

  return (
    <Link href="/" className="flex shrink-0 items-center whitespace-nowrap font-bold">
      <span className={`whitespace-nowrap font-serif text-xl font-bold leading-none xl:text-2xl ${textColor}`}>The Athenaeum</span>
    </Link>
  );
}
