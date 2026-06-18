from emcap.entity.models import EntityDefinition, EntityOptions, FieldDefinition, FieldType, StatusFieldDisplay
from emcap.module.models import MenuDefinition, ModuleDefinition
from emcap.reporting.models import ReportColumn, ReportDefinition

_STATUS_FIELD = StatusFieldDisplay(
    field="active",
    active_values=[True],
    labels={
        "active": {"en": "Active", "bn": "সক্রিয়"},
        "inactive": {"en": "Inactive", "bn": "নিষ্ক্রিয়"},
    },
)

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
                FieldDefinition(
                    name="status",
                    field_type=FieldType.ENUM,
                    options=["new", "qualified", "lost", "won"],
                    required=False,
                ),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                workflow_enabled=False,
                notes_enabled=True,
                document_enabled=True,
                bulk_actions=True,
                status_field=_STATUS_FIELD,
            ),
        ),
        EntityDefinition(
            code="CONTACT",
            fields=[
                FieldDefinition(name="name", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="email", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="phone", field_type=FieldType.STRING, required=False),
                FieldDefinition(
                    name="lead_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="LEAD",
                    required=False,
                ),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                workflow_enabled=False,
                notes_enabled=True,
                document_enabled=False,
                status_field=_STATUS_FIELD,
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
        MenuDefinition(code="leads", label="Leads", entity_code="LEAD", icon="person_search"),
        MenuDefinition(code="contacts", label="Contacts", entity_code="CONTACT", icon="contacts"),
        MenuDefinition(
            code="open_leads", label="Open Leads Report", entity_code="LEAD", report_code="OPEN_LEADS", icon="leaderboard"
        ),
    ],
    permissions=["crm.access"],
)
