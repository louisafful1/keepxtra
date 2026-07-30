import { servicesDetailed } from '@/data/servicesDetailed'
import { ServiceDetailRow } from '@/sections/services/ServiceDetailRow'

export function ServicesList() {
  return (
    <div>
      {servicesDetailed.map((service, index) => (
        <ServiceDetailRow key={service.id} service={service} index={index} />
      ))}
    </div>
  )
}
