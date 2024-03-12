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
     name VARCHAR(255) NOT NULL,
     description TEXT,
     creation_date TIMESTAMP NOT NULL
);

CREATE TABLE extension (
       id SERIAL PRIMARY KEY,
       project_id INT,
       name VARCHAR(255) NOT NULL,
       description TEXT,
       scope VARCHAR(50),
       FOREIGN KEY (project_id) REFERENCES project(id)
);

CREATE TABLE item (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        extension_id INT REFERENCES extension (id),
        table_name VARCHAR(255),
        typecode INT NOT NULL
);

CREATE TABLE role_assignment (
     role_assignment_id SERIAL PRIMARY KEY,
     user_id INT REFERENCES "user"(id) NOT NULL,
     project_id INT REFERENCES project(id) NOT NULL,
     role VARCHAR(255) NOT NULL
);