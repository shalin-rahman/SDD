FROM python:3.11-slim

WORKDIR /app

COPY platform/api/pyproject.toml .
COPY platform/api/src ./src
COPY config /config
COPY modules /modules

ENV EMCAP_CONFIG_PATH=/config/platform.yaml
ENV EMCAP_MODULES_PATH=/modules
ENV PYTHONPATH=/app/src

RUN pip install --no-cache-dir .

EXPOSE 8000

CMD ["uvicorn", "emcap.main:app", "--host", "0.0.0.0", "--port", "8000"]
