source .env.local
pg_dump -s $DATABASE -U $USER -h $HOST -p 5432 >db.sql
