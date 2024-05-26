-- Create a shared extension with a unique ID
INSERT INTO extension (project_id, name, description, scope, creation_date)
VALUES (NULL, 'Test Extension', 'This is a test extension', 'Shared', NOW());

-- Create 20 items belonging to the extension
DO $$
DECLARE
    new_id INT;
BEGIN
    SELECT COALESCE(MAX(id), 0) + 1 INTO new_id FROM item;
    FOR i IN 1..20 LOOP
        INSERT INTO item (id, extension_id, name, table_name, typecode, creation_date)
        VALUES (new_id + i, (SELECT id FROM extension WHERE name = 'Test Extension'), 'Item ' || (new_id + i), 'table_' || (new_id + i), new_id + i, NOW());
    END LOOP;
END $$;