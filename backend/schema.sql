-- Classroom Inspection App — Database Schema
-- Run against the database named in backend/.env (DB_DATABASE)

-- =========================================================
-- Schools (lookup table — school number/name pairs used
-- across Users, and later Inspections/Dashboard screens)
-- =========================================================
IF OBJECT_ID('dbo.Schools', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Schools (
        SchoolNumber   VARCHAR(10)   NOT NULL PRIMARY KEY,
        SchoolName     VARCHAR(100)  NOT NULL
    );
END;

-- =========================================================
-- Users (User Maintenance / User Security Maintenance screen)
-- Power user + notification recipient are permission flags
-- managed directly on this grid, per the combined screen design.
-- =========================================================
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        UserID                   INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        SchoolNumber             VARCHAR(10)   NOT NULL REFERENCES dbo.Schools(SchoolNumber),
        NetworkID                VARCHAR(50)   NOT NULL UNIQUE,
        FullName                 VARCHAR(100)  NOT NULL,
        IsPowerUser              BIT           NOT NULL DEFAULT 0,
        IsNotificationRecipient  BIT           NOT NULL DEFAULT 0,
        CreatedAt                DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt                DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;

-- =========================================================
-- Inspections (Record Inspection Entry screen / Dashboard)
-- =========================================================
IF OBJECT_ID('dbo.Inspections', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Inspections (
        InspectionID        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        SchoolNumber         VARCHAR(10)   NOT NULL REFERENCES dbo.Schools(SchoolNumber),
        ClassroomNumber      VARCHAR(20)   NOT NULL,
        TemperatureReading   DECIMAL(5,2)  NOT NULL,
        IssueDescription     VARCHAR(500)  NULL,
        CleanlinessRating    TINYINT       NOT NULL CHECK (CleanlinessRating BETWEEN 1 AND 5),
        CleaningNotes        VARCHAR(500)  NULL,
        InspectedBy          VARCHAR(100)  NULL,
        InspectedAt          DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        CreatedAt            DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;

-- =========================================================
-- Seed data
-- =========================================================
MERGE dbo.Schools AS target
USING (VALUES
    ('000', 'HISD'),
    ('042', 'Madison HS'),
    ('075', 'Reagan HS'),
    ('018', 'Westbury HS'),
    ('031', 'Lamar HS')
) AS source (SchoolNumber, SchoolName)
ON target.SchoolNumber = source.SchoolNumber
WHEN NOT MATCHED BY TARGET THEN
    INSERT (SchoolNumber, SchoolName) VALUES (source.SchoolNumber, source.SchoolName);

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE NetworkID = 'admin01')
BEGIN
    INSERT INTO dbo.Users (SchoolNumber, NetworkID, FullName, IsPowerUser, IsNotificationRecipient) VALUES
        ('000', 'admin01',   'Maria Gonzalez', 1, 1),
        ('042', 'jsmith01',  'James Smith',    0, 0),
        ('042', 'lrodrig02', 'Linda Rodriguez',0, 1),
        ('075', 'dtran03',   'David Tran',     0, 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Inspections)
BEGIN
    -- Last 6 days — one reading per day, feeds the "Average temperature by day" chart.
    -- The day-1 Reagan HS reading (82°F) is deliberately out of range to exercise the alert coloring.
    INSERT INTO dbo.Inspections (SchoolNumber, ClassroomNumber, TemperatureReading, CleanlinessRating, InspectedBy, InspectedAt) VALUES
        ('042', '101', 72, 4, 'James Smith',     DATEADD(DAY, -6, SYSUTCDATETIME())),
        ('075', '203', 74, 3, 'David Tran',      DATEADD(DAY, -5, SYSUTCDATETIME())),
        ('018', '105', 70, 2, 'Maria Gonzalez',  DATEADD(DAY, -4, SYSUTCDATETIME())),
        ('031', '210', 73, 5, 'Maria Gonzalez',  DATEADD(DAY, -3, SYSUTCDATETIME())),
        ('042', '102', 71, 4, 'James Smith',     DATEADD(DAY, -2, SYSUTCDATETIME())),
        ('075', '204', 82, 3, 'David Tran',      DATEADD(DAY, -1, SYSUTCDATETIME()));

    -- Today — includes deliberate temp alerts (below 68 / above 78) and
    -- cleanliness alerts (rating <= 2) so the dashboard's alert counts are non-zero.
    INSERT INTO dbo.Inspections (SchoolNumber, ClassroomNumber, TemperatureReading, IssueDescription, CleanlinessRating, CleaningNotes, InspectedBy, InspectedAt) VALUES
        ('042', '101', 73, NULL,                                  4, NULL,                          'James Smith',    SYSUTCDATETIME()),
        ('042', '103', 65, 'AC blowing too cold',                 4, NULL,                          'James Smith',    SYSUTCDATETIME()),
        ('075', '201', 75, NULL,                                  2, 'Trash not emptied',           'David Tran',      SYSUTCDATETIME()),
        ('075', '205', 74, NULL,                                  3, NULL,                          'David Tran',      SYSUTCDATETIME()),
        ('018', '106', 80, 'Thermostat unresponsive',             1, 'Floors sticky, needs mopping', 'Maria Gonzalez', SYSUTCDATETIME()),
        ('031', '211', 72, NULL,                                  5, NULL,                          'Maria Gonzalez',  SYSUTCDATETIME()),
        ('031', '212', 71, NULL,                                  4, NULL,                          'Maria Gonzalez',  SYSUTCDATETIME());
END;
