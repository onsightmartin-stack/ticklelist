/** Tiny psql helper shared by the Peakbagger import scripts. */
export const psql = async (sql: string): Promise<string> => {
  const proc = Bun.spawn(["psql", "-Atq", "-c", sql], { stdout: "pipe", stderr: "pipe" });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) throw new Error(err.trim() || `psql exited ${code}`);
  return out.trim();
};

/** Run a whole SQL file inside one transaction. */
export const psqlFile = async (path: string): Promise<string> => {
  const proc = Bun.spawn(["psql", "-Atq", "-v", "ON_ERROR_STOP=1", "--single-transaction", "-f", path], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) throw new Error(err.trim() || `psql exited ${code}`);
  return out.trim();
};

export const lit = (v: string) => `'${v.replace(/'/g, "''")}'`;
