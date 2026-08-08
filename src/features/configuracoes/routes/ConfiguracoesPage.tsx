import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/shared/components/PageHeader'
import { ConfiguracoesGeralForm } from '../components/ConfiguracoesGeralForm'
import { AcessoAuditoriaTab } from '../components/AcessoAuditoriaTab'
import { ConfiguracaoCobrancaTab } from '../components/ConfiguracaoCobrancaTab'
import { ConfiguracaoEmailTab } from '../components/ConfiguracaoEmailTab'
import { ConfiguracaoEmpresaTab } from '../components/ConfiguracaoEmpresaTab'
import { AparenciaTab } from '../components/AparenciaTab'

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
          <TabsTrigger value="cobranca">Cobrança WhatsApp</TabsTrigger>
          <TabsTrigger value="email">Email (fallback)</TabsTrigger>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="aparencia">Aparência</TabsTrigger>
          <TabsTrigger value="acesso-auditoria">Acesso à Auditoria</TabsTrigger>
        </TabsList>
        <TabsContent value="geral">
          <ConfiguracoesGeralForm />
        </TabsContent>
        <TabsContent value="cobranca">
          <ConfiguracaoCobrancaTab />
        </TabsContent>
        <TabsContent value="email">
          <ConfiguracaoEmailTab />
        </TabsContent>
        <TabsContent value="empresa">
          <ConfiguracaoEmpresaTab />
        </TabsContent>
        <TabsContent value="aparencia">
          <AparenciaTab />
        </TabsContent>
        <TabsContent value="acesso-auditoria">
          <AcessoAuditoriaTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
