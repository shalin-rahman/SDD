from typing import Any

from sqlalchemy.orm import Session

from emcap.persistence.database import PaymentTransactionRow


class PaymentGateway:
    def __init__(
        self,
        session: Session,
        tenant_id: str = "default",
        provider: str = "stripe",
    ) -> None:
        self._session = session
        self._tenant_id = tenant_id
        self._provider = provider

    def create_intent(self, amount: str, currency: str = "USD") -> dict[str, Any]:
        row = PaymentTransactionRow(
            provider=self._provider,
            amount=amount,
            currency=currency,
            tenant_id=self._tenant_id,
            status="pending",
        )
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return {
            "transaction_id": row.id,
            "provider": row.provider,
            "amount": row.amount,
            "currency": row.currency,
            "status": row.status,
        }
