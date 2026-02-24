-- Enable realtime for caches and users tables
ALTER PUBLICATION supabase_realtime ADD TABLE caches, users;
ALTER TABLE caches REPLICA IDENTITY FULL;
ALTER TABLE users REPLICA IDENTITY FULL;
