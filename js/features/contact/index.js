import { FORM_FIELD_NAMES, validateField, validateForm } from "./validation.js";
import { isValidFormspreeEndpoint, sendContactMessage } from "../../services/formspree.js";

export const initContact = () => {
  const contactForm = document.querySelector("[data-contact-form]");
  const formResult = document.querySelector("[data-form-result]");
  const formSubmitButton = document.querySelector("[data-form-submit]");

  if (!contactForm) {
    return;
  }

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

  const collectFormValues = () =>
    Object.fromEntries(FORM_FIELD_NAMES.map((name) => [name, getFieldValue(name)]));

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

  const resetFormValidation = () => {
    contactForm?.reset();
    formState.values = Object.fromEntries(FORM_FIELD_NAMES.map((name) => [name, ""]));
    formState.errors = Object.fromEntries(FORM_FIELD_NAMES.map((name) => [name, ""]));
    formState.touched = Object.fromEntries(FORM_FIELD_NAMES.map((name) => [name, false]));
    formState.hasSubmitted = false;
    renderFormErrors();
  };

  const submitContactForm = async () => {
    const formData = new FormData(contactForm);

    FORM_FIELD_NAMES.forEach((name) => {
      formData.set(name, formState.values[name]);
    });

    await sendContactMessage(contactForm.action, formData);
  };

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
