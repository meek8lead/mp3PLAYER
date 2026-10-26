"use client"

import { FormEvent, useCallback, useEffect, useRef, useState } from "react"

type Track = {
  id: string
  title: string
  artist: string
  filename?: string | null
  filesize?: number | null
  url?: string | null
}

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00"
  const minutes = Math.floor(value / 60)
  return `${minutes}:${Math.floor(value % 60)
    .toString()
    .padStart(2, "0")}`
}

function Disc({ small = false }: { small?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={small ? "disc disc-small" : "disc"}
      viewBox="0 0 120 120"
    >
      <defs>
        <radialGradient
          id={small ? "discShineSmall" : "discShine"}
          cx="35%"
          cy="30%"
        >
          <stop offset="0" stopColor="#fff" />
          <stop offset=".25" stopColor="#00ffff" />
          <stop offset=".48" stopColor="#ff00ff" />
          <stop offset=".7" stopColor="#ffff00" />
          <stop offset="1" stopColor="#7060ff" />
        </radialGradient>
      </defs>
      <circle
        cx="60"
        cy="60"
        r="55"
        fill={`url(#${small ? "discShineSmall" : "discShine"})`}
        stroke="#000"
        strokeWidth="5"
      />
      <circle
        cx="60"
        cy="60"
        r="18"
        fill="#111"
        stroke="#fff"
        strokeWidth="4"
      />
      <circle cx="60" cy="60" r="7" fill="#e6e6e6" />
      <path
        d="M20 35 Q60 5 98 35M16 80 Q58 108 104 74"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        opacity=".8"
      />
    </svg>
  )
}

function Boombox() {
  return (
    <svg aria-hidden="true" className="boombox" viewBox="0 0 240 130">
      <path d="M63 30V13h112v17" fill="none" stroke="#111" strokeWidth="10" />
      <rect
        x="9"
        y="30"
        width="222"
        height="94"
        rx="7"
        fill="#bdbdbd"
        stroke="#111"
        strokeWidth="7"
      />
      <rect
        x="71"
        y="42"
        width="98"
        height="22"
        fill="#7dffcf"
        stroke="#111"
        strokeWidth="4"
      />
      <circle
        cx="52"
        cy="89"
        r="27"
        fill="#333"
        stroke="#111"
        strokeWidth="5"
      />
      <circle cx="52" cy="89" r="13" fill="#ff4bf3" />
      <circle
        cx="188"
        cy="89"
        r="27"
        fill="#333"
        stroke="#111"
        strokeWidth="5"
      />
      <circle cx="188" cy="89" r="13" fill="#00eaff" />
      <rect
        x="92"
        y="76"
        width="56"
        height="34"
        fill="#222"
        stroke="#111"
        strokeWidth="4"
      />
      <rect x="101" y="82" width="38" height="21" fill="#ffd500" />
      <circle cx="25" cy="45" r="4" fill="#f00" />
      <circle cx="39" cy="45" r="4" fill="#00f" />
    </svg>
  )
}

export default function RetroPlayer() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState("")
  const audioRef = useRef<HTMLAudioElement>(null)

  const currentIndex = tracks.findIndex((track) => track.id === currentId)
  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : tracks[0]

  const loadTracks = useCallback(async () => {
    try {
      const response = await fetch("/music-api/tracks", { cache: "no-store" })
      if (!response.ok) throw new Error()
      const data = (await response.json()) as { tracks: Track[] }
      setTracks(data.tracks)
      setCurrentId((id) => id ?? data.tracks[0]?.id ?? null)
      setLoadError("")
    } catch {
      setLoadError("ОШИБКА СОЕДИНЕНИЯ С МУЗЫКАЛЬНОЙ БАЗОЙ!!!")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTracks()
  }, [loadTracks])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack?.url) return
    audio.load()
    setElapsed(0)
    setDuration(0)
    if (playing) void audio.play().catch(() => setPlaying(false))
  }, [currentTrack?.id, currentTrack?.url])

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio || !currentTrack?.url) return
    if (audio.paused) {
      await audio.play()
      setPlaying(true)
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  const moveTrack = (direction: number) => {
    if (!tracks.length) return
    const index = currentIndex >= 0 ? currentIndex : 0
    const nextIndex = (index + direction + tracks.length) % tracks.length
    setCurrentId(tracks[nextIndex].id)
  }

  const chooseTrack = (track: Track) => {
    setCurrentId(track.id)
    setPlaying(true)
  }

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setUploading(true)
    setUploadMessage("ЗАГРУЖАЕМ В КИБЕРПРОСТРАНСТВО...")
    try {
      const response = await fetch("/music-api/tracks", {
        method: "POST",
        body: new FormData(event.currentTarget),
      })
      const data = (await response.json()) as {
        error?: string
        track?: Track
      }
      if (!response.ok || !data.track)
        throw new Error(data.error || "Неизвестная ошибка.")
      setUploadMessage("ГОТОВО! ТВОЙ ХИТ УЖЕ В ЭФИРЕ!!!")
      event.currentTarget.reset()
      await loadTracks()
      setCurrentId(data.track.id)
    } catch (error) {
      setUploadMessage(
        error instanceof Error ? error.message : "Загрузка не удалась.",
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="retro-page">
      <div className="cursor-star cursor-star-one">★</div>
      <div className="cursor-star cursor-star-two">♪</div>

      <div className="top-marquee" aria-label="Объявление">
        <div className="marquee-track">
          ★★★ ДОБРО ПОЖАЛОВАТЬ НА САМЫЙ КРУТОЙ MP3-ПОРТАЛ РУНЕТА!!! ★ НОВЫЕ ХИТЫ
          КАЖДЫЙ ДЕНЬ ★ КАЧАЙ МУЗОН — БУДЬ В ТЕМЕ ★★★
        </div>
      </div>

      <div className="site-shell">
        <header className="site-header">
          <Disc small />
          <div className="logo-wrap">
            <p className="pre-title">ЛИЧНАЯ СТРАНИЧКА DJ КОЛБАСЕРА</p>
            <h1>
              <span>МУЗ</span>ОТСТОЙ<span>.RU</span>
            </h1>
            <p className="tagline">Твоя музыка. Твои правила. Твой dial-up.</p>
          </div>
          <Boombox />
        </header>

        <nav className="retro-nav" aria-label="Главное меню">
          <button type="button">ГЛАВНАЯ</button>
          <button
            type="button"
            onClick={() =>
              document.getElementById("playlist")?.scrollIntoView()
            }
          >
            MP3 АРХИВ
          </button>
          <button type="button" onClick={() => setUploadOpen((open) => !open)}>
            ЗАЛИТЬ ХИТ
          </button>
          <button
            type="button"
            onClick={() => alert("ГОСТЕВАЯ КНИГА ВРЕМЕННО НА РЕМОНТЕ!")}
          >
            ГОСТЕВАЯ
          </button>
        </nav>

        <div className="content-grid">
          <aside className="sidebar">
            <section className="retro-box">
              <h2>★ МЕНЮ САЙТА ★</h2>
              <ul className="link-list">
                <li>→ Новинки MP3</li>
                <li>→ Хит-парад</li>
                <li>→ Мои друзья</li>
                <li>→ Приколы</li>
                <li>→ Обои 800×600</li>
              </ul>
            </section>
            <section className="retro-box counter-box">
              <h2>ВЫ ПОСЕТИТЕЛЬ №</h2>
              <div className="counter">00042069</div>
              <p>с 12.04.2004</p>
            </section>
            <div className="best-badge">
              <strong>BEST VIEWED</strong>
              <span>IN INTERNET</span>
              <b>EXPLORER 6</b>
              <small>800 × 600</small>
            </div>
            <div className="under-construction">
              <span>⚠</span>
              <b>
                САЙТ ВСЕГДА
                <br />
                НА РЕКОНСТРУКЦИИ
              </b>
              <span>⚠</span>
            </div>
          </aside>

          <section className="main-column">
            <div className="welcome-banner">
              <span>♪</span>
              <div>
                <h2>ПРИВЕТ, МЕЛОМАН!!!</h2>
                <p>Ты попал в мою персональную музыкальную вселенную!</p>
              </div>
              <span>♫</span>
            </div>

            <section className="player-panel" aria-label="Музыкальный плеер">
              <div className="player-titlebar">
                <span>WINAMP 2.666 — MУЗОТСТОЙ EDITION</span>
                <div>
                  <i /> <i /> <i />
                </div>
              </div>
              <div className="player-body">
                <div className={`disc-wrap ${playing ? "is-playing" : ""}`}>
                  <Disc />
                </div>
                <div className="player-screen">
                  <div className="equalizer" aria-hidden="true">
                    {Array.from({ length: 18 }, (_, index) => (
                      <i key={index} />
                    ))}
                  </div>
                  <p className="track-number">
                    {String(Math.max(currentIndex + 1, 1)).padStart(2, "0")}
                  </p>
                  <div className="track-info">
                    <strong>
                      {currentTrack?.title || "НЕТ ЗАГРУЖЕННЫХ ТРЕКОВ"}
                    </strong>
                    <span>{currentTrack?.artist || "НАЖМИ «ЗАЛИТЬ ХИТ»"}</span>
                  </div>
                  <p className="time-display">
                    {formatTime(elapsed)} / {formatTime(duration)}
                  </p>
                </div>
                <audio
                  ref={audioRef}
                  src={currentTrack?.url || undefined}
                  onEnded={() => moveTrack(1)}
                  onPause={() => setPlaying(false)}
                  onPlay={() => setPlaying(true)}
                  onTimeUpdate={(event) =>
                    setElapsed(event.currentTarget.currentTime)
                  }
                  onLoadedMetadata={(event) =>
                    setDuration(event.currentTarget.duration)
                  }
                />
                <div className="seek-row">
                  <span>SEEK</span>
                  <input
                    aria-label="Позиция воспроизведения"
                    max={duration || 0}
                    min="0"
                    type="range"
                    value={Math.min(elapsed, duration || 0)}
                    onChange={(event) => {
                      const nextTime = Number(event.target.value)
                      if (audioRef.current)
                        audioRef.current.currentTime = nextTime
                      setElapsed(nextTime)
                    }}
                  />
                </div>
                <div className="controls-row">
                  <div className="transport">
                    <button
                      aria-label="Предыдущий трек"
                      type="button"
                      onClick={() => moveTrack(-1)}
                    >
                      ◀◀
                    </button>
                    <button
                      className="play-button"
                      type="button"
                      onClick={() => void togglePlayback()}
                    >
                      {playing ? "❚❚" : "▶"}{" "}
                      <span>{playing ? "PAUSE" : "PLAY"}</span>
                    </button>
                    <button
                      aria-label="Следующий трек"
                      type="button"
                      onClick={() => moveTrack(1)}
                    >
                      ▶▶
                    </button>
                    <button
                      aria-label="Остановить"
                      type="button"
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.pause()
                          audioRef.current.currentTime = 0
                        }
                      }}
                    >
                      ■
                    </button>
                  </div>
                  <label className="volume-control">
                    VOL
                    <input
                      aria-label="Громкость"
                      max="1"
                      min="0"
                      step=".01"
                      type="range"
                      value={volume}
                      onChange={(event) =>
                        setVolume(Number(event.target.value))
                      }
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className={`upload-panel ${uploadOpen ? "open" : ""}`}>
              <button
                className="upload-toggle"
                type="button"
                onClick={() => setUploadOpen((open) => !open)}
              >
                <span>★</span> ЗАЛИТЬ СВОЙ MP3 НА САЙТ <span>★</span>
              </button>
              {uploadOpen && (
                <form onSubmit={handleUpload}>
                  <p>ТОЛЬКО ДЛЯ ИЗБРАННЫХ! ВВЕДИ СЕКРЕТНЫЙ ПАРОЛЬ:</p>
                  <div className="form-grid">
                    <label>
                      НАЗВАНИЕ
                      <input
                        name="title"
                        maxLength={120}
                        placeholder="Мой суперхит"
                      />
                    </label>
                    <label>
                      ИСПОЛНИТЕЛЬ
                      <input
                        name="artist"
                        maxLength={120}
                        placeholder="DJ Вася"
                      />
                    </label>
                    <label>
                      ПАРОЛЬ
                      <input
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                      />
                    </label>
                    <label>
                      MP3-ФАЙЛ
                      <input
                        name="file"
                        type="file"
                        accept=".mp3,audio/mpeg,audio/mp3"
                        required
                      />
                    </label>
                  </div>
                  <button
                    className="submit-upload"
                    disabled={uploading}
                    type="submit"
                  >
                    {uploading ? "ПОДОЖДИ..." : "ЗАЛИТЬ В ИНТЕРНЕТ!!!"}
                  </button>
                  {uploadMessage && (
                    <p className="upload-message" role="status">
                      {uploadMessage}
                    </p>
                  )}
                </form>
              )}
            </section>

            <section className="playlist-panel" id="playlist">
              <div className="section-heading">
                <span>♫</span> MP3 АРХИВ <span>♫</span>
              </div>
              {loading && (
                <p className="loading-text">СОЕДИНЯЕМСЯ ПО МОДЕМУ...</p>
              )}
              {loadError && <p className="error-text">{loadError}</p>}
              {!loading && !loadError && tracks.length === 0 && (
                <div className="empty-state">
                  <strong>АРХИВ ПОКА ПУСТ!</strong>
                  <p>Будь первым: нажми «ЗАЛИТЬ ХИТ» и добавь MP3.</p>
                </div>
              )}
              <div className="track-list">
                {tracks.map((track, index) => (
                  <button
                    className={
                      track.id === currentTrack?.id
                        ? "track-row active"
                        : "track-row"
                    }
                    key={track.id}
                    type="button"
                    onClick={() => chooseTrack(track)}
                  >
                    <span className="file-icon">MP3</span>
                    <span className="track-index">
                      {String(index + 1).padStart(2, "0")}.
                    </span>
                    <span className="track-copy">
                      <b>{track.title}</b>
                      <small>{track.artist}</small>
                    </span>
                    <span className="track-size">
                      {track.filesize
                        ? `${(track.filesize / 1024 / 1024).toFixed(1)} MB`
                        : "MP3"}
                    </span>
                    <span className="download-word">
                      {track.id === currentTrack?.id && playing
                        ? "ИГРАЕТ"
                        : "PLAY"}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </section>

          <aside className="sidebar right-sidebar">
            <section className="retro-box">
              <h2>СЕЙЧАС В ЭФИРЕ</h2>
              <div className="on-air">
                <span>ON AIR</span>
                <b>{currentTrack?.title || "ТИШИНА"}</b>
                <small>{currentTrack?.artist || "—"}</small>
              </div>
            </section>
            <section className="retro-box shoutbox">
              <h2>МИНИ-ЧАТ</h2>
              <p>
                <b>&lt;МаШкА&gt;</b> сайт супер!!!
              </p>
              <p>
                <b>&lt;xx_DJ_xx&gt;</b> залей транс
              </p>
              <p>
                <b>&lt;admin&gt;</b> ща будет
              </p>
              <input
                aria-label="Сообщение в мини-чате"
                placeholder="Ваше сообщение..."
              />
              <button
                type="button"
                onClick={() => alert("ЧАТ ОТКЛЮЧЁН ДО 2005 ГОДА")}
              >
                ОТПРАВИТЬ
              </button>
            </section>
            <section className="retro-box friends">
              <h2>ДРУЗЬЯ САЙТА</h2>
              <div>RAP-MP3.NAROD.RU</div>
              <div>★ BEST-WAREZ ★</div>
              <div>DJ_VOVAN HOME</div>
            </section>
            <div className="award">
              COOL
              <br />
              <b>SITE</b>
              <br />
              AWARD
              <br />
              <span>2004</span>
            </div>
          </aside>
        </div>

        <footer>
          <p>© 2004–2025 DJ КОЛБАСЕР. ВСЕ ПРАВА ЗАЩИЩЕНЫ МОИМ ПАПОЙ.</p>
          <p>Сделано в Блокноте • Хостинг NAROD.RU • ICQ: 420-069-666</p>
          <div className="footer-badges">
            <span>HTML 4.01</span>
            <span>NO SPAM!</span>
            <span>100% MP3</span>
          </div>
        </footer>
      </div>
    </main>
  )
}
