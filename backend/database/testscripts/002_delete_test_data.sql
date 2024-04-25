-- Active: 1713613995265@@127.0.0.1@5432@typecode-registry

-- Leert die Tabellen role_assignment, item, extension, project und user
-- Obligatorisches doppeltes Anführungszeichen (reserviertes Schlüsselwort)
TRUNCATE TABLE role_assignment, item, extension, project, "user" RESTART IDENTITY CASCADE;