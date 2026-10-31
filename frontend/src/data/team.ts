export interface TeamMember {
  name: string
  role: string
  bio: string
  /** Optional headshot path, relative to /public. Falls back to an icon avatar. */
  photo?: string
  /** Optional zoom for wide-cropped shots so faces fill the avatar evenly. 1 = default. */
  photoZoom?: number
}

/**
 * Photos still pending for the remaining members — add `photo` once available.
 */
export const teamMembers: TeamMember[] = [
  {
    name: 'Hamilton Maison',
    role: 'Founder & Chief Executive Officer',
    bio: 'Leads the company vision and drives KeepXtra’s mission to build reliable food infrastructure for Africa.',
  },
  {
    name: 'Louis Afful',
    role: 'Head of Technology',
    bio: 'Builds the software and data systems that power inventory, routing, and quality tracking.',
    photo: '/team/louis.jpg',
    photoZoom: 1.55,
  },
  {
    name: 'Helena Yaa Kyei',
    role: 'Business Development',
    bio: 'Builds partnerships and market access that help farmers store, sell, and earn more from their produce.',
    photo: '/team/Helina.jpeg',
  },
  {
    name: 'Alice Kafui',
    role: 'Administration & Human Resources',
    bio: 'Coordinates daily operations and people processes so the team has an efficient, supportive workplace to do its best work.',
    photo: '/team/alice-square.jpg',
  },
]
