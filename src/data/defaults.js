export const defaults = {
  hero: {
    greeting: "Hi, I'm",
    name: 'Aydin',
    subtitles: ['Full Stack Developer', 'UI/UX Designer', 'Creative Problem Solver'],
    availability: {
      active: true,
      label: 'Available for work',
    },
  },
  about: {
    profileImage: null,
    paragraphs: [
      "Hello! I'm a passionate full stack developer with a love for creating beautiful and functional web applications. I enjoy turning complex problems into simple, elegant solutions.",
      "When I'm not coding, you can find me exploring new technologies, reading tech blogs, or working on personal projects. I believe in continuous learning and staying up-to-date with the latest web development trends.",
      "I'm always excited to collaborate on interesting projects and connect with fellow developers!",
    ],
    stats: [
      { label: 'Years coding', value: 6 },
      { label: 'Projects shipped', value: 24 },
      { label: 'Cups of coffee', value: 9001 },
    ],
  },
  skills: [
    {
      title: 'Frontend',
      description: 'Modern web development',
      technologies: ['React', 'Vite', 'HTML5', 'CSS3', 'JavaScript ES6+'],
      proficiency: 92,
    },
    {
      title: 'Backend & APIs',
      description: 'Server-side development',
      technologies: ['Node.js', 'Express', 'REST APIs', 'GraphQL', 'Microservices'],
      proficiency: 85,
    },
    {
      title: 'Database & Storage',
      description: 'Data management solutions',
      technologies: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Firebase'],
      proficiency: 78,
    },
    {
      title: 'Machine Learning & AI',
      description: 'AI-powered solutions',
      technologies: ['TensorFlow', 'PyTorch', 'scikit-learn', 'NLP', 'Computer Vision'],
      proficiency: 70,
    },
    {
      title: 'Docker',
      description: 'Containerization & deployment',
      technologies: ['Docker', 'Docker Compose', 'Container Orchestration', 'CI/CD'],
      proficiency: 75,
    },
    {
      title: 'Design',
      description: 'UI/UX and visual design',
      technologies: ['Figma', 'Adobe XD', 'Responsive Design', 'Accessibility', 'UX Patterns'],
      proficiency: 80,
    },
  ],
  contact: {
    intro: "I'm always open to new opportunities and collaborations. Feel free to reach out if you'd like to work together!",
    timezone: 'auto',
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
      category: 'Full-stack web app',
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop',
      title: 'Dog Wash Booking System',
      description:
        'An online appointment booking system for Dog Wash services at PetValu. Features real-time availability, booking management, and customer notifications.',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Express', 'REST API'],
      liveLink: '#',
      codeLink: '#',
      highlights: [
        'Cut booking time from 8 minutes to under 60 seconds',
        'Real-time slot availability with optimistic UI updates',
        'Deployed with automated CI/CD and rollback safety',
      ],
    },
    {
      number: '02',
      year: '2025',
      icon: '▲',
      category: 'E-commerce platform',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop',
      title: 'E-Commerce Platform',
      description:
        'A full-stack e-commerce application with product catalog, shopping cart, secure checkout, and order tracking dashboard.',
      technologies: ['React', 'Express', 'MongoDB', 'Redis', 'Stripe'],
      liveLink: '#',
      codeLink: '#',
      highlights: [
        'Stripe-powered checkout with idempotent order creation',
        'Redis-cached catalog for sub-100ms product reads',
        'Accessible by default — keyboard flow + WCAG AA contrast',
      ],
    },
    {
      number: '03',
      year: '2025',
      icon: '◉',
      category: 'AI / ML',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop',
      title: 'AI Chat Assistant',
      description:
        'An intelligent conversational assistant powered by machine learning, featuring natural language understanding and context-aware responses.',
      technologies: ['Python', 'TensorFlow', 'React', 'FastAPI', 'WebSocket'],
      liveLink: '#',
      codeLink: '#',
      highlights: [
        'Streaming token-by-token UI with cancellation support',
        'Context memory summarized with LLM checkpoints',
        'Edge-deployed for < 200ms time-to-first-token',
      ],
    },
  ],
};
