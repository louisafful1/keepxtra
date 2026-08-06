export interface TeamMember {
  name: string
  role: string
  bio: string
}

/**
 * Photos still pending — swap in headshots via MeetTheTeam.tsx once available.
 */
export const teamMembers: TeamMember[] = [
  {
    name: 'Hamilton Maison',
    role: 'Founder & Chief Executive Officer',
    bio: 'Leads the company vision and drives KeepXtra’s mission to build reliable food infrastructure for Africa.',
  },
  {
    name: 'Joseph Maison',
    role: 'Co-Founder & Chief Operating Officer',
    bio: 'Oversees day-to-day operations across storage, quality assurance, and logistics.',
  },
  {
    name: 'Louis Afful',
    role: 'Head of Technology',
    bio: 'Builds the software and data systems that power inventory, routing, and quality tracking.',
  },
  {
    name: 'Dennis Konadu',
    role: 'Head of Logistics & Cold Chain',
    bio: 'Manages the storage facilities and delivery network that keep produce fresh, farm to doorstep.',
  },
]
