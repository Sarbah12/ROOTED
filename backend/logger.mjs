const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function formatMeta(meta) {
  if (meta == null) {
    return '';
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ` ${String(meta)}`;
  }
}

export function createLogger(level = 'info') {
  const threshold = LEVELS[level] ?? LEVELS.info;

  const write = (severity, message, meta) => {
    if ((LEVELS[severity] ?? LEVELS.info) < threshold) {
      return;
    }

    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${severity.toUpperCase()} ${message}${formatMeta(meta)}`;

    if (severity === 'error') {
      console.error(line);
      return;
    }

    if (severity === 'warn') {
      console.warn(line);
      return;
    }

    console.log(line);
  };

  return {
    debug: (message, meta) => write('debug', message, meta),
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
  };
}

