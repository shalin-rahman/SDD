import 'package:flutter/material.dart';

import '../api/emcap_client.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key, required this.client});

  final EmcapClient client;

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  late Future<List<String>> _reportsFuture;
  String? _selectedCode;
  Future<Map<String, dynamic>>? _runFuture;

  @override
  void initState() {
    super.initState();
    _reportsFuture = widget.client.listReports();
  }

  void _runReport(String code) {
    setState(() {
      _selectedCode = code;
      _runFuture = widget.client.runReport(code);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reports')),
      body: FutureBuilder<List<String>>(
        future: _reportsFuture,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Failed to load: ${snapshot.error}'));
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final reports = snapshot.data!;
          if (reports.isEmpty) {
            return const Center(child: Text('No reports registered.'));
          }
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: reports
                      .map(
                        (code) => ElevatedButton(
                          onPressed: () => _runReport(code),
                          child: Text(code),
                        ),
                      )
                      .toList(),
                ),
              ),
              if (_runFuture != null)
                Expanded(
                  child: FutureBuilder<Map<String, dynamic>>(
                    future: _runFuture,
                    builder: (context, runSnapshot) {
                      if (runSnapshot.hasError) {
                        return Center(child: Text('Run failed: ${runSnapshot.error}'));
                      }
                      if (!runSnapshot.hasData) {
                        return const Center(child: CircularProgressIndicator());
                      }
                      final result = runSnapshot.data!;
                      final rows = List<Map<String, dynamic>>.from(result['rows'] as List);
                      if (rows.isEmpty) {
                        return Center(child: Text('$_selectedCode: no rows'));
                      }
                      final columns = rows.first.keys.toList();
                      return SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: DataTable(
                          columns: columns
                              .map((col) => DataColumn(label: Text(col)))
                              .toList(),
                          rows: rows
                              .map(
                                (row) => DataRow(
                                  cells: columns
                                      .map((col) => DataCell(Text('${row[col] ?? ''}')))
                                      .toList(),
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
}
