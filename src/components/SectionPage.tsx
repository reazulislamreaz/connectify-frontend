import { PageHeader } from "./PageHeader";

interface SectionPageProps {
  title: string;
  subtitle?: string;
  refreshing?: boolean;
  children: React.ReactNode;
  /** Extra classes on page-shell (e.g. friends-page for mobile list styles) */
  shellClassName?: string;
}

/** Standard full-width page layout shared by Feed, Friends, Discover, Profile, Settings */
export function SectionPage({
  title,
  subtitle,
  refreshing,
  children,
  shellClassName,
}: SectionPageProps) {
  return (
    <div className={["page-shell", shellClassName].filter(Boolean).join(" ")}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        refreshing={refreshing}
      />
      <div className="page-content">
        <div className="content-section">{children}</div>
      </div>
    </div>
  );
}
