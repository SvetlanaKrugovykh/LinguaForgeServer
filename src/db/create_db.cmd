& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "DROP DATABASE IF EXISTS lang WITH (FORCE);"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE lang WITH ENCODING='UTF8' LC_COLLATE='uk_UA.utf8' LC_CTYPE='uk_UA.utf8' TEMPLATE=template0;"
