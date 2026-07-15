from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config.logging_config import logger
from app.models.order import OrderModel
from app.models.refund import RefundModel
from app.models.ticket import TicketModel
from app.models.user import UserModel
from app.models.policy import PolicyModel

FIRST_NAMES = [
    "Alice", "Bob", "Charlie", "Diana", "Edward",
    "Fiona", "George", "Hannah", "Ivan", "Julia",
    "Kevin", "Laura", "Michael", "Nina", "Oscar",
]
LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones",
    "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
]
PRODUCTS = [
    "Wireless Headphones Pro", "Bluetooth Speaker Max", "USB-C Hub Adapter",
    "Mechanical Keyboard RGB", "Ergonomic Mouse", "27\" 4K Monitor",
    "Webcam HD 1080p", "Laptop Stand Adjustable", "Portable SSD 1TB",
    "Smart Watch Ultra", "Fitness Tracker Band", "Wireless Charger Pad",
    "Noise Cancelling Earbuds", "Desk Lamp LED", "Cable Management Kit",
]
CARRIERS = ["FedEx", "UPS", "USPS", "DHL", "Amazon Logistics"]
ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "returned"]
REFUND_STATUSES = ["pending", "approved", "rejected", "processed"]
TICKET_TYPES = ["order_issue", "refund_request", "technical_support", "billing", "general", "complaint"]
PRIORITIES = ["low", "medium", "high", "urgent"]
TICKET_STATUSES = ["open", "in_progress", "resolved", "closed", "escalated"]

POLICIES_DATA = [
    ("Return Policy", "returns", "Items can be returned within 30 days of delivery. Items must be unused and in original packaging. Shipping costs for returns are the responsibility of the customer unless the item is defective."),
    ("Refund Policy", "refunds", "Refunds are processed within 5-7 business days after the returned item is received. Refunds are issued to the original payment method. Partial refunds may be granted for items returned in less than original condition."),
    ("Shipping Policy", "shipping", "Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days. Free shipping on orders over $50. We ship to all 50 US states."),
    ("Warranty Policy", "warranty", "All products carry a 1-year manufacturer warranty. Warranty covers defects in materials and workmanship. Warranty does not cover accidental damage or normal wear and tear."),
    ("Privacy Policy", "privacy", "We collect personal information solely for order processing and customer support. We do not sell or share personal data with third parties for marketing purposes. Data is encrypted at rest and in transit."),
    ("Account Security", "security", "Customers are responsible for maintaining the confidentiality of their account credentials. Password resets can be requested via email. Two-factor authentication is recommended for all accounts."),
    ("Cancellation Policy", "cancellations", "Orders can be cancelled within 2 hours of placement. Shipped orders cannot be cancelled and must go through the return process. Cancellations are refunded in full within 3-5 business days."),
    ("Price Match Guarantee", "pricing", "We offer a 14-day price match guarantee. If you find a lower price at an authorized retailer within 14 days of purchase, we will refund the difference. Excludes clearance and marketplace items."),
    ("Gift Card Policy", "gift_cards", "Gift cards are non-refundable and cannot be redeemed for cash. Gift cards do not expire. Lost or stolen gift cards cannot be replaced. Digital gift cards are delivered via email."),
    ("Bulk Order Policy", "bulk_orders", "Orders of 10 or more units qualify for bulk pricing. Contact our sales team for a custom quote. Bulk orders may have extended delivery times."),
    ("Customer Satisfaction", "service", "We are committed to customer satisfaction. If you are not satisfied with your purchase, please contact our support team. We will work to resolve any issues promptly."),
    ("Dispute Resolution", "legal", "Any disputes arising from purchases will be handled through binding arbitration. Class action lawsuits are waived. Governing law is the state of Delaware."),
    ("Email Communication", "communication", "Order confirmations and shipping notifications are sent via email. Marketing emails require explicit opt-in. You can unsubscribe from marketing emails at any time."),
    ("Loyalty Program", "rewards", "Earn 1 point per dollar spent. Points can be redeemed for discounts on future purchases. 100 points = $1 discount. Loyalty points expire after 12 months of account inactivity."),
    ("Damaged Items", "returns", "Report damaged items within 48 hours of delivery. Provide photos of the damage. We will send a replacement or issue a full refund. Do not discard the damaged item until instructed."),
]


def seed_database(db: Session) -> None:
    existing = db.query(UserModel).count()
    if existing > 0:
        logger.info("Database already seeded, skipping.")
        return

    logger.info("Seeding database with sample data...")

    _seed_users(db)
    _seed_orders(db)
    _seed_refunds(db)
    _seed_tickets(db)
    _seed_policies(db)

    db.commit()
    logger.info("Database seeding complete.")


def _seed_users(db: Session) -> None:
    roles = ["agent", "admin", "supervisor"]
    for i in range(5):
        db.add(UserModel(
            id=str(uuid.uuid4()),
            name=f"{FIRST_NAMES[i]} {LAST_NAMES[i]}",
            email=f"{FIRST_NAMES[i].lower()}.{LAST_NAMES[i].lower()}@supportco.com",
            role=random.choice(roles),
        ))


def _seed_orders(db: Session) -> None:
    for _ in range(25):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        status = random.choice(ORDER_STATUSES)
        carrier = random.choice(CARRIERS) if status in ("shipped", "delivered") else None
        tracking = f"TRK{random.randint(10000000, 99999999)}" if carrier else None
        days_ago = random.randint(1, 60)
        created = datetime.now(timezone.utc) - timedelta(days=days_ago)
        est_delivery = (datetime.now(timezone.utc) + timedelta(days=random.randint(1, 14))).strftime("%Y-%m-%d") if status in ("pending", "processing", "shipped") else None

        db.add(OrderModel(
            order_id=str(uuid.uuid4()),
            customer_name=f"{first} {last}",
            email=f"{first.lower()}.{last.lower()}@email.com",
            product_name=random.choice(PRODUCTS),
            status=status,
            carrier=carrier,
            tracking_number=tracking,
            estimated_delivery=est_delivery,
            price=round(random.uniform(9.99, 499.99), 2),
            created_at=created,
        ))


def _seed_refunds(db: Session) -> None:
    orders = db.query(OrderModel).limit(10).all()
    for order in orders:
        db.add(RefundModel(
            refund_id=str(uuid.uuid4()),
            order_id=order.order_id,
            amount=round(order.price * random.uniform(0.1, 1.0), 2),
            reason=random.choice([
                "Item not as described",
                "Changed mind",
                "Wrong item received",
                "Defective product",
                "Better price found elsewhere",
                "No longer needed",
                "Late delivery",
            ]),
            status=random.choice(REFUND_STATUSES),
            approved_by=random.choice(FIRST_NAMES) if random.random() > 0.5 else None,
        ))


def _seed_tickets(db: Session) -> None:
    for _ in range(20):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        db.add(TicketModel(
            ticket_id=str(uuid.uuid4()),
            customer_name=f"{first} {last}",
            customer_email=f"{first.lower()}.{last.lower()}@email.com",
            ticket_type=random.choice(TICKET_TYPES),
            message=f"Customer inquiry regarding their recent order. Issue type: {random.choice(TICKET_TYPES)}.",
            priority=random.choice(PRIORITIES),
            status=random.choice(TICKET_STATUSES),
            confidence=round(random.uniform(0.5, 0.99), 2) if random.random() > 0.3 else None,
            resolution="Resolved automatically" if random.random() > 0.5 else None,
            assigned_to=random.choice(FIRST_NAMES) if random.random() > 0.4 else None,
        ))


def _seed_policies(db: Session) -> None:
    for title, category, content in POLICIES_DATA:
        db.add(PolicyModel(
            policy_id=str(uuid.uuid4()),
            title=title,
            category=category,
            content=content,
        ))
