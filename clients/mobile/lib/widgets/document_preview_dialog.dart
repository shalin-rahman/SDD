import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../api/emcap_client.dart';
import '../services/i18n_service.dart';
import '../utils/document_preview_util.dart';

Future<void> showDocumentPreviewDialog(
  BuildContext context, {
  required EmcapClient client,
  required String documentId,
  Map<String, dynamic>? initialDocument,
}) {
  return showDialog<void>(
    context: context,
    builder: (ctx) => _DocumentPreviewDialog(
      client: client,
      documentId: documentId,
      initialDocument: initialDocument,
    ),
  );
}

class _DocumentPreviewDialog extends StatefulWidget {
  const _DocumentPreviewDialog({
    required this.client,
    required this.documentId,
    this.initialDocument,
  });

  final EmcapClient client;
  final String documentId;
  final Map<String, dynamic>? initialDocument;

  @override
  State<_DocumentPreviewDialog> createState() => _DocumentPreviewDialogState();
}

class _DocumentPreviewDialogState extends State<_DocumentPreviewDialog> {
  bool _loading = true;
  String? _loadError;
  String _filename = '';
  String _virusScanStatus = '';
  List<DocumentVersionOption> _versions = [];
  String _selectedVersionId = '';
  DocumentPreviewView? _previewView;

  @override
  void initState() {
    super.initState();
    _loadDocument(widget.documentId);
  }

  Future<void> _loadDocument(String documentId) async {
    setState(() {
      _loading = true;
      _loadError = null;
      _previewView = null;
    });
    try {
      final payload = await widget.client.getDocument(documentId);
      if (!mounted) return;
      final fallbackName =
          '${widget.initialDocument?['filename'] ?? widget.initialDocument?['id'] ?? documentId}';
      setState(() {
        _filename = '${payload['filename'] ?? fallbackName}';
        _virusScanStatus =
            '${payload['virus_scan_status'] ?? widget.initialDocument?['virus_scan_status'] ?? ''}';
        _versions = parseDocumentVersions(payload, documentId);
        _selectedVersionId = documentId;
        _previewView = buildDocumentPreviewView(payload);
        _loading = false;
      });
    } catch (err) {
      if (!mounted) return;
      setState(() {
        _loadError = err.toString().contains('Exception')
            ? EmcapLocale.t('document.preview.loadFailed')
            : err.toString();
        _loading = false;
      });
    }
  }

  void _onVersionChanged(String? versionId) {
    if (versionId == null || versionId.isEmpty || versionId == _selectedVersionId) return;
    _loadDocument(versionId);
  }

  Color? _virusBadgeColor(VirusScanBadgeKind kind) {
    switch (kind) {
      case VirusScanBadgeKind.clean:
        return Colors.green.shade100;
      case VirusScanBadgeKind.pending:
        return Colors.orange.shade100;
      case VirusScanBadgeKind.blocked:
        return Colors.red.shade100;
      case VirusScanBadgeKind.unknown:
        return Colors.grey.shade200;
    }
  }

  String _virusScanLabel() {
    if (_virusScanStatus.isEmpty) {
      return EmcapLocale.t('document.preview.virusUnknown');
    }
    return _virusScanStatus;
  }

  Future<void> _download() async {
    if (_previewView == null) return;
    final text = documentDownloadFallbackText(_previewView!, _filename);
    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(EmcapLocale.t('settings.saved'))),
    );
  }

  Widget _buildPreviewBody() {
    final view = _previewView;
    if (view == null) return const SizedBox.shrink();

    switch (view.mode) {
      case DocumentPreviewMode.image:
        if (view.bytes != null) {
          return Image.memory(view.bytes!, fit: BoxFit.contain);
        }
        break;
      case DocumentPreviewMode.text:
        final text = view.textContent ?? '';
        if (text.isNotEmpty) {
          return SelectableText(text);
        }
        break;
      case DocumentPreviewMode.pdf:
      case DocumentPreviewMode.download:
        break;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(EmcapLocale.t('document.preview.downloadOnly')),
        if (view.textContent != null && view.textContent!.isNotEmpty) ...[
          const SizedBox(height: 12),
          SelectableText(view.textContent!),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final virusKind = virusScanBadgeKind(_virusScanStatus);

    return AlertDialog(
      title: Row(
        children: [
          Expanded(
            child: Text(
              _filename.isEmpty
                  ? EmcapLocale.t('document.preview.title')
                  : _filename,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (_virusScanStatus.isNotEmpty || widget.initialDocument?['virus_scan_status'] != null)
            Padding(
              padding: const EdgeInsets.only(left: 8),
              child: Chip(
                label: Text(_virusScanLabel(), style: const TextStyle(fontSize: 11)),
                backgroundColor: _virusBadgeColor(virusKind),
                visualDensity: VisualDensity.compact,
              ),
            ),
        ],
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_versions.length > 1)
                DropdownButtonFormField<String>(
                  value: _selectedVersionId,
                  decoration: InputDecoration(
                    labelText: EmcapLocale.t('document.preview.version'),
                  ),
                  items: _versions
                      .map(
                        (entry) => DropdownMenuItem(
                          value: entry.id,
                          child: Text('${EmcapLocale.t('document.preview.version')} ${entry.version}'),
                        ),
                      )
                      .toList(),
                  onChanged: _onVersionChanged,
                )
              else if (widget.initialDocument?['version'] != null)
                Text('${EmcapLocale.t('document.preview.version')} ${widget.initialDocument!['version']}'),
              const SizedBox(height: 8),
              if (_loading)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Column(
                      children: [
                        const CircularProgressIndicator(),
                        const SizedBox(height: 12),
                        Text(EmcapLocale.t('common.loading')),
                      ],
                    ),
                  ),
                )
              else if (_loadError != null)
                Column(
                  children: [
                    Text(_loadError!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => _loadDocument(widget.documentId),
                      child: Text(EmcapLocale.t('common.retry')),
                    ),
                  ],
                )
              else
                _buildPreviewBody(),
            ],
          ),
        ),
      ),
      actions: [
        if (!_loading && _loadError == null && _previewView != null)
          TextButton(
            onPressed: _download,
            child: Text(EmcapLocale.t('document.preview.download')),
          ),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(EmcapLocale.t('common.cancel')),
        ),
      ],
    );
  }
}
