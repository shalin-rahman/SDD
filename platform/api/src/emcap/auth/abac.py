from collections.abc import Mapping

from pydantic import BaseModel


class AbacPolicy(BaseModel):
    permission: str
    effect: str = "allow"
    attribute: str
    operator: str = "equals"
    value: str = ""


DEFAULT_POLICIES: list[AbacPolicy] = [
    AbacPolicy(
        permission="customer.read",
        attribute="tenant_id",
        operator="equals",
        value="$user.tenant_id",
    ),
    AbacPolicy(
        permission="customer.write",
        attribute="tenant_id",
        operator="equals",
        value="$user.tenant_id",
    ),
]


def _resolve_value(
    token: str,
    user_attrs: Mapping[str, object],
    resource_attrs: Mapping[str, object],
) -> object:
    if token.startswith("$user."):
        return user_attrs.get(token.removeprefix("$user."), "")
    if token.startswith("$resource."):
        return resource_attrs.get(token.removeprefix("$resource."), "")
    return token


def _actual_attribute_value(
    policy: AbacPolicy,
    user_attrs: Mapping[str, object],
    resource_attrs: Mapping[str, object],
) -> object:
    if policy.value.startswith("$user.") or policy.value.startswith("$resource."):
        return resource_attrs.get(policy.attribute)
    if policy.attribute in resource_attrs:
        return resource_attrs.get(policy.attribute)
    return user_attrs.get(policy.attribute)


def evaluate_abac(
    policies: list[AbacPolicy],
    *,
    permission: str,
    user_attrs: Mapping[str, object],
    resource_attrs: Mapping[str, object],
) -> bool:
    matched = [p for p in policies if p.permission == permission or p.permission.endswith(".*")]
    if not matched:
        return True

    for policy in matched:
        expected = _resolve_value(policy.value, user_attrs, resource_attrs)
        actual = _actual_attribute_value(policy, user_attrs, resource_attrs)
        allowed = str(actual) == str(expected)
        if policy.effect == "deny" and allowed:
            return False
        if policy.effect == "allow" and allowed:
            return True
    return False
