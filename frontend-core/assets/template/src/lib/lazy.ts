/** Loads a file again when the network drops it once. Use inside React.lazy. */
export async function retryImport<T>(load: () => Promise<T>, wait = 500): Promise<T> {
  try {
    return await load();
  } catch {
    await new Promise((done) => setTimeout(done, wait));
    return load();
  }
}

/** True when a part of the app could not be downloaded (offline, or a new release removed it). */
export function isChunkError(error: unknown) {
  return (
    error instanceof Error &&
    /dynamically imported module|importing a module script failed|unable to preload css/i.test(error.message)
  );
}
