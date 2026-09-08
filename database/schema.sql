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
	contractor_id INTEGER,
	contractor_name VARCHAR(200),
	created_at DATETIME, 
	PRIMARY KEY (id)
);
CREATE INDEX ix_projects_id ON projects (id);

CREATE TABLE contractors (
	id INTEGER NOT NULL,
	name VARCHAR(200) NOT NULL,
	pan_cin VARCHAR(50),
	incorporation_year INTEGER,
	category VARCHAR(50),
	status VARCHAR(50),
	avg_rating FLOAT,
	shell_risk_score FLOAT,
	ghost_billing_flags INTEGER,
	litigation_count INTEGER,
	tax_compliance_status VARCHAR(50),
	max_project_budget_handled FLOAT,
	created_at DATETIME,
	PRIMARY KEY (id)
);
CREATE INDEX ix_contractors_id ON contractors (id);

CREATE TABLE contractor_project_history (
	id INTEGER NOT NULL,
	contractor_id INTEGER NOT NULL,
	project_name VARCHAR(200) NOT NULL,
	ministry VARCHAR(150),
	sanctioned_budget FLOAT,
	actual_cost FLOAT,
	cost_overrun_pct FLOAT,
	planned_days INTEGER,
	actual_days INTEGER,
	delay_days INTEGER,
	completion_status VARCHAR(50),
	audit_irregularity_flag INTEGER,
	year_completed INTEGER,
	PRIMARY KEY (id),
	FOREIGN KEY(contractor_id) REFERENCES contractors (id)
);
CREATE INDEX ix_contractor_project_history_id ON contractor_project_history (id);
CREATE INDEX ix_contractor_project_history_contractor_id ON contractor_project_history (contractor_id);

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
