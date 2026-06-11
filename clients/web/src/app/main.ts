import { createClient } from "../api/emcap-client";
import { renderEntityView } from "./entity-view";

const client = createClient();
let activeStreamCleanup: (() => void) | null = null;
let aiEnabled = false;

const entityHandles = {
  stopStream: () => {
    activeStreamCleanup?.();
    activeStreamCleanup = null;
  },
  setStreamCleanup: (cleanup: (() => void) | null) => {
    activeStreamCleanup?.();
    activeStreamCleanup = cleanup;
  },
};

function el(tag: string, text = "", className = ""): HTMLElement {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function stopActiveStream(): void {
  activeStreamCleanup?.();
  activeStreamCleanup = null;
}

function renderLogin(root: HTMLElement): void {
  stopActiveStream();
  root.innerHTML = "";
  const form = el("form", "", "login-form");
  const user = document.createElement("input");
  user.placeholder = "Username";
  user.value = "admin";
  const pass = document.createElement("input");
  pass.type = "password";
  pass.placeholder = "Password";
  pass.value = "admin123";
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Sign in";
  const error = el("p", "", "error");
  const oauthBtn = el("button", "OAuth (client credentials)");
  oauthBtn.type = "button";
  form.append(user, pass, button, oauthBtn, error);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const result = await client.login(user.value, pass.value);
      client.setToken(result.access_token, result.tenant_id);
      void renderShell(root);
    } catch (err) {
      error.textContent = err instanceof Error ? err.message : "Login failed";
    }
  });
  oauthBtn.addEventListener("click", () => {
    void (async () => {
      try {
        const providers = await client.getAuthProviders();
        if (!providers.providers.includes("oauth")) {
          error.textContent = "OAuth disabled in config";
          return;
        }
        const result = await client.loginOAuth("emcap-client", "emcap-secret");
        client.setToken(result.access_token, result.tenant_id);
        void renderShell(root);
      } catch (err) {
        error.textContent = err instanceof Error ? err.message : "OAuth failed";
      }
    })();
  });
  root.append(el("h1", "EMCAP"), form);
}

async function renderAssistantView(root: HTMLElement): Promise<void> {
  stopActiveStream();
  root.innerHTML = "";
  root.append(el("h2", "Assistant"));
  if (!aiEnabled) {
    root.append(el("p", "AI disabled in platform config."));
    return;
  }
  const input = document.createElement("textarea");
  input.value = "Summarize inventory status";
  const sendBtn = el("button", "Chat");
  const out = el("pre", "");
  sendBtn.addEventListener("click", () => {
    void client.aiChat(input.value).then((r) => {
      out.textContent = JSON.stringify(r, null, 2);
    });
  });
  root.append(input, sendBtn, out);
}

async function renderShell(root: HTMLElement): Promise<void> {
  stopActiveStream();
  try {
    const config = await client.getPlatformConfig();
    const modules = config.modules as Record<string, { enabled?: boolean }> | undefined;
    aiEnabled = modules?.ai?.enabled === true;
  } catch {
    aiEnabled = false;
  }
  root.innerHTML = "";
  const header = el("header", "", "app-header");
  const titleWrap = el("div");
  titleWrap.append(el("h1", "EMCAP"));
  const tenantLine = el("p", "", "tenant-status");
  titleWrap.append(tenantLine);
  header.append(titleWrap, el("button", "Sign out"));
  header.querySelector("button")?.addEventListener("click", () => renderLogin(root));
  const tenantSelect = document.createElement("select");
  tenantSelect.style.display = "none";
  void client.getHealth().then(async (health) => {
    tenantLine.textContent = `mode: multi_tenant=${String(health.multi_tenant)} · ${health.tenant_strategy}`;
    const tenants = await client.listTenants();
    if (health.multi_tenant) {
      tenantSelect.style.display = "block";
      tenantSelect.innerHTML = "";
      for (const tenant of tenants.tenants) {
        const opt = document.createElement("option");
        opt.value = String(tenant.id ?? tenant.code ?? "default");
        opt.textContent = String(tenant.name ?? tenant.code ?? tenant.id);
        tenantSelect.append(opt);
      }
      tenantSelect.addEventListener("change", () => {
        client.setTenantId(tenantSelect.value);
      });
    }
    const config = await client.getPlatformConfig();
    const modules = config.modules as Record<string, { enabled?: boolean }> | undefined;
    aiEnabled = modules?.ai?.enabled === true;
    if (tenants.white_label) {
      document.documentElement.style.setProperty("--emcap-primary", "#1a56db");
    }
  }).catch(() => {
    tenantLine.textContent = "";
  });
  titleWrap.append(tenantSelect);

  const nav = el("nav", "", "app-nav");
  const main = el("main", "", "app-main");
  root.append(header, nav, main);

  const navViews: Array<[string, () => void]> = [
    ["Workflow tasks", () => renderWorkflowInbox(main)],
    ["Reports", () => renderReportsView(main)],
    ["Dashboards", () => renderDashboardsView(main)],
    ["Notifications", () => renderNotificationsView(main)],
    ["Account", () => renderAccountView(main)],
    ["Assistant", () => renderAssistantView(main)],
  ];
  for (const [label, handler] of navViews) {
    if (label === "Assistant" && !aiEnabled) {
      continue;
    }
    const link = el("button", label, "nav-link");
    link.addEventListener("click", () => {
      void handler();
    });
    nav.append(link);
  }

  try {
    const { menus } = await client.getMenus();
    for (const menu of menus) {
      const link = el("button", menu.label, "nav-link");
      link.addEventListener("click", () => {
        void renderEntityView(main, client, menu.entity_code, menu.label, entityHandles);
      });
      nav.append(link);
    }
    if (menus.length > 0) {
      await renderEntityView(main, client, menus[0].entity_code, menus[0].label, entityHandles);
    }
  } catch (err) {
    main.append(el("p", err instanceof Error ? err.message : "Failed to load menus", "error"));
  }
}

async function renderReportsView(root: HTMLElement): Promise<void> {
  stopActiveStream();
  root.innerHTML = "";
  root.append(el("h2", "Reports"));

  try {
    const { reports } = await client.listReports();
    if (reports.length === 0) {
      root.append(el("p", "No reports registered."));
      return;
    }

    const picker = el("div", "", "report-picker");
    const resultArea = el("div", "", "report-result");
    root.append(picker, resultArea);

    for (const code of reports) {
      const button = el("button", code, "nav-link");
      button.addEventListener("click", () => {
        void (async () => {
          resultArea.innerHTML = "";
          resultArea.append(el("p", `Running ${code}...`));
          try {
            const runs = await client.listReportRuns(code);
            const result = await client.runReport(code);
            resultArea.innerHTML = "";
            resultArea.append(el("p", `Past runs: ${runs.runs.length} · schedule: daily (cron in module)`));
            resultArea.append(el("h3", `${result.report_code} (${result.rows.length} rows)`));
            if (result.rows.length === 0) {
              resultArea.append(el("p", "No rows returned."));
              return;
            }
            const columns = Object.keys(result.rows[0] ?? {});
            const table = el("table", "", "grid-table");
            const headerRow = el("tr");
            for (const column of columns) {
              headerRow.append(el("th", column));
            }
            table.append(headerRow);
            for (const row of result.rows) {
              const tr = el("tr");
              for (const column of columns) {
                tr.append(el("td", String(row[column] ?? "")));
              }
              table.append(tr);
            }
            resultArea.append(table);
          } catch (err) {
            resultArea.innerHTML = "";
            resultArea.append(
              el("p", err instanceof Error ? err.message : "Report run failed", "error"),
            );
          }
        })();
      });
      picker.append(button);
    }
  } catch (err) {
    root.append(el("p", err instanceof Error ? err.message : "Failed to load reports", "error"));
  }
}

function appendWorkflowActions(cell: HTMLElement, instance: Record<string, unknown>): void {
  const instanceId = String(instance.id ?? "");
  const state = String(instance.current_state ?? "");
  const actor = "admin";
  const reload = cell.closest("main") ?? document.body;

  const addBtn = (label: string, action: () => Promise<void>): void => {
    const btn = el("button", label, "nav-link");
    btn.type = "button";
    btn.addEventListener("click", () => {
      void action().then(() => renderWorkflowInbox(reload as HTMLElement));
    });
    cell.append(btn);
  };

  if (state === "draft") {
    addBtn("Submit", () => client.transitionWorkflow(instanceId, "submit", actor));
  }
  if (state === "submitted") {
    addBtn("Approve", () => client.transitionWorkflow(instanceId, "approve", actor));
    addBtn("Reject", () => client.transitionWorkflow(instanceId, "reject", actor));
    addBtn("Delegate", async () => {
      const delegateTo = window.prompt("Delegate to", "inventory-manager");
      if (delegateTo) {
        await client.delegateWorkflow(instanceId, delegateTo);
      }
    });
  }
}

async function renderWorkflowInbox(root: HTMLElement): Promise<void> {
  stopActiveStream();
  root.innerHTML = "";
  root.append(el("h2", "Workflow tasks"));
  const escalateBtn = el("button", "Escalate overdue");
  escalateBtn.type = "button";
  escalateBtn.addEventListener("click", () => {
    void client.escalateWorkflows().then((r) => {
      root.append(el("p", `Escalated: ${String(r.escalated)}`));
    });
  });
  root.append(escalateBtn);

  try {
    const { instances } = await client.listWorkflowInstances();
    if (instances.length === 0) {
      root.append(el("p", "No open workflow instances."));
      return;
    }

    const table = el("table", "", "grid-table");
    const headerRow = el("tr");
    for (const column of ["workflow", "entity", "record", "state", "assignee", "due_at", "actions"]) {
      headerRow.append(el("th", column));
    }
    table.append(headerRow);

    for (const instance of instances) {
      const instanceId = String(instance.id ?? "");
      const row = el("tr");
      row.append(
        el("td", String(instance.workflow_code ?? "")),
        el("td", String(instance.entity_code ?? "")),
        el("td", String(instance.record_id ?? "")),
        el("td", String(instance.current_state ?? "")),
        el("td", String(instance.assignee ?? "")),
        el("td", String(instance.due_at ?? instance.sla_hours ?? "")),
      );
      const actionsCell = el("td");
      const detailBtn = el("button", "Detail", "nav-link");
      detailBtn.type = "button";
      detailBtn.addEventListener("click", () => {
        void client.getWorkflowInstance(instanceId).then((detail) => {
          window.alert(JSON.stringify(detail, null, 2));
        });
      });
      actionsCell.append(detailBtn);
      appendWorkflowActions(actionsCell, instance);
      row.append(actionsCell);
      table.append(row);
    }
    root.append(table);
  } catch (err) {
    root.append(el("p", err instanceof Error ? err.message : "Failed to load tasks", "error"));
  }
}

async function renderDashboardsView(root: HTMLElement): Promise<void> {
  stopActiveStream();
  root.innerHTML = "";
  root.append(el("h2", "Dashboards"));
  try {
    const { dashboards } = await client.listDashboards();
    if (dashboards.length === 0) {
      root.append(el("p", "No dashboards."));
      return;
    }
    for (const dash of dashboards) {
      root.append(el("h3", String(dash.name ?? dash.code ?? "Dashboard")));
      const widgets = (dash.widgets as Record<string, unknown>[]) ?? [];
      const list = el("ul");
      for (const widget of widgets) {
        list.append(el("li", `${String(widget.label ?? widget.code)}: ${String(widget.value ?? widget.metric ?? "")}`));
      }
      root.append(list);
    }
  } catch (err) {
    root.append(el("p", err instanceof Error ? err.message : "Failed to load dashboards", "error"));
  }
}

async function renderNotificationsView(root: HTMLElement): Promise<void> {
  stopActiveStream();
  root.innerHTML = "";
  root.append(el("h2", "Notifications"));
  const config = await client.getPlatformConfig();
  const channels = (config.notifications as Record<string, boolean>) ?? { email: true };
  const form = el("form", "", "record-form");
  const channelSelect = document.createElement("select");
  for (const [name, enabled] of Object.entries(channels)) {
    if (enabled) {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      channelSelect.append(opt);
    }
  }
  const recipient = document.createElement("input");
  recipient.placeholder = "Recipient";
  recipient.value = "ops@example.com";
  const subject = document.createElement("input");
  subject.placeholder = "Subject";
  subject.value = "EMCAP alert";
  const body = document.createElement("textarea");
  body.placeholder = "Body";
  body.value = "Stock notification";
  const sendBtn = el("button", "Send");
  sendBtn.type = "submit";
  const formError = el("p", "", "error");
  form.append(channelSelect, recipient, subject, body, sendBtn, formError);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void (async () => {
      try {
        await client.sendNotification({
          channel: channelSelect.value,
          recipient: recipient.value,
          subject: subject.value,
          body: body.value,
        });
        await renderNotificationsView(root);
      } catch (err) {
        formError.textContent = err instanceof Error ? err.message : "Send failed";
      }
    })();
  });
  root.append(form);
  try {
    const { notifications } = await client.listNotifications();
    root.append(el("h3", `Sent (${notifications.length})`));
    const list = el("ul");
    for (const note of notifications) {
      list.append(el("li", `${String(note.subject ?? note.channel)} → ${String(note.recipient ?? "")}`));
    }
    root.append(list);
  } catch (err) {
    root.append(el("p", err instanceof Error ? err.message : "Failed to list notifications", "error"));
  }
}

async function renderAccountView(root: HTMLElement): Promise<void> {
  stopActiveStream();
  root.innerHTML = "";
  root.append(el("h2", "Account"));
  try {
    const [health, tenants, permissions, roles, config] = await Promise.all([
      client.getHealth(),
      client.listTenants(),
      client.getPermissions(),
      client.getRoles(),
      client.getPlatformConfig(),
    ]);
    root.append(el("p", `Multi-tenant: ${String(health.multi_tenant)} · White-label: ${String(tenants.white_label)}`));
    root.append(el("h3", `Permissions (${permissions.permissions.length})`));
    const permList = el("ul");
    for (const perm of permissions.permissions.slice(0, 30)) {
      permList.append(el("li", perm));
    }
    root.append(permList);
    root.append(el("h3", `Roles (${roles.roles.length})`));
    const roleList = el("ul");
    for (const role of roles.roles) {
      roleList.append(el("li", String(role.code ?? role.name ?? role)));
    }
    root.append(roleList);
    root.append(el("h3", "MFA"));
    const mfaSecret = el("p", "");
    const mfaCode = document.createElement("input");
    mfaCode.placeholder = "TOTP code";
    const enrollBtn = el("button", "Enroll MFA");
    const verifyBtn = el("button", "Verify MFA");
    enrollBtn.addEventListener("click", () => {
      void client.enrollMfa().then((r) => {
        mfaSecret.textContent = `Secret: ${r.secret}`;
      });
    });
    verifyBtn.addEventListener("click", () => {
      void client.verifyMfa(mfaCode.value).then((r) => {
        client.setToken(r.access_token, client.getTenantId());
        root.append(el("p", "MFA verified — token refreshed"));
      });
    });
    root.append(enrollBtn, verifyBtn, mfaCode, mfaSecret);

    root.append(el("h3", "Integrations"));
    const dispatchUrl = document.createElement("input");
    dispatchUrl.value = "https://httpbin.org/post";
    const dispatchPayload = document.createElement("textarea");
    dispatchPayload.value = '{"ping":true}';
    const dispatchBtn = el("button", "REST dispatch");
    dispatchBtn.addEventListener("click", () => {
      void client.dispatchRestIntegration(dispatchUrl.value, JSON.parse(dispatchPayload.value) as Record<string, unknown>);
    });
    root.append(dispatchUrl, dispatchPayload, dispatchBtn);
    const kafkaTopic = document.createElement("input");
    kafkaTopic.value = "emcap.events";
    const kafkaBtn = el("button", "Kafka publish");
    kafkaBtn.addEventListener("click", () => {
      void client.publishKafkaIntegration(kafkaTopic.value, { ping: true });
    });
    root.append(kafkaTopic, kafkaBtn);
    const soapEndpoint = document.createElement("input");
    soapEndpoint.value = "https://example.com/soap";
    const soapAction = document.createElement("input");
    soapAction.value = "Ping";
    const soapBtn = el("button", "SOAP invoke");
    soapBtn.addEventListener("click", () => {
      void client.invokeSoapIntegration(soapEndpoint.value, soapAction.value, {});
    });
    root.append(soapEndpoint, soapAction, soapBtn);
    const sftpHost = document.createElement("input");
    sftpHost.value = "sftp.example.com";
    const sftpPath = document.createElement("input");
    sftpPath.value = "/inbound/data.json";
    const sftpBtn = el("button", "SFTP upload");
    sftpBtn.addEventListener("click", () => {
      void client.uploadSftpIntegration(sftpHost.value, sftpPath.value, { ok: true });
    });
    root.append(sftpHost, sftpPath, sftpBtn);
    const gqlBtn = el("button", "GraphQL health");
    gqlBtn.addEventListener("click", () => {
      void client.graphqlQuery("{ health { status multi_tenant } }").then((r) => {
        root.append(el("p", `GraphQL: ${JSON.stringify(r)}`));
      });
    });
    root.append(gqlBtn);
    root.append(el("h3", "Admin"));
    const meLine = el("p", "");
    void client.getMe().then((me) => {
      meLine.textContent = `User: ${String(me.user_id ?? me)}`;
    });
    root.append(meLine);
    const roleUser = document.createElement("input");
    roleUser.value = "admin";
    const roleCode = document.createElement("input");
    roleCode.value = "admin";
    const assignBtn = el("button", "Assign role");
    assignBtn.addEventListener("click", () => {
      void client.assignRole(roleUser.value, roleCode.value);
    });
    root.append(roleUser, roleCode, assignBtn);
    const permCheck = document.createElement("input");
    permCheck.value = "inventory.access";
    const checkBtn = el("button", "Check permission");
    checkBtn.addEventListener("click", () => {
      void client.checkAuth(permCheck.value).then((r) => {
        root.append(el("p", `Allowed: ${String(r.allowed)}`));
      });
    });
    root.append(permCheck, checkBtn);
    const ruleExpr = document.createElement("input");
    ruleExpr.value = "amount > 100";
    const ruleBtn = el("button", "Evaluate rule");
    ruleBtn.addEventListener("click", () => {
      void client.evaluateWorkflowRule(ruleExpr.value, { amount: 150 }).then((r) => {
        root.append(el("p", `Rule result: ${String(r.result)}`));
      });
    });
    root.append(ruleExpr, ruleBtn);
    const metricsBtn = el("button", "Fetch metrics");
    metricsBtn.addEventListener("click", () => {
      void client.getMetrics().then((text) => {
        root.append(el("pre", text.slice(0, 500)));
      });
    });
    root.append(metricsBtn);
    void client.listEntities().then((r) => {
      root.append(el("p", `Entities: ${r.entities.join(", ")}`));
    });
    const modules = config.modules as Record<string, { enabled?: boolean }> | undefined;
    if (modules?.payments?.enabled) {
      const payBtn = el("button", "Create payment intent (demo)");
      payBtn.addEventListener("click", () => {
        void client.createPaymentIntent("10.00").then((result) => {
          root.append(el("p", `Intent: ${JSON.stringify(result)}`));
          const txnId = String(result.transaction_id ?? "");
          if (txnId) {
            void client.confirmPaymentIntent(txnId).then((confirmed) => {
              root.append(el("p", `Confirmed: ${JSON.stringify(confirmed)}`));
            });
          }
        });
      });
      root.append(payBtn);
    } else {
      root.append(el("p", "Payments disabled in platform config."));
    }
  } catch (err) {
    root.append(el("p", err instanceof Error ? err.message : "Failed to load account", "error"));
  }
}

const root = document.getElementById("app");
if (root) {
  renderLogin(root);
}
