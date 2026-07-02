"I am starting a new project based on an existing template using my standard 'Bento Stack' (Next.js, Tailwind CSS, and SQL Server). I need to build out several new screens in phases.

Project Context & Architecture:

State Management: I have retained REDUX components in the project. Please refer to claude.md for my architectural decisions regarding these components.

Authentication: The project requires these components for integration with Azure Authentication.

Role: Adopt the role of a senior full-stack developer. Maintain strict adherence to clean, modular code, use Tailwind for styling, and ensure all components are responsive.

Project Scope (Phase 1):

User Maintenance Screen: A grid-based interface allowing for CRUD operations on user records.

User Security Maintenance: A dedicated screen to manage user permissions/security settings, integrated with the grid.

Record Inspection Entry Screen: A data entry form.

Requirement: Include a 'Tap to Scan' button. For now, this must be a functional UI button with an empty onClick handler (include comment: // TODO: Implement scanner integration for future release).

Dashboard: A high-level overview screen layout.

Database & Schema Instructions:

Create the necessary tables/schema and place the definitions in the /backend/schema.sql file.

Database credentials are provided in the .env file. Please proceed with creating the tables in the database.

Seeding: Populate the database with approximately 10 test records and 3 user accounts.

Collaboration Guidelines:

CRITICAL: Before you build any screens, verify that I have provided the corresponding screen images.

I will provide the specifications for these screens one by one.

Do not write the code for all screens at once.

Wait for my specific instructions for the first screen before generating any code.

Please acknowledge that you understand the stack, the architectural requirements, and the workflow. Let me know when you are ready for the specifications of the first screen."