import { useState, useEffect } from 'react'
import { ref, get, remove } from 'firebase/database'
import { db } from '../firebase'

const ADMIN_PASSWORD = 'admin123'

const MODULO_LABELS = {
  monitorhub: 'MonitorHub',
  connecthub: 'ConnectHub',
  xmlhub: 'XMLHub',
  taskhub: 'TaskHub',
}

const MODULO_COLORS = {
  monitorhub: '#f59e0b',
  connecthub: '#3b82f6',
  xmlhub: '#10b981',
  taskhub: '#a855f7',
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const [formularios, setFormularios] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)

  function handleLogin(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      setAuthError('')
    } else {
      setAuthError('Senha incorreta.')
    }
  }

  async function fetchFormularios() {
    setLoading(true)
    try {
      const snap = await get(ref(db, 'formularios'))
      const data = []
      snap.forEach((child) => {
        const val = child.val()
        data.push({
          id: child.key,
          ...val,
          criadoEm: val.criadoEm ? new Date(val.criadoEm) : null,
        })
      })
      data.sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0))
      setFormularios(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authenticated) fetchFormularios()
  }, [authenticated])

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir este formulário?')) return
    setDeleting(id)
    try {
      await remove(ref(db, `formularios/${id}`))
      setFormularios((prev) => prev.filter((f) => f.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  function formatDate(date) {
    if (!date) return '—'
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filtered = formularios.filter((f) =>
    f.cnpjCpf?.toLowerCase().includes(search.toLowerCase())
  )

  if (!authenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <div className="admin-login-logo">⬡</div>
          <h2 className="admin-login-title">Painel Administrativo</h2>
          <form onSubmit={handleLogin}>
            <div className="field-group">
              <label className="field-label">Senha de acesso</label>
              <input
                type="password"
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                autoFocus
              />
            </div>
            {authError && <p className="error-msg">{authError}</p>}
            <button type="submit" className="submit-btn">
              Entrar
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <span className="admin-logo">⬡</span>
          <h1 className="admin-title">Painel Administrativo</h1>
        </div>
        <div className="admin-header-right">
          <span className="admin-count">{formularios.length} formulários</span>
          <button className="admin-refresh-btn" onClick={fetchFormularios} disabled={loading}>
            {loading ? '↻ Atualizando...' : '↻ Atualizar'}
          </button>
          <button className="admin-logout-btn" onClick={() => setAuthenticated(false)}>
            Sair
          </button>
        </div>
      </header>

      <div className="admin-body">
        {/* Lista */}
        <div className="admin-list-panel">
          <div className="admin-search-wrapper">
            <input
              type="text"
              className="admin-search"
              placeholder="Buscar por CNPJ/CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="admin-loading">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="admin-empty">Nenhum formulário encontrado.</div>
          ) : (
            <ul className="admin-list">
              {filtered.map((f) => (
                <li
                  key={f.id}
                  className={`admin-list-item ${selected?.id === f.id ? 'active' : ''}`}
                  onClick={() => setSelected(f)}
                >
                  <div className="admin-item-razao">{f.razaoSocial}</div>
                  <div className="admin-item-cnpj">{f.cnpjCpf}</div>
                  <div className="admin-item-meta">
                    <span className="admin-item-users">{f.utilizadores}</span>
                    <span className="admin-item-date">{formatDate(f.criadoEm)}</span>
                  </div>
                  <div className="admin-item-badges">
                    {(f.modulos || []).map((mod, i) => (
                      <span
                        key={mod}
                        className="admin-badge"
                        style={{ borderColor: MODULO_COLORS[mod], color: MODULO_COLORS[mod] }}
                      >
                        {i + 1}º {MODULO_LABELS[mod]}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detalhe */}
        <div className="admin-detail-panel">
          {!selected ? (
            <div className="admin-detail-empty">
              <span>← Selecione um formulário para ver os detalhes</span>
            </div>
          ) : (
            <div className="admin-detail">
              <div className="admin-detail-header">
                <h2 className="admin-detail-title">Detalhes do Formulário</h2>
                <button
                  className="admin-delete-btn"
                  onClick={() => handleDelete(selected.id)}
                  disabled={deleting === selected.id}
                >
                  {deleting === selected.id ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>

              <div className="admin-detail-body">
                <div className="detail-row">
                  <span className="detail-label">ID</span>
                  <span className="detail-value detail-id">{selected.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Razão Social</span>
                  <span className="detail-value">{selected.razaoSocial}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">CNPJ/CPF</span>
                  <span className="detail-value">{selected.cnpjCpf}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Utilizadores da ferramenta</span>
                  <span className="detail-value">{selected.utilizadores}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Data de envio</span>
                  <span className="detail-value">{formatDate(selected.criadoEm)}</span>
                </div>
                <div className="detail-row detail-row-vertical">
                  <span className="detail-label">Módulos por prioridade de interesse</span>
                  <div className="detail-modulos">
                    {(selected.modulos || []).map((mod, i) => {
                      const total = selected.modulos.length
                      const ordemLabel =
                        total === 1
                          ? 'Único selecionado'
                          : i === 0
                          ? '1º — Maior interesse'
                          : i === total - 1
                          ? `${i + 1}º — Menor interesse`
                          : `${i + 1}º`
                      return (
                        <div key={mod} className="detail-modulo-item">
                          <span
                            className="detail-modulo-dot"
                            style={{ background: MODULO_COLORS[mod] }}
                          />
                          <div className="detail-modulo-info">
                            <span className="detail-modulo-text">
                              {mod === 'monitorhub' && 'Monitoramento de pendências fiscais (MonitorHub)'}
                              {mod === 'connecthub' && 'Comunicação com o cliente (ConnectHub, DriveHub e Aplicativo)'}
                              {mod === 'xmlhub' && 'Buscador de notas fiscais (XMLHub)'}
                              {mod === 'taskhub' && 'Gerenciamento de processos e tarefas (TaskHub)'}
                            </span>
                            <span className="detail-modulo-ordem" style={{ color: MODULO_COLORS[mod] }}>
                              {ordemLabel}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
