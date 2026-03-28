import { File, Directory, Paths } from 'expo-file-system';

const CUSTOM_SOUND_DIR_NAME = 'custom-sounds';

function getCustomSoundDir(): Directory {
  return new Directory(Paths.document, CUSTOM_SOUND_DIR_NAME);
}

export interface PickResult {
  uri: string;
  name: string;
}

export async function pickAudioFile(): Promise<PickResult | null> {
  let result: File | File[] | null;
  try {
    result = await File.pickFileAsync(undefined, 'public.audio');
  } catch {
    // User cancelled the picker
    return null;
  }
  if (!result) return null;

  const pickedFile = Array.isArray(result) ? result[0] : result;
  if (!pickedFile) return null;

  const originalName = pickedFile.name ?? 'Custom Sound';

  const dir = getCustomSoundDir();
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }

  cleanupOldCustomSound();

  const destFile = new File(dir, `custom-alarm${pickedFile.extension || '.audio'}`);
  pickedFile.copy(destFile);

  return { uri: destFile.uri, name: originalName };
}

export function cleanupOldCustomSound(): void {
  try {
    const dir = getCustomSoundDir();
    if (!dir.exists) return;
    const items = dir.list();
    for (const item of items) {
      item.delete();
    }
  } catch {}
}

export function deleteCustomSound(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {}
}
