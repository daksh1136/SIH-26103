from datetime import date, timedelta

from app.database import SessionLocal
from app.models import Project, Milestone


def seed_milestones():
    db = SessionLocal()

    try:
        projects = db.query(Project).order_by(Project.id).all()

        if not projects:
            print("No projects found.")
            return

        # Prevent duplicate seeding
        existing = db.query(Milestone).count()

        if existing > 0:
            print(f"Milestones already exist: {existing}")
            return

        today = date.today()

        milestone_templates = [
            "Project Planning & Approval",
            "Tender / Procurement",
            "Implementation Start",
            "Mid-Project Review",
            "Major Implementation Phase",
            "Final Inspection",
        ]

        for index, project in enumerate(projects):

            for step, name in enumerate(milestone_templates):

                # Spread dates differently across projects
                start_date = today - timedelta(
                    days=240 - (index * 7) - (step * 35)
                )

                completion_date = today + timedelta(
                    days=(step - 3) * 35 + (index * 4)
                )

                # Different progress patterns
                if step == 0:
                    progress = 100

                elif step == 1:
                    progress = 100

                elif step == 2:
                    progress = min(
                        100,
                        max(
                            20,
                            project.physical_progress
                            + (index * 2)
                        )
                    )

                elif step == 3:
                    progress = min(
                        100,
                        max(
                            10,
                            project.physical_progress - 10
                        )
                    )

                elif step == 4:
                    progress = min(
                        100,
                        max(
                            0,
                            project.physical_progress - 25
                        )
                    )

                else:
                    progress = 0

                actual_completion = None

                if progress >= 100:
                    actual_completion = (
                        completion_date
                        if completion_date <= today
                        else today
                    )

                milestone = Milestone(
                    project_id=project.id,
                    name=name,
                    planned_start=start_date,
                    planned_completion=completion_date,
                    actual_completion=actual_completion,
                    progress=progress,
                )

                db.add(milestone)

        db.commit()

        total = db.query(Milestone).count()

        print(
            f"Successfully created {total} milestones."
        )

    except Exception as error:
        db.rollback()
        print("Error:", error)

    finally:
        db.close()


if __name__ == "__main__":
    seed_milestones()