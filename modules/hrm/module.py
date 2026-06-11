from emcap.entity.models import EntityDefinition, EntityOptions, FieldDefinition, FieldType
from emcap.module.models import MenuDefinition, ModuleDefinition
from emcap.reporting.models import ReportColumn, ReportDefinition

MODULE = ModuleDefinition(
    code="HRM",
    name="HRM Module",
    entities=[
        EntityDefinition(
            code="EMPLOYEE",
            fields=[
                FieldDefinition(name="employee_no", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="full_name", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="department", field_type=FieldType.STRING, required=False),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(audit_enabled=True, notes_enabled=True, document_enabled=True),
        ),
        EntityDefinition(
            code="LEAVE_REQUEST",
            fields=[
                FieldDefinition(name="employee_no", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="leave_type", field_type=FieldType.STRING, required=True),
                FieldDefinition(name="days", field_type=FieldType.INTEGER, required=True),
                FieldDefinition(name="active", field_type=FieldType.BOOLEAN, required=False),
            ],
            options=EntityOptions(audit_enabled=True, workflow_enabled=True, notes_enabled=True),
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
        MenuDefinition(code="employees", label="Employees", entity_code="EMPLOYEE"),
        MenuDefinition(code="leave", label="Leave Requests", entity_code="LEAVE_REQUEST"),
    ],
    permissions=["hrm.access"],
)
