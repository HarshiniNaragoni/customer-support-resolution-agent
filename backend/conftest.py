from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.config.database import Base
from app.models.order import OrderModel
from app.models.ticket import TicketModel


TEST_DATABASE_URL = "sqlite:///./data/test_support_agent.db"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)


@event.listens_for(test_engine, "connect")
def _set_sqlite_pragma(dbapi_connection, _connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    from main import app
    from app.config.database import get_db

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def sample_order(db_session):
    order = OrderModel(
        order_id=str(uuid.uuid4()),
        customer_name="Test Customer",
        email="test@example.com",
        product_name="Test Product",
        status="shipped",
        carrier="FedEx",
        tracking_number="TRK12345678",
        estimated_delivery="2026-07-20",
        price=99.99,
        created_at=datetime.now(timezone.utc) - timedelta(days=5),
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)
    return order


@pytest.fixture
def sample_ticket(db_session):
    ticket = TicketModel(
        ticket_id=str(uuid.uuid4()),
        customer_name="Test Customer",
        customer_email="test@example.com",
        ticket_type="order_issue",
        message="Where is my order?",
        priority="medium",
        status="open",
    )
    db_session.add(ticket)
    db_session.commit()
    db_session.refresh(ticket)
    return ticket
