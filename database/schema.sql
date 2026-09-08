CREATE TABLE projects (
	id INTEGER NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	department VARCHAR(150) NOT NULL, 
	location VARCHAR(150) NOT NULL, 
	manager VARCHAR(150) NOT NULL, 
	start_date DATE NOT NULL, 
	planned_completion DATE NOT NULL, 
	approved_budget FLOAT, 
	released_funds FLOAT, 
	expenditure FLOAT, 
	physical_progress FLOAT, 
	financial_progress FLOAT, 
	status VARCHAR(50), 
	created_at DATETIME, 
	PRIMARY KEY (id)
);
CREATE INDEX ix_projects_id ON projects (id);
CREATE TABLE milestones (
	id INTEGER NOT NULL, 
	project_id INTEGER NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	planned_date DATE NOT NULL, 
	actual_date DATE, 
	status VARCHAR(50), 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
);
CREATE INDEX ix_milestones_id ON milestones (id);
CREATE TABLE project_updates (
	id INTEGER NOT NULL, 
	project_id INTEGER NOT NULL, 
	progress FLOAT, 
	expenditure FLOAT, 
	notes TEXT, 
	update_date DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
);
CREATE INDEX ix_project_updates_id ON project_updates (id);
CREATE TABLE alerts (
	id INTEGER NOT NULL, 
	project_id INTEGER NOT NULL, 
	severity VARCHAR(30), 
	category VARCHAR(80) NOT NULL, 
	message TEXT NOT NULL, 
	recommendation TEXT, 
	status VARCHAR(30), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
);
CREATE INDEX ix_alerts_id ON alerts (id);
