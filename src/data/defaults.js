// Bundled placeholder content. This is only the offline fallback and the
// "Reset to defaults" target; the real site content lives in the database and
// is edited through the admin panel. Intentionally generic sample text, with
// the owner's name and contact links kept real.
export const defaults = {
  hero: {
    greeting: "Hi, I'm",
    name: 'Aydin',
    subtitles: ['Your headline role', 'Another role', 'A third role'],
    availability: {
      active: true,
      label: 'Available for work',
    },
  },
  about: {
    profileImage: null,
    paragraphs: [
      'This is placeholder text. Write a short introduction about yourself here.',
      'Add a second paragraph about your interests, focus, or background.',
      'Add a closing line inviting people to reach out.',
    ],
    stats: [
      { label: 'Stat one', value: 0 },
      { label: 'Stat two', value: 0 },
    ],
  },
  skills: [
    {
      title: 'Skill area one',
      description: 'Short description of this skill area.',
      technologies: ['Tech one', 'Tech two', 'Tech three'],
      proficiency: 80,
    },
    {
      title: 'Skill area two',
      description: 'Short description of this skill area.',
      technologies: ['Tech one', 'Tech two', 'Tech three'],
      proficiency: 70,
    },
    {
      title: 'Skill area three',
      description: 'Short description of this skill area.',
      technologies: ['Tech one', 'Tech two', 'Tech three'],
      proficiency: 60,
    },
  ],
  experience: [
    {
      role: 'Job title',
      company: 'Company name',
      location: 'City, Country',
      type: 'On-site',
      startDate: 'Start',
      endDate: 'Present',
      icon: '◆',
      description: 'Short description of this role goes here.',
      highlights: ['Highlight one', 'Highlight two', 'Highlight three'],
    },
    {
      role: 'Job title',
      company: 'Company name',
      location: 'City, Country',
      type: 'Remote',
      startDate: 'Start',
      endDate: 'End',
      icon: '◇',
      description: 'Short description of this role goes here.',
      highlights: ['Highlight one', 'Highlight two'],
    },
  ],
  contact: {
    intro:
      "I'm always open to new opportunities and collaborations. Feel free to reach out if you'd like to work together!",
    timezone: 'auto',
    links: [
      { type: 'email', label: 'Email', value: 'aidinthr82@gmail.com', url: 'mailto:aidinthr82@gmail.com' },
      {
        type: 'github',
        label: 'GitHub',
        value: 'github.com/AydinTHR',
        url: 'https://github.com/AydinTHR',
      },
      {
        type: 'linkedin',
        label: 'LinkedIn',
        value: 'linkedin.com/in/aydin-tehrani',
        url: 'https://linkedin.com/in/aydin-tehrani',
      },
    ],
  },
  projects: [
    {
      number: '01',
      year: '2025',
      icon: '◆',
      category: 'Category',
      image: '',
      title: 'Project one',
      description: 'Short description of this project goes here.',
      technologies: ['Tech one', 'Tech two', 'Tech three'],
      liveLink: '#',
      codeLink: '#',
      highlights: ['Highlight one', 'Highlight two'],
    },
    {
      number: '02',
      year: '2025',
      icon: '◇',
      category: 'Category',
      image: '',
      title: 'Project two',
      description: 'Short description of this project goes here.',
      technologies: ['Tech one', 'Tech two', 'Tech three'],
      liveLink: '#',
      codeLink: '#',
      highlights: ['Highlight one', 'Highlight two'],
    },
  ],
};
