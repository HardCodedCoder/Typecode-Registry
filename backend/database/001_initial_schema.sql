DROP TABLE IF EXISTS role_assignment;
DROP TABLE IF EXISTS item;
DROP TABLE IF EXISTS extension;
DROP TABLE IF EXISTS project;
DROP TABLE IF EXISTS "user";

CREATE TABLE "user" (
        id SERIAL PRIMARY KEY,
        oauth_identifier VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL
);

CREATE TABLE project (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        creation_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE extension (
       id SERIAL PRIMARY KEY,
       project_id INT,
       name VARCHAR(255) NOT NULL,
       description TEXT,
       scope VARCHAR(50),
       creation_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (project_id) REFERENCES project(id)
);

CREATE TABLE item (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      extension_id INT REFERENCES extension (id),
      table_name VARCHAR(255),
      typecode INT NOT NULL,
      creation_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_assignment (
     role_assignment_id SERIAL PRIMARY KEY,
     user_id INT REFERENCES "user"(id) NOT NULL,
     project_id INT REFERENCES project(id) NOT NULL,
     role VARCHAR(255) NOT NULL
);

-- Index for `item` table
-- CREATE INDEX idx_item_extension_id ON item(extension_id);
-- CREATE INDEX idx_item_typecode ON item(typecode);

-- Index for `extension` table
-- CREATE INDEX idx_extension_scope ON extension(scope);
