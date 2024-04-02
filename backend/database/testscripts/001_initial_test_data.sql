-- Erweiterte Projekte einfügen
INSERT INTO project (name, description, creation_date) VALUES
                                                           ('Projekt A', 'Beschreibung A', NOW()),
                                                           ('Projekt B', 'Beschreibung B', NOW()),
                                                           ('Projekt C', 'Beschreibung C', NOW()),
                                                           ('Projekt D', 'Beschreibung D', NOW()),
                                                           ('Projekt E', 'Beschreibung E', NOW());

-- Erweiterte Extensions für alle Projekte einfügen mit dem Scope 'Project'
INSERT INTO extension (project_id, name, description, scope, creation_date) VALUES
                                                                                (1, 'Extension A1', 'Erste Extension für Projekt A', 'Project', NOW()),
                                                                                (1, 'Extension A2', 'Zweite Extension für Projekt A', 'Project', NOW()),
                                                                                (1, 'Extension A3', 'Dritte Extension für Projekt A', 'Project', NOW()),
                                                                                (1, 'Extension A4', 'Vierte Extension für Projekt A', 'Project', NOW()),
                                                                                (1, 'Extension A5', 'Fünfte Extension für Projekt A', 'Project', NOW()),
                                                                                (2, 'Extension B1', 'Erste Extension für Projekt B', 'Project', NOW()),
                                                                                (2, 'Extension B2', 'Zweite Extension für Projekt B', 'Project', NOW()),
                                                                                (2, 'Extension B3', 'Dritte Extension für Projekt B', 'Project', NOW()),
                                                                                (2, 'Extension B4', 'Vierte Extension für Projekt B', 'Project', NOW()),
                                                                                (2, 'Extension B5', 'Fünfte Extension für Projekt B', 'Project', NOW()),
                                                                                (3, 'Extension C1', 'Erste Extension für Projekt C', 'Project', NOW()),
                                                                                (3, 'Extension C2', 'Zweite Extension für Projekt C', 'Project', NOW()),
                                                                                (3, 'Extension C3', 'Dritte Extension für Projekt C', 'Project', NOW()),
                                                                                (3, 'Extension C4', 'Vierte Extension für Projekt C', 'Project', NOW()),
                                                                                (3, 'Extension C5', 'Fünfte Extension für Projekt C', 'Project', NOW()),
                                                                                (4, 'Extension D1', 'Erste Extension für Projekt D', 'Project', NOW()),
                                                                                (4, 'Extension D2', 'Zweite Extension für Projekt D', 'Project', NOW()),
                                                                                (4, 'Extension D3', 'Dritte Extension für Projekt D', 'Project', NOW()),
                                                                                (4, 'Extension D4', 'Vierte Extension für Projekt D', 'Project', NOW()),
                                                                                (4, 'Extension D5', 'Fünfte Extension für Projekt D', 'Project', NOW()),
                                                                                (5, 'Extension E1', 'Erste Extension für Projekt E', 'Project', NOW()),
                                                                                (5, 'Extension E2', 'Zweite Extension für Projekt E', 'Project', NOW()),
                                                                                (5, 'Extension E3', 'Dritte Extension für Projekt E', 'Project', NOW()),
                                                                                (5, 'Extension E4', 'Vierte Extension für Projekt E', 'Project', NOW()),
                                                                                (5, 'Extension E5', 'Fünfte Extension für Projekt E', 'Project', NOW()),
                                                                                (NULL, 'Extension F1', 'Erste Extension', 'Shared', NOW()),
                                                                                (NULL, 'Extension F2', 'Zweite Extension', 'Shared', NOW()),
                                                                                (NULL, 'Extension F3', 'Dritte Extension', 'Shared', NOW()),
                                                                                (NULL, 'Extension F4', 'Vierte Extension', 'Shared', NOW()),
                                                                                (NULL, 'Extension F5', 'Fünfte Extension', 'Shared', NOW());

-- Erweiterte Items für die Extensions in allen Projekten einfügen
INSERT INTO item (name, extension_id, table_name, typecode, creation_date) VALUES
                                                                               ('Item A1', 1, 'Tabelle A1', 14000, NOW()),
                                                                               ('Item A2', 1, 'Tabelle A2', 14002, NOW()),
                                                                               ('Item A3', 1, 'Tabelle A3', 14004, NOW()),
                                                                               ('Item A4', 1, 'Tabelle A4', 14006, NOW()),
                                                                               ('Item A5', 1, 'Tabelle A5', 14008, NOW()),
                                                                               ('Item B1', 6, 'Tabelle B1', 14100, NOW()),
                                                                               ('Item B2', 6, 'Tabelle B2', 14102, NOW()),
                                                                               ('Item B3', 6, 'Tabelle B3', 14104, NOW()),
                                                                               ('Item B4', 6, 'Tabelle B4', 14106, NOW()),
                                                                               ('Item B5', 6, 'Tabelle B5', 14108, NOW()),
                                                                               ('Item C1', 11, 'Tabelle C1', 14200, NOW()),
                                                                               ('Item C2', 11, 'Tabelle C2', 14202, NOW()),
                                                                               ('Item C3', 11, 'Tabelle C3', 14204, NOW()),
                                                                               ('Item C4', 11, 'Tabelle C4', 14206, NOW()),
                                                                               ('Item C5', 11, 'Tabelle C5', 14208, NOW()),
                                                                               ('Item D1', 16, 'Tabelle D1', 14300, NOW()),
                                                                               ('Item D2', 16, 'Tabelle D2', 14302, NOW()),
                                                                               ('Item D3', 16, 'Tabelle D3', 14304, NOW()),
                                                                               ('Item D4', 16, 'Tabelle D4', 14306, NOW()),
                                                                               ('Item D5', 16, 'Tabelle D5', 14308, NOW()),
                                                                               ('Item E1', 21, 'Tabelle E1', 14400, NOW()),
                                                                               ('Item E2', 21, 'Tabelle E2', 14402, NOW()),
                                                                               ('Item E3', 21, 'Tabelle E3', 14404, NOW()),
                                                                               ('Item E4', 21, 'Tabelle E4', 14406, NOW()),
                                                                               ('Item E5', 21, 'Tabelle E5', 14408, NOW());