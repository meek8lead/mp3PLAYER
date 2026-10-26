import path from "path"
import { mcpPlugin } from "@payloadcms/plugin-mcp"
import { en as adminLanguage } from "@payloadcms/translations/languages/en"
import { fileURLToPath } from "url"
import { Admins } from "./collections/Admins"
import { Media } from "./collections/Media"
import { Folders } from "./collections/Folders"
import { Tags } from "./collections/Tags"
import { Posts } from "./collections/Posts"
import { MusicTracks } from "./collections/MusicTracks"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildFigmaConfig({
  admin: {
    user: Admins.slug,
    constrainWidth: true,
    dashboard: {
      widgets: [],
      defaultLayout: [
        { widgetSlug: "activity", width: "full" },
        { widgetSlug: "collections", width: "full" },
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    fallbackLanguage: "en",
    supportedLanguages: { en: adminLanguage },
  },
  collections: [Admins, Media, Folders, Tags, Posts, MusicTracks],
  localization: {
    locales: [{ code: "en", label: "English" }],
    fallback: true,
    defaultLocale: "en",
  },
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  plugins: [mcpPlugin({})],
  //figma: {},
})
