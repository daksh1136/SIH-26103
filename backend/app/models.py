class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=False
    )

    name = Column(String, nullable=False)

    planned_start = Column(Date, nullable=True)

    planned_completion = Column(Date, nullable=False)

    actual_completion = Column(Date, nullable=True)

    progress = Column(
        Float,
        default=0
    )

    status = Column(
        String,
        default="UPCOMING"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    project = relationship(
        "Project",
        back_populates="milestones"
    )