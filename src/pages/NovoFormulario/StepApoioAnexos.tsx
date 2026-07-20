import type { FormularioAvaliacao } from '../../lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Textarea } from '../../components/ui/Field'
import { ImageUploader } from '../../components/ui/ImageUploader'
import { LocationPicker } from '../../components/ui/LocationPicker'
import { SignaturePad } from '../../components/ui/SignaturePad'

export function StepApoioAnexos({
  formulario,
  onPatch,
}: {
  formulario: FormularioAvaliacao
  onPatch: (patch: Partial<FormularioAvaliacao>) => void
}) {
  return (
    <div className="space-y-4">
      <Card className="animate-slide-up">
        <CardHeader>
          <div>
            <CardTitle>Apoio necessário</CardTitle>
            <CardDescription>Descreva detalhadamente o apoio necessário para execução da atividade.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formulario.descricaoApoio}
            onChange={(e) => onPatch({ descricaoApoio: e.target.value })}
            placeholder="Descreva detalhadamente o apoio necessário para execução da atividade."
            className="min-h-36"
          />
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Registro fotográfico</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader imagens={formulario.imagens} onChange={(imagens) => onPatch({ imagens })} />
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Localização</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationPicker value={formulario.localizacao} onChange={(localizacao) => onPatch({ localizacao: localizacao ?? undefined })} />
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Assinatura digital</CardTitle>
        </CardHeader>
        <CardContent>
          <SignaturePad value={formulario.assinaturaDataUrl} onChange={(assinaturaDataUrl) => onPatch({ assinaturaDataUrl: assinaturaDataUrl ?? undefined })} />
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formulario.observacoes}
            onChange={(e) => onPatch({ observacoes: e.target.value })}
            placeholder="Observações adicionais sobre a atividade"
          />
        </CardContent>
      </Card>
    </div>
  )
}
