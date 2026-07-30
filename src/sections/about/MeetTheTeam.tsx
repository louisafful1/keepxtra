import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { teamMembers } from '@/data/team'
import { staggerContainer, fadeUp, viewportOnce } from '@/animation/variants'

export function MeetTheTeam() {
  return (
    <section className="bg-white py-24">
      <Container>
        <SectionHeading
          eyebrow="Leadership"
          title="Meet the team."
          description="The people building KeepXtra's infrastructure, day in and day out."
          align="center"
        />

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {teamMembers.map((member) => (
            <motion.div key={member.name} variants={fadeUp}>
              <Card className="flex h-full flex-col items-center gap-4 text-center">
                <span className="flex size-20 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                  <User className="size-9" strokeWidth={1.5} />
                </span>
                <div>
                  <h3 className="font-display text-base font-medium text-neutral-900">{member.name}</h3>
                  <p className="mt-0.5 text-sm font-medium text-primary-600">{member.role}</p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">{member.bio}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
