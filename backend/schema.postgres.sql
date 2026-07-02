-- Classroom Inspection App — Database Schema (PostgreSQL)
-- Run against the database named in backend/.env (DATABASE_URL)

-- =========================================================
-- Schools (lookup table — school number/name pairs used
-- across Users, and later Inspections/Dashboard screens)
-- =========================================================
CREATE TABLE IF NOT EXISTS schools (
    school_number  VARCHAR(10)   NOT NULL PRIMARY KEY,
    school_name    VARCHAR(100)  NOT NULL
);

-- =========================================================
-- Users (User Maintenance / User Security Maintenance screen)
-- Power user + notification recipient are permission flags
-- managed directly on this grid, per the combined screen design.
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
    user_id                   SERIAL        NOT NULL PRIMARY KEY,
    school_number             VARCHAR(10)   NOT NULL REFERENCES schools(school_number),
    network_id                VARCHAR(50)   NOT NULL UNIQUE,
    full_name                 VARCHAR(100)  NOT NULL,
    is_power_user              BOOLEAN       NOT NULL DEFAULT FALSE,
    is_notification_recipient  BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at                TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- =========================================================
-- Inspections (Record Inspection Entry screen / Dashboard)
-- =========================================================
CREATE TABLE IF NOT EXISTS inspections (
    inspection_id        SERIAL        NOT NULL PRIMARY KEY,
    school_number        VARCHAR(10)   NOT NULL REFERENCES schools(school_number),
    classroom_number     VARCHAR(20)   NOT NULL,
    temperature_reading  DECIMAL(5,2)  NOT NULL,
    issue_description    VARCHAR(500)  NULL,
    cleanliness_rating   SMALLINT      NOT NULL CHECK (cleanliness_rating BETWEEN 1 AND 5),
    cleaning_notes       VARCHAR(500)  NULL,
    inspected_by         VARCHAR(100)  NULL,
    inspected_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- =========================================================
-- Seed data
-- =========================================================
INSERT INTO schools (school_number, school_name) VALUES
    ('000', 'HISD'),
    ('042', 'Madison HS'),
    ('075', 'Reagan HS'),
    ('018', 'Westbury HS'),
    ('031', 'Lamar HS')
ON CONFLICT (school_number) DO NOTHING;

INSERT INTO users (school_number, network_id, full_name, is_power_user, is_notification_recipient)
SELECT * FROM (VALUES
    ('000', 'admin01',   'Maria Gonzalez', TRUE,  TRUE),
    ('042', 'jsmith01',  'James Smith',    FALSE, FALSE),
    ('042', 'lrodrig02', 'Linda Rodriguez',FALSE, TRUE),
    ('075', 'dtran03',   'David Tran',     FALSE, FALSE)
) AS v(school_number, network_id, full_name, is_power_user, is_notification_recipient)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE network_id = 'admin01');

INSERT INTO inspections (school_number, classroom_number, temperature_reading, issue_description, cleanliness_rating, cleaning_notes, inspected_by, inspected_at)
SELECT * FROM (VALUES
    -- Last 6 days — one reading per day, feeds the "Average temperature by day" chart.
    -- The day-1 Reagan HS reading (82°F) is deliberately out of range to exercise the alert coloring.
    ('042', '101', 72::decimal, NULL::varchar,                4, NULL::varchar,                   'James Smith',    now() - INTERVAL '6 days'),
    ('075', '203', 74::decimal, NULL,                          3, NULL,                            'David Tran',     now() - INTERVAL '5 days'),
    ('018', '105', 70::decimal, NULL,                          2, NULL,                            'Maria Gonzalez', now() - INTERVAL '4 days'),
    ('031', '210', 73::decimal, NULL,                          5, NULL,                            'Maria Gonzalez', now() - INTERVAL '3 days'),
    ('042', '102', 71::decimal, NULL,                          4, NULL,                            'James Smith',    now() - INTERVAL '2 days'),
    ('075', '204', 82::decimal, NULL,                          3, NULL,                            'David Tran',     now() - INTERVAL '1 day'),
    -- Today — includes deliberate temp alerts (below 68 / above 78) and
    -- cleanliness alerts (rating <= 2) so the dashboard's alert counts are non-zero.
    ('042', '101', 73::decimal, NULL,                          4, NULL,                            'James Smith',    now()),
    ('042', '103', 65::decimal, 'AC blowing too cold',         4, NULL,                            'James Smith',    now()),
    ('075', '201', 75::decimal, NULL,                          2, 'Trash not emptied',             'David Tran',     now()),
    ('075', '205', 74::decimal, NULL,                          3, NULL,                            'David Tran',     now()),
    ('018', '106', 80::decimal, 'Thermostat unresponsive',     1, 'Floors sticky, needs mopping',   'Maria Gonzalez', now()),
    ('031', '211', 72::decimal, NULL,                          5, NULL,                            'Maria Gonzalez', now()),
    ('031', '212', 71::decimal, NULL,                          4, NULL,                            'Maria Gonzalez', now())
) AS v(school_number, classroom_number, temperature_reading, issue_description, cleanliness_rating, cleaning_notes, inspected_by, inspected_at)
WHERE NOT EXISTS (SELECT 1 FROM inspections);
