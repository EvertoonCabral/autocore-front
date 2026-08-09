import { toast } from 'sonner'
import { useGoogleIdentityServices } from '../hooks/useGoogleIdentityServices'
import { useLoginGoogle } from '../hooks/useLoginGoogle'

interface GoogleLoginButtonProps {
  clientId: string
  onSuccess: () => void
}

/**
 * Botão "Entrar com Google". Isola o acoplamento ao GIS no
 * `useGoogleIdentityServices` — este componente só liga o id_token recebido
 * ao `useLoginGoogle` e reusa o mesmo `onSuccess` do login por senha.
 *
 * O container abaixo é onde o GIS injeta o botão oficial do Google. Em
 * jsdom/testes o GIS não carrega, então o container fica vazio (sem erro).
 */
export function GoogleLoginButton({ clientId, onSuccess }: GoogleLoginButtonProps) {
  const login = useLoginGoogle()

  const { containerRef } = useGoogleIdentityServices({
    clientId,
    onCredential: (idToken) => {
      login.mutate(
        { idToken },
        {
          onSuccess,
          onError: (err) => {
            toast.error(err.message || 'Não foi possível entrar com o Google.')
          },
        },
      )
    },
  })

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">ou</span>
        </div>
      </div>

      <div
        ref={containerRef}
        data-testid="google-login-button"
        aria-label="Entrar com Google"
        className="flex min-h-[40px] justify-center"
      />
    </div>
  )
}
