import Link from "next/link";

export function ClassBar({
  classId,
  label,
  term,
  isForm,
  current,
}: {
  classId: number;
  label: string;
  term: string;
  isForm: boolean;
  current: "register" | "markbook" | "roster" | "comments";
}) {
  const tabs = [
    { id: "register" as const, href: `/teacher/register/${classId}`, label: "Register" },
    { id: "markbook" as const, href: `/teacher/markbook/${classId}`, label: "Markbook" },
    ...(isForm
      ? [
          { id: "roster" as const, href: `/teacher/roster/${classId}`, label: "Roster" },
          { id: "comments" as const, href: `/teacher/comments/${classId}`, label: "Comments" },
        ]
      : []),
  ];
  return (
    <div className="mb-5">
      <p className="font-serif text-2xl text-moss">{label}</p>
      <p className="text-sm text-muted">{term}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${tab.id === current ? "bg-moss text-white" : "bg-card text-muted ring-1 ring-line"}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
