FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY services/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY services/backend/app ./app

EXPOSE 8000

CMD ["python", "-m", "app.cli", "--host", "0.0.0.0", "--port", "8000"]