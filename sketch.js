// p5.js 選擇題測驗系統
// 本程式不需要 HTML，可以直接完整貼到 p5.js Web Editor 執行。
// 版面會依照畫布寬度、高度與裝置方向自動調整。

// 儲存五道 p5.js 基礎指令題目，以及每一題的正確選項編號。
const questions = [
  {
    question: "在 p5.js 中，哪一個指令可以建立指定寬度與高度的畫布？",
    options: [
      "background(255)",
      "createCanvas(800, 600)",
      "ellipse(100, 100, 50, 50)",
      "frameRate(60)"
    ],
    answer: 1
  },
  {
    question: "在 p5.js 中，哪一個指令可以設定整個畫布的背景顏色？",
    options: [
      "fill(255, 0, 0)",
      "stroke(0)",
      "background(220)",
      "text(\"背景\", 10, 10)"
    ],
    answer: 2
  },
  {
    question: "ellipse(100, 80, 60, 40) 這一行程式的主要作用是什麼？",
    options: [
      "在畫布上畫出一個橢圓形",
      "把畫布變成 100 × 80 像素",
      "設定橢圓形的填色為黃色",
      "讓程式暫停 60 秒"
    ],
    answer: 0
  },
  {
    question: "p5.js 會持續重複執行哪一個函式，讓我們製作動畫？",
    options: [
      "setup()",
      "windowResized()",
      "mousePressed()",
      "draw()"
    ],
    answer: 3
  },
  {
    question: "在 p5.js 中，哪一個指令可以設定圖形的填滿顏色？",
    options: [
      "fill(0, 150, 255)",
      "line(0, 0, 100, 100)",
      "noLoop()",
      "size(400, 400)"
    ],
    answer: 0
  }
];

// 儲存目前正在作答的題目編號。
let currentQuestion = 0;
// 儲存目前答對的題數。
let score = 0;
// 儲存使用者選取的選項編號；-1 代表尚未選擇。
let selectedAnswer = -1;
// 記錄這一題是否已經鎖定，避免使用者重複作答。
let answerLocked = false;
// 記錄目前顯示的是測驗畫面或結果畫面。
let gameState = "quiz";
// 儲存所有可點擊選項的畫面位置。
let answerRects = [];
// 儲存「下一題」或「重新作答」按鈕的畫面位置。
let actionButton = null;
// 儲存畫布的 HTML 元素，方便設定全螢幕顯示樣式。
let canvas;
// 儲存依目前畫布尺寸計算出的版面資料。
let layout = null;
// 記錄答錯後開始晃動的時間，使用 p5.js 的 millis() 取得時間。
let wrongAnswerTime = 0;
// 設定正確答案選項晃動的持續時間，時間到後會自然停止。
const shakeDuration = 900;

// 將數值限制在指定範圍內，避免小螢幕或極端尺寸造成版面溢出。
function clampValue(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

// p5.js 啟動時只會執行一次 setup()。
function setup() {
  // 建立與瀏覽器視窗一樣大的全螢幕畫布。
  canvas = createCanvas(windowWidth, windowHeight);
  // 讓畫布以區塊顯示，避免畫布下方出現多餘空白。
  canvas.style("display", "block");
  // 防止觸控畫布時瀏覽器捲動或縮放頁面。
  canvas.elt.style.touchAction = "none";
  // 設定使用者介面採用容易閱讀的無襯線字型。
  textFont("Noto Sans TC, Arial, sans-serif");
  // 設定矩形繪製時，座標代表矩形左上角。
  rectMode(CORNER);
  // 啟用較平滑的圖形邊緣。
  smooth();
  // 第一次建立完整的響應式版面與點擊區域基礎資料。
  calculateLayout();
}

// p5.js 會不斷執行 draw()，用來繪製畫面。
function draw() {
  // 每一幀都重新計算，確保方向感測或瀏覽器工具列變化也能立即反映。
  calculateLayout();
  // 設定整個畫面的柔和淺色背景。
  background("#F4F7FB");
  // 依照目前狀態決定要繪製測驗頁或成績頁。
  if (gameState === "quiz") {
    drawQuizScreen();
  } else {
    drawResultScreen();
  }
}

// 依畫布寬高、方向與目前頁面狀態計算所有版面尺寸。
// 繪圖函式與滑鼠／觸控判斷都使用這些資料，避免兩者位置不同步。
function calculateLayout() {
  const canvasWidth = Math.max(1, width);
  const canvasHeight = Math.max(1, height);
  const shortSide = Math.min(canvasWidth, canvasHeight);
  const horizontalPadding = clampValue(canvasWidth * 0.045, 10, 34);
  const verticalPadding = clampValue(canvasHeight * 0.035, 8, 28);
  const contentWidth = Math.max(1, Math.min(canvasWidth - horizontalPadding * 2, 1080));
  const contentLeft = (canvasWidth - contentWidth) / 2;
  const isLandscape = canvasWidth >= canvasHeight;
  // 寬度足夠時使用雙欄；窄手機則使用單欄，避免選項文字太擠。
  const useTwoColumns = contentWidth >= 560 && (isLandscape || canvasWidth >= 700);
  const columns = useTwoColumns ? 2 : 1;
  const rows = columns === 2 ? 2 : 4;
  const titleSize = clampValue(shortSide * 0.045, 16, 38);
  const bodySize = clampValue(shortSide * 0.026, 13, 24);
  const headerHeight = clampValue(canvasHeight * 0.085, 28, 60);
  const sectionGap = clampValue(shortSide * 0.018, 6, 16);
  const optionGap = clampValue(shortSide * 0.014, 6, 14);
  const desiredQuestionHeight = clampValue(
    canvasHeight * (useTwoColumns ? 0.19 : 0.17),
    62,
    150
  );
  const feedbackHeight = answerLocked
    ? clampValue(canvasHeight * (useTwoColumns ? 0.17 : 0.16), 56, 96)
    : 0;

  // 先保留選項最小點擊高度，再把剩餘空間分配給題目卡片。
  const minimumOptionHeight = useTwoColumns ? 44 : 42;
  const fixedHeight = verticalPadding * 2
    + headerHeight
    + sectionGap * 2
    + feedbackHeight
    + optionGap * (rows - 1)
    + minimumOptionHeight * rows;
  const maximumQuestionHeight = canvasHeight - fixedHeight;
  const questionHeight = Math.max(
    44,
    Math.min(desiredQuestionHeight, maximumQuestionHeight)
  );
  const optionsTop = verticalPadding + headerHeight + sectionGap + questionHeight + sectionGap;
  const optionsAvailableHeight = Math.max(
    minimumOptionHeight * rows,
    canvasHeight - optionsTop - verticalPadding - feedbackHeight
  );
  const optionHeight = Math.max(
    30,
    (optionsAvailableHeight - optionGap * (rows - 1)) / rows
  );
  const questionTop = verticalPadding + headerHeight + sectionGap;
  const feedbackTop = optionsTop + optionHeight * rows + optionGap * (rows - 1) + sectionGap;
  const buttonWidth = useTwoColumns
    ? Math.min(210, contentWidth * 0.30)
    : Math.min(190, contentWidth * 0.43);
  const buttonHeight = clampValue(canvasHeight * 0.075, 44, 56);

  layout = {
    width: canvasWidth,
    height: canvasHeight,
    left: contentLeft,
    contentWidth,
    horizontalPadding,
    verticalPadding,
    isLandscape,
    useTwoColumns,
    columns,
    rows,
    titleSize,
    bodySize,
    headerHeight,
    sectionGap,
    optionGap,
    questionTop,
    questionHeight,
    optionsTop,
    optionHeight,
    feedbackTop,
    feedbackHeight,
    buttonWidth,
    buttonHeight
  };
}

// 繪製測驗進行中的畫面。
function drawQuizScreen() {
  const quiz = questions[currentQuestion];
  const page = layout;
  const left = page.left;
  const right = left + page.contentWidth;

  // 繪製頁面上方的大標題，窄螢幕時自動縮小以避免和題數重疊。
  noStroke();
  fill("#1F2937");
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  let titleSize = page.titleSize;
  textSize(titleSize);
  const titleAreaWidth = page.contentWidth * 0.62;
  while (titleSize > 13 && textWidth("p5.js 簡易指令測驗") > titleAreaWidth) {
    titleSize -= 1;
    textSize(titleSize);
  }
  text("p5.js 簡易指令測驗", left, page.verticalPadding + page.headerHeight / 2);

  // 顯示目前題數；文字區域獨立配置，避免小螢幕和標題互相覆蓋。
  fill("#64748B");
  textStyle(NORMAL);
  textSize(clampValue(page.bodySize * 0.78, 12, 20));
  textAlign(RIGHT, CENTER);
  text(`第 ${currentQuestion + 1} 題／共 ${questions.length} 題`, right, page.verticalPadding + page.headerHeight / 2);

  // 繪製題目卡片。
  drawRoundedCard(left, page.questionTop, page.contentWidth, page.questionHeight, "#FFFFFF");
  const markerSize = clampValue(Math.min(page.questionHeight * 0.48, page.contentWidth * 0.12), 26, 42);
  const markerX = left + Math.max(12, page.contentWidth * 0.025) + markerSize / 2;
  const markerY = page.questionTop + page.questionHeight / 2;
  fill("#2563EB");
  circle(markerX, markerY, markerSize);
  fill("#FFFFFF");
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(clampValue(markerSize * 0.43, 13, 20));
  text(String(currentQuestion + 1), markerX, markerY);

  // 題目文字依可用寬度與高度自動換行、縮放並垂直置中。
  const questionTextX = markerX + markerSize / 2 + clampValue(page.contentWidth * 0.025, 10, 20);
  const questionTextWidth = Math.max(30, right - questionTextX - 14);
  drawFittedWrappedText(
    quiz.question,
    questionTextX,
    page.questionTop + 10,
    questionTextWidth,
    Math.max(24, page.questionHeight - 20),
    page.bodySize,
    11,
    "#1E293B",
    BOLD
  );

  // 清除上一幀的選項位置，再重新建立本題的響應式位置資料。
  answerRects = [];
  // 逐一繪製四個答案選項；雙欄時每列放兩個，單欄時改為直向排列。
  for (let i = 0; i < quiz.options.length; i += 1) {
    const row = Math.floor(i / page.columns);
    const column = i % page.columns;
    const optionWidth = page.columns === 2
      ? (page.contentWidth - page.optionGap) / 2
      : page.contentWidth;
    const optionX = left + column * (optionWidth + page.optionGap);
    const optionY = page.optionsTop + row * (page.optionHeight + page.optionGap);
    drawAnswerOption(
      quiz.options[i],
      i,
      optionX,
      optionY,
      optionWidth,
      page.optionHeight,
      page.bodySize
    );
  }

  // 只有作答後才顯示作答結果與操作按鈕。
  if (answerLocked) {
    drawQuizFeedback();
  } else {
    // 尚未作答時，清除操作按鈕資料，避免點擊到隱藏按鈕。
    actionButton = null;
  }
}

// 繪製作答後的提示文字與下一題按鈕。
function drawQuizFeedback() {
  const page = layout;
  const left = page.left;
  const right = left + page.contentWidth;
  const feedbackY = page.feedbackTop;
  const buttonX = right - page.buttonWidth;
  const buttonY = feedbackY + Math.max(0, (page.feedbackHeight - page.buttonHeight) / 2);
  const feedbackGap = clampValue(page.contentWidth * 0.025, 8, 18);
  const feedbackWidth = Math.max(24, page.contentWidth - page.buttonWidth - feedbackGap);
  const quiz = questions[currentQuestion];
  const isCorrect = selectedAnswer === quiz.answer;
  const feedbackText = isCorrect
    ? "答對了！"
    : `答錯了，正確答案是：${quiz.options[quiz.answer]}`;

  // 將答題回饋放在按鈕左側，窄螢幕時會自動縮小並換行。
  drawFittedWrappedText(
    feedbackText,
    left,
    feedbackY,
    feedbackWidth,
    page.feedbackHeight,
    clampValue(page.bodySize * 0.88, 13, 22),
    10,
    isCorrect ? "#15803D" : "#B91C1C",
    BOLD
  );

  // 儲存按鈕矩形，繪圖與觸控／滑鼠判斷共用同一組座標。
  actionButton = { x: buttonX, y: buttonY, w: page.buttonWidth, h: page.buttonHeight };
  drawActionButton(
    buttonX,
    buttonY,
    page.buttonWidth,
    page.buttonHeight,
    currentQuestion === questions.length - 1 ? "看作答結果" : "下一題"
  );
}

// 繪製單一答案選項，並依照作答狀態顯示顏色。
function drawAnswerOption(label, index, x, y, w, h, bodySize) {
  const correctIndex = questions[currentQuestion].answer;
  // 判斷是否為答錯後需要提示的正確答案選項。
  const shouldShake = answerLocked && selectedAnswer !== correctIndex && index === correctIndex;
  const elapsed = shouldShake ? millis() - wrongAnswerTime : 0;
  // 將晃動進度限制在 0 到 1，讓效果逐漸減弱並自然停止。
  const shakeProgress = shouldShake ? clampValue(elapsed / shakeDuration, 0, 1) : 1;
  // 讓水平晃動幅度從小幅度逐漸減弱至零。
  const shakeOffset = shouldShake ? Math.sin(elapsed * 0.045) * 4 * (1 - shakeProgress) : 0;

  // 設定尚未作答時的預設選項背景色。
  let optionColor = "#FFFFFF";
  // 若答錯，將正確選項背景設為指定的 #B3FFCA 顏色。
  if (answerLocked && selectedAnswer !== correctIndex && index === correctIndex) {
    optionColor = "#B3FFCA";
  // 若答對，將使用者選到的正確選項以綠色標示。
  } else if (answerLocked && selectedAnswer === correctIndex && index === correctIndex) {
    optionColor = "#B7E4C7";
  // 若使用者答錯，也用淡紅色標示使用者選到的錯誤選項。
  } else if (answerLocked && selectedAnswer === index) {
    optionColor = "#FAD1D1";
  }

  // 儲存不含晃動偏移的原始選項矩形，確保整個可見卡片仍可點擊。
  answerRects.push({ x, y, w, h });
  push();
  translate(shakeOffset, 0);
  drawRoundedCard(x, y, w, h, optionColor);

  // 繪製選項左側的英文字母標籤。
  const letters = ["A", "B", "C", "D"];
  const markerSize = clampValue(Math.min(h * 0.52, w * 0.18), 24, 36);
  const markerX = x + clampValue(w * 0.055, 12, 24) + markerSize / 2;
  const markerY = y + h / 2;
  fill(answerLocked && index === correctIndex ? "#7F1D1D" : "#2563EB");
  circle(markerX, markerY, markerSize);
  fill("#FFFFFF");
  textAlign(CENTER, CENTER);
  textSize(clampValue(markerSize * 0.48, 12, 18));
  textStyle(BOLD);
  text(letters[index], markerX, markerY);

  // 繪製答案文字，依選項卡片的實際寬高自動換行與縮放。
  const textX = markerX + markerSize / 2 + clampValue(w * 0.035, 8, 16);
  const textWidthAvailable = Math.max(24, x + w - textX - 12);
  drawFittedWrappedText(
    label,
    textX,
    y + 7,
    textWidthAvailable,
    Math.max(20, h - 14),
    clampValue(bodySize * 0.84, 12, 21),
    10,
    "#1E293B",
    NORMAL
  );
  pop();
}

// 繪製結果頁面，顯示答對題數與重新作答按鈕。
function drawResultScreen() {
  const page = layout;
  const cardWidth = Math.min(page.contentWidth, 720);
  const cardHeight = Math.max(1, Math.min(page.height - page.verticalPadding * 2, 500));
  const cardX = (page.width - cardWidth) / 2;
  const cardY = (page.height - cardHeight) / 2;
  const titleSize = clampValue(Math.min(cardWidth, cardHeight) * 0.105, 22, 52);
  const resultSize = clampValue(Math.min(cardWidth, cardHeight) * 0.145, 30, 72);
  const bodySize = clampValue(Math.min(cardWidth, cardHeight) * 0.055, 14, 24);

  // 繪製結果白色卡片。
  drawRoundedCard(cardX, cardY, cardWidth, cardHeight, "#FFFFFF");
  // 設定結果頁標題樣式。
  fill("#1F2937");
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(titleSize);
  text("測驗完成！", page.width / 2, cardY + cardHeight * 0.22);
  // 顯示答對題數，例如「答對 4 題」。
  fill("#2563EB");
  textSize(resultSize);
  text(`答對 ${score} 題`, page.width / 2, cardY + cardHeight * 0.45);
  // 顯示總題數資訊。
  fill("#475569");
  textStyle(NORMAL);
  textSize(bodySize);
  text(`共 ${questions.length} 題`, page.width / 2, cardY + cardHeight * 0.59);

  // 重新作答按鈕在小畫面中維持足夠的觸控高度與寬度。
  const buttonWidth = Math.min(260, cardWidth * 0.68);
  const buttonHeight = clampValue(cardHeight * 0.14, 44, 58);
  const buttonX = page.width / 2 - buttonWidth / 2;
  const preferredButtonY = cardY + cardHeight * 0.73;
  const buttonY = Math.min(
    preferredButtonY,
    cardY + cardHeight - buttonHeight - Math.max(10, page.verticalPadding)
  );
  actionButton = { x: buttonX, y: buttonY, w: buttonWidth, h: buttonHeight };
  drawActionButton(buttonX, buttonY, buttonWidth, buttonHeight, "重新作答");
  // 恢復靠左對齊，避免下一次繪圖受到結果頁設定影響。
  textAlign(LEFT, CENTER);
}

// 繪製具有圓角、陰影與邊框的內容卡片。
function drawRoundedCard(x, y, w, h, colorValue) {
  push();
  noStroke();
  const radius = clampValue(Math.min(w, h) * 0.08, 8, 16);
  // 使用淡淡的陰影色先畫出偏移的卡片。
  fill("#DDE5F0");
  rect(x, y + Math.min(4, h * 0.04), w, h, radius);
  // 使用指定顏色畫出主要卡片。
  fill(colorValue);
  rect(x, y, w, h, radius);
  pop();
}

// 繪製藍色的操作按鈕。
function drawActionButton(x, y, w, h, label) {
  push();
  noStroke();
  // 使用較深的藍色製作按鈕下方陰影。
  fill("#1D4ED8");
  rect(x, y + Math.min(4, h * 0.08), w, h, clampValue(h * 0.22, 8, 13));
  // 繪製按鈕主要背景。
  fill("#2563EB");
  rect(x, y, w, h, clampValue(h * 0.22, 8, 13));
  // 設定按鈕文字的樣式。
  fill("#FFFFFF");
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(clampValue(h * 0.34, 14, 22));
  text(label, x + w / 2, y + h / 2);
  pop();
}

// 把文字切成適合指定寬度的行；中文可逐字換行，英文指令也能在窄欄位切開。
function wrapTextLines(content, maxWidth) {
  const lines = [];
  let currentLine = "";
  const characters = Array.from(content);
  for (let i = 0; i < characters.length; i += 1) {
    const character = characters[i];
    const candidate = currentLine + character;
    if (textWidth(candidate) > maxWidth && currentLine.length > 0) {
      lines.push(currentLine.trimEnd());
      currentLine = character === " " ? "" : character;
    } else if (character !== " " || currentLine.length > 0) {
      currentLine = candidate;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.trimEnd());
  }
  return lines.length > 0 ? lines : [""];
}

// 在指定區域內自動尋找合適字級、換行並垂直置中文字。
function drawFittedWrappedText(content, x, y, maxWidth, maxHeight, maximumSize, minimumSize, colorValue, styleValue) {
  push();
  fill(colorValue);
  textStyle(styleValue);
  textAlign(LEFT, TOP);
  let fontSize = maximumSize;
  let lines = [];
  let lineHeight = 0;
  while (fontSize > minimumSize) {
    textSize(fontSize);
    lines = wrapTextLines(content, maxWidth);
    lineHeight = textAscent() + textDescent() + Math.max(2, fontSize * 0.16);
    if (lines.length * lineHeight <= maxHeight) {
      break;
    }
    fontSize -= 1;
  }
  textSize(Math.max(minimumSize, fontSize));
  lines = wrapTextLines(content, maxWidth);
  lineHeight = textAscent() + textDescent() + Math.max(2, fontSize * 0.16);
  const visibleLineCount = Math.max(1, Math.min(lines.length, Math.floor(maxHeight / lineHeight)));
  const visibleLines = lines.slice(0, visibleLineCount);
  const blockHeight = visibleLines.length * lineHeight;
  let lineY = y + Math.max(0, (maxHeight - blockHeight) / 2);
  for (let i = 0; i < visibleLines.length; i += 1) {
    text(visibleLines[i], x, lineY);
    lineY += lineHeight;
  }
  pop();
}

// p5.js 在使用者按下滑鼠時會呼叫 mousePressed()。
function mousePressed() {
  // 將滑鼠點擊交給共用的互動處理函式。
  handlePointerPress(mouseX, mouseY);
  // 回傳 false 可以避免瀏覽器執行預設的滑鼠行為。
  return false;
}

// p5.js 在觸控裝置觸碰畫面時會呼叫 touchStarted()。
function touchStarted() {
  // 將第一個觸控點交給共用的互動處理函式。
  if (touches.length > 0) {
    handlePointerPress(touches[0].x, touches[0].y);
  }
  // 回傳 false 可以避免手機瀏覽器捲動畫面。
  return false;
}

// 集中處理滑鼠與觸控的點擊事件。
function handlePointerPress(pointerX, pointerY) {
  // 若尚未建立版面資料，先建立一次，確保剛旋轉畫面就點擊也能正常反應。
  if (layout === null) {
    calculateLayout();
  }

  // 如果目前是測驗頁，先檢查是否點擊某個答案。
  if (gameState === "quiz" && !answerLocked) {
    for (let i = 0; i < answerRects.length; i += 1) {
      const option = answerRects[i];
      if (isInside(pointerX, pointerY, option)) {
        // 記錄使用者選取的選項並鎖定本題。
        selectedAnswer = i;
        answerLocked = true;
        // 若選到正確答案，答對題數增加一題。
        if (selectedAnswer === questions[currentQuestion].answer) {
          score += 1;
          wrongAnswerTime = 0;
        } else {
          // 答錯時記錄開始時間，讓正確答案從此刻開始晃動。
          wrongAnswerTime = millis();
        }
        // 立即重算一次，讓回饋與按鈕在下一個畫面使用最新位置。
        calculateLayout();
        return;
      }
    }
    return;
  }

  // 只有在操作按鈕存在時才檢查按鈕點擊。
  if (actionButton !== null && isInside(pointerX, pointerY, actionButton)) {
    if (gameState === "quiz") {
      // 如果仍有下一題，就移動到下一題。
      if (currentQuestion < questions.length - 1) {
        currentQuestion += 1;
        selectedAnswer = -1;
        answerLocked = false;
        wrongAnswerTime = 0;
      } else {
        gameState = "result";
      }
    } else {
      // 如果目前在結果頁，重新初始化測驗。
      currentQuestion = 0;
      score = 0;
      selectedAnswer = -1;
      answerLocked = false;
      wrongAnswerTime = 0;
      gameState = "quiz";
    }
    actionButton = null;
    calculateLayout();
  }
}

// 判斷一個點是否位於矩形範圍內。
function isInside(pointX, pointY, rectangle) {
  return pointX >= rectangle.x
    && pointX <= rectangle.x + rectangle.w
    && pointY >= rectangle.y
    && pointY <= rectangle.y + rectangle.h;
}

// 當瀏覽器視窗尺寸改變時，重新調整畫布尺寸與所有版面座標。
function windowResized() {
  // 讓畫布繼續填滿最新的視窗寬度與高度。
  resizeCanvas(windowWidth, windowHeight);
  // 立即同步更新題目、選項、按鈕及其點擊區域。
  calculateLayout();
}
