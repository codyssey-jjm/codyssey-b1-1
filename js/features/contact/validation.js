// 문의 폼 검증 대상 필드와 이메일 형식
export const FORM_FIELD_NAMES = ["name", "email", "message"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 필드별 필수값과 이메일 형식 검증
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

// 전체 필드 오류 객체 생성
export const validateForm = (values) =>
  Object.fromEntries(FORM_FIELD_NAMES.map((name) => [name, validateField(name, values[name])]));
