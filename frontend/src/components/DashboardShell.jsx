import { NavLink } from "react-router-dom";

export default function DashboardShell({
  title,
  subtitle,
  links,
  actions,
  children,
  theme = "neutral",
  workspace,
}) {
  const sidebarChips = workspace?.chips?.length
    ? workspace.chips
    : ["Live API data", `${links.length} focused routes`];

  return (
    <section className={`dashboard-shell dashboard-shell--${theme}`}>
      <aside className={`dashboard-sidebar dashboard-sidebar--${theme}`}>
        <div className="dashboard-sidebar__hero">
          <small>{workspace?.eyebrow || "Workspace"}</small>
          <h2>{workspace?.headline || title}</h2>
          <p>{workspace?.summary || subtitle}</p>
        </div>

        {workspace?.profile ? (
          <div className="dashboard-identity-card">
            <div className="dashboard-identity-card__avatar">{workspace.profile.initials}</div>
            <div className="dashboard-identity-card__copy">
              <strong>{workspace.profile.name}</strong>
              <span>{workspace.profile.role}</span>
              <small>{workspace.profile.detail}</small>
            </div>
          </div>
        ) : null}

        <div className="dashboard-sidebar__chips">
          {sidebarChips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>

        <nav className="dashboard-sidebar__nav" aria-label={`${title} navigation`}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              className={({ isActive }) =>
                isActive ? "dashboard-link is-active" : "dashboard-link"
              }
              to={link.to}
              end={link.end}
            >
              <span>{link.label}</span>
              <small>{link.description}</small>
            </NavLink>
          ))}
        </nav>

        {workspace?.spotlight ? (
          <div className="dashboard-sidebar__spotlight">
            <span>{workspace.spotlight.label}</span>
            <strong>{workspace.spotlight.title}</strong>
            <p>{workspace.spotlight.copy}</p>
          </div>
        ) : null}

        {actions ? <div className="dashboard-sidebar__actions">{actions}</div> : null}
      </aside>

      <div className="dashboard-content">
        {workspace?.banner ? (
          <div className={`dashboard-banner dashboard-banner--${theme}`}>
            <div className="dashboard-banner__copy">
              <span className="eyebrow">{workspace.banner.eyebrow}</span>
              <h3>{workspace.banner.title}</h3>
              <p>{workspace.banner.copy}</p>
            </div>

            {workspace.banner.meta?.length ? (
              <div className="dashboard-banner__meta">
                {workspace.banner.meta.map((item) => (
                  <article key={`${item.label}-${item.value}`} className="dashboard-banner__meta-card">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {children}
      </div>
    </section>
  );
}
