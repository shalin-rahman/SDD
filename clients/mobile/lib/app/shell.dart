import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import '../theme.dart';
import '../theme/app_tokens.dart';
import '../services/i18n_service.dart';
import '../utils/material_icon_util.dart';
import '../utils/organization_logo_util.dart';
import '../utils/shell_nav_util.dart';
import 'account_screen.dart';
import 'admin_permissions_screen.dart';
import 'admin_roles_screen.dart';
import 'admin_security_screen.dart';
import 'admin_users_screen.dart';
import 'assistant_screen.dart';
import 'dashboard_screen.dart';
import 'entity_list_screen.dart';
import 'notification_screen.dart';
import 'report_screen.dart';
import 'settings_screen.dart';
import 'workflow_inbox_screen.dart';

class _ShellNavEntry {
  const _ShellNavEntry({
    required this.key,
    required this.label,
    required this.icon,
    this.groupLabel,
  });

  final String key;
  final String label;
  final IconData icon;
  final String? groupLabel;
}

class EmcapShell extends StatefulWidget {
  const EmcapShell({super.key, required this.client});

  final EmcapClient client;

  @override
  State<EmcapShell> createState() => _EmcapShellState();
}

class _EmcapShellState extends State<EmcapShell> {
  List<_ShellNavEntry> _entries = [];
  String _selectedKey = 'workflow';
  String _tenantLabel = '';
  bool _multiTenant = false;
  bool _aiEnabled = false;
  List<Map<String, dynamic>> _tenants = [];
  String? _selectedTenantId;
  bool _loading = true;
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    widget.client.setOnUnauthorized(_handleSessionExpired);
    _bootstrap();
  }

  void _handleSessionExpired() {
    if (!mounted) return;
    widget.client.clearSession();
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (_) => LoginScreen(client: widget.client, sessionExpired: true),
      ),
      (_) => false,
    );
  }

  Future<void> _bootstrap() async {
    try {
      final health = await widget.client.getHealth();
      final tenants = await widget.client.listTenants();
      final config = await widget.client.getPlatformConfig();
      final me = await widget.client.getMe();
      final modules = extractModuleToggles(config);
      final permissions = extractUserPermissions(me);
      var menus = <MenuItem>[];
      try {
        final rawMenus = await widget.client.getMenus();
        menus = filterMenus(
          rawMenus.map(MenuItem.fromJson).toList(),
          permissions,
          modules,
        );
      } catch (_) {
        menus = const [];
      }
      final groups = groupMenusByModule(menus);
      final platformLinks = buildPlatformLinks(modules, permissions);
      if (!mounted) return;
      setState(() {
        _multiTenant = health['multi_tenant'] == true;
        _tenantLabel = 'tenant · ${health['tenant_strategy']} · multi=${health['multi_tenant']}';
        _tenants = parseTenantEntries(tenants);
        _selectedTenantId = widget.client.getTenantId();
        _aiEnabled = (modules?['ai'] as Map?)?['enabled'] == true;
        _entries = _buildEntries(platformLinks, groups);
        if (_entries.isNotEmpty && !_entries.any((e) => e.key == _selectedKey)) {
          _selectedKey = _entries.first.key;
        }
        _loading = false;
      });
      if (tenants['white_label'] == true) {
        EmcapTheme.seedColor.value = const Color(0xFF1A56DB);
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _entries = _buildEntries(buildPlatformLinks(null, const ['*.*']), const []);
        if (_entries.isNotEmpty && !_entries.any((e) => e.key == _selectedKey)) {
          _selectedKey = _entries.first.key;
        }
        _loading = false;
      });
    } finally {
      if (mounted && _loading && _entries.isEmpty) {
        setState(() {
          _entries = _buildEntries(buildPlatformLinks(null, const ['*.*']), const []);
          if (_entries.isNotEmpty) {
            _selectedKey = _entries.first.key;
          }
          _loading = false;
        });
      }
    }
  }

  List<_ShellNavEntry> _buildEntries(List<PlatformNavLink> links, List<ModuleNavGroup> groups) {
    final entries = <_ShellNavEntry>[];
    for (final link in links) {
      entries.add(
        _ShellNavEntry(
          key: link.key,
          label: link.label,
          icon: _iconForKey(link.key),
        ),
      );
    }
    for (final group in groups) {
      for (final menu in group.items) {
        entries.add(
          _ShellNavEntry(
            key: 'entity:${menu.entityCode}',
            label: menu.label,
            icon: iconFromMaterialName(menu.icon),
            groupLabel: group.moduleLabel,
          ),
        );
      }
    }
    return entries;
  }

  IconData _iconForKey(String key) {
    switch (key) {
      case 'workflow':
        return Icons.inbox;
      case 'reports':
        return Icons.assessment;
      case 'dashboards':
        return Icons.dashboard;
      case 'notifications':
        return Icons.notifications;
      case 'account':
        return Icons.person;
      case 'assistant':
        return Icons.smart_toy;
      case 'admin-users':
        return Icons.manage_accounts;
      case 'admin-roles':
        return Icons.badge;
      case 'admin-permissions':
        return Icons.lock;
      case 'admin-security':
        return Icons.security;
      case 'settings':
        return Icons.settings;
      default:
        if (key.startsWith('entity:')) {
          return Icons.folder;
        }
        return Icons.circle;
    }
  }

  _ShellNavEntry? get _selectedEntry {
    for (final entry in _entries) {
      if (entry.key == _selectedKey) return entry;
    }
    return _entries.isEmpty ? null : _entries.first;
  }

  Widget _bodyForSelection() {
    switch (_selectedKey) {
      case 'workflow':
        return WorkflowInboxScreen(
          client: widget.client,
          onOpenEntity: (entityCode) => _selectKey('entity:$entityCode'),
        );
      case 'reports':
        return ReportScreen(client: widget.client);
      case 'dashboards':
        return DashboardScreen(client: widget.client);
      case 'notifications':
        return NotificationScreen(client: widget.client);
      case 'account':
        return AccountScreen(client: widget.client);
      case 'assistant':
        return AssistantScreen(client: widget.client, enabled: _aiEnabled);
      case 'admin-users':
        return AdminUsersScreen(client: widget.client);
      case 'admin-roles':
        return AdminRolesScreen(client: widget.client);
      case 'admin-permissions':
        return AdminPermissionsScreen(client: widget.client);
      case 'admin-security':
        return AdminSecurityScreen(client: widget.client);
      case 'settings':
        return SettingsScreen(
          client: widget.client,
          onNavRefresh: _bootstrap,
          logoPicker: pickOrganizationLogoFromDevice,
        );
      default:
        break;
    }
    if (_selectedKey.startsWith('entity:')) {
      final entityCode = _selectedKey.substring('entity:'.length);
      final label = _selectedEntry?.label ?? entityCode;
      return EntityListScreen(
        client: widget.client,
        entityCode: entityCode,
        title: label,
        showPageTitle: false,
        onOpenWorkflowInbox: () => _selectKey('workflow'),
      );
    }
    return Center(child: Text(EmcapLocale.t('shell.nav.unknown')));
  }

  void _selectKey(String key) {
    setState(() => _selectedKey = key);
    if (_scaffoldKey.currentState?.isDrawerOpen == true) {
      Navigator.of(context).pop();
    }
  }

  List<Widget> _navTiles({required bool rail}) {
    final tokens = context.emcapTokens;
    final tiles = <Widget>[];
    String? currentGroup;
    for (final entry in _entries) {
      if (entry.groupLabel != null && entry.groupLabel != currentGroup) {
        currentGroup = entry.groupLabel;
        tiles.add(
          Padding(
            padding: EdgeInsets.fromLTRB(
              rail ? tokens.spaceSm + 4 : tokens.spaceMd,
              tokens.spaceSm + 4,
              tokens.spaceSm,
              tokens.spaceXs,
            ),
            child: Text(
              currentGroup!,
              style: Theme.of(context).textTheme.labelSmall,
            ),
          ),
        );
      }
      if (rail) {
        continue;
      }
      tiles.add(
        ListTile(
          leading: Icon(entry.icon),
          title: Text(entry.label),
          selected: _selectedKey == entry.key,
          onTap: () => _selectKey(entry.key),
        ),
      );
    }
    return tiles;
  }

  Widget _drawer() {
    return Drawer(
      child: Semantics(
        label: EmcapLocale.t('a11y.landmark.navigation'),
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(color: Theme.of(context).colorScheme.primaryContainer),
              child: Align(
                alignment: Alignment.bottomLeft,
                child: Text(EmcapLocale.t('shell.pageTitle.default'), style: Theme.of(context).textTheme.titleLarge),
              ),
            ),
            ..._navTiles(rail: false),
          ],
        ),
      ),
    );
  }

  Widget _rail() {
    final tokens = context.emcapTokens;
    final slots = buildRailNavSlots(
      _entries
          .map(
            (entry) => ShellNavEntryRef(
              key: entry.key,
              label: entry.label,
              groupLabel: entry.groupLabel,
            ),
          )
          .toList(),
    );
    return Material(
      child: Container(
        width: 72,
        decoration: BoxDecoration(
          border: Border(right: BorderSide(color: Theme.of(context).dividerColor)),
        ),
        child: ListView(
          padding: EdgeInsets.symmetric(vertical: tokens.spaceSm),
          children: [
            for (final slot in slots)
              if (slot.isHeader)
                Padding(
                  padding: EdgeInsets.fromLTRB(
                    tokens.spaceXs,
                    tokens.spaceSm + 4,
                    tokens.spaceXs,
                    tokens.spaceXs,
                  ),
                  child: Text(
                    slot.headerLabel!,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.labelSmall,
                  ),
                )
              else
                _railDestination(slot.key!, slot.label!),
          ],
        ),
      ),
    );
  }

  Widget _railDestination(String key, String label) {
    final selected = _selectedKey == key;
    return Tooltip(
      message: label,
      child: InkWell(
        onTap: () => _selectKey(key),
        child: Container(
          height: 56,
          color: selected ? Theme.of(context).colorScheme.secondaryContainer : null,
          child: Icon(
            _iconForKey(key),
            color: selected ? Theme.of(context).colorScheme.onSecondaryContainer : null,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _entries.isEmpty) {
      return Scaffold(
        body: Semantics(
          label: EmcapLocale.t('a11y.screenReader.loading'),
          liveRegion: true,
          child: const Center(child: CircularProgressIndicator()),
        ),
      );
    }
    final selected = _selectedEntry!;
    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 900;
        return Scaffold(
          key: _scaffoldKey,
          drawer: wide ? null : _drawer(),
          appBar: AppBar(
            title: Text(
              selected.label,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontSize: context.emcapTokens.fontTitleLg,
                    fontWeight: FontWeight.w600,
                    color: context.emcapTokens.text,
                  ),
            ),
            actions: [
              PopupMenuButton<String>(
                tooltip: EmcapLocale.t('toolbar.locale'),
                icon: const Icon(Icons.language),
                onSelected: (tag) => EmcapLocale.setLocaleTag(tag),
                itemBuilder: (_) => [
                  PopupMenuItem(value: 'en-US', child: Text(EmcapLocale.t('toolbar.language.en-US'))),
                  PopupMenuItem(value: 'fr-FR', child: Text(EmcapLocale.t('toolbar.language.fr-FR'))),
                  PopupMenuItem(value: 'bn-BD', child: Text(EmcapLocale.t('toolbar.language.bn-BD'))),
                ],
              ),
              ValueListenableBuilder<ThemeMode>(
                valueListenable: EmcapTheme.themeMode,
                builder: (context, mode, _) {
                  return IconButton(
                    tooltip: EmcapLocale.t('toolbar.theme'),
                    icon: Icon(mode == ThemeMode.dark ? Icons.light_mode : Icons.dark_mode),
                    onPressed: EmcapTheme.toggleThemeMode,
                  );
                },
              ),
              ValueListenableBuilder<bool>(
                valueListenable: EmcapTheme.compactDensity,
                builder: (context, compact, _) {
                  return IconButton(
                    tooltip: compact
                        ? EmcapLocale.t('platform.account.densityComfortable')
                        : EmcapLocale.t('platform.account.densityCompact'),
                    icon: Icon(compact ? Icons.density_small : Icons.density_medium),
                    onPressed: EmcapTheme.toggleCompactDensity,
                  );
                },
              ),
            ],
          ),
          body: Row(
            children: [
              if (wide) _rail(),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Material(
                      color: Theme.of(context).colorScheme.surfaceContainerHighest,
                      child: Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal: context.emcapTokens.spaceSm + 4,
                          vertical: context.emcapTokens.spaceXs + 2,
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(_tenantLabel, style: Theme.of(context).textTheme.bodySmall),
                            ),
                            if (_multiTenant && _tenants.isNotEmpty)
                              DropdownButton<String>(
                                value: _selectedTenantId,
                                items: _tenants
                                    .map(
                                      (t) => DropdownMenuItem(
                                        value: '${t['id'] ?? t['code'] ?? 'default'}',
                                        child: Text('${t['name'] ?? t['code'] ?? t['id']}'),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (value) {
                                  if (value == null) return;
                                  widget.client.setTenantId(value);
                                  setState(() => _selectedTenantId = value);
                                },
                              ),
                          ],
                        ),
                      ),
                    ),
                    Expanded(
                      child: Semantics(
                        label: EmcapLocale.t('a11y.landmark.main'),
                        child: Padding(
                          padding: EdgeInsets.all(context.emcapTokens.spaceSm + 4),
                          child: _bodyForSelection(),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.client, this.sessionExpired = false});

  final EmcapClient client;
  final bool sessionExpired;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _username = TextEditingController(text: 'admin');
  final _password = TextEditingController(text: 'admin123');
  String? _error;
  List<String> _providers = const ['username_password'];
  String _selectedProvider = 'username_password';
  bool _loadingProviders = true;

  @override
  void initState() {
    super.initState();
    if (widget.sessionExpired) {
      _error = EmcapLocale.t('security.session.expired');
    }
    _loadProviders();
  }

  Future<void> _loadProviders() async {
    try {
      final providers = await widget.client.getAuthProviders();
      if (!mounted) return;
      setState(() {
        _providers = providers;
        _loadingProviders = false;
        if (!_providers.contains(_selectedProvider)) {
          _selectedProvider = _providers.first;
        }
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _providers = const ['username_password'];
        _loadingProviders = false;
      });
    }
  }

  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    super.dispose();
  }

  String _providerLabel(String provider) {
    final key = 'platform.login.provider.$provider';
    final label = EmcapLocale.t(key);
    return label == key ? provider : label;
  }

  void _enterShell(Map<String, dynamic> result) {
    widget.client.setToken(
      result['access_token'] as String,
      (result['tenant_id'] as String?) ?? 'default',
    );
    widget.client.setOnUnauthorized(_handleSessionExpired);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => EmcapShell(client: widget.client)),
    );
  }

  void _handleSessionExpired() {
    if (!mounted) return;
    widget.client.clearSession();
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (_) => LoginScreen(client: widget.client, sessionExpired: true),
      ),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(EmcapLocale.t('platform.login.title'))),
      body: Padding(
        padding: EdgeInsets.all(context.emcapTokens.spaceLg),
        child: ListView(
          children: [
            Text(
              EmcapLocale.t('platform.login.subtitle'),
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 12),
            if (_loadingProviders)
              Text(EmcapLocale.t('common.loading'))
            else ...[
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final provider in _providers)
                    ChoiceChip(
                      label: Text(_providerLabel(provider)),
                      selected: _selectedProvider == provider,
                      onSelected: (_) => setState(() {
                        _selectedProvider = provider;
                        _error = null;
                      }),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              if (_selectedProvider == 'username_password') ...[
                TextField(
                  controller: _username,
                  decoration: InputDecoration(labelText: EmcapLocale.t('platform.login.username')),
                ),
                TextField(
                  controller: _password,
                  decoration: InputDecoration(labelText: EmcapLocale.t('platform.login.password')),
                  obscureText: true,
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () async {
                    try {
                      final result = await widget.client.login(_username.text, _password.text);
                      _enterShell(result);
                    } catch (_) {
                      setState(() => _error = EmcapLocale.t('platform.login.loginFailed'));
                    }
                  },
                  child: Text(EmcapLocale.t('platform.login.signIn')),
                ),
              ] else if (_selectedProvider == 'oauth') ...[
                Text(EmcapLocale.t('platform.login.oauthHint')),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: () async {
                    try {
                      if (!_providers.contains('oauth')) {
                        setState(() => _error = EmcapLocale.t('platform.login.oauthDisabled'));
                        return;
                      }
                      final result = await widget.client.loginOAuth('emcap-client', 'emcap-secret');
                      _enterShell(result);
                    } catch (_) {
                      setState(() => _error = EmcapLocale.t('platform.login.oauthFailed'));
                    }
                  },
                  child: Text(EmcapLocale.t('platform.login.oauth')),
                ),
              ],
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
          ],
        ),
      ),
    );
  }
}
