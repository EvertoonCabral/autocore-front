import { useState } from 'react'
import { PageHeader } from '@/shared/components/PageHeader'
import { AgendaToolbar, type ModoAgenda } from '../components/AgendaToolbar'
import { SemanaCalendario } from '../components/SemanaCalendario'
import { MesCalendario } from '../components/MesCalendario'

export function AgendaPage() {
  const [referencia, setReferencia] = useState(() => new Date())
  const [modo, setModo] = useState<ModoAgenda>('mes')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Ordens de serviço agendadas — visão semanal ou mensal, com consulta a datas passadas e futuras."
      />
      <AgendaToolbar
        modo={modo}
        referencia={referencia}
        onModoChange={setModo}
        onReferenciaChange={setReferencia}
      />
      {modo === 'semana' ? (
        <SemanaCalendario referencia={referencia} />
      ) : (
        <MesCalendario referencia={referencia} />
      )}
    </div>
  )
}
