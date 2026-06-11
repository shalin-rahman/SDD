import { createClient } from "../api/emcap-client";
import { DynamicFormRenderer } from "../dynamic-form.component";
import { DynamicGridRenderer } from "../dynamic-grid.component";
import type { GridMetadata } from "../metadata/contract";
import { validateFormMetadata, validateGridMetadata } from "../metadata/contract";

const client = createClient();
let activeStreamCleanup: (() => void) | null = null;

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
  form.append(user, pass, button, error);
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
  root.append(el("h1", "EMCAP"), form);
}

function downloadCsv(columns: string[], rows: Record<string, unknown>[], filename: string): void {
  const escape = (value: unknown): string => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = [columns.map(escape).join(",")];
  for (const row of rows) {
    lines.push(columns.map((col) => escape(row[col])).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function renderShell(root: HTMLElement): Promise<void> {
  stopActiveStream();
  root.innerHTML = "";
  const header = el("header", "", "app-header");
  const titleWrap = el("div");
  titleWrap.append(el("h1", "EMCAP"));
  const tenantLine = el("p", "", "tenant-status");
  titleWrap.append(tenantLine);
  header.append(titleWrap, el("button", "Sign out"));
  header.querySelector("button")?.addEventListener("click", () => renderLogin(root));
  void client.getHealth().then((health) => {
    tenantLine.textContent = `mode: multi_tenant=${String(health.multi_tenant)} · ${health.tenant_strategy}`;
  }).catch(() => {
    tenantLine.textContent = "";
  });

  const nav = el("nav", "", "app-nav");
  const main = el("main", "", "app-main");
  root.append(header, nav, main);

  const navViews: Array<[string, () => void]> = [
    ["Workflow tasks", () => renderWorkflowInbox(main)],
    ["Reports", () => renderReportsView(main)],
    ["Dashboards", () => renderDashboardsView(main)],
    ["Notifications", () => renderNotificationsView(main)],
    ["Account", () => renderAccountView(main)],
  ];
  for (const [label, handler] of navViews) {
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
        void renderEntityView(main, menu.entity_code, menu.label);
      });
      nav.append(link);
    }
    if (menus.length > 0) {
      await renderEntityView(main, menus[0].entity_code, menus[0].label);
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
            const result = await client.runReport(code);
            resultArea.innerHTML = "";
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

  try {
    const { instances } = await client.listWorkflowInstances();
    if (instances.length === 0) {
      root.append(el("p", "No open workflow instances."));
      return;
    }

    const table = el("table", "", "grid-table");
    const headerRow = el("tr");
    for (const column of ["workflow", "entity", "record", "state", "assignee", "actions"]) {
      headerRow.append(el("th", column));
    }
    table.append(headerRow);

    for (const instance of instances) {
      const row = el("tr");
      row.append(
        el("td", String(instance.workflow_code ?? "")),
        el("td", String(instance.entity_code ?? "")),
        el("td", String(instance.record_id ?? "")),
        el("td", String(instance.current_state ?? "")),
        el("td", String(instance.assignee ?? "")),
      );
      const actionsCell = el("td");
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
  const form = el("form", "", "record-form");
  const recipient = document.createElement("input");
  recipient.placeholder = "Recipient";
  recipient.value = "ops@example.com";
  const subject = document.createElement("input");
  subject.placeholder = "Subject";
  subject.value = "EMCAP alert";
  const body = document.createElement("textarea");
  body.placeholder = "Body";
  body.value = "Stock notification";
  const sendBtn = el("button", "Send email");
  sendBtn.type = "submit";
  const formError = el("p", "", "error");
  form.append(recipient, subject, body, sendBtn, formError);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void (async () => {
      try {
        await client.sendNotification({
          channel: "email",
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
    root.append(el("h3", "Integrations"));
    root.append(el("p", "REST: POST /api/v1/integrations/rest/dispatch"));
    root.append(el("p", "Kafka: POST /api/v1/integrations/kafka/publish"));
    const modules = config.modules as Record<string, { enabled?: boolean }> | undefined;
    if (modules?.payments?.enabled) {
      const payBtn = el("button", "Create payment intent (demo)");
      payBtn.addEventListener("click", () => {
        void client.createPaymentIntent("10.00").then((result) => {
          root.append(el("p", `Intent: ${JSON.stringify(result)}`));
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

function renderGridTable(
  table: HTMLTableElement,
  gridRenderer: DynamicGridRenderer,
  records: Record<string, unknown>[],
  selectedId: string | null,
  onSelect: (recordId: string) => void,
): void {
  table.innerHTML = "";
  const headerRow = el("tr");
  for (const field of gridRenderer.columnFields()) {
    headerRow.append(el("th", field));
  }
  table.append(headerRow);

  for (const record of records) {
    const recordId = String(record.id ?? "");
    const row = el("tr", "", selectedId === recordId ? "row-selected" : "");
    if (recordId) {
      row.style.cursor = "pointer";
      row.addEventListener("click", () => onSelect(recordId));
    }
    for (const field of gridRenderer.columnFields()) {
      row.append(el("td", String(record[field] ?? "")));
    }
    table.append(row);
  }
}

async function renderRecordDetail(
  container: HTMLElement,
  entityCode: string,
  recordId: string,
): Promise<void> {
  container.innerHTML = "";
  container.append(el("h3", `Record ${recordId}`));

  try {
    const [notesPayload, documentsPayload, auditPayload] = await Promise.all([
      client.listNotes(entityCode, recordId),
      client.listDocuments(entityCode, recordId),
      client.listAudit(entityCode),
    ]);
    const auditForRecord = auditPayload.audit.filter((entry) => String(entry.record_id) === recordId);

    container.append(el("h4", `Notes (${notesPayload.notes.length})`));
    if (notesPayload.notes.length === 0) {
      container.append(el("p", "No notes."));
    } else {
      const notesList = el("ul");
      for (const note of notesPayload.notes) {
        notesList.append(el("li", String(note.body ?? "")));
      }
      container.append(notesList);
    }

    container.append(el("h4", `Documents (${documentsPayload.documents.length})`));
    if (documentsPayload.documents.length === 0) {
      container.append(el("p", "No documents."));
    } else {
      const docsList = el("ul");
      for (const doc of documentsPayload.documents) {
        docsList.append(el("li", String(doc.filename ?? doc.id ?? "")));
      }
      container.append(docsList);
    }

    container.append(el("h4", `Audit (${auditForRecord.length})`));
    if (auditForRecord.length === 0) {
      container.append(el("p", "No audit entries for this record."));
    } else {
      const auditList = el("ul");
      for (const entry of auditForRecord) {
        auditList.append(el("li", `${String(entry.action)} — ${JSON.stringify(entry.payload ?? {})}`));
      }
      container.append(auditList);
    }

    const uploadForm = el("form", "", "record-form");
    const filenameInput = document.createElement("input");
    filenameInput.value = "spec.txt";
    const contentInput = document.createElement("textarea");
    contentInput.value = "uploaded from web";
    const uploadBtn = el("button", "Upload document");
    uploadBtn.type = "submit";
    const uploadError = el("p", "", "error");
    uploadForm.append(filenameInput, contentInput, uploadBtn, uploadError);
    uploadForm.addEventListener("submit", (event) => {
      event.preventDefault();
      void (async () => {
        try {
          await client.uploadDocument(entityCode, recordId, filenameInput.value, contentInput.value);
          await renderRecordDetail(container, entityCode, recordId);
        } catch (err) {
          uploadError.textContent = err instanceof Error ? err.message : "Upload failed";
        }
      })();
    });
    container.append(uploadForm);
  } catch (err) {
    container.append(el("p", err instanceof Error ? err.message : "Failed to load record", "error"));
  }
}

async function renderEntityView(root: HTMLElement, entityCode: string, title: string): Promise<void> {
  stopActiveStream();
  root.innerHTML = "";
  root.append(el("h2", title));

  const statusLine = el("p", "");
  const table = el("table", "", "grid-table");
  const detailPanel = el("section", "", "record-detail");
  const form = el("form", "", "record-form");
  root.append(statusLine, table, detailPanel, form);

  let selectedRecordId: string | null = null;
  let gridRenderer: DynamicGridRenderer | null = null;
  let gridMeta: GridMetadata | null = null;
  let snapshotSince = "1970-01-01T00:00:00+00:00";
  let currentRecords: Record<string, unknown>[] = [];

  const reloadGrid = async (): Promise<void> => {
    if (!gridRenderer) {
      return;
    }
    const recordsPayload = await client.listRecords(entityCode);
    currentRecords = recordsPayload.records;
    renderGridTable(table, gridRenderer, currentRecords, selectedRecordId, (recordId) => {
      selectedRecordId = recordId;
      void renderRecordDetail(detailPanel, entityCode, recordId).then(() => {
        void reloadGrid();
      });
    });

    if (gridMeta?.offline) {
      const changes = await client.syncChanges(entityCode, snapshotSince);
      statusLine.textContent = `Offline snapshot · ${changes.count} change(s) since baseline`;
    }
  };

  try {
    const [formMeta, loadedGridMeta, recordsPayload, snapshot] = await Promise.all([
      client.getFormMetadata(entityCode),
      client.getGridMetadata(entityCode),
      client.listRecords(entityCode),
      client.syncSnapshot(entityCode),
    ]);

    if (!validateFormMetadata(formMeta) || !validateGridMetadata(loadedGridMeta)) {
      root.append(el("p", "Invalid metadata contract", "error"));
      return;
    }

    const formRenderer = new DynamicFormRenderer(formMeta);
    gridRenderer = new DynamicGridRenderer(loadedGridMeta);
    gridMeta = loadedGridMeta;
    snapshotSince = String(snapshot.sync_version ?? snapshotSince);

    statusLine.textContent = `Offline snapshot v: ${String(snapshot.sync_version ?? "n/a")}`;

    currentRecords = recordsPayload.records;
    if (gridMeta.export.csv) {
      const exportBtn = el("button", "Export CSV");
      exportBtn.type = "button";
      exportBtn.addEventListener("click", () => {
        if (gridRenderer) {
          downloadCsv(gridRenderer.columnFields(), currentRecords, `${entityCode}-export.csv`);
        }
      });
      root.insertBefore(exportBtn, table);
    }

    renderGridTable(table, gridRenderer, currentRecords, selectedRecordId, (recordId) => {
      selectedRecordId = recordId;
      void renderRecordDetail(detailPanel, entityCode, recordId).then(() => {
        void reloadGrid();
      });
    });

    if (gridMeta.offline) {
      const changes = await client.syncChanges(entityCode, snapshotSince);
      statusLine.textContent = `Offline snapshot v: ${String(snapshot.sync_version ?? "n/a")} · ${changes.count} change(s)`;
    }

    if (gridMeta.realtime) {
      activeStreamCleanup = client.subscribeRecordsStream(entityCode, () => {
        void reloadGrid();
      });
    }

    const inputs: Record<string, HTMLInputElement> = {};
    for (const name of formRenderer.fieldNames()) {
      const label = el("label", name);
      const input = document.createElement("input");
      input.name = name;
      input.required = formRenderer.isRequired(name);
      inputs[name] = input;
      form.append(label, input);
    }
    const noteInput = document.createElement("textarea");
    noteInput.placeholder = "Note (optional)";
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Create record";
    const formError = el("p", "", "error");
    form.append(noteInput, submit, formError);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void (async () => {
        try {
          const payload: Record<string, unknown> = {};
          for (const [name, input] of Object.entries(inputs)) {
            payload[name] = input.type === "checkbox" ? input.checked : input.value;
          }
          const created = await client.createRecord(entityCode, payload);
          if (noteInput.value.trim()) {
            await client.addNote(entityCode, String(created.id), noteInput.value.trim());
          }
          noteInput.value = "";
          for (const input of Object.values(inputs)) {
            input.value = "";
          }
          await reloadGrid();
        } catch (err) {
          formError.textContent = err instanceof Error ? err.message : "Create failed";
        }
      })();
    });
  } catch (err) {
    root.append(el("p", err instanceof Error ? err.message : "Failed to load entity", "error"));
  }
}

const root = document.getElementById("app");
if (root) {
  renderLogin(root);
}
