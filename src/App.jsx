import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Clock3,
  CloudOff,
  ImagePlus,
  LogOut,
  MapPin,
  MessageCircleHeart,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
import { hasSupabaseConfig, signedMediaUrl, supabase, usernameEmail } from './lib/supabase'

const CATEGORY_FALLBACKS = [
  { slug: 'comida', name: 'Comida', emoji: '🍜', color: '#f08c72' },
  { slug: 'actividad', name: 'Actividad', emoji: '✨', color: '#e7a93d' },
  { slug: 'juego', name: 'Juego', emoji: '🎮', color: '#8c7cf0' },
  { slug: 'pelicula', name: 'Película', emoji: '🎬', color: '#d978a9' },
  { slug: 'anime', name: 'Anime', emoji: '🌸', color: '#e88cab' },
  { slug: 'deportes', name: 'Deportes', emoji: '🏃', color: '#55ad96' },
  { slug: 'viajes', name: 'Viajes', emoji: '🧳', color: '#5d9ddd' },
  { slug: 'otro', name: 'Otro', emoji: '💌', color: '#b277c9' },
]

const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })
const longDateFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const shortDateFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const toIsoDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseIsoDate = (iso) => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)
const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1)
const clampText = (value, max = 100) => (value || '').trim().slice(0, max)
const initials = (name = '') => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'NT'

function Avatar({ profile, size = 'md', online = false }) {
  return (
    <span className={`avatar avatar-${size}`} style={{ '--avatar-color': profile?.avatar_color || '#f08c72' }}>
      {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.display_name || profile.username} /> : initials(profile?.display_name || profile?.username)}
      {online && <span className="online-dot" />}
    </span>
  )
}

function Logo({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <div className="brand-mark"><span>♡</span></div>
      {!compact && <div><strong>Nuestro</strong><span>Tiempo</span></div>}
    </div>
  )
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!username.trim() || !password) return setError('Escribe tu usuario y contraseña para entrar.')
    if (!hasSupabaseConfig || !supabase) return setError('Falta conectar Supabase. Revisa la configuración de la publicación.')
    setLoading(true)
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: usernameEmail(username), password })
    setLoading(false)
    if (authError) return setError('No pudimos iniciar sesión. Revisa tu usuario y contraseña.')
    onLogin(data.user)
  }

  return (
    <main className="login-page">
      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />
      <section className="login-card">
        <div className="login-intro">
          <Logo />
          <div className="eyebrow"><Sparkles size={14} /> Un rincón solo para ustedes</div>
          <h1>Lo bonito de un día<br /><em>es compartirlo.</em></h1>
          <p>Guarden comidas, películas, aventuras y esos pequeños momentos que merecen quedarse para siempre.</p>
          <div className="login-preview">
            <div className="preview-photo photo-one">🍓</div>
            <div className="preview-photo photo-two">🎬</div>
            <div className="preview-photo photo-three">🌿</div>
            <div className="preview-note"><MessageCircleHeart size={16} /><span>Una colección de<br /><strong>sus días favoritos</strong></span></div>
          </div>
        </div>
        <div className="login-form-side">
          <div className="form-heading"><span className="mini-heart">♡</span><div><span className="muted-label">Bienvenidos a</span><h2>Nuestro Tiempo</h2></div></div>
          <p className="form-subtitle">Inicia sesión para abrir su calendario compartido.</p>
          <form onSubmit={submit} className="auth-form">
            <label>Usuario<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Tu usuario" autoComplete="username" /></label>
            <label>Contraseña<input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tu contraseña" type="password" autoComplete="current-password" /></label>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-button full-button" disabled={loading}>{loading ? <><RefreshCw size={16} className="spin" /> Entrando...</> : <>Entrar a nuestro espacio <ArrowRight size={17} /></>}</button>
          </form>
          <p className="login-footnote"><span>Privado para ustedes dos</span><span>·</span><span>Hecho con cariño</span></p>
        </div>
      </section>
    </main>
  )
}

function CalendarGrid({ currentMonth, entries, presence, selectedDate, onSelectDate, currentUserId }) {
  const monthStart = startOfMonth(currentMonth)
  const offset = (monthStart.getDay() + 6) % 7
  const daysInMonth = endOfMonth(currentMonth).getDate()
  const cells = []
  for (let i = 0; i < offset; i += 1) cells.push({ empty: true, key: `before-${i}` })
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const iso = toIsoDate(date)
    cells.push({ date, iso, day })
  }
  while (cells.length % 7 !== 0) cells.push({ empty: true, key: `after-${cells.length}` })

  const entriesByDate = entries.reduce((acc, entry) => {
    acc[entry.entry_date] = [...(acc[entry.entry_date] || []), entry]
    return acc
  }, {})
  const presenceByDate = presence.reduce((acc, person) => {
    acc[person.calendar_date] = [...(acc[person.calendar_date] || []), person]
    return acc
  }, {})
  const today = toIsoDate(new Date())

  return (
    <div className="calendar-shell">
      <div className="weekday-row">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">
        {cells.map((cell) => {
          if (cell.empty) return <div className="day-cell empty-cell" key={cell.key} />
          const dayEntries = entriesByDate[cell.iso] || []
          const dayPresence = presenceByDate[cell.iso] || []
          const isSelected = cell.iso === selectedDate
          return (
            <button className={`day-cell ${isSelected ? 'selected-day' : ''} ${cell.iso === today ? 'today-cell' : ''}`} key={cell.iso} onClick={() => onSelectDate(cell.iso)}>
              <span className="day-number">{cell.day}</span>
              {dayPresence.length > 0 && <span className="presence-stack">{dayPresence.slice(0, 2).map((person) => <Avatar key={person.user_id} profile={person.profile} size="xs" online />)}</span>}
              <div className="day-content">
                {dayEntries.slice(0, 3).map((entry) => <span className="event-pill" style={{ '--event-color': entry.category?.color || '#b277c9' }} key={entry.id}><span>{entry.category?.emoji || '💌'}</span><b>{entry.title}</b></span>)}
                {dayEntries.length > 3 && <span className="more-events">+{dayEntries.length - 3} más</span>}
              </div>
              {dayEntries.some((entry) => entry.user_id === currentUserId) && <span className="my-day-mark"><Check size={10} /></span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DayDrawer({ selectedDate, entries, categories, onClose, onAdd, onDelete, currentUserId }) {
  const [activeEntry, setActiveEntry] = useState(null)
  const date = parseIsoDate(selectedDate)
  const dateEntries = entries.filter((entry) => entry.entry_date === selectedDate)
  return (
    <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="day-drawer">
        <div className="drawer-topline"><span className="eyebrow"><CalendarDays size={14} /> Día guardado</span><button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={18} /></button></div>
        <h2>{longDateFormatter.format(date)}</h2>
        <p className="drawer-subtitle">{dateEntries.length ? `${dateEntries.length} recuerdo${dateEntries.length === 1 ? '' : 's'} en este día` : 'Todavía no han guardado nada aquí'}</p>
        <div className="drawer-actions"><button className="primary-button" onClick={onAdd}><Plus size={16} /> Añadir recuerdo</button></div>
        <div className="entry-list">
          {dateEntries.map((entry) => (
            <article className="entry-card" key={entry.id} onClick={() => setActiveEntry(activeEntry?.id === entry.id ? null : entry)}>
              <div className="entry-card-header"><span className="category-dot" style={{ background: entry.category?.color }}>{entry.category?.emoji || '💌'}</span><div><span className="category-label" style={{ color: entry.category?.color }}>{entry.category?.name || 'Recuerdo'}</span><h3>{entry.title}</h3></div><ChevronDown size={17} className={activeEntry?.id === entry.id ? 'rotate-180' : ''} /></div>
              {(activeEntry?.id === entry.id || entry.photos?.length > 0) && <div className="entry-expanded">
                {entry.photos?.length > 0 && <div className="photo-strip">{entry.photos.map((photo) => <img key={photo.id} src={photo.url} alt={photo.caption || entry.title} />)}</div>}
                {activeEntry?.id === entry.id && <>
                  {entry.note && <p className="entry-note">“{entry.note}”</p>}
                  <div className="entry-meta">{entry.entry_time && <span><Clock3 size={13} /> {entry.entry_time}</span>}{entry.location && <span><MapPin size={13} /> {entry.location}</span>}<span><Avatar profile={entry.profile} size="xs" /> {entry.profile?.display_name || entry.profile?.username}</span></div>
                  {entry.user_id === currentUserId && <button className="delete-button" onClick={(event) => { event.stopPropagation(); onDelete(entry.id) }}><Trash2 size={13} /> Eliminar recuerdo</button>}
                </>}
              </div>}
            </article>
          ))}
          {dateEntries.length === 0 && <div className="empty-day"><div className="empty-illustration">♡</div><h3>Un día en blanco</h3><p>Agrega una foto, una nota o una actividad para comenzar este recuerdo.</p><button className="text-button" onClick={onAdd}>Crear el primer recuerdo <ArrowRight size={15} /></button></div>}
        </div>
        <div className="drawer-footer"><Sparkles size={15} /><span>Los pequeños momentos hacen la historia.</span></div>
      </aside>
    </div>
  )
}

function AddEntryModal({ selectedDate, categories, onClose, onSaved, userId }) {
  const [form, setForm] = useState({ title: '', category_id: categories[0]?.id || '', note: '', entry_time: '', location: '' })
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) return setError('Ponle un título a este recuerdo.')
    setSaving(true); setError('')
    const { data: entry, error: insertError } = await supabase.from('entries').insert({ ...form, title: clampText(form.title), note: clampText(form.note, 600), location: clampText(form.location, 120), entry_date: selectedDate, user_id: userId }).select('id').single()
    if (insertError) { setSaving(false); return setError('No pudimos guardar el recuerdo. Revisa que la base esté configurada.') }
    if (files.length) {
      const photoRows = []
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()
        const path = `${userId}/${entry.id}/${crypto.randomUUID()}-${safeName}`
        const { error: uploadError } = await supabase.storage.from('memory-photos').upload(path, file, { cacheControl: '3600', upsert: false })
        if (!uploadError) photoRows.push({ entry_id: entry.id, storage_path: path, caption: '' })
      }
      if (photoRows.length) await supabase.from('entry_photos').insert(photoRows)
    }
    setSaving(false); onSaved()
  }

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card entry-modal"><div className="modal-header"><div><span className="eyebrow"><Sparkles size={14} /> Nuevo recuerdo</span><h2>¿Qué hicieron este día?</h2><p>{longDateFormatter.format(parseIsoDate(selectedDate))}</p></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><form onSubmit={submit}>
    <label className="wide-label">Título del recuerdo<input autoFocus value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Ej. Sushi y una peli en casa" /></label>
    <div className="form-two-col"><label>Categoría<div className="select-wrap"><select value={form.category_id} onChange={(event) => update('category_id', event.target.value)}>{categories.map((category) => <option value={category.id} key={category.id}>{category.emoji}  {category.name}</option>)}</select><ChevronDown size={15} /></div></label><label>Hora <input type="time" value={form.entry_time} onChange={(event) => update('entry_time', event.target.value)} /></label></div>
    <label className="wide-label">Nota para el futuro<textarea value={form.note} onChange={(event) => update('note', event.target.value)} placeholder="¿Qué hizo especial este momento?" rows="3" /></label>
    <label className="wide-label">Lugar <input value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Ej. Nuestra casa, Quito..." /></label>
    <div className="upload-zone" onClick={() => fileRef.current?.click()}><input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(event) => setFiles(Array.from(event.target.files || []))} /><div className="upload-icon"><ImagePlus size={20} /></div><div><strong>{files.length ? `${files.length} foto${files.length > 1 ? 's' : ''} seleccionada${files.length > 1 ? 's' : ''}` : 'Añadan fotos de este momento'}</strong><span>{files.length ? files.map((file) => file.name).join(', ') : 'JPG, PNG o WEBP · varias fotos permitidas'}</span></div><Upload size={17} /></div>
    {error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? <><RefreshCw size={16} className="spin" /> Guardando...</> : <><Check size={16} /> Guardar recuerdo</>}</button></div>
  </form></section></div>
}

function ProfileModal({ profile, onClose, onUpdated }) {
  const [name, setName] = useState(profile?.display_name || '')
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)
  const save = async (event) => {
    event.preventDefault(); setSaving(true)
    let avatarPath = profile.avatar_path
    if (files[0]) {
      const file = files[0]
      avatarPath = `${profile.id}/avatar-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()}`
      const { error } = await supabase.storage.from('memory-photos').upload(avatarPath, file, { cacheControl: '3600', upsert: false })
      if (error) avatarPath = profile.avatar_path
    }
    const { data } = await supabase.from('profiles').update({ display_name: clampText(name, 60), avatar_path: avatarPath }).eq('id', profile.id).select('*').single()
    setSaving(false); if (data) onUpdated(data)
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card profile-modal"><div className="modal-header"><div><span className="eyebrow"><UserRound size={14} /> Tu perfil</span><h2>Un poquito de ustedes</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><form onSubmit={save}><div className="profile-preview"><Avatar profile={profile} size="xl" /><button type="button" className="avatar-change" onClick={() => fileRef.current?.click()}><Camera size={14} /> Cambiar foto</button><input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => setFiles(Array.from(event.target.files || []))} /></div><label className="wide-label">Nombre para mostrar<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Cómo quieres que te veamos" /></label><div className="profile-handle">@{profile.username}</div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button></div></form></section></div>
}

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [categories, setCategories] = useState([])
  const [entries, setEntries] = useState([])
  const [presence, setPresence] = useState([])
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(toIsoDate(new Date()))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    const withMedia = await Promise.all((data || []).map(async (item) => ({ ...item, avatar_url: await signedMediaUrl(item.avatar_path) })))
    setProfiles(withMedia)
    if (session?.user?.id) setProfile(withMedia.find((item) => item.id === session.user.id) || null)
  }, [session?.user?.id])

  const fetchEntries = useCallback(async () => {
    const from = toIsoDate(startOfMonth(currentMonth))
    const to = toIsoDate(endOfMonth(currentMonth))
    const { data } = await supabase.from('entries').select('*, category:categories(*), photos:entry_photos(*), profile:profiles(*)').gte('entry_date', from).lte('entry_date', to).order('entry_time', { ascending: true, nullsFirst: false })
    const hydrated = await Promise.all((data || []).map(async (entry) => ({ ...entry, photos: await Promise.all((entry.photos || []).map(async (photo) => ({ ...photo, url: await signedMediaUrl(photo.storage_path) }))) })))
    setEntries(hydrated)
  }, [currentMonth])

  const fetchPresence = useCallback(async () => {
    const { data } = await supabase.from('presence').select('*, profile:profiles(*)')
    const hydrated = await Promise.all((data || []).map(async (item) => ({ ...item, profile: { ...item.profile, avatar_url: await signedMediaUrl(item.profile?.avatar_path) } })))
    setPresence(hydrated)
  }, [])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user?.id) { setLoading(false); return }
    let mounted = true
    const load = async () => {
      setLoading(true)
      const { data: categoryData } = await supabase.from('categories').select('*').order('sort_order')
      if (mounted) setCategories(categoryData?.length ? categoryData : CATEGORY_FALLBACKS.map((item, index) => ({ ...item, id: item.slug, sort_order: index })))
      await Promise.all([fetchProfiles(), fetchEntries(), fetchPresence()])
      if (mounted) setLoading(false)
    }
    load()
    const channel = supabase.channel('nuestro-tiempo-live').on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, fetchEntries).on('postgres_changes', { event: '*', schema: 'public', table: 'entry_photos' }, fetchEntries).on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, fetchPresence).on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchProfiles).subscribe()
    return () => { mounted = false; supabase.removeChannel(channel) }
  }, [session?.user?.id, currentMonth, fetchEntries, fetchPresence, fetchProfiles])

  useEffect(() => {
    if (!session?.user?.id || !selectedDate) return
    supabase.from('presence').upsert({ user_id: session.user.id, calendar_date: selectedDate, updated_at: new Date().toISOString() }).then(() => fetchPresence())
  }, [selectedDate, session?.user?.id, fetchPresence])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const selectDate = (date) => { setSelectedDate(date); setDrawerOpen(true) }
  const moveMonth = (amount) => { const next = addMonths(currentMonth, amount); setCurrentMonth(next); setSelectedDate(toIsoDate(next)); }
  const goToday = () => { const today = new Date(); setCurrentMonth(startOfMonth(today)); setSelectedDate(toIsoDate(today)); }
  const signOut = async () => { await supabase.auth.signOut(); setSession(null); setProfile(null) }
  const deleteEntry = async (id) => { const { error } = await supabase.from('entries').delete().eq('id', id); if (!error) setToast('Recuerdo eliminado') }
  const afterSave = () => { setAddOpen(false); setToast('Recuerdo guardado en su historia'); fetchEntries() }
  const updateProfile = async (nextProfile) => { setProfile({ ...nextProfile, avatar_url: await signedMediaUrl(nextProfile.avatar_path) }); setProfileOpen(false); fetchProfiles(); setToast('Perfil actualizado') }

  const visibleEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return entries
    return entries.filter((entry) => [entry.title, entry.note, entry.location, entry.category?.name].some((field) => field?.toLowerCase().includes(query)))
  }, [entries, search])
  const selectedDayEntries = entries.filter((entry) => entry.entry_date === selectedDate)
  const monthMemories = entries.length
  const todayCount = entries.filter((entry) => entry.entry_date === toIsoDate(new Date())).length
  const partner = profiles.find((item) => item.id !== session?.user?.id)

  if (!session) return <LoginScreen onLogin={(user) => setSession({ user })} />
  return <div className="app-shell">
    <header className="app-header"><Logo compact /><div className="header-center"><span className="top-kicker">Nuestra historia</span><span className="live-indicator"><i /> Sincronizado en vivo</span></div><div className="header-actions"><div className="user-pair"><button className="avatar-button" onClick={() => setProfileOpen(true)}><Avatar profile={profile} size="sm" online /></button>{partner && <Avatar profile={partner} size="sm" online />}</div><div className="header-divider" /><button className="icon-button" onClick={() => setProfileOpen(true)} title="Editar perfil"><Settings2 size={18} /></button><button className="icon-button" onClick={signOut} title="Cerrar sesión"><LogOut size={18} /></button></div></header>
    <main className="main-content"><section className="welcome-row"><div><span className="eyebrow"><Sparkles size={14} /> Calendario compartido</span><h1>Hola, {profile?.display_name || profile?.username} <span>♡</span></h1><p>Un lugar para volver a todos sus días bonitos.</p></div><div className="quick-stats"><div><strong>{monthMemories}</strong><span>recuerdos este mes</span></div><div><strong>{todayCount}</strong><span>en el día de hoy</span></div></div></section>
      <section className="toolbar-card"><div className="month-navigation"><button className="icon-button light" onClick={() => moveMonth(-1)}><ArrowLeft size={17} /></button><button className="month-title" onClick={goToday}>{monthFormatter.format(currentMonth).replace(/^./, (letter) => letter.toUpperCase())}</button><button className="icon-button light" onClick={() => moveMonth(1)}><ArrowRight size={17} /></button><button className="today-button" onClick={goToday}>Hoy</button></div><div className="toolbar-tools"><div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar recuerdos..." /></div><button className="primary-button" onClick={() => { setSelectedDate(selectedDate || toIsoDate(new Date())); setDrawerOpen(true); setAddOpen(true) }}><Plus size={16} /> Nuevo recuerdo</button></div></section>
      <section className="legend-row"><div className="legend-title"><CalendarDays size={16} /> Categorías</div><div className="legend-items">{categories.map((category) => <span key={category.id}><i style={{ background: category.color }} />{category.name}</span>)}</div><div className="calendar-hint"><span><Avatar profile={profile} size="xs" /> Tú</span>{partner && <span><Avatar profile={partner} size="xs" /> {partner.display_name || partner.username}</span>}</div></section>
      {loading ? <div className="loading-state"><RefreshCw size={20} className="spin" /><span>Abriendo su historia...</span></div> : <CalendarGrid currentMonth={currentMonth} entries={visibleEntries} presence={presence} selectedDate={selectedDate} onSelectDate={selectDate} currentUserId={session.user.id} />}
      <section className="bottom-note"><div className="note-icon"><MessageCircleHeart size={19} /></div><div><strong>El tiempo que comparten merece un lugar.</strong><span>Agreguen una foto o una nota cada vez que quieran volver a este día.</span></div><button className="text-button" onClick={() => setAddOpen(true)}>Guardar un momento <ArrowRight size={15} /></button></section>
    </main>
    {drawerOpen && <DayDrawer selectedDate={selectedDate} entries={entries} categories={categories} onClose={() => { setDrawerOpen(false); setAddOpen(false) }} onAdd={() => setAddOpen(true)} onDelete={deleteEntry} currentUserId={session.user.id} />}
    {addOpen && <AddEntryModal selectedDate={selectedDate} categories={categories} onClose={() => setAddOpen(false)} onSaved={afterSave} userId={session.user.id} />}
    {profileOpen && <ProfileModal profile={profile} onClose={() => setProfileOpen(false)} onUpdated={updateProfile} />}
    {toast && <div className="toast"><Check size={15} /> {toast}</div>}
  </div>
}

export default App
