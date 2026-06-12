import 'package:flutter/material.dart';

import '../api/emcap_client.dart';
import '../services/i18n_service.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key, required this.client});

  final EmcapClient client;

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  late Future<List<Map<String, dynamic>>> _reportsFuture;
  String? _selectedCode;
  Future<Map<String, dynamic>>? _runFuture;
  List<Map<String, dynamic>> _runs = [];

  @override
  void initState() {
    super.initState();
    _reportsFuture = widget.client.listReports();
  }

  String _scheduleLabel(Map<String, dynamic> report) {
    final cron = report['schedule_cron'];
    if (cron == null || '$cron'.isEmpty) {
      return EmcapLocale.t('platform.reports.noSchedule');
    }
    return '$cron';
  }

  void _runReport(String code) {
    setState(() {
      _selectedCode = code;
      _runFuture = widget.client.runReport(code);
    });
    widget.client.listReportRuns(code).then((runs) {
      if (!mounted) return;
      setState(() => _runs = runs);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(EmcapLocale.t('platform.reports.title'))),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _reportsFuture,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(
              child: Text('${EmcapLocale.t('platform.common.failed')}: ${snapshot.error}'),
            );
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final reports = snapshot.data!;
          if (reports.isEmpty) {
            return Center(child: Text(EmcapLocale.t('platform.reports.noReports')));
          }
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  columns: [
                    DataColumn(label: Text(EmcapLocale.t('platform.reports.colCode'))),
                    DataColumn(label: Text(EmcapLocale.t('platform.reports.colName'))),
                    DataColumn(label: Text(EmcapLocale.t('platform.reports.colEntity'))),
                    DataColumn(label: Text(EmcapLocale.t('platform.reports.colSchedule'))),
                    DataColumn(label: Text(EmcapLocale.t('platform.reports.colActions'))),
                  ],
                  rows: reports
                      .map(
                        (report) => DataRow(
                          cells: [
                            DataCell(Text('${report['code'] ?? ''}')),
                            DataCell(Text('${report['name'] ?? ''}')),
                            DataCell(Text('${report['entity_code'] ?? ''}')),
                            DataCell(Text(_scheduleLabel(report))),
                            DataCell(
                              TextButton(
                                onPressed: () => _runReport('${report['code']}'),
                                child: Text(EmcapLocale.t('platform.reports.run')),
                              ),
                            ),
                          ],
                        ),
                      )
                      .toList(),
                ),
              ),
              if (_selectedCode != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    '${EmcapLocale.t('platform.reports.pastRuns')}: ${_runs.length} · ${EmcapLocale.t('platform.reports.schedule')}: ${_scheduleLabelForCode(reports, _selectedCode!)}',
                  ),
                ),
              if (_runFuture != null)
                Expanded(
                  child: FutureBuilder<Map<String, dynamic>>(
                    future: _runFuture,
                    builder: (context, runSnapshot) {
                      if (runSnapshot.hasError) {
                        return Center(child: Text(EmcapLocale.t('platform.reports.runFailed')));
                      }
                      if (!runSnapshot.hasData) {
                        return const Center(child: CircularProgressIndicator());
                      }
                      final result = runSnapshot.data!;
                      final rows = List<Map<String, dynamic>>.from(result['rows'] as List);
                      if (rows.isEmpty) {
                        return Center(child: Text(EmcapLocale.t('platform.reports.noRows')));
                      }
                      final columns = rows.first.keys.toList();
                      return SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: DataTable(
                          columns: columns.map((col) => DataColumn(label: Text(col))).toList(),
                          rows: rows
                              .map(
                                (row) => DataRow(
                                  cells: columns.map((col) => DataCell(Text('${row[col] ?? ''}'))).toList(),
                                ),
                              )
                              .toList(),
                        ),
                      );
                    },
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  String _scheduleLabelForCode(List<Map<String, dynamic>> reports, String code) {
    for (final report in reports) {
      if ('${report['code']}' == code) {
        return _scheduleLabel(report);
      }
    }
    return EmcapLocale.t('platform.reports.noSchedule');
  }
}
