import { PageHeader } from '@/shared/components/PageHeader'
import { SemanaCalendario } from '../components/SemanaCalendario'

export function AgendaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Ordens de serviço agendadas, organizadas por semana."
      />
      <SemanaCalendario />
    </div>
  )
}
