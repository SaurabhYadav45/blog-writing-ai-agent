import psycopg2
from datetime import datetime

conn = psycopg2.connect('postgresql://postgres:Postgress%4012345@localhost:5432/blogfusion_db')
cur = conn.cursor()

# Find the user id for the Pro user
cur.execute("SELECT id FROM \"user\" WHERE plan_name = 'Pro' LIMIT 1;")
user_record = cur.fetchone()

if user_record:
    user_id = user_record[0]
    
    # Check if a transaction already exists
    cur.execute("SELECT COUNT(*) FROM paymenttransaction WHERE user_id = %s;", (user_id,))
    count = cur.fetchone()[0]
    
    if count == 0:
        # Insert a dummy transaction
        cur.execute("""
            INSERT INTO paymenttransaction (user_id, razorpay_order_id, razorpay_payment_id, amount, currency, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (user_id, 'order_dummy_123', 'pay_dummy_456', 49900, 'INR', 'success', datetime.now()))
        conn.commit()
        print('Inserted mock payment transaction.')
    else:
        print('Transaction already exists.')
else:
    print('No Pro user found.')

cur.close()
conn.close()
