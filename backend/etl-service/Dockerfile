# ETL em Python (FastAPI + Kafka KRaft + Groq) — substitui os .java ETL do monolito
FROM python:3.12-slim
WORKDIR /app

# deps de sistema para libs nativas do confluent-kafka
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential librdkafka-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY data ./data

ENV PYTHONUNBUFFERED=1
ENV KAFKA_BOOTSTRAP_SERVERS=kafka:9092
ENV GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
ENV GROQ_MODEL=llama-3.3-70b-versatile

EXPOSE 8083
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8083"]
