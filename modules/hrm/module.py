from emcap.entity.models import EntityDefinition, EntityOptions, FieldDefinition, FieldType, StatusFieldDisplay
from emcap.module.models import MenuDefinition, ModuleDefinition
from emcap.reporting.models import ReportColumn, ReportDefinition

_ACTIVE_STATUS = StatusFieldDisplay(
    field="active",
    active_values=[True],
    labels={
        "active": {"en": "Active", "bn": "সক্রিয়"},
        "inactive": {"en": "Inactive", "bn": "নিষ্ক্রিয়"},
    },
)

LEAVE_TYPES = ["annual", "sick", "unpaid", "other"]
DEPARTMENTS = ["sales", "ops", "finance", "hr", "it", "other"]

MODULE = ModuleDefinition(
    code="HRM",
    name="HRM Module",
    entities=[
        EntityDefinition(
            code="EMPLOYEE",
            fields=[
                FieldDefinition(name="employee_no", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="full_name", field_type=FieldType.STRING, required=True),
                FieldDefinition(
                    name="department",
                    field_type=FieldType.ENUM,
                    options=DEPARTMENTS,
                    required=False,
                ),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                notes_enabled=True,
                document_enabled=True,
                status_field=_ACTIVE_STATUS,
            ),
        ),
        EntityDefinition(
            code="LEAVE_REQUEST",
            fields=[
                FieldDefinition(
                    name="employee_id",
                    field_type=FieldType.LOOKUP,
                    lookup_entity="EMPLOYEE",
                    required=True,
                ),
                FieldDefinition(
                    name="leave_type",
                    field_type=FieldType.ENUM,
                    options=LEAVE_TYPES,
                    required=True,
                ),
                FieldDefinition(name="days", field_type=FieldType.INTEGER, required=True),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(
                audit_enabled=True,
                workflow_enabled=True,
                notes_enabled=True,
                status_field=_ACTIVE_STATUS,
            ),
        ),
    ],
    workflows=[],
    reports=[
        ReportDefinition(
            code="ACTIVE_EMPLOYEES",
            name="Active Employees",
            entity_code="EMPLOYEE",
            columns=[
                ReportColumn(field="employee_no", label="No"),
                ReportColumn(field="full_name", label="Name"),
                ReportColumn(field="department", label="Department"),
            ],
        ),
    ],
    dashboards=[],
    menus=[
        MenuDefinition(code="employees", label="Employees", entity_code="EMPLOYEE", icon="badge"),
        MenuDefinition(code="leave", label="Leave Requests", entity_code="LEAVE_REQUEST", icon="event_busy"),
        MenuDefinition(
            code="active_employees",
            label="Active Employees",
            entity_code="EMPLOYEE",
            report_code="ACTIVE_EMPLOYEES",
            icon="groups",
        ),
    ],
    permissions=["hrm.access"],
)
