from app.database import engine, SessionLocal
from app.models.user import User
from app.models.team import Team
from app.models.invoice import Invoice
from app.models.topup import TopUp
from app.models.report_upload import ReportUpload
from app.models.usage import SubUserUsage
from app.database import Base
from app.utils.security import hash_password

Base.metadata.create_all(bind=engine)

# Bootstrap initial users
db = SessionLocal()

try:
    # Check if users already exist
    kajal = db.query(User).filter(User.username == "kajal").first()
    rashish = db.query(User).filter(User.username == "rashish").first()
    
    if not kajal:
        kajal = User(
            username="kajal",
            password=hash_password("kajal@123"),  # Initial password, user should change on first login
            role="employee"
        )
        db.add(kajal)
        print("✓ Created user: Kajal (Employee)")
    else:
        print("✓ User Kajal already exists")
    
    if not rashish:
        rashish = User(
            username="rashish",
            password=hash_password("rashish@123"),  # Initial password, user should change on first login
            role="admin"
        )
        db.add(rashish)
        print("✓ Created user: Rashish (Admin)")
    else:
        print("✓ User Rashish already exists")
    
    db.commit()
    print("\n✓ Database initialization complete!")
    print("\n📋 Initial Credentials:")
    print("   Kajal (Employee): username=kajal, password=kajal@123")
    print("   Rashish (Admin): username=rashish, password=rashish@123")
    print("\n⚠️  Please change these passwords after first login!")
    
finally:
    db.close()
