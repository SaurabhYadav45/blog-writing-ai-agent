import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL found.")
    exit(1)

engine = create_engine(db_url)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE blog ADD COLUMN cta VARCHAR;"))
        conn.commit()
        print("Successfully added cta column.")
    except Exception as e:
        print("Error or cta column already exists:", e)
        conn.rollback()
        
    try:
        conn.execute(text("ALTER TABLE blog ADD COLUMN reference_urls VARCHAR;"))
        conn.commit()
        print("Successfully added reference_urls column.")
    except Exception as e:
        print("Error or reference_urls column already exists:", e)
        conn.rollback()

    try:
        conn.execute(text("ALTER TABLE blog RENAME COLUMN length TO depth;"))
        conn.commit()
        print("Successfully renamed length to depth.")
    except Exception as e:
        print("Error or depth column already exists:", e)
        conn.rollback()

    try:
        conn.execute(text("ALTER TABLE \"user\" ADD COLUMN plan_name VARCHAR DEFAULT 'Free';"))
        conn.commit()
        print("Successfully added plan_name column to user table.")
    except Exception as e:
        print("Error or plan_name column already exists:", e)
        conn.rollback()

    try:
        conn.execute(text("ALTER TABLE \"user\" ADD COLUMN credits INTEGER DEFAULT 5;"))
        conn.commit()
        print("Successfully added credits column to user table.")
    except Exception as e:
        print("Error or credits column already exists:", e)
        conn.rollback()

    try:
        conn.execute(text("ALTER TABLE blog ADD COLUMN user_id INTEGER REFERENCES \"user\"(id);"))
        conn.commit()
        print("Successfully added user_id column to blog table.")
    except Exception as e:
        print("Error or user_id column already exists:", e)
        conn.rollback()
