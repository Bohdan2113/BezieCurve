class Point {
  static pointId = 0;
  static maxX = 0;
  static minX = 0;
  static maxY = 0;
  static minY = 0;
  constructor(x, y, color) {
    this.id = Point.pointId++;
    this._x = Math.round(x * 10) / 10;
    this._y = Math.round(y * 10) / 10;
    this.color = color;
  }
  get x() {
    return this._x;
  }
  set x(value) {
    if (value > Point.maxX) this._x = Point.maxX;
    else if (value < Point.minX) this._y = Point.minX;
    else this._x = Math.round(value * 10) / 10;
  }
  get y() {
    return this._y;
  }
  set y(value) {
    if (value > Point.maxY) this._y = Point.maxY;
    else if (value < Point.minY) this._x = Point.minY;
    else this._y = Math.round(value * 10) / 10;
  }
  get coords() {
    return `(X: ${this.x}, Y: ${this.y})`;
  }
}

const $ = document.querySelector.bind(document);
const coordSystemMargin = 15;
const maxPointsForParams = 20;
const maxPointsForRecursive = 10;
const deltaT = 0.01;

let unitCount;
let pointList = [];
let outputPoints = [];
let curvePoints = [];
let draggedPoint = null; // Поточна точка, яку тягнемо
let BezierCurveMethod = ParamMethod;
let maxPointPossible = maxPointsForParams;

window.onload = function () {
  const canvas = $("#myCanvas");
  const seeCanvas = $("#seeCanvas");
  seeCanvas.width = canvas.width = window.innerHeight - 180;
  seeCanvas.height = canvas.height = window.innerHeight - 180;

  const unitsCountField = $("#unit-count");
  const xField = $("#x-field");
  const yField = $("#y-field");
  const diapasonYStartField = $("#diapasonY-start");
  const diapasonYEndField = $("#diapasonY-end");
  const diapasonYStepField = $("#diapasonY-step");
  const diapasonIStartField = $("#diapasonI-start");
  const diapasonIEndField = $("#diapasonI-end");
  const diapasonTStartField = $("#diapasonT-start");
  const diapasonTEndField = $("#diapasonT-end");

  unitsCountField.min = 1;
  unitsCountField.max = canvas.height / 2 - coordSystemMargin;

  const fields = [
    { field: xField, errorId: "#error-message-point" },
    { field: yField, errorId: "#error-message-point" },
    { field: diapasonYStartField, errorId: "#error-message-optionY" },
    { field: diapasonYEndField, errorId: "#error-message-optionY" },
    { field: diapasonYStepField, errorId: "#error-message-optionY" },
    { field: diapasonIStartField, errorId: "#error-message-optionPolinom" },
    { field: diapasonIEndField, errorId: "#error-message-optionPolinom" },
    { field: diapasonTStartField, errorId: "#error-message-optionPolinom" },
    { field: diapasonTEndField, errorId: "#error-message-optionPolinom" },
    { field: unitsCountField, errorId: "#error-message-unit" },
  ];

  // Обробка неправильного введення
  fields.forEach(({ field, errorId }) => {
    field.addEventListener("input", (event) =>
      hideErrorMessage(event, errorId)
    );
    field.addEventListener("input", (event) => checkInterval(event, errorId));
  });

  // Подія зміни методу
  const paramMethod = document.getElementById("params-method");
  const recursiveMethod = document.getElementById("recursive-method");
  paramMethod.addEventListener("change", MethodChange);
  recursiveMethod.addEventListener("change", MethodChange);

  // Створення точок подвійним кліком
  canvas.addEventListener("dblclick", function (event) {
    const canvas = $("#myCanvas");
    const { x, y } = ClickToCoord(event.clientX, event.clientY, canvas);
    CreatePointDoubleClick(x, y);
  });

  // Перетягнення точок
  canvas.addEventListener("mousedown", (event) => {
    ToogleBlocks($(".points-container"), $("#addpoint-container"));
    const canvas = $("#myCanvas");
    const hoverP = ClickToCoord(event.clientX, event.clientY, canvas);
    draggedPoint = FindClosestPoint(pointList, hoverP, 0.2);
  });
  canvas.addEventListener("mousemove", (event) => {
    if (!draggedPoint) return;

    // Оновлюємо координати точки
    const canvas = $("#myCanvas");
    const { x, y } = ClickToCoord(event.clientX, event.clientY, canvas);
    draggedPoint.x = x;
    draggedPoint.y = y;
    const draggedLiText = $(`#point-${draggedPoint.id} h3`);
    if (draggedLiText) {
      draggedLiText.textContent = draggedPoint.coords;
    }

    Redraw(); // Перемальовуємо
  });
  canvas.addEventListener("mouseup", () => {
    draggedPoint = null; // Відпускаємо точку
  });

  // Видалення точок
  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault(); // Відміна стандартного контекстного меню

    const canvas = $("#myCanvas");
    const hoverP = ClickToCoord(event.clientX, event.clientY, canvas);
    const closestPoint = FindClosestPoint(pointList, hoverP, 0.2);

    DeletePoint(closestPoint.id);
  });

  // Перегляд інформації про точку
  canvas.addEventListener("mousemove", (event) => {
    const canvas = $("#myCanvas");
    ShowHooverPointInfo(canvas, event, pointList);
  });
  seeCanvas.addEventListener("mousemove", (event) => {
    const seeCanvas = $("#seeCanvas");
    ShowHooverPointInfo(seeCanvas, event, outputPoints);
  });

  // Зміна кольору кривої
  $("#curve-color").addEventListener("change", (event) => Redraw());
};

function SealOptions(stan) {
  const optionsData = $(".options-data");
  if (stan !== undefined) optionsData.style.display = stan;
  else
    optionsData.style.display = optionsData.style.display === "" ? "block" : "";
}
function MethodChange(event) {
  const paramMethod = document.getElementById("params-method");
  const recursiveMethod = document.getElementById("recursive-method");

  if (event.target === paramMethod) {
    if (pointList.length > maxPointsForParams) {
      paramMethod.checked = false;
      alert(
        `Maximum points for Params method is 20 delete some points to change method for this.`
      );
      return;
    }
    paramMethod.checked = true;
    recursiveMethod.checked = false;
  } else {
    if (pointList.length > maxPointsForRecursive) {
      recursiveMethod.checked = false;
      alert(
        `Maximum points for Recursive method is 20 delete some points to change method for this.`
      );
      return;
    }
    recursiveMethod.checked = true;
    paramMethod.checked = false;
  }

  if (paramMethod.checked) {
    BezierCurveMethod = ParamMethod;
    maxPointPossible = maxPointsForParams;
  } else if (recursiveMethod.checked) {
    BezierCurveMethod = RecursiveMethod;
    maxPointPossible = maxPointsForRecursive;
  }

  Redraw();
}

function FindClosestPoint(points, clickP, radius) {
  return points.find(
    (point) => Math.hypot(point.x - clickP.x, point.y - clickP.y) < radius
  );
}
function SetRestrictionsForInput() {
  const xField = $("#x-field");
  const yField = $("#y-field");
  const diapasonYStartField = $("#diapasonY-start");
  const diapasonYEndField = $("#diapasonY-end");
  const diapasonIStartField = $("#diapasonI-start");
  const diapasonIEndField = $("#diapasonI-end");
  const diapasonTStartField = $("#diapasonT-start");
  const diapasonTEndField = $("#diapasonT-end");
  const diapasonYStep = $("#diapasonY-step");

  Point.minX = -1 * unitCount;
  Point.maxX = unitCount;
  Point.minY = -1 * unitCount;
  Point.maxY = unitCount;

  xField.min = -1 * unitCount;
  xField.max = unitCount;
  yField.min = -1 * unitCount;
  yField.max = unitCount;

  diapasonYStartField.min = -1 * unitCount;
  diapasonYStartField.max = unitCount;
  diapasonYEndField.min = -1 * unitCount;
  diapasonYEndField.max = unitCount;
  diapasonYStep.min = 0;
  diapasonYStep.max = 1 / deltaT + 1;

  diapasonIStartField.min = 0;
  diapasonIStartField.max = 0;
  diapasonIEndField.min = 0;
  diapasonIEndField.max = 0;

  diapasonTStartField.min = 0;
  diapasonTStartField.max = 1;
  diapasonTEndField.min = 0;
  diapasonTEndField.max = 1;
}
function GetSegmentLength(count, unitSize) {
  const factors = [2, 2.5, 2];
  let index = 0;
  let base = 20;
  let interval = 1;

  if (count < base) return interval * unitSize;

  do {
    interval *= factors[index++];
    if (index >= factors.length) index = 0;

    base *= factors[index];
  } while (count >= base);

  return interval * unitSize;
}
function ToCanvas(x, y) {
  const canvas = $("#myCanvas");
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const sideLength = canvas.height / 2 - coordSystemMargin;
  const unitSize = sideLength / (unitCount + 1);

  return {
    x: x * unitSize + centerX,
    y: centerY - y * unitSize,
  };
}
function ClickToCoord(x, y, canvas) {
  const rect = canvas.getBoundingClientRect();
  const sideLength = canvas.height / 2 - coordSystemMargin;
  const unitSize = sideLength / (unitCount + 1);

  return {
    x: (x - rect.left - canvas.width / 2) / unitSize,
    y: (canvas.height / 2 - (y - rect.top)) / unitSize,
  };
}
function CanvasToCoord(x, y) {
  const canvas = $("#myCanvas");
  const sideLength = canvas.height / 2 - coordSystemMargin;
  const unitSize = sideLength / (unitCount + 1);

  return {
    x: (x - canvas.width / 2) / unitSize,
    y: (canvas.height / 2 - y) / unitSize,
  };
}
function ShowHooverPointInfo(canvas, event, points) {
  const hoverP = ClickToCoord(event.clientX, event.clientY, canvas);
  const closePoint = FindClosestPoint(points, hoverP, 0.2);

  if (closePoint) {
    console.log(closePoint);
    const infoPanel = $("#point-info-panel");
    const { clientX, clientY } = event; // Отримуємо координати курсора
    infoPanel.style.display = "block";
    infoPanel.style.position = "absolute";
    infoPanel.style.left = `${clientX + 10}px`; // Відступ від курсора
    infoPanel.style.top = `${clientY + 10}px`; // Відступ від курсора
    infoPanel.style.zIndex = "1000";
    infoPanel.innerHTML = `
    <p>(X: ${closePoint.x}, Y: ${closePoint.y})</p>
    `;
  } else {
    const infoPanel = $("#point-info-panel");
    infoPanel.style.display = "none";
    infoPanel.innerHTML = "";
  }
}

function ToogleBlocks(block1, block2) {
  block1.style.display = "flex";
  block2.style.display = "none";
}

function SeeCurveBut() {
  const seeCanvas = $("#seeCanvas");
  DrawCurve(seeCanvas, pointList, BezierCurveMethod);

  $(".modal-overlay-canvas").classList.add("show");
  $(".curve-output").classList.add("show");
}
function OutputCanvasClose() {
  $(".modal-overlay-canvas").classList.remove("show");
  $(".curve-output").classList.remove("show");

  ClearCanvas($("#seeCanvas"));
  outputPoints = [];
}

function ClearAllBut() {
  ClearHome();
  ToogleBlocks($("#home"), $("#work"));
  ClearWork();
}
function ClearHome() {
  const unitCountField = $("#unit-count");
  unitCountField.value = "";
  unitCountField.dispatchEvent(new Event("input"));
}
function ClearWork() {
  ClearCanvas($("#myCanvas"));
  ClearPointsList();

  ClearCurveFields();
  ClearPointFields();
  ClearOptionYFields();
  ClearOptionsPolinomsFields();
  ClearmethodChoose();

  const pointsCont = $(".points-container");
  ToogleBlocks($(".points-container"), $("#addpoint-container"));
  SealOptions("");
}
function ClearCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  curvePoints = [];
}
function ClearmethodChoose() {
  const paramMethod = document.getElementById("params-method");
  const recursiveMethod = document.getElementById("recursive-method");

  recursiveMethod.checked = false;
  paramMethod.checked = true;
}
function ClearPointsList() {
  pointList.forEach((p) => {
    RemovePointFromList(p.id);
  });
}
function ClearCurveFields() {
  $("#curve-color").value = "#000000";
}
function ClearPointFields() {
  const xField = $("#x-field");
  xField.value = "";
  xField.dispatchEvent(new Event("input"));

  const yField = $("#y-field");
  yField.value = "";
  yField.dispatchEvent(new Event("input"));

  $("#point-color").value = "#000000";

  let confirmButton = $(".create-point-but");
  confirmButton.removeEventListener("click", saveEditListener);
  confirmButton.removeEventListener("click", CreatePointBut);
}
function ClearOptionYFields() {
  const diapasonYStart = $("#diapasonY-start");
  diapasonYStart.value = "";
  diapasonYStart.dispatchEvent(new Event("input"));

  const diapasonYEnd = $("#diapasonY-end");
  diapasonYEnd.value = "";
  diapasonYEnd.dispatchEvent(new Event("input"));

  const diapasonYCount = $("#diapasonY-step");
  diapasonYCount.value = "";
  diapasonYCount.dispatchEvent(new Event("input"));
}
function ClearOptionsPolinomsFields() {
  const diapasonIStart = $("#diapasonI-start");
  diapasonIStart.value = "";
  diapasonIStart.dispatchEvent(new Event("input"));

  const diapasonIEnd = $("#diapasonI-end");
  diapasonIEnd.value = "";
  diapasonIEnd.dispatchEvent(new Event("input"));

  const diapasonTStart = $("#diapasonT-start");
  diapasonTStart.value = "";
  diapasonTStart.dispatchEvent(new Event("input"));

  const diapasonTEnd = $("#diapasonT-end");
  diapasonTEnd.value = "";
  diapasonTEnd.dispatchEvent(new Event("input"));
}
function ClearOptionOutput() {
  $(".modal-overlay h3").textContent = "";

  const outputList = $("#output-list");
  while (outputList.firstChild) {
    outputList.removeChild(outputList.firstChild);
  }
}

function CreateCoordsBut() {
  if (!CheckUnitCount()) return;

  const unitCountField = $("#unit-count");
  unitCount = parseInt(unitCountField.value);
  DrawCoords($("#myCanvas"), unitCount);
  SetRestrictionsForInput();

  ToogleBlocks($("#work"), $("#home"));
}
function DrawCoords(canvas, unitCount) {
  const ctx = canvas.getContext("2d");

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const sideLength = canvas.height / 2 - coordSystemMargin;
  const unitSize = sideLength / (unitCount + 1);
  const segmentLength = GetSegmentLength(unitCount, unitSize);
  const segmentSize = sideLength / 70;
  const arrowSize = sideLength / 30;

  ctx.beginPath(); // coordinate system
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = "black";
  ctx.moveTo(centerX, centerY - sideLength);
  ctx.lineTo(centerX, centerY + sideLength);
  ctx.moveTo(centerX - sideLength, centerY);
  ctx.lineTo(centerX + sideLength, centerY);

  ctx.font = "10px Arial";
  DrawUnitsY(centerX, centerY, true); // coord segments
  DrawUnitsYNegative(centerX, centerY, false);
  DrawUnitsXNegative(centerX, centerY, false);
  DrawUnitsX(centerX, centerY, true);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath(); // arrow on Y
  ctx.moveTo(centerX + sideLength - arrowSize, centerY - arrowSize / 2);
  ctx.lineTo(centerX + sideLength, centerY);
  ctx.lineTo(centerX + sideLength - arrowSize, centerY + arrowSize / 2);
  ctx.stroke();

  ctx.beginPath(); // arrow on X
  ctx.moveTo(centerX - arrowSize / 2, centerY - sideLength + arrowSize);
  ctx.lineTo(centerX, centerY - sideLength);
  ctx.lineTo(centerX + arrowSize / 2, centerY - sideLength + arrowSize);
  ctx.stroke();

  ctx.font = "12px Arial"; // x / y text
  ctx.fillText("x", centerX + sideLength + arrowSize / 2, centerY);
  ctx.fillText("y", centerX, centerY - sideLength - arrowSize / 2);

  ctx.beginPath(); // Намалювати сітку на координатах
  ctx.lineWidth = 0.1;
  DrawGrid(segmentLength);
  ctx.stroke();

  function DrawUnitsY(X, downY, isNumerate) {
    for (
      var i = segmentLength / unitSize;
      i <= unitCount;
      i += segmentLength / unitSize
    ) {
      const startX = X - segmentSize;
      const endX = X + segmentSize;

      let startY = downY - i * unitSize;
      let endY = downY - i * unitSize;

      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);

      if (isNumerate) {
        const textX = endX + 5;
        const textY = startY + 3;
        ctx.fillStyle = "black";
        ctx.fillText(Math.round(i), textX, textY);
      }
    }
  }
  function DrawUnitsX(leftX, topY, isNumerate) {
    for (
      var i = segmentLength / unitSize;
      i <= unitCount;
      i += segmentLength / unitSize
    ) {
      const startY = topY - segmentSize;
      const endY = topY + segmentSize;

      let startX = leftX + i * unitSize;
      let endX = leftX + i * unitSize;

      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);

      if (isNumerate) {
        const textX = startX - 3;
        const textY = endY + 10;
        ctx.fillStyle = "black";
        ctx.fillText(Math.round(i), textX, textY);
      }
    }
  }
  function DrawUnitsYNegative(X, downY, isNumerate) {
    for (
      var i = segmentLength / unitSize;
      i <= unitCount;
      i += segmentLength / unitSize
    ) {
      const startX = X - segmentSize;
      const endX = X + segmentSize;

      let startY = downY + i * unitSize;
      let endY = downY + i * unitSize;

      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);

      if (isNumerate) {
        const textX = endX + 5;
        const textY = startY + 3;
        ctx.fillStyle = "black";
        ctx.fillText(Math.round(i) * -1, textX, textY);
      }
    }
  }
  function DrawUnitsXNegative(leftX, topY, isNumerate) {
    for (
      var i = segmentLength / unitSize;
      i <= unitCount;
      i += segmentLength / unitSize
    ) {
      const startY = topY - segmentSize;
      const endY = topY + segmentSize;

      let startX = leftX - i * unitSize;
      let endX = leftX - i * unitSize;

      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);

      if (isNumerate) {
        const textX = startX - 3;
        const textY = endY + 10;
        ctx.fillStyle = "black";
        ctx.fillText(Math.round(i) * -1, textX, textY);
      }
    }
  }
  function DrawGrid(gap) {
    const lineHCount = canvas.height / (segmentLength + 1);
    const lineWCount = canvas.width / (segmentLength + 1);
    for (let i = 0; i <= lineHCount; i++) {
      let Y = centerY + i * gap;
      let _Y = centerY - i * gap;
      ctx.moveTo(0, Y);
      ctx.lineTo(canvas.width, Y);

      ctx.moveTo(0, _Y);
      ctx.lineTo(canvas.width, _Y);
    }
    for (let i = 0; i <= lineWCount; i++) {
      let X = centerX + i * gap;
      let _X = centerX - i * gap;
      ctx.moveTo(X, 0);
      ctx.lineTo(X, canvas.height);

      ctx.moveTo(_X, 0);
      ctx.lineTo(_X, canvas.height);
    }
  }
}
function CheckUnitCount() {
  const unitCountField = $("#unit-count");
  if (unitCountField.value === "") {
    showErrorMessage("Enter units count", "#error-message-unit");
    unitCountField.style.border = "1px solid red";
    return false;
  }

  const value = parseInt(unitCountField.value);
  const min = parseInt(unitCountField.min);
  const max = parseInt(unitCountField.max);

  if (value > max || value < min) {
    showErrorMessage(
      value + " is out of range [" + min + ", " + max + "]",
      "#error-message-unit"
    );
    unitCountField.style.border = "1px solid red";

    return false;
  }

  return true;
}

function AddNewBut() {
  $(".addpoint-header h3").textContent = "Add point";
  let confirmButton = $(".create-point-but");
  confirmButton.textContent = "Create";
  confirmButton.addEventListener("click", CreatePointBut);

  ToogleBlocks($("#addpoint-container"), $(".points-container"));
}
let saveEditListener;
function EditPoint(id) {
  const point = pointList.find((p) => p.id === id);
  $("#x-field").value = point.x;
  $("#y-field").value = point.y;
  $("#point-color").value = point.color;

  $(".addpoint-header h3").textContent = "Edit";
  let confirmButton = $(".create-point-but");
  confirmButton.textContent = "Save";
  saveEditListener = () => {
    SavePointBut(point);
  };
  confirmButton.addEventListener("click", saveEditListener);

  ToogleBlocks($("#addpoint-container"), $(".points-container"));
}
function DeletePoint(id) {
  RemovePointFromList(id);
  Redraw();
}
function CloseAddPointBut() {
  ToogleBlocks($(".points-container"), $("#addpoint-container"));
  ClearPointFields();
}

function CreateNewPoint_Base(x, y, color) {
  if (pointList.length === maxPointPossible) {
    alert(
      `You can't add more points. Maximum is ${maxPointPossible}. Try to delete some points or use other method of creation.`
    );
    return;
  }

  let newPoint = new Point(x, y, color);
  const ul = $(".points-list");
  pointList.push(newPoint);
  AddToListUL(newPoint, ul);
  return true;
}
function CreatePointBut() {
  if (!ValidateForm("point")) return;

  const pointValues = {
    x: parseFloat($("#x-field").value),
    y: parseFloat($("#y-field").value),
    color: $("#point-color").value,
  };
  if (!CreateNewPoint_Base(pointValues.x, pointValues.y, pointValues.color))
    return;

  Redraw();
  ToogleBlocks($(".points-container"), $("#addpoint-container"));
  ClearPointFields();
}
function CreatePointDoubleClick(x, y) {
  const canvas = $("#myCanvas");

  if (x > Point.maxX) x = Point.maxX;
  if (y > Point.maxY) y = Point.maxY;
  if (x < Point.minX) x = Point.minX;
  if (y < Point.minY) y = Point.minY;

  if (!CreateNewPoint_Base(x, y, "#000")) return;

  Redraw();
  ToogleBlocks($(".points-container"), $("#addpoint-container"));
}
function SavePointBut(point) {
  if (!ValidateForm("point")) return;
  const pointValues = {
    x: parseFloat($("#x-field").value),
    y: parseFloat($("#y-field").value),
    color: $("#point-color").value,
  };
  let isChanged = false;

  if (point.x !== pointValues.x) {
    point.x = pointValues.x;
    isChanged = true;
  }
  if (point.y !== pointValues.y) {
    point.y = pointValues.y;
    isChanged = true;
  }
  if (point.color !== pointValues.color) {
    point.color = pointValues.color;
    isChanged = true;
  }
  if (isChanged) {
    document.getElementById(`${point.id}-info`).textContent = `${point.coords}`;
    document.getElementById(
      `${point.id}-color`
    ).style.backgroundColor = `${point.color}`;
    Redraw();
  }

  ToogleBlocks($(".points-container"), $("#addpoint-container"));
  ClearPointFields();
}

function AddToListUL(newPoint, ul) {
  const li = document.createElement("li");
  li.id = `point-${newPoint.id}`;
  li.draggable = true; // Додаємо можливість перетягування
  li.innerHTML = `
        <div>
          <span id="${newPoint.id}-color" class="point-color" style="background-color: ${newPoint.color};"></span>
          <h3 id="${newPoint.id}-info">${newPoint.coords}</h3>
        </div>
        <div>
          <button class="button-edit" onclick="EditPoint(${newPoint.id})">
            <img src="/Images/pencil.png">
          </button>
          <button class="button-delete" onclick="DeletePoint(${newPoint.id})">
            <img src="/Images/bin.png">
          </button>
        </div>
  `;

  // Додаємо обробники подій для перетягування
  li.addEventListener("dragstart", handleDragStart);
  li.addEventListener("dragover", handleDragOver);
  li.addEventListener("dragleave", handleDragLeave);
  li.addEventListener("drop", handleDrop);

  ul.appendChild(li);

  $(".points-header h3").textContent = `Points: ${pointList.length}`;
}
function RemovePointFromList(id) {
  const li = document.getElementById(`point-${id}`);
  if (li) {
    li.remove();
  }
  pointList = pointList.filter((p) => p.id !== id);

  $(".points-header h3").textContent = `Points: ${pointList.length}`;
}
// Переміщуємо елемент
function handleDragStart(event) {
  event.dataTransfer.setData("text/plain", event.target.id);
}
function handleDragOver(event) {
  event.preventDefault(); // Дозволяємо кидати сюди елементи
  const dropTarget = event.target.closest("li");
  if (dropTarget) {
    dropTarget.classList.add("drag-over"); // Додаємо клас підсвічування
  }
}
function handleDragLeave(event) {
  const dropTarget = event.target.closest("li");
  if (dropTarget) {
    dropTarget.classList.remove("drag-over"); // Видаляємо клас підсвічування
  }
}
function handleDrop(event) {
  event.preventDefault();
  const draggedId = event.dataTransfer.getData("text/plain");
  const draggedElement = document.getElementById(draggedId);
  const dropTarget = event.target.closest("li");
  const dropId = dropTarget.id;

  if (dropTarget && dropTarget !== draggedElement) {
    // міняєм місцями список ul
    dropTarget.parentNode.insertBefore(draggedElement, dropTarget.nextSibling);

    // Відсортовуємо масив точок в програмі
    const draggedIndex = pointList.findIndex(
      (p) => parseInt(draggedId.match(/\d+$/)[0], 10) === p.id
    );
    const dropIndex = pointList.findIndex(
      (p) => parseInt(dropId.match(/\d+$/)[0], 10) === p.id
    );
    const [movedElement] = pointList.splice(draggedIndex, 1); // Вирізаємо елемент
    pointList.splice(dropIndex + 1, 0, movedElement); // Вставляємо на нове місце

    // Перемальовуємо полотно
    Redraw();
  }

  // Забираємо підсвічування після дропу
  dropTarget.classList.remove("drag-over");
}

function ShowPointsYBut() {
  if (!ValidateForm("optionY")) return;

  const startField = $("#diapasonY-start");
  const endField = $("#diapasonY-end");
  const startValue = parseInt(startField.value);
  const endValue = parseInt(endField.value);
  /*Validate diapasons*/ {
    if (startValue > endValue) {
      showErrorMessage(
        "Diapason start must be less than end.",
        "#error-message-optionY"
      );
      startField.style.border = "1px solid red";
      endField.style.border = "1px solid red";
      return;
    } else {
      startField.style.border = "1px solid black";
      endField.style.border = "1px solid black";
    }
  }

  // arrays for points
  const filteredPoints = curvePoints.filter(
    (point) => point.y >= startValue && point.y <= endValue
  );
  for (let i = 0; i < filteredPoints.length; i++) {
    filteredPoints[i].x = Math.round(filteredPoints[i].x * 1000) / 1000;
    filteredPoints[i].y = Math.round(filteredPoints[i].y * 1000) / 1000;
  }

  // define needed points
  let countYLeft = parseFloat($("#diapasonY-step").value);
  let step = 1;
  const length = filteredPoints.length;
  let lengthLeft = length;
  if (lengthLeft === 0)
    CreateMassageOutput(
      "There is no points of Bezier's curve in given diapason."
    );
  else if (countYLeft === 1)
    CreatePointOutput(filteredPoints[parseInt(lengthLeft / 2)]);
  else {
    for (let i = 1; i <= length && countYLeft > 0; i += step) {
      outputPoints.push(filteredPoints[i - 1]);
      lengthLeft -= step;
      countYLeft--;

      step = parseInt(lengthLeft / countYLeft);
      if (step === 0) {
        CreateMassageOutput(`There is only ${length} points in this dispason`);
        break;
      }
    }
  }

  // // output points in modal window
  // const outputList = $("#output-list");
  // $(
  //   ".modal-overlay h3"
  // ).textContent = `Points in diapason Y:[${startValue};${endValue}]`;
  // outputPoints.forEach((point) => CreatePointOutput(point));
  // document.querySelector(".modal-overlay").classList.add("show");
  // document.querySelector(".options-output").classList.add("show");

  // output points in canvas
  const seeCanvas = $("#seeCanvas");
  DrawCoords(seeCanvas, unitCount);
  DrawCurve(seeCanvas, pointList, BezierCurveMethod);
  DrawPoints(seeCanvas, outputPoints, 2, "red");
  $(".modal-overlay-canvas").classList.add("show");
  $(".curve-output").classList.add("show");

  function CreatePointOutput(point) {
    const li = document.createElement("li");
    const colorCircle = document.createElement("span");
    colorCircle.style.display = "inline-block";
    colorCircle.style.width = "10px";
    colorCircle.style.height = "10px";
    colorCircle.style.borderRadius = "50%";
    colorCircle.style.backgroundColor = "black";
    colorCircle.style.marginRight = "10px";

    li.appendChild(colorCircle);
    li.appendChild(
      document.createTextNode(
        `Point: (X: ${point.x.toFixed(5)}, ` + `Y: ${point.y.toFixed(5)})`
      )
    );
    outputList.appendChild(li);
  }
  function CreateMassageOutput(message) {
    const p = document.createElement("p");
    p.appendChild(document.createTextNode(message));
    outputList.appendChild(p);
  }
}
function CalculatePolinomsBut() {
  const iStartField = $("#diapasonI-start");
  const iEndField = $("#diapasonI-end");
  const iStartValue = parseInt(iStartField.value);
  const iEndValue = parseInt(iEndField.value);
  iStartField.max = pointList.length - 1 > 0 ? pointList.length - 1 : 0;
  iEndField.max = pointList.length - 1 > 0 ? pointList.length - 1 : 0;

  if (!ValidateForm("optionPolinom")) return;

  const tStartField = $("#diapasonT-start");
  const tEndField = $("#diapasonT-end");
  const tStartValue = parseFloat(tStartField.value);
  const tEndValue = parseFloat(tEndField.value);
  /*Validate diapasons*/ {
    let isWrong = false;
    if (iStartValue > iEndValue) {
      showErrorMessage(
        "Diapason start must be less than end.",
        "#error-message-optionPolinom"
      );
      iStartField.style.border = "1px solid red";
      iEndField.style.border = "1px solid red";
      isWrong = true;
    } else {
      iStartField.style.border = "1px solid black";
      iEndField.style.border = "1px solid black";
    }

    if (tStartValue > tEndValue) {
      showErrorMessage(
        "Diapason start must be less than end.",
        "#error-message-optionPolinom"
      );
      tStartField.style.border = "1px solid red";
      tEndField.style.border = "1px solid red";
      isWrong = true;
    } else {
      tStartField.style.border = "1px solid black";
      tEndField.style.border = "1px solid black";
    }
    if (isWrong) return;
  }

  const outputList = $("#output-list");
  const n = pointList.length - 1;
  if (n < 0) {
    showErrorMessage(
      "There is no points. Add some points at the curve",
      "#error-message-optionPolinom"
    );
    return;
  } else iStartField.dispatchEvent(new Event("input"));

  const tD = 0.1;
  $(".modal-overlay h3").innerHTML =
    "Polynoms b<sub>in</sub>(t) in diapason " +
    `i:[${iStartValue};${iEndValue}], t:[${tStartValue};${tEndValue}], tD=${tD}`;

  let tCur = tStartValue;
  while (tCur <= tEndValue) {
    for (let i = iStartValue; i <= iEndValue; i++) {
      const li = document.createElement("li");
      li.innerHTML =
        `Polynom b<sub>${i},${n}</sub>(${Math.round(tCur * 10) / 10}): ` +
        Math.round(PolynomBernshteina(i, n, tCur) * Math.pow(10, 5)) /
          Math.pow(10, 5);
      outputList.appendChild(li);
    }
    tCur += tD;
  }

  document.querySelector(".modal-overlay").classList.add("show");
  document.querySelector(".options-output").classList.add("show");
}
function OutputClose() {
  $(".modal-overlay").classList.remove("show");
  $(".options-output").classList.remove("show");

  ClearOptionOutput();
}

function ValidateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) {
    console.error(`Form with id "${formId}" not found.`);
    return false;
  }

  const coordFields = Array.from(form.querySelectorAll("input"));
  let emptyFields = FilterEmptyFields(coordFields);

  if (emptyFields.length !== 0) {
    console.log(emptyFields);
    emptyFields.forEach((f) => (f.style.border = "1px solid red"));

    let message = "All fields must be defined";
    showErrorMessage(message, `#error-message-${formId}`);
    return false;
  }

  for (let i = 0; i < coordFields.length; i++) {
    const value = parseFloat(coordFields[i].value);
    const min = parseFloat(coordFields[i].min);
    const max = parseFloat(coordFields[i].max);

    if (value > max || value < min) {
      coordFields[i].style.border = "1px solid red";
      showErrorMessage(
        `${value} is out of range [${min}, ${max}]`,
        `#error-message-${formId}`
      );
      return false;
    }
  }

  return true;

  function FilterEmptyFields(fields) {
    let emptyFields = [];
    for (let i = 0; i < fields.length; i++)
      if (!fields[i].value.trim()) emptyFields.push(fields[i]);

    return emptyFields;
  }
}

function checkInterval(event, errorId) {
  const diapasonIStartField = $("#diapasonI-start");
  const diapasonIEndField = $("#diapasonI-end");
  diapasonIStartField.max = pointList.length - 1 > 0 ? pointList.length - 1 : 0;
  diapasonIEndField.max = pointList.length - 1 > 0 ? pointList.length - 1 : 0;

  const value = parseFloat(event.target.value);
  const min = parseFloat(event.target.min);
  const max = parseFloat(event.target.max);

  if (value === "") return;
  if (value < min || value > max) {
    showErrorMessage(
      value + " is out of range [" + min + ", " + max + "]",
      errorId
    );
    event.target.style.border = "1px solid red";
  }
}
function hideErrorMessage(event, errorId) {
  let errorElement = $(errorId);

  errorElement.style.display = "none";
  event.target.style.border = "1px solid black";
}
function showErrorMessage(message, where) {
  let errorElement = $(where);
  errorElement.textContent = message;

  errorElement.style.display = "block"; // Показати повідомлення
}

function Redraw() {
  const canvas = $("#myCanvas");
  ClearCanvas(canvas);
  DrawCoords(canvas, unitCount);
  DrawPoints(canvas, pointList);
  DrawCarcas(canvas, pointList);
  DrawCurve(canvas, pointList, BezierCurveMethod);
}
function DrawPoints(canvas, points, r = 4, color = "#000000") {
  // Get canvas context
  const ctx = canvas.getContext("2d");

  points.forEach((p) => {
    const { x, y } = ToCanvas(p.x, p.y);

    // Draw point
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.arc(x, y, r, 0, 2 * Math.PI, (anticlockwise = false));
    ctx.stroke();
    ctx.fill();
  });
}
function DrawCarcas(canvas, points, width = 0.3) {
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = ToCanvas(points[i].x, points[i].y);
    const p2 = ToCanvas(points[i + 1].x, points[i + 1].y);

    // Draw line
    DrawLine(canvas, p1, p2, width, "black");
  }
}
function DrawCurve(canvas, points, method, width = 1) {
  const curveColor = $("#curve-color").value;

  curvePoints = [];
  method(canvas, points, width, curveColor);
}

function DrawLine(canvas, pStart, pEnd, width, color) {
  const ctx = canvas.getContext("2d");

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.moveTo(pStart.x, pStart.y);
  ctx.lineTo(pEnd.x, pEnd.y);
  ctx.stroke();
}
function ParamMethod(canvas, points, width, color, tD = deltaT) {
  const n = points.length - 1;
  if (n <= 0) return;

  const tStart = 0;
  const tEnd = 1;
  const EPS = tD / 10;

  let tCur = tStart;
  let tNext = tCur + tD;
  let pStart = { x: Bx(tCur), y: By(tCur) };
  let pEnd = pStart;
  while (tNext <= tEnd + EPS) {
    pStart = pEnd;
    pEnd = { x: Bx(tNext), y: By(tNext) };
    curvePoints.push(CanvasToCoord(pStart.x, pStart.y));

    DrawLine(canvas, pStart, pEnd, width, color);
    tCur = tNext;
    tNext += tD;
  }
  curvePoints.push(CanvasToCoord(pEnd.x, pEnd.y));

  function Bx(t) {
    let sum = 0;
    for (let i = 0; i <= n; i++) {
      const pCanvas = ToCanvas(points[i].x, points[i].y);
      sum += pCanvas.x * b(i, n, t);
    }

    return sum;
  }
  function By(t) {
    let sum = 0;
    for (let i = 0; i <= n; i++) {
      const pCanvas = ToCanvas(points[i].x, points[i].y);
      sum += pCanvas.y * b(i, n, t);
    }

    return sum;
  }

  function b(i, n, t) {
    return PolynomBernshteina(i, n, t);
  }
}
function RecursiveMethod(canvas, points, width, color, tD = deltaT) {
  const n = points.length - 1;
  if (n <= 0) return;

  const tStart = 0;
  const tEnd = 1;
  const EPS = tD / 10;

  let tCur = tStart;
  let tNext = tCur + tD;
  let pStart = { x: Bx(points, 0, n, tCur), y: By(points, 0, n, tCur) };
  let pEnd = pStart;
  while (tNext <= tEnd + EPS) {
    pStart = pEnd;
    pEnd = { x: Bx(points, 0, n, tNext), y: By(points, 0, n, tNext) };
    curvePoints.push(CanvasToCoord(pStart.x, pStart.y));

    DrawLine(canvas, pStart, pEnd, width, color);
    tCur = tNext;
    tNext += tD;
  }
  curvePoints.push(CanvasToCoord(pEnd.x, pEnd.y));

  function Bx(points, iStart, iEnd, t) {
    if (iEnd === iStart) return ToCanvas(points[iStart].x, 0).x;

    return (
      (1 - t) * Bx(points, iStart, iEnd - 1, t) +
      t * Bx(points, iStart + 1, iEnd, t)
    );
  }
  function By(points, iStart, iEnd, t) {
    if (iEnd === iStart) return ToCanvas(0, points[iStart].y).y;

    return (
      (1 - t) * By(points, iStart, iEnd - 1, t) +
      t * By(points, iStart + 1, iEnd, t)
    );
  }
}

function Factorial(n) {
  if (n < 0) return undefined; // Для від'ємних чисел факторіал не існує
  let result = 1;
  for (let i = 1; i <= n; i++) {
    result *= i;
  }
  return result;
}
function PolynomBernshteina(i, n, t) {
  return (
    (Factorial(n) / (Factorial(i) * Factorial(n - i))) *
    Math.pow(t, i) *
    Math.pow(1 - t, n - i)
  );
}
