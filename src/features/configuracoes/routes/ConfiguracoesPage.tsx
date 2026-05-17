import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/shared/components/PageHeader'
import { ConfiguracoesGeralForm } from '../components/ConfiguracoesGeralForm'
import { AcessoAuditoriaTab } from '../components/AcessoAuditoriaTab'

export function ConfiguracoesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Configurações"
        description="Parâmetros do sistema que podem ser ajustados sem deploy. Restrito ao Admin."
      />

      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="acesso-auditoria">Acesso à Auditoria</TabsTrigger>
        </TabsList>
        <TabsContent value="geral">
          <ConfiguracoesGeralForm />
        </TabsContent>
        <TabsContent value="acesso-auditoria">
          <AcessoAuditoriaTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
