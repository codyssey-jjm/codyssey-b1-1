// 허용된 Formspree 전송 주소 형식 검증
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

// 문의 데이터를 Formspree로 전송하고 HTTP 오류 전달
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
