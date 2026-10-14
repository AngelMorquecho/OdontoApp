export async function ejecutarSupabase<T>(
  contexto: string,
  operacion: () => PromiseLike<{ data: T; error: { message: string } | null }>,
): Promise<T> {
  try {
    const { data, error } = await operacion();
    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    throw new Error(
      `${contexto}: ${error instanceof Error ? error.message : 'error desconocido.'}`,
    );
  }
}
