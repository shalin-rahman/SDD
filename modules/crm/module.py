from emcap.entity.models import EntityDefinition, EntityOptions, FieldDefinition, FieldType
from emcap.module.models import MenuDefinition, ModuleDefinition
from emcap.reporting.models import ReportColumn, ReportDefinition

MODULE = ModuleDefinition(
    code="CRM",
    name="CRM Module",
    entities=[
        EntityDefinition(
            code="LEAD",
            fields=[
                FieldDefinition(name="company", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="contact_name", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="email", field_type=FieldType.STRING, required=False),
                FieldDefinition(name="status", field_type=FieldType.STRING, required=False),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                workflow_enabled=False,
                notes_enabled=True,
                document_enabled=True,
            ),
        ),
        EntityDefinition(
            code="CONTACT",
            fields=[
                FieldDefinition(name="name", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="email", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="phone", field_type=FieldType.STRING, required=False),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                workflow_enabled=False,
                notes_enabled=True,
                document_enabled=False,
            ),
        ),
    ],
    workflows=[],
    reports=[
        ReportDefinition(
            code="OPEN_LEADS",
            name="Open Leads",
            entity_code="LEAD",
            columns=[
                ReportColumn(field="company", label="Company"),
                ReportColumn(field="contact_name", label="Contact"),
                ReportColumn(field="status", label="Status"),
            ],
            schedule_cron="0 8 * * *",
        ),
    ],
    dashboards=[],
    menus=[
        MenuDefinition(code="leads", label="Leads", entity_code="LEAD"),
        MenuDefinition(code="contacts", label="Contacts", entity_code="CONTACT"),
    ],
    permissions=["crm.access"],
)
