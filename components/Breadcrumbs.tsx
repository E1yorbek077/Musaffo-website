import Link from "@/components/Link";

export function Breadcrumbs({
  items,
  label,
  className = "text-slate",
}: {
  items: { label: string; href?: string }[];
  label: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={`text-sm font-semibold ${className}`}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true" className="opacity-40">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-navy">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
