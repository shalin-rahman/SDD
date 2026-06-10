from emcap.auth.providers.base import AuthProvider


class AuthProviderRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, AuthProvider] = {}

    def register(self, provider: AuthProvider) -> None:
        self._providers[provider.name] = provider

    def get(self, name: str) -> AuthProvider:
        if name not in self._providers:
            msg = f"Unknown auth provider: {name}"
            raise KeyError(msg)
        return self._providers[name]

    def list_enabled(self, enabled: dict[str, bool]) -> list[str]:
        return sorted(
            name for name, active in enabled.items() if active and name in self._providers
        )
