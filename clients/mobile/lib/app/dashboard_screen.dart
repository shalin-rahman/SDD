import 'package:flutter/material.dart';

import '../api/emcap_client.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, required this.client});

  final EmcapClient client;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.client.listDashboards();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dashboards')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Failed: ${snapshot.error}'));
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final dashboards = snapshot.data!;
          if (dashboards.isEmpty) {
            return const Center(child: Text('No dashboards.'));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: dashboards.length,
            itemBuilder: (context, index) {
              final dash = dashboards[index];
              final widgets = List<Map<String, dynamic>>.from(dash['widgets'] as List? ?? []);
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${dash['name'] ?? dash['code']}', style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 8),
                      ...widgets.map(
                        (w) => ListTile(
                          dense: true,
                          title: Text('${w['label'] ?? w['code']}'),
                          trailing: Text('${w['value'] ?? w['metric'] ?? ''}'),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
