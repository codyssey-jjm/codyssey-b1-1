export const isValidFormspreeEndpoint = (value) => {
  try {
    const endpoint = new URL(value);
    return (
      endpoint.protocol === "https:" &&
      endpoint.hostname === "formspree.io" &&
      /^\/f\/[a-z0-9]+$/i.test(endpoint.pathname)
    );
  } catch {
    return false;
  }
};

export const sendContactMessage = async (endpoint, formData) => {
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Formspree request failed: ${response.status}`);
  }
};
