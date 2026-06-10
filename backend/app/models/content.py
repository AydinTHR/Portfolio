"""Pydantic models for portfolio content.

Field names intentionally match the frontend's ``src/data/defaults.js`` shape
(camelCase where the JS uses camelCase) so the API is a drop-in content source.
"""

from pydantic import BaseModel, ConfigDict, Field


class Availability(BaseModel):
    active: bool = True
    label: str = ""


class Hero(BaseModel):
    greeting: str
    name: str
    subtitles: list[str] = []
    availability: Availability = Field(default_factory=Availability)


class Stat(BaseModel):
    label: str
    value: int | float = 0


class About(BaseModel):
    profileImage: str | None = None
    paragraphs: list[str] = []
    stats: list[Stat] = []


class Skill(BaseModel):
    title: str
    description: str = ""
    technologies: list[str] = []
    proficiency: int = 75


class Experience(BaseModel):
    role: str
    company: str = ""
    location: str = ""
    type: str = ""
    startDate: str = ""
    endDate: str = ""
    icon: str = "◆"
    description: str = ""
    highlights: list[str] = []


class ContactLink(BaseModel):
    type: str
    label: str = ""
    value: str = ""
    url: str = ""


class ContactInfo(BaseModel):
    intro: str = ""
    timezone: str = "auto"
    links: list[ContactLink] = []


class Project(BaseModel):
    number: str = ""
    year: str = ""
    icon: str = "◆"
    category: str = ""
    image: str = ""
    title: str
    description: str = ""
    technologies: list[str] = []
    liveLink: str = "#"
    codeLink: str = "#"
    highlights: list[str] = []


class PortfolioContent(BaseModel):
    """The full portfolio document. Extra/internal keys (_id, updated_at) are ignored."""

    model_config = ConfigDict(extra="ignore")

    hero: Hero
    about: About
    skills: list[Skill] = []
    experience: list[Experience] = []
    contact: ContactInfo
    projects: list[Project] = []
