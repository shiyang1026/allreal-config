import type { ConfigFileInfo } from '../../types/dashboard'

export function resolveInitialConfigFileID(files: ConfigFileInfo[], requestedID: string) {
  if (files.length === 0) return requestedID
  return files.some((file) => file.id === requestedID) ? requestedID : files[0].id
}
