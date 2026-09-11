// 타이핑 간격과 최초 시작 지연 시간
const TYPING_INTERVAL = 55;
const TYPING_START_DELAY = 450;

// Hero 소개 문구의 일회성 타이핑 효과 관리
export const initTyping = ({ reducedMotionQuery }) => {
  const typingElement = document.querySelector("[data-typing]");
  const typingOutput = document.querySelector("[data-typing-output]");

  if (!typingElement || !typingOutput) {
    return;
  }

  // 타이핑 진행 상태와 예약 타이머
  const typingState = {
    status: "idle",
    characters: [],
    currentIndex: 0,
    timerId: null,
  };

  // 예약된 타이핑 타이머 해제
  const clearTypingTimer = () => {
    if (typingState.timerId === null) {
      return;
    }

    window.clearTimeout(typingState.timerId);
    typingState.timerId = null;
  };

  // 현재 글자 위치와 상태 클래스 갱신
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

  // 전체 문장 표시 후 완료 상태 전환
  const completeTyping = () => {
    clearTypingTimer();
    typingState.currentIndex = typingState.characters.length;
    typingState.status = "complete";
    renderTypingText();
  };

  // 한 글자 출력 후 다음 타이머 예약
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

  // 초기 지연 이후 타이핑 시작
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

  // 원문 저장과 사용자 모션 설정에 따른 초기 실행
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

  // 실행 중 모션 감소 설정 전환 시 즉시 완료
  reducedMotionQuery.addEventListener("change", ({ matches }) => {
    if (matches && typingState.status !== "complete") {
      completeTyping();
    }
  });
};
