import type { ReactNode } from "react";

export default function AdminPageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="admin-page-heading">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {actions && (
        <div className="admin-page-heading__actions">{actions}</div>
      )}
    </div>
  );
}
