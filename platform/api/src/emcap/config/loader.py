from pathlib import Path

import yaml
from pydantic import ValidationError

from emcap.config.models import PlatformConfig

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parents[5] / "config" / "platform.yaml"


def resolve_config_path(explicit: Path | None = None) -> Path:
    if explicit is not None:
        return explicit
    env_path = Path(__import__("os").environ.get("EMCAP_CONFIG_PATH", ""))
    if env_path and env_path.is_file():
        return env_path
    return DEFAULT_CONFIG_PATH


def load_platform_config(path: Path | None = None) -> PlatformConfig:
    config_path = resolve_config_path(path)
    if not config_path.is_file():
        msg = f"Platform config not found: {config_path}"
        raise FileNotFoundError(msg)

    with config_path.open(encoding="utf-8") as handle:
        raw = yaml.safe_load(handle) or {}

    try:
        return PlatformConfig.model_validate(raw)
    except ValidationError as exc:
        msg = f"Invalid platform config at {config_path}"
        raise ValueError(msg) from exc
