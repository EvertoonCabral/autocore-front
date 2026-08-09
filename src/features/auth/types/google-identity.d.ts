/**
 * Tipagem mínima do Google Identity Services (GIS) carregado via
 * `https://accounts.google.com/gsi/client`. Declaramos só o que usamos —
 * evita adicionar uma dependência npm só pelos tipos.
 */
export interface GoogleCredentialResponse {
  credential: string
  select_by?: string
}

export interface GoogleIdConfiguration {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
}

export interface GoogleButtonConfiguration {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'small' | 'medium' | 'large'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  width?: number
  logo_alignment?: 'left' | 'center'
}

export interface GoogleAccountsId {
  initialize: (config: GoogleIdConfiguration) => void
  renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void
  prompt: () => void
  cancel: () => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId
      }
    }
  }
}
