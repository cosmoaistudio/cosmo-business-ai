import { MapPin } from "lucide-react";
import { OrganizationAvatar } from "@/components/organization/OrganizationAvatar";
import type { Organization } from "@/features/auth";
import type { OperationSetupStatus } from "@/features/operation-onboarding";
import "./organization-identity.css";

interface OrganizationIdentityHeaderProps {
  organization: Organization | null | undefined;
  operationStatus: OperationSetupStatus;
  operationLoading?: boolean;
}

export function OrganizationIdentityHeader({
  organization,
  operationStatus,
  operationLoading = false,
}: OrganizationIdentityHeaderProps) {
  const name = organization?.name?.trim() || "Seu negócio";
  const city = organization?.city?.trim() || "";
  const configured = operationStatus.allComplete;
  const progress = operationStatus.progressPercent;

  return (
    <section className="org-identity" aria-label="Identidade do estabelecimento">
      <OrganizationAvatar
        name={name}
        logoUrl={organization?.logo_url}
        size="lg"
      />

      <div className="org-identity__copy">
        <h1 className="org-identity__name">
          {name}
          <span className="org-identity__wave" aria-hidden>
            {" "}
            👋
          </span>
        </h1>
        <p className="org-identity__welcome">Bem-vindo de volta!</p>
        {city ? (
          <p className="org-identity__city">
            <MapPin size={14} aria-hidden />
            <span>{city}</span>
          </p>
        ) : null}
      </div>

      <div
        className={`org-identity__status${
          configured
            ? " org-identity__status--ready"
            : " org-identity__status--progress"
        }`}
      >
        <span className="org-identity__dot" aria-hidden />
        <div>
          <p className="org-identity__status-label">
            {operationLoading
              ? "Sincronizando…"
              : configured
                ? "Operação configurada"
                : "Configuração em andamento"}
          </p>
          {!operationLoading && !configured ? (
            <p className="org-identity__status-meta">{progress}% concluído</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
