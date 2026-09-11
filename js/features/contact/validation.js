export const FORM_FIELD_NAMES = ["name", "email", "message"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateField = (name, value) => {
  if (!value) {
    const requiredMessages = {
      name: "이름을 입력해 주세요.",
      email: "이메일을 입력해 주세요.",
      message: "메시지를 입력해 주세요.",
    };

    return requiredMessages[name] ?? "필수 입력값을 입력해 주세요.";
  }

  if (name === "email" && !EMAIL_PATTERN.test(value)) {
    return "올바른 이메일 형식으로 입력해 주세요.";
  }

  return "";
};

export const validateForm = (values) =>
  Object.fromEntries(FORM_FIELD_NAMES.map((name) => [name, validateField(name, values[name])]));
