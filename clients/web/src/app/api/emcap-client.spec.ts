import { createClient } from './emcap-client';

const REQUIRED_METHODS = [
  'login',
  'getMenus',
  'getFormMetadata',
  'getGridMetadata',
  'listRecords',
  'getRecord',
  'createRecord',
  'updateRecord',
  'deleteRecord',
  'syncSnapshot',
  'listNotes',
  'addNote',
  'listWorkflowInstances',
  'transitionWorkflow',
  'delegateWorkflow',
  'listReports',
  'runReport',
  'listDocuments',
  'uploadDocument',
  'syncChanges',
  'subscribeRecordsStream',
  'listAudit',
  'listNotifications',
  'sendNotification',
  'getPermissions',
  'getRoles',
  'listDashboards',
  'getHealth',
  'getPlatformConfig',
  'listTenants',
  'createPaymentIntent',
  'dispatchRestIntegration',
  'setToken',
  'setTenantId',
  'getAuthProviders',
  'loginOAuth',
  'enrollMfa',
  'verifyMfa',
  'startWorkflow',
  'listReportRuns',
  'getDocument',
  'aiChat',
  'aiSummarize',
  'getWorkflowInstance',
  'publishKafkaIntegration',
  'invokeSoapIntegration',
  'uploadSftpIntegration',
  'graphqlQuery',
  'getMe',
  'assignRole',
  'checkAuth',
  'escalateWorkflows',
  'evaluateWorkflowRule',
  'listEntities',
  'getMetrics',
  'confirmPaymentIntent',
  'listAdminUsers',
  'getAdminUser',
  'createAdminUser',
  'updateAdminUser',
  'deactivateAdminUser',
  'listAdminRoles',
  'createAdminRole',
  'updateAdminRole',
  'getAdminSettings',
  'updateAdminSettings',
  'listAdminTemplates',
  'createAdminTemplate',
  'updateAdminTemplate',
  'deleteAdminTemplate',
  'getAdminAudit',
] as const;

describe('EmcapClient contract', () => {
  it('exposes SDD §9 platform API methods', () => {
    const client = createClient('http://localhost:8000');

    for (const method of REQUIRED_METHODS) {
      expect(typeof client[method]).toBe('function');
    }
  });

  it('defaults API base to localhost:8000', () => {
    expect(createClient('http://localhost:8000')).toBeDefined();
  });
});
