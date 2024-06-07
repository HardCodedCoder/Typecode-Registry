-- Create a project
INSERT INTO project (name, description) VALUES ('Test Project', 'This is a test project');

-- Create extensions for the project
INSERT INTO extension (project_id, name, description, scope)
VALUES ((SELECT id FROM project WHERE name = 'Test Project'), 'Extension 1', 'Description for Extension 1', 'Project');

INSERT INTO extension (project_id, name, description, scope)
VALUES ((SELECT id FROM project WHERE name = 'Test Project'), 'Extension 2', 'Description for Extension 2', 'Project');

-- Create items for each extension
INSERT INTO item (extension_id, name, table_name, typecode)
VALUES ((SELECT id FROM extension WHERE name = 'Extension 1'), 'Item 1', 'item_1_table', 10000);

INSERT INTO item (extension_id, name, table_name, typecode)
VALUES ((SELECT id FROM extension WHERE name = 'Extension 1'), 'Item 2', 'item_2_table', 20000);

INSERT INTO item (extension_id, name, table_name, typecode)
VALUES ((SELECT id FROM extension WHERE name = 'Extension 2'), 'Item 3', 'item_3_table', 30000);

INSERT INTO item (extension_id, name, table_name, typecode)
VALUES ((SELECT id FROM extension WHERE name = 'Extension 2'), 'Item 4', 'item_4_table', 40000);

-- Verify the data
SELECT * FROM project;
SELECT * FROM extension;
SELECT * FROM item;
