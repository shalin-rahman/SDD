import type { EmcapClient } from "../api/emcap-client";
import { DynamicFormRenderer } from "../dynamic-form.component";
import { DynamicGridRenderer, type SortDirection } from "../dynamic-grid.component";
import type { FormMetadata, GridMetadata } from "../metadata/contract";
import { validateFormMetadata, validateGridMetadata } from "../metadata/contract";

const PAGE_SIZE = 10;

function el(tag: string, text = "", className = ""): HTMLElement {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadCsv(columns: string[], rows: Record<string, unknown>[], filename: string): void {
  const escape = (value: unknown): string => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = [columns.map(escape).join(",")];
  for (const row of rows) {
    lines.push(columns.map((col) => escape(row[col])).join(","));
  }
  downloadBlob(lines.join("\n"), filename, "text/csv");
}

function printPdfTable(columns: string[], rows: Record<string, unknown>[], title: string): void {
  const win = window.open("", "_blank");
  if (!win) return;
  const headers = columns.map((c) => `<th>${c}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${columns.map((c) => `<td>${String(row[c] ?? "")}</td>`).join("")}</tr>`)
    .join("");
  win.document.write(`<html><head><title>${title}</title></head><body><h1>${title}</h1><table border="1"><tr>${headers}</tr>${body}</table></body></html>`);
  win.document.close();
  win.print();
}

export interface EntityViewHandles {
  stopStream: () => void;
  setStreamCleanup: (cleanup: (() => void) | null) => void;
}

export async function renderEntityView(
  root: HTMLElement,
  client: EmcapClient,
  entityCode: string,
  title: string,
  handles: EntityViewHandles,
): Promise<void> {
  handles.stopStream();
  root.innerHTML = "";
  root.append(el("h2", title));

  const toolbar = el("div", "", "entity-toolbar");
  const searchInput = document.createElement("input");
  searchInput.placeholder = "Search records";
  const prevBtn = el("button", "Prev");
  const nextBtn = el("button", "Next");
  const pageLabel = el("span", "Page 1");
  const groupToggle = el("button", "Group");
  prevBtn.type = "button";
  nextBtn.type = "button";
  groupToggle.type = "button";
  toolbar.append(searchInput, prevBtn, pageLabel, nextBtn, groupToggle);
  root.append(toolbar);

  const statusLine = el("p", "");
  const table = el("table", "", "grid-table");
  const filterRow = el("tr");
  const detailPanel = el("section", "", "record-detail");
  const form = el("form", "", "record-form");
  root.append(statusLine, table, detailPanel, form);

  let selectedRecordId: string | null = null;
  let editingId: string | null = null;
  let gridRenderer: DynamicGridRenderer | null = null;
  let formRenderer: DynamicFormRenderer | null = null;
  let gridMeta: GridMetadata | null = null;
  let formMeta: FormMetadata | null = null;
  let snapshotSince = "1970-01-01T00:00:00+00:00";
  let allRecords: Record<string, unknown>[] = [];
  let searchQuery = "";
  let page = 1;
  let sortField: string | null = null;
  let sortDir: SortDirection = null;
  let groupBy: string | null = null;
  const filters: Record<string, string> = {};
  const inputs: Record<string, HTMLInputElement> = {};
  let submitBtn: HTMLButtonElement | null = null;
  let formError = el("p", "", "error");

  const displayRecords = (): Record<string, unknown>[] => {
    if (!gridRenderer) return [];
    let rows = gridRenderer.filterRecords(allRecords, filters);
    rows = gridRenderer.sortRecords(rows, sortField, sortDir);
    return gridRenderer.paginate(rows, page, PAGE_SIZE);
  };

  const rebuildForm = (values: Record<string, unknown> = {}): void => {
    if (!formRenderer) return;
    form.innerHTML = "";
    formError = el("p", "", "error");
    const draft = { ...values };
    for (const name of formRenderer.visibleFieldNames(draft)) {
      const field = formRenderer.getField(name);
      if (!field) continue;
      const label = el("label", formRenderer.label(name));
      const input = formRenderer.createInputElement(field, draft[name]);
      input.name = name;
      input.required = formRenderer.isRequired(name);
      inputs[name] = input as HTMLInputElement;
      label.append(input);
      form.append(label);
    }
    const noteInput = document.createElement("textarea");
    noteInput.placeholder = "Note (optional)";
    noteInput.style.display = editingId ? "none" : "block";
    submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.textContent = editingId ? "Save changes" : "Create record";
    const cancelBtn = el("button", "Cancel edit");
    cancelBtn.type = "button";
    cancelBtn.style.display = editingId ? "inline" : "none";
    cancelBtn.addEventListener("click", () => {
      editingId = null;
      selectedRecordId = null;
      rebuildForm();
      void paintGrid();
      detailPanel.innerHTML = "";
    });
    form.append(noteInput, submitBtn, cancelBtn, formError);
    form.onsubmit = (event) => {
      event.preventDefault();
      void (async () => {
        const payload: Record<string, unknown> = {};
        for (const name of formRenderer!.fieldNames()) {
          const input = inputs[name];
          if (!input) continue;
          payload[name] = input.type === "checkbox" ? input.checked : input.value;
        }
        const errors = formRenderer!.validate(payload);
        if (Object.keys(errors).length > 0) {
          formError.textContent = Object.values(errors).join("; ");
          return;
        }
        try {
          if (editingId) {
            await client.updateRecord(entityCode, editingId, payload);
            editingId = null;
          } else {
            const created = await client.createRecord(entityCode, payload);
            if (noteInput.value.trim()) {
              await client.addNote(entityCode, String(created.id), noteInput.value.trim());
            }
            noteInput.value = "";
          }
          for (const input of Object.values(inputs)) input.value = "";
          await reloadAll();
          rebuildForm();
        } catch (err) {
          formError.textContent = err instanceof Error ? err.message : "Save failed";
        }
      })();
    };
  };

  const paintGrid = async (): Promise<void> => {
    if (!gridRenderer || !gridMeta) return;
    table.innerHTML = "";
    filterRow.innerHTML = "";
    const headerRow = el("tr");
    for (const field of gridRenderer.columnFields()) {
      const th = el("th", gridRenderer.columnLabel(field));
      if (gridRenderer.isSortable(field)) {
        th.style.cursor = "pointer";
        th.addEventListener("click", () => {
          if (sortField === field) {
            sortDir = sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc";
          } else {
            sortField = field;
            sortDir = "asc";
          }
          void paintGrid();
        });
      }
      headerRow.append(th);
      const filterCell = el("th");
      if (gridRenderer.isFilterable(field)) {
        const filterInput = document.createElement("input");
        filterInput.placeholder = "Filter";
        filterInput.value = filters[field] ?? "";
        filterInput.addEventListener("input", () => {
          filters[field] = filterInput.value;
          page = 1;
          void paintGrid();
        });
        filterCell.append(filterInput);
      }
      filterRow.append(filterCell);
    }
    table.append(headerRow, filterRow);

    const rows = displayRecords();
    const groups = gridRenderer.groupRecords(rows, groupBy);
    for (const group of groups) {
      if (groupBy && group.key) {
        const groupRow = el("tr");
        const groupCell = el("td", `${groupBy}: ${group.key}`);
        groupCell.colSpan = gridRenderer.columnFields().length;
        groupRow.append(groupCell);
        table.append(groupRow);
      }
      for (const record of group.records) {
        const recordId = String(record.id ?? "");
        const row = el("tr", "", selectedRecordId === recordId ? "row-selected" : "");
        if (recordId) {
          row.style.cursor = "pointer";
          row.addEventListener("click", () => {
            selectedRecordId = recordId;
            void loadRecordDetail(recordId);
            void paintGrid();
          });
        }
        for (const field of gridRenderer.columnFields()) {
          row.append(el("td", String(record[field] ?? "")));
        }
        table.append(row);
      }
    }

    const total = gridRenderer.filterRecords(allRecords, filters).length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    pageLabel.textContent = `Page ${page} / ${totalPages} (${total} records)`;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;

    if (gridMeta.offline) {
      const changes = await client.syncChanges(entityCode, snapshotSince);
      statusLine.textContent = `Offline · ${changes.count} change(s) · snapshot ${snapshotSince}`;
    }
  };

  const loadRecordDetail = async (recordId: string): Promise<void> => {
    detailPanel.innerHTML = "";
    detailPanel.append(el("h3", `Record ${recordId}`));
    const editBtn = el("button", "Edit");
    const deleteBtn = el("button", "Delete");
    const startWfBtn = el("button", "Start STOCK_ADJUSTMENT");
    editBtn.type = "button";
    deleteBtn.type = "button";
    startWfBtn.type = "button";
    startWfBtn.style.display = entityCode === "PRODUCT" ? "inline" : "none";

    editBtn.addEventListener("click", () => {
      void client.getRecord(entityCode, recordId).then((record) => {
        editingId = recordId;
        rebuildForm(record);
      });
    });
    deleteBtn.addEventListener("click", () => {
      if (!window.confirm(`Delete record ${recordId}?`)) return;
      void client.deleteRecord(entityCode, recordId).then(async () => {
        selectedRecordId = null;
        editingId = null;
        detailPanel.innerHTML = "";
        rebuildForm();
        await reloadAll();
      });
    });
    startWfBtn.addEventListener("click", () => {
      void client.startWorkflow("STOCK_ADJUSTMENT", recordId).then(() => {
        detailPanel.append(el("p", "Workflow started."));
      });
    });
    detailPanel.append(editBtn, deleteBtn, startWfBtn);

    try {
      const [notesPayload, documentsPayload, auditPayload] = await Promise.all([
        client.listNotes(entityCode, recordId),
        client.listDocuments(entityCode, recordId),
        client.listAudit(entityCode),
      ]);
      const auditForRecord = auditPayload.audit.filter((e) => String(e.record_id) === recordId);

      detailPanel.append(el("h4", `Notes (${notesPayload.notes.length})`));
      const notesList = el("ul");
      for (const note of notesPayload.notes) {
        notesList.append(el("li", String(note.body ?? "")));
      }
      detailPanel.append(notesList);

      detailPanel.append(el("h4", `Documents (${documentsPayload.documents.length})`));
      const docsList = el("ul");
      for (const doc of documentsPayload.documents) {
        const li = el("li");
        li.append(el("span", `${String(doc.filename ?? doc.id)} v${String(doc.version ?? 1)} · ${String(doc.virus_scan_status ?? "")} `));
        const previewBtn = el("button", "Preview");
        previewBtn.type = "button";
        previewBtn.addEventListener("click", () => {
          void client.getDocument(String(doc.id)).then((full) => {
            window.alert(`Document ${full.filename}\nOCR: ${String(full.ocr_text ?? "").slice(0, 200)}`);
          });
        });
        li.append(previewBtn);
        docsList.append(li);
      }
      detailPanel.append(docsList);

      detailPanel.append(el("h4", `Audit (${auditForRecord.length})`));
      const auditList = el("ul");
      for (const entry of auditForRecord) {
        auditList.append(el("li", `${String(entry.action)} — ${JSON.stringify(entry.payload ?? {})}`));
      }
      detailPanel.append(auditList);

      const uploadForm = el("form", "", "record-form");
      const filenameInput = document.createElement("input");
      filenameInput.value = "spec.txt";
      const contentInput = document.createElement("textarea");
      contentInput.value = "uploaded from web";
      const uploadBtn = el("button", "Upload document");
      uploadBtn.type = "submit";
      uploadForm.append(filenameInput, contentInput, uploadBtn);
      uploadForm.addEventListener("submit", (event) => {
        event.preventDefault();
        void client.uploadDocument(entityCode, recordId, filenameInput.value, contentInput.value).then(() =>
          loadRecordDetail(recordId),
        );
      });
      detailPanel.append(uploadForm);
    } catch (err) {
      detailPanel.append(el("p", err instanceof Error ? err.message : "Failed to load record", "error"));
    }
  };

  const reloadAll = async (): Promise<void> => {
    const payload = await client.listRecords(entityCode, searchQuery ? { q: searchQuery } : undefined);
    allRecords = payload.records;
    await paintGrid();
  };

  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  searchInput.addEventListener("input", () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      page = 1;
      void reloadAll();
    }, 300);
  });
  prevBtn.addEventListener("click", () => {
    if (page > 1) {
      page -= 1;
      void paintGrid();
    }
  });
  nextBtn.addEventListener("click", () => {
    page += 1;
    void paintGrid();
  });
  groupToggle.addEventListener("click", () => {
    if (!gridRenderer) return;
    const fields = gridRenderer.columnFields();
    groupBy = groupBy ? null : fields[0] ?? null;
    groupToggle.textContent = groupBy ? `Ungroup` : "Group";
    void paintGrid();
  });

  try {
    const [loadedFormMeta, loadedGridMeta, recordsPayload, snapshot] = await Promise.all([
      client.getFormMetadata(entityCode),
      client.getGridMetadata(entityCode),
      client.listRecords(entityCode),
      client.syncSnapshot(entityCode),
    ]);
    if (!validateFormMetadata(loadedFormMeta) || !validateGridMetadata(loadedGridMeta)) {
      root.append(el("p", "Invalid metadata contract", "error"));
      return;
    }
    formMeta = loadedFormMeta;
    gridMeta = loadedGridMeta;
    formRenderer = new DynamicFormRenderer(formMeta);
    gridRenderer = new DynamicGridRenderer(gridMeta);
    snapshotSince = String(snapshot.sync_version ?? snapshotSince);
    allRecords = recordsPayload.records;

    const exportBar = el("div", "", "export-bar");
    if (gridMeta.export.csv) {
      const btn = el("button", "Export CSV");
      btn.type = "button";
      btn.addEventListener("click", () => downloadCsv(gridRenderer!.columnFields(), allRecords, `${entityCode}.csv`));
      exportBar.append(btn);
    }
    if (gridMeta.export.excel) {
      const btn = el("button", "Export Excel");
      btn.type = "button";
      btn.addEventListener("click", () =>
        downloadCsv(gridRenderer!.columnFields(), allRecords, `${entityCode}.xls`),
      );
      exportBar.append(btn);
    }
    if (gridMeta.export.pdf) {
      const btn = el("button", "Export PDF");
      btn.type = "button";
      btn.addEventListener("click", () => printPdfTable(gridRenderer!.columnFields(), allRecords, title));
      exportBar.append(btn);
    }
    root.insertBefore(exportBar, statusLine);

    rebuildForm();
    await paintGrid();

    if (gridMeta.realtime) {
      handles.setStreamCleanup(
        client.subscribeRecordsStream(entityCode, () => {
          void reloadAll();
        }),
      );
    }
  } catch (err) {
    root.append(el("p", err instanceof Error ? err.message : "Failed to load entity", "error"));
  }
}
