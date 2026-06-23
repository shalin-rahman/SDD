from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any

from emcap.config.models import PlatformConfig

_TEMPLATE_TOKEN_RE = re.compile(r"\{\{(\w+)\}\}")


def interpolate_template(template: str, variables: dict[str, str]) -> str:
    """Replace {{token}} placeholders in notification or org profile templates."""

    def replacer(match: re.Match[str]) -> str:
        return variables.get(match.group(1) or "", "")

    return _TEMPLATE_TOKEN_RE.sub(replacer, template)


def build_organization_template_vars(profile: dict[str, Any]) -> dict[str, str]:
    address = profile.get("address")
    if not isinstance(address, dict):
        address = {}
    return {
        "display_name": str(profile.get("display_name") or ""),
        "legal_name": str(profile.get("legal_name") or ""),
        "tax_id": str(profile.get("tax_id") or ""),
        "email": str(profile.get("email") or ""),
        "phone": str(profile.get("phone") or ""),
        "website": str(profile.get("website") or ""),
        "address_line1": str(address.get("line1") or ""),
        "address_line2": str(address.get("line2") or ""),
        "city": str(address.get("city") or ""),
        "state": str(address.get("state") or ""),
        "postal_code": str(address.get("postal_code") or ""),
        "country": str(address.get("country") or ""),
        "date": datetime.now(UTC).date().isoformat(),
    }


def render_notification_template(
    *,
    subject: str,
    body: str,
    channel: str,
    profile: dict[str, Any],
    context: dict[str, str] | None = None,
) -> tuple[str, str]:
    """Render subject/body with org tokens, context vars, and email signature merge."""

    org_vars = build_organization_template_vars(profile)
    merged = {**org_vars, **(context or {})}

    signature_template = str(profile.get("email_signature") or "").strip()
    signature_rendered = (
        interpolate_template(signature_template, org_vars) if signature_template else ""
    )
    merged["signature"] = signature_rendered

    rendered_subject = interpolate_template(subject, merged)
    rendered_body = interpolate_template(body, merged)

    if channel == "email" and signature_rendered and "{{signature}}" not in body:
        rendered_body = f"{rendered_body.rstrip()}\n\n--\n{signature_rendered}"

    return rendered_subject, rendered_body


def render_notification_from_profile(
    *,
    subject: str,
    body: str,
    channel: str,
    config: PlatformConfig,
    profile: dict[str, Any] | None = None,
    context: dict[str, str] | None = None,
) -> tuple[str, str]:
    """Convenience wrapper using merged org profile dict or platform defaults."""

    resolved_profile = profile if profile is not None else config.organization_profile.model_dump(mode="json")
    return render_notification_template(
        subject=subject,
        body=body,
        channel=channel,
        profile=resolved_profile,
        context=context,
    )
