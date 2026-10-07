"use client";

import Link from "next/link";
import { useLanguage } from "@/features/i18n/context/LanguageContext";
import { InstitutionalShell, SectionBand, StatTile, TextCard } from "./InstitutionalShell";

const aboutCopy = {
  en: {
    eyebrow: "About The Athenaeum",
    title: "A modern academic library for knowledge discovery.",
    description: "The Athenaeum brings together a refined public catalog, member services, and staff circulation tools in one cohesive library experience.",
    stats: [
      ["Catalog focus", "Books"],
      ["Member tools", "Loans"],
      ["Staff desk", "Live"],
      ["Design tone", "Calm"],
    ],
    roleEyebrow: "Our role",
    roleTitle: "Built for readers and operators.",
    roleDescription: "The library experience is not only a public catalog. It is a system for discovery, accountability, staff service, and a clear path from search to shelf.",
    exploreBooks: "Explore books",
    borrowingGuide: "Borrowing guide",
    values: [
      ["Search-first access", "The Athenaeum centers discovery, availability, and clear circulation status."],
      ["Academic calm", "Spaces and systems are designed for focus, research, and repeat daily use."],
      ["Operational clarity", "Borrowing, holds, returns, and catalog work are visible to the people who need them."],
    ],
    spacesEyebrow: "Spaces and systems",
    spacesTitle: "Designed as a working library.",
    spaces: [
      {
        title: "Reading room",
        body: "A quiet environment for individual study and long-form reading.",
        image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Digital catalog desk",
        body: "Search-first tooling for finding books, checking copies, and placing holds.",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Circulation support",
        body: "Staff workflows for checkout, check-in, renewals, and hold pickup.",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
      },
    ],
  },
  vi: {
    eyebrow: "Giới thiệu The Athenaeum",
    title: "Thư viện học thuật hiện đại cho khám phá tri thức.",
    description: "The Athenaeum kết hợp danh mục công khai tinh gọn, dịch vụ thành viên và công cụ lưu thông cho nhân viên trong một trải nghiệm thư viện nhất quán.",
    stats: [
      ["Trọng tâm danh mục", "Sách"],
      ["Công cụ thành viên", "Mượn sách"],
      ["Quầy nhân viên", "Trực tiếp"],
      ["Tinh thần thiết kế", "Điềm tĩnh"],
    ],
    roleEyebrow: "Vai trò của chúng tôi",
    roleTitle: "Xây dựng cho người đọc và người vận hành.",
    roleDescription: "Trải nghiệm thư viện không chỉ là danh mục công khai. Đó là hệ thống cho tìm kiếm, trách nhiệm, phục vụ tại quầy và đường đi rõ ràng từ tìm sách đến kệ sách.",
    exploreBooks: "Khám phá sách",
    borrowingGuide: "Hướng dẫn mượn",
    values: [
      ["Ưu tiên tìm kiếm", "The Athenaeum đặt trọng tâm vào khám phá, tình trạng sẵn có và trạng thái lưu thông rõ ràng."],
      ["Không gian học thuật yên tĩnh", "Không gian và hệ thống được thiết kế cho tập trung, nghiên cứu và sử dụng hằng ngày."],
      ["Vận hành rõ ràng", "Mượn sách, đặt giữ, trả sách và công việc danh mục đều hiển thị cho đúng người cần dùng."],
    ],
    spacesEyebrow: "Không gian và hệ thống",
    spacesTitle: "Được thiết kế như một thư viện đang vận hành.",
    spaces: [
      {
        title: "Phòng đọc",
        body: "Môi trường yên tĩnh cho học tập cá nhân và đọc chuyên sâu.",
        image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Quầy danh mục số",
        body: "Công cụ ưu tiên tìm kiếm để tìm sách, kiểm tra bản sao và đặt giữ.",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Hỗ trợ lưu thông",
        body: "Quy trình nhân viên cho mượn, trả, gia hạn và nhận sách đặt giữ.",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
      },
    ],
  },
};

export function AboutPage() {
  const { locale } = useLanguage();
  const copy = aboutCopy[locale];

  return (
    <InstitutionalShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      imageUrl="/image.png"
    >
      <SectionBand>
        <div className="grid gap-5 md:grid-cols-4">
          {copy.stats.map(([label, value]) => <StatTile key={label} label={label} value={value} />)}
        </div>
      </SectionBand>

      <SectionBand tone="soft">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#7A263A]">{copy.roleEyebrow}</p>
            <h2 className="mt-3 font-serif text-4xl font-bold text-[#2B2723]">{copy.roleTitle}</h2>
            <p className="mt-4 leading-7 text-[#5F574F]">
              {copy.roleDescription}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/books" className="rounded-full bg-[#7A263A] px-5 py-3 text-sm font-bold text-white">{copy.exploreBooks}</Link>
              <Link href="/borrowing-guide" className="rounded-full border border-[#D8CCBC] px-5 py-3 text-sm font-bold text-[#2B2723]">{copy.borrowingGuide}</Link>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {copy.values.map(([title, body]) => <TextCard key={title} title={title} body={body} />)}
          </div>
        </div>
      </SectionBand>

      <SectionBand>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[#7A263A]">{copy.spacesEyebrow}</p>
          <h2 className="mt-3 font-serif text-4xl font-bold text-[#2B2723]">{copy.spacesTitle}</h2>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {copy.spaces.map((space) => (
            <article key={space.title} className="overflow-hidden rounded-2xl border border-[#DED5C8] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(7,7,88,0.12)]">
              <div
                className="h-56 w-full bg-cover bg-center"
                role="img"
                aria-label={space.title}
                style={{ backgroundImage: `url(${space.image})` }}
              />
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#2B2723]">{space.title}</h3>
                <p className="mt-3 leading-7 text-[#5F574F]">{space.body}</p>
              </div>
            </article>
          ))}
        </div>
      </SectionBand>
    </InstitutionalShell>
  );
}
