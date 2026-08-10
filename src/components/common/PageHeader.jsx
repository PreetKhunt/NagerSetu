import Breadcrumb from "./Breadcrumb";

/** Title block for dashboard pages: breadcrumb + heading + right-side actions. */
export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className = "",
}) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div>
        {breadcrumbs?.length > 0 && <Breadcrumb items={breadcrumbs} />}
        <h1 className="page-header__title">{title}</h1>
        {description && <p className="page-header__desc">{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
