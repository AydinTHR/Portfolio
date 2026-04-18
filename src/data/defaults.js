export const defaults = {
  hero: {
    greeting: "Hi, I'm",
    name: 'Aydin',
    subtitles: ['Full Stack Developer', 'UI/UX Designer', 'Creative Problem Solver'],
  },
  about: {
    profileImage: null,
    paragraphs: [
      "Hello! I'm a passionate full stack developer with a love for creating beautiful and functional web applications. I enjoy turning complex problems into simple, elegant solutions.",
      "When I'm not coding, you can find me exploring new technologies, reading tech blogs, or working on personal projects. I believe in continuous learning and staying up-to-date with the latest web development trends.",
      "I'm always excited to collaborate on interesting projects and connect with fellow developers!",
    ],
  },
  skills: [
    {
      title: 'Frontend',
      description: 'Modern web development',
      technologies: ['React', 'Vite', 'HTML5', 'CSS3', 'JavaScript ES6+'],
    },
    {
      title: 'Backend & APIs',
      description: 'Server-side development',
      technologies: ['Node.js', 'Express', 'REST APIs', 'GraphQL', 'Microservices'],
    },
    {
      title: 'Database & Storage',
      description: 'Data management solutions',
      technologies: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Firebase'],
    },
    {
      title: 'Machine Learning & AI',
      description: 'AI-powered solutions',
      technologies: ['TensorFlow', 'PyTorch', 'scikit-learn', 'NLP', 'Computer Vision'],
    },
    {
      title: 'Docker',
      description: 'Containerization & deployment',
      technologies: ['Docker', 'Docker Compose', 'Container Orchestration', 'CI/CD'],
    },
    {
      title: 'Design',
      description: 'UI/UX and visual design',
      technologies: ['Figma', 'Adobe XD', 'Responsive Design', 'Accessibility', 'UX Patterns'],
    },
  ],
  contact: {
    intro: "I'm always open to new opportunities and collaborations. Feel free to reach out if you'd like to work together!",
    links: [
      { type: 'email', label: 'Email', value: 'aidinthr82@gmail.com', url: 'mailto:aidinthr82@gmail.com' },
      { type: 'github', label: 'GitHub', value: 'github.com/yourhandle', url: 'https://github.com/' },
      { type: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/yourhandle', url: 'https://linkedin.com/' },
    ],
  },
  projects: [
    {
      number: '01',
      year: '2026',
      icon: '◆',
      title: 'Dog Wash Booking System',
      description:
        'An online appointment booking system for Dog Wash services at PetValu. Features real-time availability, booking management, and customer notifications.',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Express', 'REST API'],
      liveLink: '#',
      codeLink: '#',
    },
    {
      number: '02',
      year: '2025',
      icon: '▲',
      title: 'E-Commerce Platform',
      description:
        'A full-stack e-commerce application with product catalog, shopping cart, secure checkout, and order tracking dashboard.',
      technologies: ['React', 'Express', 'MongoDB', 'Redis', 'Stripe'],
      liveLink: '#',
      codeLink: '#',
    },
    {
      number: '03',
      year: '2025',
      icon: '◉',
      title: 'AI Chat Assistant',
      description:
        'An intelligent conversational assistant powered by machine learning, featuring natural language understanding and context-aware responses.',
      technologies: ['Python', 'TensorFlow', 'React', 'FastAPI', 'WebSocket'],
      liveLink: '#',
      codeLink: '#',
    },
  ],
};
