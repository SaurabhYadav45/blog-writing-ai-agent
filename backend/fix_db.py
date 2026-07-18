import psycopg2
conn = psycopg2.connect('postgresql://postgres:Postgress%4012345@localhost:5432/blogfusion_db')
cur = conn.cursor()
cur.execute("UPDATE \"user\" SET plan_expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days' WHERE plan_name = 'Pro' AND plan_expires_at IS NULL;")
conn.commit()
cur.close()
conn.close()
print('DB Updated')
