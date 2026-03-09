import { useState } from 'react'
import { ref, push, serverTimestamp } from 'firebase/database'
import { db } from '../firebase'
import { useNavigate } from 'react-router-dom'

const MODULO_ICONS = {
  monitorhub: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M20.7134 4.90258C16.8371 1.02632 10.8317 0.589564 6.47498 3.59229L10.1547 7.272C12.4368 6.1801 15.2539 6.57319 17.1429 8.46218C19.5341 10.8534 19.5341 14.7406 17.1429 17.1319C14.7516 19.5231 10.8644 19.5231 8.47316 17.1319C6.58417 15.2429 6.19109 12.4258 7.28299 10.1437L3.60328 6.46399C0.60055 10.8207 1.03731 16.8261 4.91356 20.7024C8.78981 24.5786 16.3567 25.07 20.7243 20.7024C25.0919 16.3348 25.0919 9.25927 20.7243 4.89166H20.7134V4.90258Z" fill="#35CCA3"/>
      <path d="M6.47498 3.59235L2.88262 0L0 2.88262L3.59236 6.47498C3.97452 5.91811 4.41128 5.39399 4.90264 4.90263C5.39399 4.41128 5.91811 3.97452 6.47498 3.59235Z" fill="#35CCA3"/>
      <path d="M8.47309 17.1429C10.8644 19.5341 14.7515 19.5341 17.1428 17.1429C19.5341 14.7516 19.5341 10.8644 17.1428 8.47315C15.2538 6.58416 12.4367 6.19107 10.1546 7.28298L6.47491 3.60327C5.91804 3.98544 5.39392 4.4222 4.90257 4.91355C4.41121 5.40491 3.97445 5.92902 3.59229 6.48589L7.272 10.1656C6.18009 12.4477 6.57318 15.2648 8.46217 17.1538H8.47309V17.1429Z" fill="#1E293B"/>
    </svg>
  ),
  connecthub: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M10.3669 8H15.9897V2.36693C15.9897 1.05427 14.9251 0 13.6227 0H2.36692C1.0646 0 0 1.0646 0 2.36693V13.6227C0 14.9354 1.0646 15.9897 2.36692 15.9897H7.98966V10.3566C7.98966 9.04394 9.05426 7.98967 10.3566 7.98967L10.3669 8Z" fill="#35CCA3"/>
      <path d="M21.6227 8H15.9999V13.6331C15.9999 14.9457 14.9353 16 13.633 16H8.01025V21.6331C8.01025 22.9457 9.07485 24 10.3772 24H21.633C22.9353 24 23.9999 22.9354 23.9999 21.6331V10.3773C23.9999 9.0646 22.9353 8.01033 21.633 8.01033L21.6227 8Z" fill="#35CCA3"/>
      <path d="M15.9999 13.6331V8H10.3772C9.07485 8 8.01025 9.0646 8.01025 10.3669V16H13.633C14.9353 16 15.9999 14.9354 15.9999 13.6331Z" fill="#1E293B"/>
    </svg>
  ),
  xmlhub: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3.60166 12.0001C3.60166 7.36963 7.35845 3.61768 11.9949 3.61768V12.0001H3.59131H3.60166Z" fill="#35CCA3"/>
      <path d="M2.06986 12H3.60155C3.60155 16.6305 7.35834 20.3824 11.9948 20.3824C16.6313 20.3824 20.3881 16.6305 20.3881 12C20.3881 7.36952 16.6313 3.61757 11.9948 3.61757V2.06718C11.9948 0.930233 12.9159 0 14.0647 0H20.4502C22.4166 0 24 1.59173 24 3.55556V20.4445C24 22.4083 22.4062 24 20.4502 24H3.54981C1.58344 24 0 22.4083 0 20.4445V17.54V17.2713V14.0569C0 12.9199 0.921087 11.9897 2.06986 11.9897V12Z" fill="#35CCA3"/>
      <path d="M20.3881 12.0001C20.3881 16.6306 16.6313 20.3825 11.9948 20.3825C7.35836 20.3825 3.60156 16.6306 3.60156 12.0001H12.0052V3.61768C16.6417 3.61768 20.3985 7.36962 20.3985 12.0001H20.3881Z" fill="#1E293B"/>
    </svg>
  ),
  taskhub: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4.2931 6.37581C4.2931 6.2827 4.2931 6.19995 4.31379 6.11719H1.72758C0.77586 6.11719 0 6.89304 0 7.84477V17.1448C0 18.0965 0.77586 18.8724 1.72758 18.8724H4.31379C4.31379 18.7896 4.2931 18.6965 4.2931 18.6137V6.37581Z" fill="#35CCA3"/>
      <path d="M11.0793 4.85511C11.0793 4.59649 11.1207 4.33788 11.1828 4.0896H6.56898C5.40002 4.0896 4.43795 4.96891 4.30347 6.10684H6.12415C7.07588 6.10684 7.85174 6.8827 7.85174 7.83442V17.1344C7.85174 18.0861 7.07588 18.862 6.12415 18.862H4.30347C4.43795 19.9999 5.40002 20.8792 6.56898 20.8792H11.1828C11.1207 20.6413 11.0793 20.3827 11.0793 20.1137V4.84475V4.85511Z" fill="#35CCA3"/>
      <path d="M7.86218 17.1448V7.84477C7.86218 6.89304 7.08632 6.11719 6.13459 6.11719H4.3139C4.3139 6.19995 4.29321 6.29305 4.29321 6.37581V18.6137C4.29321 18.7068 4.29321 18.7896 4.3139 18.8724H6.13459C7.08632 18.8724 7.86218 18.0965 7.86218 17.1448Z" fill="#1E293B"/>
      <path d="M21.1553 2.01035H13.9242C12.6208 2.01035 11.5242 2.88968 11.1829 4.08968H12.3725C13.6346 4.08968 14.6484 5.11381 14.6484 6.36554V18.6035C14.6484 19.8655 13.6242 20.8793 12.3725 20.8793H11.1829C11.5139 22.0793 12.6104 22.9586 13.9242 22.9586H21.1553C22.7277 22.9586 24.0001 21.6862 24.0001 20.1138V4.84483C24.0001 3.27241 22.7277 2 21.1553 2V2.01035Z" fill="#35CCA3"/>
      <path d="M14.6483 18.6137V6.37572C14.6483 5.11365 13.6242 4.09985 12.3724 4.09985H11.1828C11.1207 4.33778 11.0793 4.59642 11.0793 4.86539V20.1343C11.0793 20.393 11.1207 20.6516 11.1828 20.8999H12.3724C13.6345 20.8999 14.6483 19.8757 14.6483 18.624V18.6137Z" fill="#1E293B"/>
    </svg>
  ),
}

const MODULOS = [
  {
    id: 'monitorhub',
    label: 'MonitorHub',
    desc: 'Monitoramento de pendências fiscais',
  },
  {
    id: 'connecthub',
    label: 'ConnectHub',
    desc: 'Comunicação com o cliente (DriveHub e Aplicativo)',
  },
  {
    id: 'xmlhub',
    label: 'XMLHub',
    desc: 'Buscador de notas fiscais',
  },
  {
    id: 'taskhub',
    label: 'TaskHub',
    desc: 'Gerenciamento de processos e tarefas',
  },
]

const UTILIZADORES_OPTIONS = [
  'Somente eu',
  '1 a 2 usuários',
  '3 a 5 usuários',
  '5+ usuários',
]

export default function FormPage() {
  const navigate = useNavigate()
  const [razaoSocial, setRazaoSocial] = useState('')
  const [cnpjCpf, setCnpjCpf] = useState('')
  const [utilizadores, setUtilizadores] = useState('')
  const [modulos, setModulos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function formatCnpjCpf(value) {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }

  function handleCnpjChange(e) {
    const formatted = formatCnpjCpf(e.target.value)
    setCnpjCpf(formatted)
  }

  function toggleModulo(id) {
    setModulos((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!razaoSocial.trim()) {
      setError('Por favor, informe a Razão Social.')
      return
    }
    if (!cnpjCpf.trim()) {
      setError('Por favor, informe o CNPJ do escritório.')
      return
    }
    if (!utilizadores) {
      setError('Por favor, selecione o número de usuários.')
      return
    }
    if (modulos.length === 0) {
      setError('Selecione ao menos um módulo de interesse.')
      return
    }

    setLoading(true)
    try {
      const newRef = await push(ref(db, 'formularios'), {
        razaoSocial,
        cnpjCpf,
        utilizadores,
        modulos,
        criadoEm: serverTimestamp(),
      })

      navigate('/sucesso', {
        state: {
          id: newRef.key,
          razaoSocial,
          cnpjCpf,
          utilizadores,
          modulos,
        },
      })
    } catch (err) {
      console.error(err)
      setError('Erro ao enviar o formulário. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-card">

        {/* Logo */}
        <div className="form-logo">
          <img src="/hubstrom-logo.png" alt="Hubstrom" className="form-logo-img" />
        </div>

        {/* Header */}
        <div className="form-header">
          <span className="form-tag">Solicitação de Treinamento</span>
          <h1 className="form-heading">Conheça o sistema na prática.</h1>
          <p className="form-subheading">
            Preencha os dados abaixo e nossa equipe entrará em contato para agendar seu treinamento baseado na sua urgência de aprendizado.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Razão Social - full width */}
          <div className="field-group">
            <input
              type="text"
              className="field-input"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              placeholder="Razão Social"
            />
          </div>

          {/* CNPJ + Utilizadores lado a lado */}
          <div className="field-group-row">
            <input
              type="text"
              className="field-input"
              value={cnpjCpf}
              onChange={handleCnpjChange}
              maxLength={18}
              placeholder="CNPJ do escritório"
            />
            <div className="select-wrapper">
              <select
                className={`field-select${!utilizadores ? ' placeholder-selected' : ''}`}
                value={utilizadores}
                onChange={(e) => setUtilizadores(e.target.value)}
              >
                <option value="" disabled hidden>Nº de Colaboradores</option>
                {UTILIZADORES_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <span className="select-arrow">▼</span>
            </div>
          </div>

          {/* Módulos */}
          <div className="field-group">
            <div className="modulos-header">
              <div className="modulos-label-row">
                <span className="field-label">Módulos de interesse</span>
                <div className="modulos-steps">
                  {[1,2,3,4].map((n, i) => (
                    <span key={n} style={{ display: 'contents' }}>
                      <span
                        className="modulos-step"
                        style={modulos.length >= n ? { background: '#1db97c', borderColor: '#1db97c', color: '#0a0a0f' } : {}}
                      >{n}</span>
                      {i < 3 && <span className="modulos-step-arrow">›</span>}
                    </span>
                  ))}
                </div>
              </div>
              <span className="modulos-hint">
                <span className="modulos-hint-icon"></span>
                Clique nos módulos na ordem que será realizado o treinamento
              </span>
            </div>
            <div className="modulos-grid">
              {MODULOS.map((mod) => {
                const ordem = modulos.indexOf(mod.id)
                const selecionado = ordem !== -1
                return (
                  <button
                    key={mod.id}
                    type="button"
                    className={`modulo-card${selecionado ? ' modulo-card--selecionado' : ''}`}
                    onClick={() => toggleModulo(mod.id)}
                  >
                    <span className="modulo-icon">{MODULO_ICONS[mod.id]}</span>
                    <span className="modulo-info">
                      <span className="modulo-label">{mod.label}</span>
                      <span className="modulo-desc">{mod.desc}</span>
                    </span>
                    {selecionado && (
                      <span className="modulo-ordem">{ordem + 1}º</span>
                    )}
                  </button>
                )
              })}
            </div>
            {modulos.length > 0 && (
              <p className="modulos-feedback">
                {modulos.length === 1
                  ? '1º selecionado — clique em mais módulos para definir a ordem'
                  : `${modulos.length} módulos ordenados por prioridade ✓`}
              </p>
            )}
          </div>

          {error && <p className="error-msg">{error}</p>}

          <p className="form-terms">
            Ao seguir aceito os{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>Termos de uso</a>
            {' '}&amp;{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>Privacidade LGPD</a>
          </p>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Enviando...' : 'Solicitar treinamento'}
          </button>
        </form>
      </div>

      <div className="form-footer">
        <span>Desenvolvido por</span>
        <span className="form-footer-logo">
          <img src="/hubstrom-logo.png" alt="Hubstrom" className="form-footer-img" />
        </span>
      </div>
    </div>
  )
}
