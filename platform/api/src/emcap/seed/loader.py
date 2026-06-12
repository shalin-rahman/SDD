"""Load core and demo seed data from JSON packs configured in platform.yaml."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from emcap.auth.service import hash_password
from emcap.config.loader import resolve_config_path
from emcap.config.models import PlatformConfig
from emcap.persistence.database import (
    DocumentRow,
    EntityRecordRow,
    NoteRow,
    RoleRow,
    UserRoleRow,
    UserRow,
)

logger = logging.getLogger(__name__)


def repo_root_from_config() -> Path:
    return resolve_config_path().parent.parent


def resolve_seed_directory(config: PlatformConfig, relative_path: str) -> Path:
    path = Path(relative_path)
    if path.is_absolute():
        return path
    return (repo_root_from_config() / path).resolve()


def _load_json_documents(directory: Path) -> list[dict[str, Any]]:
    if not directory.is_dir():
        logger.warning("Seed directory missing: %s", directory)
        return []

    documents: list[dict[str, Any]] = []
    for file_path in sorted(directory.glob("*.json")):
        if file_path.name == "manifest.json":
            continue
        with file_path.open(encoding="utf-8") as handle:
            payload = json.load(handle)
        if isinstance(payload, dict):
            documents.append(payload)
    return documents


def _collect_demo_record_ids(directory: Path) -> set[str]:
    ids: set[str] = set()
    for document in _load_json_documents(directory):
        for record in document.get("entity_records", []):
            record_id = record.get("id")
            if record_id:
                ids.add(str(record_id))
    return ids


def remove_demo_seed(session: Session, demo_directory: Path) -> int:
    record_ids = _collect_demo_record_ids(demo_directory)
    if not record_ids:
        return 0

    removed = 0
    for record_id in record_ids:
        session.query(NoteRow).filter_by(record_id=record_id).delete()
        session.query(DocumentRow).filter_by(record_id=record_id).delete()
        deleted = session.query(EntityRecordRow).filter_by(id=record_id).delete()
        removed += deleted

    if removed:
        session.commit()
        logger.info("Removed %d demo entity record(s)", removed)
    return removed


def _upsert_roles(session: Session, roles: list[dict[str, Any]]) -> dict[str, str]:
    code_to_id: dict[str, str] = {}
    for role in roles:
        code = str(role["code"])
        existing = session.query(RoleRow).filter_by(code=code).one_or_none()
        if existing is None:
            row = RoleRow(
                code=code,
                name=str(role.get("name", code)),
                permissions=list(role.get("permissions", [])),
            )
            session.add(row)
            session.flush()
            code_to_id[code] = row.id
        else:
            existing.name = str(role.get("name", existing.name))
            existing.permissions = list(role.get("permissions", existing.permissions))
            code_to_id[code] = existing.id
    session.commit()
    return code_to_id


def _upsert_users(
    session: Session,
    users: list[dict[str, Any]],
    role_code_to_id: dict[str, str],
) -> None:
    for user in users:
        username = str(user["username"])
        existing = session.query(UserRow).filter_by(username=username).one_or_none()
        if existing is None:
            password_hash = user.get("password_hash")
            if not password_hash and user.get("password"):
                password_hash = hash_password(str(user["password"]))
            if not password_hash:
                msg = f"User {username} requires password or password_hash"
                raise ValueError(msg)

            row = UserRow(
                username=username,
                password_hash=str(password_hash),
                tenant_id=str(user.get("tenant_id", "default")),
                attributes=dict(user.get("attributes", {})),
                mfa_enabled=bool(user.get("mfa_enabled", False)),
            )
            session.add(row)
            session.flush()
            user_id = row.id
        else:
            user_id = existing.id
            if user.get("password"):
                existing.password_hash = hash_password(str(user["password"]))
            elif user.get("password_hash"):
                existing.password_hash = str(user["password_hash"])
            if "tenant_id" in user:
                existing.tenant_id = str(user["tenant_id"])
            if "attributes" in user:
                existing.attributes = dict(user["attributes"])
            session.flush()

        for role_code in user.get("roles", []):
            role_id = role_code_to_id.get(str(role_code))
            if role_id is None:
                logger.warning("Role not found for user %s: %s", username, role_code)
                continue
            link = (
                session.query(UserRoleRow).filter_by(user_id=user_id, role_id=role_id).one_or_none()
            )
            if link is None:
                session.add(UserRoleRow(user_id=user_id, role_id=role_id))

    session.commit()


def _upsert_entity_records(session: Session, records: list[dict[str, Any]]) -> int:
    inserted = 0
    for record in records:
        record_id = str(record["id"])
        entity_code = str(record["entity_code"])
        tenant_id = str(record.get("tenant_id", "default"))
        data = dict(record.get("data", {}))

        existing = session.query(EntityRecordRow).filter_by(id=record_id).one_or_none()
        if existing is None:
            session.add(
                EntityRecordRow(
                    id=record_id,
                    entity_code=entity_code,
                    tenant_id=tenant_id,
                    data=data,
                )
            )
            inserted += 1
        else:
            existing.entity_code = entity_code
            existing.tenant_id = tenant_id
            existing.data = data

    if inserted:
        session.commit()
    else:
        session.commit()
    return inserted


def apply_core_seed(session: Session, core_directory: Path) -> None:
    role_codes: dict[str, str] = {}
    for document in _load_json_documents(core_directory):
        if document.get("roles"):
            role_codes = _upsert_roles(session, list(document["roles"]))
        if document.get("users"):
            if not role_codes:
                existing_roles = session.query(RoleRow).all()
                role_codes = {role.code: role.id for role in existing_roles}
            _upsert_users(session, list(document["users"]), role_codes)


def apply_demo_seed(session: Session, demo_directory: Path) -> int:
    inserted = 0
    for document in _load_json_documents(demo_directory):
        records = document.get("entity_records", [])
        if records:
            inserted += _upsert_entity_records(session, list(records))
    return inserted


def apply_configured_seeds(session: Session, config: PlatformConfig) -> None:
    demo_directory = resolve_seed_directory(config, config.seed.demo.path)
    core_directory = resolve_seed_directory(config, config.seed.core.path)

    if config.seed.demo.remove_when_disabled and not config.seed.demo.enabled:
        remove_demo_seed(session, demo_directory)

    if config.seed.core.enabled:
        apply_core_seed(session, core_directory)

    if config.seed.demo.enabled:
        count = apply_demo_seed(session, demo_directory)
        if count:
            logger.info("Applied %d demo entity record(s)", count)
