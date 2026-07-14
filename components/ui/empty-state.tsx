import Icon from "@/components/ui/icon";

export default function EmptyState({
  title,
  description,
  icon = "package",
}: {
  title: string;
  description: string;
  icon?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon name={icon} size={24} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
