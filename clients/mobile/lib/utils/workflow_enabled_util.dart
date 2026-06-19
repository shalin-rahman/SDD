Map<String, dynamic>? _map(dynamic value) {
  if (value == null) return null;
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return null;
}

bool isWorkflowEnabled(Map<String, dynamic> config) {
  final modules = _map(config['modules']);
  final workflowModule = (modules?['workflow'] as Map?)?['enabled'];
  if (workflowModule == false) return false;
  final workflow = _map(config['workflow']);
  if (workflow?['enabled'] == false) return false;
  return true;
}

const entityStartWorkflowCodes = <String, String>{
  'PRODUCT': 'STOCK_ADJUSTMENT',
};

String? entityStartWorkflowCode(String entityCode) => entityStartWorkflowCodes[entityCode];
