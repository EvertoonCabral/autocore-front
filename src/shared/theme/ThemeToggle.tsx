import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTema, type Tema } from './ThemeContext'

/**
 * Toggle de tema no header. Mostra o ícone do tema atualmente resolvido
 * (Sun no claro, Moon no escuro) — ao clicar, abre dropdown com 3 opções:
 * Claro, Escuro, Sistema.
 */
export function ThemeToggle() {
  const { tema, resolvido, setTema } = useTema()

  const Icone = resolvido === 'dark' ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Tema (atual: ${labelTema(tema)})`}
        >
          <Icone className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <ItemTema atual={tema} valor="light" onSelect={setTema} icon={Sun} label="Claro" />
        <ItemTema atual={tema} valor="dark" onSelect={setTema} icon={Moon} label="Escuro" />
        <ItemTema atual={tema} valor="system" onSelect={setTema} icon={Monitor} label="Sistema" />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface ItemTemaProps {
  atual: Tema
  valor: Tema
  onSelect: (v: Tema) => void
  icon: typeof Sun
  label: string
}

function ItemTema({ atual, valor, onSelect, icon: Icon, label }: ItemTemaProps) {
  const ativo = atual === valor
  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault()
        onSelect(valor)
      }}
      className={ativo ? 'font-medium text-foreground' : ''}
      aria-checked={ativo}
      role="menuitemradio"
    >
      <Icon className="h-4 w-4" />
      {label}
    </DropdownMenuItem>
  )
}

function labelTema(t: Tema): string {
  return t === 'light' ? 'Claro' : t === 'dark' ? 'Escuro' : 'Sistema'
}
