import { timingSafeEqual } from "crypto"
import config from "@payload-config"
import { getPayload } from "payload"

const MAX_FILE_SIZE = 25 * 1024 * 1024
const UPLOAD_PASSWORD = "pa55w0rd"

function passwordsMatch(candidate: string) {
  const actual = Buffer.from(UPLOAD_PASSWORD)
  const supplied = Buffer.from(candidate)

  return supplied.length === actual.length && timingSafeEqual(supplied, actual)
}

function cleanText(value: FormDataEntryValue | null, fallback: string) {
  if (typeof value !== "string") return fallback
  return value.trim().slice(0, 120) || fallback
}

export async function GET() {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: "music-tracks",
    depth: 0,
    limit: 100,
    overrideAccess: false,
    sort: "-createdAt",
    user: null,
  })

  const tracks = result.docs.map((track) => ({
    id: String(track.id),
    title: track.title,
    artist: track.artist || "НЕИЗВЕСТНЫЙ ИСПОЛНИТЕЛЬ",
    filename: track.filename,
    filesize: track.filesize,
    url: track.url,
  }))

  return Response.json({ tracks })
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const password = formData.get("password")

  if (typeof password !== "string" || !passwordsMatch(password)) {
    return Response.json({ error: "Неверный пароль. Доступ запрещён!" }, {
      status: 401,
    })
  }

  const upload = formData.get("file")
  if (!(upload instanceof File)) {
    return Response.json({ error: "Сначала выберите MP3-файл." }, {
      status: 400,
    })
  }
  if (!["audio/mpeg", "audio/mp3"].includes(upload.type)) {
    return Response.json({ error: "Разрешены только настоящие MP3-файлы." }, {
      status: 415,
    })
  }
  if (upload.size === 0 || upload.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "Размер файла должен быть от 1 байта до 25 МБ." },
      { status: 413 },
    )
  }

  const fallbackTitle =
    upload.name.replace(/\.mp3$/i, "").slice(0, 120) || "Без названия"
  const title = cleanText(formData.get("title"), fallbackTitle)
  const artist = cleanText(formData.get("artist"), "НЕИЗВЕСТНЫЙ ИСПОЛНИТЕЛЬ")
  const payload = await getPayload({ config })
  const data = Buffer.from(await upload.arrayBuffer())

  const track = await payload.create({
    collection: "music-tracks",
    context: { musicUploadAuthorized: true },
    data: { artist, title },
    file: {
      data,
      mimetype: upload.type,
      name: upload.name,
      size: upload.size,
    },
    overrideAccess: false,
    user: null,
  })

  return Response.json(
    {
      track: {
        id: String(track.id),
        title: track.title,
        artist: track.artist || "НЕИЗВЕСТНЫЙ ИСПОЛНИТЕЛЬ",
        filename: track.filename,
        filesize: track.filesize,
        url: track.url,
      },
    },
    { status: 201 },
  )
}
