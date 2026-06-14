bool isWorkflowEnabled(Map<String, dynamic> config) {
  final modules = config['modules'] as Map<String, dynamic>?;
  final workflowModule = (modules?['workflow'] as Map?)?['enabled'];
  if (workflowModule == false) return false;
  final workflow = config['workflow'] as Map<String, dynamic>?;
  if (workflow?['enabled'] == false) return false;
  return true;
}

const entityStartWorkflowCodes = <String, String>{
  'PRODUCT': 'STOCK_ADJUSTMENT',
};

String? entityStartWorkflowCode(String entityCode) => entityStartWorkflowCodes[entityCode];
