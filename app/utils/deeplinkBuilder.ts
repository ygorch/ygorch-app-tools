export interface DeeplinkComponents {
  scheme: string;
  host: string;
  params: { id: string; key: string; value: string }[];
}

export function parseUrlToComponents(url: string): DeeplinkComponents {
  // If empty
  if (!url || !url.trim()) {
    return { scheme: '', host: '', params: [] };
  }

  let scheme = '';
  let host = '';
  const params: { id: string; key: string; value: string }[] = [];

  try {
    // 1. Extract Scheme
    // Regex to find 'scheme://' or 'scheme:'
    const schemeMatch = url.match(/^([a-zA-Z0-9.+-]+):(\/\/)?/);

    let remainingUrl = url;

    if (schemeMatch) {
      scheme = schemeMatch[1];
      remainingUrl = url.slice(schemeMatch[0].length);
    }

    // 2. Extract Host/Path
    // Everything before the first '?'
    const questionMarkIndex = remainingUrl.indexOf('?');
    if (questionMarkIndex !== -1) {
      host = remainingUrl.slice(0, questionMarkIndex);
      const queryString = remainingUrl.slice(questionMarkIndex + 1);

      // 3. Extract Params
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((value, key) => {
        params.push({
          id: crypto.randomUUID(),
          key,
          value
        });
      });

    } else {
      host = remainingUrl;
    }

  } catch (err) {
    console.error("Error parsing URL components", err);
  }

  return { scheme, host, params };
}

export function buildUrlFromComponents(components: DeeplinkComponents): string {
  const { scheme, host, params } = components;

  if (!scheme && !host) return '';

  let builtUrl = '';

  if (scheme) {
    builtUrl += `${scheme}://`;
  }

  if (host) {
    builtUrl += host;
  }

  if (params && params.length > 0) {
    const validParams = params.filter(p => p.key.trim() !== '');
    if (validParams.length > 0) {
      const searchParams = new URLSearchParams();
      validParams.forEach(p => searchParams.append(p.key, p.value));
      builtUrl += `?${searchParams.toString()}`;
    }
  }

  return builtUrl;
}
