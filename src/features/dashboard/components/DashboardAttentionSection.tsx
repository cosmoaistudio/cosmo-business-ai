import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Package,
  QrCode,
  ShoppingCart,
} from "lucide-react";
import type { ReactNode } from "react";

import { OsPanel } from "./os/OsPanel";
import type {
  AttentionAlert,
  AttentionAlertId,
  AttentionPriority,
} from "../utils/buildDashboardAttentionAlerts";

interface DashboardAttentionSectionProps {
  alerts: AttentionAlert[];
  loading?: boolean;
}

const ICONS: Record<AttentionAlertId, ReactNode> = {
  no_products: <Package size={18} />,
  products_inactive: <Package size={18} />,
  digital_unpublished: <QrCode size={18} />,
  no_sales_today: <ShoppingCart size={18} />,
};

function toneClass(priority: AttentionPriority): string {
  if (priority === "high") return "dashboard-attention__item--high";
  if (priority === "medium") return "dashboard-attention__item--medium";
  return "dashboard-attention__item--low";
}

/**
 * Renders only when there is something relevant.
 * Returns null for empty / loading to avoid empty chrome.
 */
export default function DashboardAttentionSection({
  alerts,
  loading = false,
}: DashboardAttentionSectionProps) {
  if (loading || alerts.length === 0) {
    return null;
  }

  return (
    <OsPanel
      title="Precisa de atenção"
      description="Situações reais da operação que merecem um olhar agora."
    >
      <ul className="dashboard-attention__list">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className={`dashboard-attention__item ${toneClass(alert.priority)}`}
          >
            <span className="dashboard-attention__icon" aria-hidden>
              {ICONS[alert.id] ?? <AlertTriangle size={18} />}
            </span>
            <div className="dashboard-attention__body">
              <p className="dashboard-attention__title">{alert.title}</p>
              <p className="dashboard-attention__desc">{alert.description}</p>
            </div>
            <Link to={alert.href} className="dashboard-attention__cta">
              {alert.ctaLabel}
              <ArrowRight size={14} />
            </Link>
          </li>
        ))}
      </ul>
    </OsPanel>
  );
}
