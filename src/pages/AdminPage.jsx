import { useState, useEffect } from 'react'
import { ref, get, remove, update } from 'firebase/database'
import { db } from '../firebase'

const ADMIN_PASSWORD = 'admin123'

const MODULO_INFO = {
  monitorhub: {
    label: 'MonitorHub',
    desc: 'Monitoramento de pendências fiscais',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  connecthub: {
    label: 'ConnectHub',
    desc: 'Comunicação com o cliente (DriveHub e Aplicativo)',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
  },
  xmlhub: {
    label: 'XMLHub',
    desc: 'Buscador de notas fiscais',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
  },
  taskhub: {
    label: 'TaskHub',
    desc: 'Gerenciamento de processos e tarefas',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.1)',
  },
}

function getProgress(formulario) {
  const modulos = formulario.modulos || []
  const status = formulario.statusTreinamentos || {}
  const realizados = modulos.filter((m) => status[m]?.status === 'realizado').length
  return { realizados, total: modulos.length }
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
  const [updatingMod, setUpdatingMod] = useState(null)
  const [filterStatus, setFilterStatus] = useState('todos') // todos | pendente | concluido

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
    if (!confirm('Tem certeza que deseja excluir este registro?')) return
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

  async function toggleTreinamento(formularioId, moduloId, currentStatus) {
    const novoStatus = currentStatus === 'realizado' ? 'pendente' : 'realizado'
    setUpdatingMod(moduloId)
    try {
      const updates = {
        [`formularios/${formularioId}/statusTreinamentos/${moduloId}/status`]: novoStatus,
        [`formularios/${formularioId}/statusTreinamentos/${moduloId}/atualizadoEm`]:
          novoStatus === 'realizado' ? Date.now() : null,
      }
      await update(ref(db), updates)

      setFormularios((prev) =>
        prev.map((f) => {
          if (f.id !== formularioId) return f
          const updated = {
            ...f,
            statusTreinamentos: {
              ...f.statusTreinamentos,
              [moduloId]: {
                status: novoStatus,
                atualizadoEm: novoStatus === 'realizado' ? Date.now() : null,
              },
            },
          }
          return updated
        })
      )

      setSelected((prev) => {
        if (!prev || prev.id !== formularioId) return prev
        return {
          ...prev,
          statusTreinamentos: {
            ...prev.statusTreinamentos,
            [moduloId]: {
              status: novoStatus,
              atualizadoEm: novoStatus === 'realizado' ? Date.now() : null,
            },
          },
        }
      })
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingMod(null)
    }
  }

  function formatDate(date) {
    if (!date) return '—'
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatDateShort(date) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const filtered = formularios.filter((f) => {
    const matchSearch =
      f.razaoSocial?.toLowerCase().includes(search.toLowerCase()) ||
      f.cnpjCpf?.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (filterStatus === 'todos') return true
    const { realizados, total } = getProgress(f)
    if (filterStatus === 'concluido') return realizados === total && total > 0
    if (filterStatus === 'pendente') return realizados < total
    return true
  })

  const statsTotal = formularios.length
  const totalConcluidos = formularios.filter((f) => {
    const { realizados, total } = getProgress(f)
    return realizados === total && total > 0
  }).length
  const totalPendentes = formularios.filter((f) => {
    const { realizados, total } = getProgress(f)
    return realizados < total
  }).length

  if (!authenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <img src="/hubstrom-logo.png" alt="Hubstrom" className="admin-login-logo-img" />
          <h2 className="admin-login-title">Painel Administrativo</h2>
          <p className="admin-login-subtitle">Gestão de treinamentos</p>
          <form onSubmit={handleLogin}>
            <div className="field-group">
              <label className="field-label">Senha de acesso</label>
              <input
                type="password"
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
              />
            </div>
            {authError && <p className="error-msg">{authError}</p>}
            <button type="submit" className="submit-btn">
              Entrar no painel
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
          <img src="/hubstrom-logo.png" alt="Hubstrom" className="admin-header-logo" />
          <div className="admin-header-divider" />
          <span className="admin-header-label">Gestão de Treinamentos</span>
        </div>
        <div className="admin-header-right">
          <div className="admin-stat-pill">
            <span className="admin-stat-dot admin-stat-dot--total" />
            <span>{statsTotal} solicitações</span>
          </div>
          <div className="admin-stat-pill">
            <span className="admin-stat-dot admin-stat-dot--ok" />
            <span>{totalConcluidos} concluídos</span>
          </div>
          <div className="admin-stat-pill">
            <span className="admin-stat-dot admin-stat-dot--pending" />
            <span>{totalPendentes} pendentes</span>
          </div>
          <button className="admin-refresh-btn" onClick={fetchFormularios} disabled={loading}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
          <button className="admin-logout-btn" onClick={() => setAuthenticated(false)}>
            Sair
          </button>
        </div>
      </header>

      <div className="admin-body">
        {/* Painel esquerdo — lista */}
        <div className="admin-list-panel">
          <div className="admin-list-toolbar">
            <div className="admin-search-wrapper">
              <svg className="admin-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                className="admin-search"
                placeholder="Buscar por razão social ou CNPJ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="admin-filter-tabs">
              {[
                { key: 'todos', label: 'Todos' },
                { key: 'pendente', label: 'Pendentes' },
                { key: 'concluido', label: 'Concluídos' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`admin-filter-tab${filterStatus === tab.key ? ' active' : ''}`}
                  onClick={() => setFilterStatus(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="admin-loading">
              <div className="admin-loading-spinner" />
              Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="admin-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: 8 }}>
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
              </svg>
              Nenhum registro encontrado.
            </div>
          ) : (
            <ul className="admin-list">
              {filtered.map((f) => {
                const { realizados, total } = getProgress(f)
                const pct = total > 0 ? Math.round((realizados / total) * 100) : 0
                const concluido = realizados === total && total > 0
                return (
                  <li
                    key={f.id}
                    className={`admin-list-item${selected?.id === f.id ? ' active' : ''}`}
                    onClick={() => setSelected(f)}
                  >
                    <div className="admin-item-top">
                      <span className="admin-item-razao">{f.razaoSocial}</span>
                      <span className={`admin-item-status-badge${concluido ? ' done' : ''}`}>
                        {concluido ? '✓ Concluído' : `${realizados}/${total}`}
                      </span>
                    </div>
                    <div className="admin-item-cnpj">{f.cnpjCpf}</div>
                    <div className="admin-item-progress-bar">
                      <div
                        className="admin-item-progress-fill"
                        style={{ width: `${pct}%`, background: concluido ? '#10b981' : '#3b82f6' }}
                      />
                    </div>
                    <div className="admin-item-footer">
                      <div className="admin-item-dots">
                        {(f.modulos || []).map((mod) => {
                          const st = f.statusTreinamentos?.[mod]?.status
                          return (
                            <span
                              key={mod}
                              className="admin-item-dot"
                              title={MODULO_INFO[mod]?.label}
                              style={{
                                background: st === 'realizado' ? MODULO_INFO[mod]?.color : 'rgba(255,255,255,0.1)',
                                border: `1px solid ${MODULO_INFO[mod]?.color}`,
                              }}
                            />
                          )
                        })}
                      </div>
                      <span className="admin-item-date">{formatDateShort(f.criadoEm)}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Painel direito — detalhe */}
        <div className="admin-detail-panel">
          {!selected ? (
            <div className="admin-detail-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2, marginBottom: 12 }}>
                <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
              <span>Selecione uma solicitação para gerenciar os treinamentos</span>
            </div>
          ) : (() => {
            const { realizados, total } = getProgress(selected)
            const pct = total > 0 ? Math.round((realizados / total) * 100) : 0
            const concluido = realizados === total && total > 0

            return (
              <div className="admin-detail">
                {/* Topo do detalhe */}
                <div className="admin-detail-topbar">
                  <div className="admin-detail-topbar-left">
                    <h2 className="admin-detail-razao">{selected.razaoSocial}</h2>
                    <span className="admin-detail-cnpj">{selected.cnpjCpf}</span>
                  </div>
                  <button
                    className="admin-delete-btn"
                    onClick={() => handleDelete(selected.id)}
                    disabled={deleting === selected.id}
                  >
                    {deleting === selected.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>

                {/* Cards de info */}
                <div className="admin-info-grid">
                  <div className="admin-info-card">
                    <span className="admin-info-label">Colaboradores</span>
                    <span className="admin-info-value">{selected.utilizadores}</span>
                  </div>
                  <div className="admin-info-card">
                    <span className="admin-info-label">Solicitado em</span>
                    <span className="admin-info-value">{formatDate(selected.criadoEm)}</span>
                  </div>
                  <div className="admin-info-card">
                    <span className="admin-info-label">Progresso</span>
                    <span className="admin-info-value" style={{ color: concluido ? '#10b981' : '#e8e8f0' }}>
                      {realizados} de {total} treinamentos
                    </span>
                  </div>
                </div>

                {/* Barra de progresso geral */}
                <div className="admin-progress-section">
                  <div className="admin-progress-header">
                    <span className="admin-progress-label">Progresso geral dos treinamentos</span>
                    <span className="admin-progress-pct" style={{ color: concluido ? '#10b981' : '#6b6b88' }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="admin-progress-track">
                    <div
                      className="admin-progress-fill"
                      style={{
                        width: `${pct}%`,
                        background: concluido
                          ? 'linear-gradient(90deg, #10b981, #059669)'
                          : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                      }}
                    />
                  </div>
                  {concluido && (
                    <div className="admin-progress-done-msg">
                      ✓ Todos os treinamentos foram realizados!
                    </div>
                  )}
                </div>

                {/* Treinamentos por módulo */}
                <div className="admin-treinamentos-section">
                  <h3 className="admin-section-title">Treinamentos por módulo</h3>
                  <div className="admin-treinamentos-list">
                    {(selected.modulos || []).map((mod, i) => {
                      const info = MODULO_INFO[mod]
                      const statusObj = selected.statusTreinamentos?.[mod]
                      const status = statusObj?.status || 'pendente'
                      const realizado = status === 'realizado'
                      const total = selected.modulos.length
                      const ordemLabel =
                        total === 1
                          ? 'Único módulo'
                          : i === 0
                          ? '1º — Maior interesse'
                          : i === total - 1
                          ? `${i + 1}º — Menor interesse`
                          : `${i + 1}º`

                      return (
                        <div
                          key={mod}
                          className={`admin-treinamento-card${realizado ? ' realizado' : ''}`}
                        >
                          <div className="admin-treinamento-left">
                            <div
                              className="admin-treinamento-icon"
                              style={{ background: info?.bg, border: `1px solid ${info?.color}30` }}
                            >
                              <span className="admin-treinamento-dot" style={{ background: info?.color }} />
                            </div>
                            <div className="admin-treinamento-info">
                              <div className="admin-treinamento-name">
                                <span style={{ color: info?.color, fontWeight: 700 }}>{info?.label}</span>
                                <span className="admin-treinamento-ordem" style={{ borderColor: `${info?.color}40`, color: info?.color }}>
                                  {ordemLabel}
                                </span>
                              </div>
                              <span className="admin-treinamento-desc">{info?.desc}</span>
                              {realizado && statusObj?.atualizadoEm && (
                                <span className="admin-treinamento-date">
                                  Realizado em {formatDate(statusObj.atualizadoEm)}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            className={`admin-treinamento-btn${realizado ? ' btn-desfazer' : ' btn-realizar'}`}
                            onClick={() => toggleTreinamento(selected.id, mod, status)}
                            disabled={updatingMod === mod}
                          >
                            {updatingMod === mod ? (
                              <span className="admin-btn-spinner" />
                            ) : realizado ? (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 6 9 17l-5-5"/>
                                </svg>
                                Realizado
                              </>
                            ) : (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"/>
                                  <path d="M12 8v4l3 3"/>
                                </svg>
                                Marcar como realizado
                              </>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
