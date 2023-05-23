async function fetchWithTimeout(url, options, timeout) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), timeout)
  );

  try {
    const response = await Promise.race([
      fetch(url, options),
      timeoutPromise,
    ]);
    return response;
  } catch (error) {
    handleFetchError(error);
  }
}

const fetchWithTimeout = async (url, options, timeout) => {
  const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
  );

  try {
      const response = await Promise.race([
          fetch(url, options),
          timeoutPromise,
      ]);
      return response;
  } catch (error) {
    return error;
  }
};