const TYPING_INTERVAL = 55;
const TYPING_START_DELAY = 450;

export const initTyping = ({ reducedMotionQuery }) => {
  const typingElement = document.querySelector("[data-typing]");
  const typingOutput = document.querySelector("[data-typing-output]");

  if (!typingElement || !typingOutput) {
    return;
  }

  const typingState = {
    status: "idle",
    characters: [],
    currentIndex: 0,
    timerId: null,
  };

  const clearTypingTimer = () => {
    if (typingState.timerId === null) {
      return;
    }

    window.clearTimeout(typingState.timerId);
    typingState.timerId = null;
  };

  const renderTypingText = () => {
    if (!typingElement || !typingOutput) {
      return;
    }

    typingOutput.textContent = typingState.characters
      .slice(0, typingState.currentIndex)
      .join("");
    typingElement.classList.toggle("is-typing", typingState.status === "typing");
    typingElement.classList.toggle("is-complete", typingState.status === "complete");
  };

  const completeTyping = () => {
    clearTypingTimer();
    typingState.currentIndex = typingState.characters.length;
    typingState.status = "complete";
    renderTypingText();
  };

  const typeNextCharacter = () => {
    typingState.timerId = null;

    if (typingState.status !== "typing") {
      return;
    }

    typingState.currentIndex += 1;

    if (typingState.currentIndex >= typingState.characters.length) {
      completeTyping();
      return;
    }

    renderTypingText();
    typingState.timerId = window.setTimeout(typeNextCharacter, TYPING_INTERVAL);
  };

  const startTyping = () => {
    typingState.timerId = null;

    if (typingState.status !== "idle") {
      return;
    }

    if (reducedMotionQuery.matches) {
      completeTyping();
      return;
    }

    typingState.status = "typing";
    typingState.currentIndex = 0;
    renderTypingText();
    typingState.timerId = window.setTimeout(typeNextCharacter, TYPING_INTERVAL);
  };

  const initializeTypingEffect = () => {
    if (
      !typingElement ||
      !typingOutput ||
      typingState.status !== "idle" ||
      typingState.timerId !== null
    ) {
      return;
    }

    const fullText = typingOutput.textContent.trim();

    if (!fullText) {
      return;
    }

    typingState.characters = [...fullText];

    if (reducedMotionQuery.matches) {
      completeTyping();
      return;
    }

    typingState.timerId = window.setTimeout(startTyping, TYPING_START_DELAY);
  };

  initializeTypingEffect();

  reducedMotionQuery.addEventListener("change", ({ matches }) => {
    if (matches && typingState.status !== "complete") {
      completeTyping();
    }
  });
};
