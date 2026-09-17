import json
import os
from typing import Any

from confluent_kafka import Producer

BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
TOPIC_QUESTIONS_IMPORTED = os.getenv("KAFKA_TOPIC_QUESTIONS_IMPORTED", "questions.imported")

_producer: Producer | None = None


def _get_producer() -> Producer:
    global _producer
    if _producer is None:
        _producer = Producer({"bootstrap.servers": BOOTSTRAP_SERVERS})
    return _producer


def _delivery_callback(err, msg) -> None:
    if err is not None:
        print(f"[kafka] entrega falhou: {err}")
    elif msg is not None:
        print(f"[kafka] ok {msg.topic()} [{msg.partition()}] @{msg.offset()}")


def send_to_kafka(topic: str, payload: dict[str, Any], key: str = "") -> None:
    p = _get_producer()
    p.produce(
        topic,
        key=key or payload.get("id", ""),
        value=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        callback=_delivery_callback,
    )
    p.poll(0)


def flush(timeout: float = 10.0) -> None:
    if _producer is not None:
        _producer.flush(timeout)
