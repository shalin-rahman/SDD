"""Unit tests for RBAC role listing and assignment."""

import pytest
from fastapi.testclient import TestClient

from emcap.auth.rbac import assign_role, list_roles
from emcap.persistence.database import UserRow, UserRoleRow, get_session_factory


def test_list_roles_returns_seeded_admin(client: TestClient) -> None:
    session = get_session_factory()()
    try:
        roles = list_roles(session)
        codes = {role["code"] for role in roles}
        assert "admin" in codes
        assert all({"id", "code", "name", "permissions"}.issubset(role.keys()) for role in roles)
    finally:
        session.close()


def test_assign_role_adds_user_role_link(client: TestClient) -> None:
    session = get_session_factory()()
    try:
        admin = session.query(UserRow).filter_by(username="admin").one()
        before = session.query(UserRoleRow).filter_by(user_id=admin.id).count()
        assign_role(session, admin.id, "viewer")
        after = session.query(UserRoleRow).filter_by(user_id=admin.id).count()
        assert after == before + 1
        assign_role(session, admin.id, "viewer")
        assert session.query(UserRoleRow).filter_by(user_id=admin.id).count() == after
    finally:
        session.close()


def test_assign_role_unknown_role_raises(client: TestClient) -> None:
    session = get_session_factory()()
    try:
        admin = session.query(UserRow).filter_by(username="admin").one()
        with pytest.raises(KeyError, match="Unknown role"):
            assign_role(session, admin.id, "not_a_role")
    finally:
        session.close()
