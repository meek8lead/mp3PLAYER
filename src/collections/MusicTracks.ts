import type { Access, CollectionConfig } from "payload"

const canUploadMusic: Access = ({ req }) =>
  req.user?.collection === "admins" ||
  req.context.musicUploadAuthorized === true

const isPayloadAdmin: Access = ({ req }) => req.user?.collection === "admins"

export const MusicTracks: CollectionConfig = {
  slug: "music-tracks",
  labels: {
    singular: "Music track",
    plural: "Music tracks",
  },
  access: {
    create: canUploadMusic,
    delete: isPayloadAdmin,
    read: () => true,
    update: isPayloadAdmin,
  },
  admin: {
    group: "Music player",
    useAsTitle: "title",
    defaultColumns: ["title", "artist", "filename", "createdAt"],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      maxLength: 120,
    },
    {
      name: "artist",
      type: "text",
      maxLength: 120,
    },
  ],
  upload: {
    mimeTypes: ["audio/mpeg", "audio/mp3"],
  },
}
