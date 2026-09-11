import { FORM_FIELD_NAMES, validateField, validateForm } from "./validation.js";
import { isValidFormspreeEndpoint, sendContactMessage } from "../../services/formspree.js";

// 문의 폼의 입력·검증·전송 상태 관리
export const initContact = () => {
  const contactForm = document.querySelector("[data-contact-form]");
  const formResult = document.querySelector("[data-form-result]");
  const formSubmitButton = document.querySelector("[data-form-submit]");

  if (!contactForm) {
    return;
  }

  // 입력값과 검증 결과 및 전송 진행 상태
  const formState = {
    values: {
      name: "",
      email: "",
      message: "",
    },
    errors: {
      name: "",
      email: "",
      message: "",
    },
    touched: {
      name: false,
      email: false,
      message: false,
    },
    hasSubmitted: false,
    submissionStatus: "idle",
    submissionMessage: "",
  };

  // 필드 이름 기준 입력 요소와 오류 요소 연결
  const formFields = Object.fromEntries(
    FORM_FIELD_NAMES.map((name) => [name, contactForm?.elements.namedItem(name) ?? null]),
  );

  const formErrorElements = Object.fromEntries(
    FORM_FIELD_NAMES.map((name) => [
      name,
      contactForm?.querySelector(`[data-error-for="${name}"]`) ?? null,
    ]),
  );

  const getFieldValue = (name) => formFields[name]?.value.trim() ?? "";

  // 전송할 공백 제거 입력값 수집
  const collectFormValues = () =>
    Object.fromEntries(FORM_FIELD_NAMES.map((name) => [name, getFieldValue(name)]));

  // 필드 접근성 속성과 오류 문구 갱신
  const renderFieldError = (name) => {
    const field = formFields[name];
    const errorElement = formErrorElements[name];
    const errorMessage = formState.errors[name];
    const shouldShowError = formState.touched[name] || formState.hasSubmitted;
    const visibleError = shouldShowError ? errorMessage : "";

    if (!field || !errorElement) {
      return;
    }

    errorElement.textContent = visibleError;

    if (visibleError) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
  };

  const renderFormErrors = () => {
    FORM_FIELD_NAMES.forEach((name) => {
      renderFieldError(name);
    });
  };

  const FORM_RESULT_CLASSES = ["is-submitting", "is-success", "is-error"];

  // 전송 결과 문구와 상태 클래스 갱신
  const renderFormResult = () => {
    if (!formResult) {
      return;
    }

    FORM_RESULT_CLASSES.forEach((className) => {
      formResult.classList.remove(className);
    });

    const hasResult = formState.submissionStatus !== "idle";
    const statusClass = `is-${formState.submissionStatus}`;

    formResult.hidden = !hasResult;
    formResult.textContent = hasResult ? formState.submissionMessage : "";

    if (FORM_RESULT_CLASSES.includes(statusClass)) {
      formResult.classList.add(statusClass);
    }
  };

  // 중복 제출 방지와 버튼 문구 갱신
  const renderFormSubmitButton = () => {
    if (!formSubmitButton) {
      return;
    }

    const isSubmitting = formState.submissionStatus === "submitting";
    const buttonLabels = {
      idle: "메시지 보내기",
      submitting: "전송 중...",
      success: "메시지 보내기",
      error: "다시 보내기",
    };

    formSubmitButton.disabled = isSubmitting;
    formSubmitButton.setAttribute("aria-disabled", String(isSubmitting));
    formSubmitButton.textContent = buttonLabels[formState.submissionStatus] ?? "메시지 보내기";
    contactForm?.setAttribute("aria-busy", String(isSubmitting));
  };

  const renderFormSubmission = () => {
    renderFormResult();
    renderFormSubmitButton();
  };

  // 새 입력 시작 시 이전 성공·오류 상태 제거
  const clearSubmissionState = () => {
    if (
      formState.submissionStatus === "idle" ||
      formState.submissionStatus === "submitting"
    ) {
      return;
    }

    formState.submissionStatus = "idle";
    formState.submissionMessage = "";
    renderFormSubmission();
  };

  // 전송 성공 이후 입력값과 검증 상태 초기화
  const resetFormValidation = () => {
    contactForm?.reset();
    formState.values = Object.fromEntries(FORM_FIELD_NAMES.map((name) => [name, ""]));
    formState.errors = Object.fromEntries(FORM_FIELD_NAMES.map((name) => [name, ""]));
    formState.touched = Object.fromEntries(FORM_FIELD_NAMES.map((name) => [name, false]));
    formState.hasSubmitted = false;
    renderFormErrors();
  };

  // 검증된 입력값으로 FormData 구성 후 전송
  const submitContactForm = async () => {
    const formData = new FormData(contactForm);

    FORM_FIELD_NAMES.forEach((name) => {
      formData.set(name, formState.values[name]);
    });

    await sendContactMessage(contactForm.action, formData);
  };

  // 입력과 포커스 이탈 시점의 단계별 검증
  FORM_FIELD_NAMES.forEach((name) => {
    const field = formFields[name];

    if (!field) {
      return;
    }

    field.addEventListener("input", () => {
      formState.values[name] = getFieldValue(name);
      clearSubmissionState();

      if (formState.touched[name] || formState.hasSubmitted) {
        formState.errors[name] = validateField(name, formState.values[name]);
        renderFieldError(name);
      }
    });

    field.addEventListener("blur", () => {
      formState.touched[name] = true;
      formState.values[name] = getFieldValue(name);
      formState.errors[name] = validateField(name, formState.values[name]);
      renderFieldError(name);
    });
  });

  // 전체 검증 후 문의 전송 상태 처리
  contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (formState.submissionStatus === "submitting") {
      return;
    }

    formState.hasSubmitted = true;
    formState.values = collectFormValues();
    formState.errors = validateForm(formState.values);

    FORM_FIELD_NAMES.forEach((name) => {
      formState.touched[name] = true;
    });

    renderFormErrors();

    const firstInvalidFieldName = FORM_FIELD_NAMES.find((name) => formState.errors[name]);

    if (firstInvalidFieldName) {
      formState.submissionStatus = "idle";
      formState.submissionMessage = "";
      renderFormSubmission();
      formFields[firstInvalidFieldName]?.focus();
      return;
    }

    if (!isValidFormspreeEndpoint(contactForm.action)) {
      formState.submissionStatus = "error";
      formState.submissionMessage = "문의 폼의 전송 설정이 필요합니다.";
      renderFormSubmission();
      formResult?.focus();
      return;
    }

    formState.submissionStatus = "submitting";
    formState.submissionMessage = "메시지를 전송하고 있습니다.";
    renderFormSubmission();

    try {
      await submitContactForm();
      resetFormValidation();
      formState.submissionStatus = "success";
      formState.submissionMessage = "메시지가 전송되었습니다. 확인 후 연락드리겠습니다.";
    } catch {
      formState.submissionStatus = "error";
      formState.submissionMessage =
        "메시지를 전송하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    }

    renderFormSubmission();
    formResult?.focus();
  });
};
