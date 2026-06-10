import { createClient } from "../api/emcap-client";
import { DynamicFormRenderer } from "../dynamic-form.component";
import { DynamicGridRenderer } from "../dynamic-grid.component";
import { validateFormMetadata, validateGridMetadata } from "../metadata/contract";

const client = createClient();

function el(tag: string, text = "", className = ""): HTMLElement {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function renderLogin(root: HTMLElement): void {
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

async function renderShell(root: HTMLElement): Promise<void> {
  root.innerHTML = "";
  const header = el("header", "", "app-header");
  header.append(el("h1", "EMCAP"), el("button", "Sign out"));
  header.querySelector("button")?.addEventListener("click", () => renderLogin(root));

  const nav = el("nav", "", "app-nav");
  const main = el("main", "", "app-main");
  root.append(header, nav, main);

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

async function renderEntityView(root: HTMLElement, entityCode: string, title: string): Promise<void> {
  root.innerHTML = "";
  root.append(el("h2", title));

  try {
    const [formMeta, gridMeta, recordsPayload, snapshot] = await Promise.all([
      client.getFormMetadata(entityCode),
      client.getGridMetadata(entityCode),
      client.listRecords(entityCode),
      client.syncSnapshot(entityCode),
    ]);

    if (!validateFormMetadata(formMeta) || !validateGridMetadata(gridMeta)) {
      root.append(el("p", "Invalid metadata contract", "error"));
      return;
    }

    const formRenderer = new DynamicFormRenderer(formMeta);
    const gridRenderer = new DynamicGridRenderer(gridMeta);

    root.append(el("p", `Offline snapshot v: ${String(snapshot.sync_version ?? "n/a")}`));

    const table = el("table", "", "grid-table");
    const headerRow = el("tr");
    for (const field of gridRenderer.columnFields()) {
      headerRow.append(el("th", field));
    }
    table.append(headerRow);
    for (const record of recordsPayload.records) {
      const row = el("tr");
      for (const field of gridRenderer.columnFields()) {
        row.append(el("td", String(record[field] ?? "")));
      }
      table.append(row);
    }
    root.append(table);

    const form = el("form", "", "record-form");
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
          await renderEntityView(root, entityCode, title);
        } catch (err) {
          formError.textContent = err instanceof Error ? err.message : "Create failed";
        }
      })();
    });
    root.append(form);
  } catch (err) {
    root.append(el("p", err instanceof Error ? err.message : "Failed to load entity", "error"));
  }
}

const root = document.getElementById("app");
if (root) {
  renderLogin(root);
}
