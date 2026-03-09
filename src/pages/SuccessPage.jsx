import { useLocation, useNavigate } from 'react-router-dom'

const MODULO_LABELS = {
  monitorhub: 'Monitoramento de pendências fiscais (MonitorHub)',
  connecthub: 'Comunicação com o cliente (ConnectHub, DriveHub e Aplicativo)',
  xmlhub: 'Buscador de notas fiscais (XMLHub)',
  taskhub: 'Gerenciamento de processos e tarefas (TaskHub)',
}

export default function SuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const data = location.state

  if (!data) {
    return (
      <div className="success-page">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h2 className="success-title">Nenhum dado encontrado.</h2>
          <button className="submit-btn" onClick={() => navigate('/')}>
            Voltar ao formulário
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-icon">✓</div>
        <h2 className="success-title">Formulário enviado com sucesso!</h2>
        <p className="success-subtitle">
          Obrigado! Recebemos suas informações e entraremos em contato em breve.
        </p>

        <div className="success-data">
          <h3 className="success-data-title">Dados enviados</h3>

          <div className="success-row">
            <span className="success-row-label">Razão Social</span>
            <span className="success-row-value">{data.razaoSocial}</span>
          </div>

          <div className="success-row">
            <span className="success-row-label">CNPJ/CPF</span>
            <span className="success-row-value">{data.cnpjCpf}</span>
          </div>

          <div className="success-row">
            <span className="success-row-label">Utilizadores da ferramenta</span>
            <span className="success-row-value">{data.utilizadores}</span>
          </div>

          <div className="success-row">
            <span className="success-row-label">Módulos prioritários</span>
            <div className="success-modulos">
              {data.modulos.map((mod) => (
                <span key={mod} className="success-badge">
                  {MODULO_LABELS[mod]}
                </span>
              ))}
            </div>
          </div>

          {data.id && (
            <div className="success-row">
              <span className="success-row-label">ID do envio</span>
              <span className="success-row-value success-id">{data.id}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
