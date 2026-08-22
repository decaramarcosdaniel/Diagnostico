/* =========================================================
   DIAGNÓSTICO DE TIRO
   Geometría basada en la imagen real de 1060 x 1484 px.
========================================================= */

const FIGURE = {
    width: 1060,
    height: 1484,

    // Centro del círculo real de la figura.
    centerX: 581.42,
    centerY: 674.64,

    // Radio aproximado del círculo real.
    centerRadius: 157.80
};

/*
   Rueda lógica invisible.

   1 y 5 = 72°
   2, 3, 4, 6, 7 y 8 = 36°

   La distribución queda:
        8 | 1 | 2
        7 |   | 3
        6 | 5 | 4

   El ángulo 0° apunta hacia la derecha.
   -90° apunta hacia arriba.
*/
const WHEEL = {
    sectors: [
        { number: 1, start: -126, end: -54 },
        { number: 2, start: -54, end: -18 },
        { number: 3, start: -18, end: 18 },
        { number: 4, start: 18, end: 54 },
        { number: 5, start: 54, end: 126 },
        { number: 6, start: 126, end: 162 },
        { number: 7, start: 162, end: 198 },
        { number: 8, start: 198, end: 234 }
    ]
};

// Correspondencia para tirador zurdo.
const LEFT_HAND_MAP = {
    1: 5,
    2: 8,
    3: 7,
    4: 6,
    5: 1,
    6: 4,
    7: 3,
    8: 2
};

const ERRORS = {
    1: {
        title: "En este sector, los disparos se concentrarán cada vez que:",
        items: [
            "Al alinear la mira, se deje el guión grueso.",
            "Se mueva la muñeca hacia arriba en el instante del disparo.",
            "Se anticipe el retroceso del arma, con un movimiento hacia arriba."
        ]
    },
    2: {
        title: "Son errores de mano a saber:",
        items: [
            "Aflojar la mano en el instante previo del disparo.",
            "Empujar con la base de la mano en el mismo instante."
        ]
    },
    3: {
        title: "Los dedos pulgar e índice influyen con su mal desempeño:",
        items: [
            "El pulgar empuja a la derecha, por reflejo por la presión del índice.",
            "El índice está colocado muy adentro sobre la cola del disparador."
        ]
    },
    4: {
        title: "Influencia de los dedos de la mano:",
        items: [
            "Oprimir más fuertemente la empuñadura en el instante del disparo."
        ]
    },
    5: {
        title: "Errores muy comunes en los tiradores:",
        items: [
            "La puntería se establece con el guión fino (bajo) (quiebre de muñeca).",
            "Se mueve la muñeca hacia abajo en el instante del disparo.",
            "Relajamiento prematuro de la mano, antes del disparo.",
            "Tironeo violento de la cola del disparador."
        ]
    },
    6: {
        title: "Resulta de la conjunción de dos errores:",
        items: [
            "Tironeo violento de la cola del disparador y gancho de índice."
        ]
    },
    7: {
        title: "Inequívocamente los disparos se producen por:",
        items: [
            "Gancho de índice."
        ]
    },
    8: {
        title: "Dos errores fáciles de anular, que también encontramos en el Sector:",
        items: [
            "Falta de Follow Through (seguir el movimiento).",
            "Anticipación del retroceso en el momento del disparo."
        ]
    }
};

/* ========================= ELEMENTOS ========================= */

const homeView = document.getElementById("homeView");
const errorsView = document.getElementById("errorsView");
const diagnosticView = document.getElementById("diagnosticView");

const goDiagnostic = document.getElementById("goDiagnostic");
const goErrors = document.getElementById("goErrors");

const target = document.getElementById("target");
const overlay = document.getElementById("overlay");

const contador = document.getElementById("contador");
const manoActual = document.getElementById("manoActual");

const undoButton = document.getElementById("undoButton");
const clearButton = document.getElementById("clearButton");
const diagnosticButton = document.getElementById("diagnosticButton");

const handButtons = document.querySelectorAll(".hand-button");

const errorsList = document.getElementById("errorsList");

const resultModal = document.getElementById("resultModal");
const closeResult = document.getElementById("closeResult");

const resultTotal = document.getElementById("resultTotal");
const resultPrincipal = document.getElementById("resultPrincipal");
const resultPercentage = document.getElementById("resultPercentage");

const sectorResults = document.getElementById("sectorResults");
const errorResults = document.getElementById("errorResults");
const diagnosticConclusion = document.getElementById("diagnosticConclusion");

let hand = "diestro";
let shots = [];

/* ========================= NAVEGACIÓN ========================= */

function showView(view) {
    homeView.hidden = true;
    errorsView.hidden = true;
    diagnosticView.hidden = true;

    view.hidden = false;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

goDiagnostic.addEventListener("click", () => showView(diagnosticView));
goErrors.addEventListener("click", () => showView(errorsView));

document.querySelectorAll("[data-back]").forEach(button => {
    button.addEventListener("click", () => showView(homeView));
});

/* ========================= ERRORES ========================= */

function renderErrors() {
    errorsList.innerHTML = "";

    for (let sector = 1; sector <= 8; sector++) {
        const card = document.createElement("article");
        card.className = "error-card";

        card.innerHTML = `
            <div class="error-card__header">
                <div class="error-card__sector">Sector ${sector}</div>
                <div class="error-card__equivalence">
                    Zurdo → ${LEFT_HAND_MAP[sector]}
                </div>
            </div>

            <div class="error-card__title">
                ${ERRORS[sector].title}
            </div>

            <ul>
                ${ERRORS[sector].items.map(item => `<li>${item}</li>`).join("")}
            </ul>
        `;

        errorsList.appendChild(card);
    }
}

renderErrors();

/* ========================= GEOMETRÍA ========================= */

function normalizeAngle(angle) {
    while (angle > 180) angle -= 360;
    while (angle <= -180) angle += 360;
    return angle;
}

function getVisualSector(angle) {
    // Sector 8 cruza el límite +180/-180.
    if (angle >= 198 || angle < -126) {
        return 8;
    }

    const sector = WHEEL.sectors.find(
        item => angle >= item.start && angle < item.end
    );

    return sector ? sector.number : 8;
}

function classifyPoint(x, y) {
    const dx = x - FIGURE.centerX;
    const dy = y - FIGURE.centerY;

    const distance = Math.hypot(dx, dy);

    // Centro real de la figura.
    if (distance <= FIGURE.centerRadius) {
        return {
            center: true,
            visualSector: 0,
            diagnosticSector: 0
        };
    }

    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    angle = normalizeAngle(angle);

    const visualSector = getVisualSector(angle);

    const diagnosticSector =
        hand === "zurdo"
            ? LEFT_HAND_MAP[visualSector]
            : visualSector;

    return {
        center: false,
        visualSector,
        diagnosticSector
    };
}

/* ========================= COORDENADAS ========================= */

function getImageCoordinates(event) {
    const rect = target.getBoundingClientRect();

    return {
        x: ((event.clientX - rect.left) / rect.width) * FIGURE.width,
        y: ((event.clientY - rect.top) / rect.height) * FIGURE.height
    };
}

/* ========================= REGISTRAR DISPARO ========================= */

target.addEventListener("pointerdown", event => {
    event.preventDefault();

    const point = getImageCoordinates(event);
    const classification = classifyPoint(point.x, point.y);

    shots.push({
        id: shots.length + 1,
        x: point.x,
        y: point.y,
        center: classification.center,
        visualSector: classification.visualSector,
        diagnosticSector: classification.diagnosticSector
    });

    updateUI();
});

/* ========================= DIBUJAR IMPACTOS ========================= */

function drawShots() {
    overlay.innerHTML = "";

    shots.forEach(shot => {
        const group = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );

        const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

        circle.setAttribute("cx", shot.x);
        circle.setAttribute("cy", shot.y);
        circle.setAttribute("r", 17);
        circle.setAttribute("class", "impact-circle");

        const text = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        text.setAttribute("x", shot.x);
        text.setAttribute("y", shot.y);
        text.setAttribute("class", "impact-number");
        text.textContent = shot.id;

        group.append(circle, text);
        overlay.appendChild(group);
    });
}

/* ========================= UI ========================= */

function updateUI() {
    contador.textContent = shots.length;
    manoActual.textContent = hand.toUpperCase();

    const hasShots = shots.length > 0;

    undoButton.disabled = !hasShots;
    clearButton.disabled = !hasShots;
    diagnosticButton.disabled = !hasShots;

    drawShots();
}

/* ========================= DIESTRO / ZURDO ========================= */

handButtons.forEach(button => {
    button.addEventListener("click", () => {
        hand = button.dataset.hand;

        handButtons.forEach(item => {
            item.classList.toggle(
                "hand-button--active",
                item === button
            );
        });

        // Se conserva la ubicación física del impacto.
        // Solo cambia su interpretación diagnóstica.
        shots.forEach(shot => {
            shot.diagnosticSector = shot.center
                ? 0
                : hand === "zurdo"
                    ? LEFT_HAND_MAP[shot.visualSector]
                    : shot.visualSector;
        });

        updateUI();
    });
});

/* ========================= DESHACER ========================= */

undoButton.addEventListener("click", () => {
    if (!shots.length) return;

    shots.pop();

    shots.forEach((shot, index) => {
        shot.id = index + 1;
    });

    updateUI();
});

/* ========================= LIMPIAR ========================= */

clearButton.addEventListener("click", () => {
    if (!shots.length) return;

    if (!confirm("¿Desea eliminar todos los disparos registrados?")) {
        return;
    }

    shots = [];
    closeModal();
    updateUI();
});

/* ========================= DIAGNÓSTICO ========================= */

diagnosticButton.addEventListener("click", generateDiagnostic);

function generateDiagnostic() {
    if (!shots.length) return;

    const counts = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0
    };

    let centerCount = 0;

    shots.forEach(shot => {
        if (shot.center) {
            centerCount++;
        } else {
            counts[shot.diagnosticSector]++;
        }
    });

    const total = shots.length;

    const ranking = Object.entries(counts)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);

    const principal = ranking[0] || null;

    const principalPercentage = principal
        ? Math.round((principal[1] * 100) / total)
        : 0;

    resultTotal.textContent = total;

    if (principal) {
        resultPrincipal.textContent = `SECTOR ${principal[0]}`;
        resultPercentage.textContent = `${principalPercentage}%`;
    } else {
        resultPrincipal.textContent = "CENTRO";
        resultPercentage.textContent = "100%";
    }

    renderDistribution(counts, centerCount, total);
    renderPredominantErrors(ranking, total);
    renderConclusion(
        total,
        centerCount,
        principal,
        principalPercentage
    );

    openModal();
}

/* ========================= DISTRIBUCIÓN ========================= */

function renderDistribution(counts, centerCount, total) {
    sectorResults.innerHTML = "";

    // CENTRO SIEMPRE PRIMERO
    const centerPercentage = Math.round(
        (centerCount * 100) / total
    );

    const centerRow = document.createElement("div");
    centerRow.className = "sector-result sector-result--center";

    centerRow.innerHTML = `
        <div class="sector-result__name">CENTRO</div>
        <div class="sector-result__count">
            ${centerCount} ${centerCount === 1 ? "disparo" : "disparos"}
        </div>
        <div class="sector-result__percentage">
            ${centerPercentage}%
        </div>
    `;

    sectorResults.appendChild(centerRow);

    for (let sector = 1; sector <= 8; sector++) {
        const count = counts[sector];
        const percentage = Math.round((count * 100) / total);

        const row = document.createElement("div");
        row.className = "sector-result";

        row.innerHTML = `
            <div class="sector-result__name">Sector ${sector}</div>
            <div class="sector-result__count">
                ${count} ${count === 1 ? "disparo" : "disparos"}
            </div>
            <div class="sector-result__percentage">
                ${percentage}%
            </div>
        `;

        sectorResults.appendChild(row);
    }
}

/* ========================= ERRORES PREDOMINANTES ========================= */

function renderPredominantErrors(ranking, total) {
    errorResults.innerHTML = "";

    if (!ranking.length) {
        errorResults.innerHTML = `
            <div class="error-result">
                <div class="error-result__title">
                    Sin sectores de dispersión predominantes
                </div>
                <div class="error-result__meta">
                    Los impactos registrados se encuentran en el centro.
                </div>
            </div>
        `;
        return;
    }

    // Mostramos los sectores empatados en el máximo
    // y, como máximo, los tres primeros.
    const maxCount = ranking[0][1];

    const predominant = ranking
        .filter(([, count]) => count === maxCount)
        .slice(0, 3);

    predominant.forEach(([sector, count]) => {
        const percentage = Math.round((count * 100) / total);

        const card = document.createElement("div");
        card.className = "error-result";

        card.innerHTML = `
            <div class="error-result__title">
                Sector ${sector}
            </div>

            <div class="error-result__meta">
                ${count} ${count === 1 ? "disparo" : "disparos"}
                · ${percentage}%
            </div>

            <ul>
                ${ERRORS[sector].items.map(
                    item => `<li>${item}</li>`
                ).join("")}
            </ul>
        `;

        errorResults.appendChild(card);
    });
}

/* ========================= CONCLUSIÓN ========================= */

function renderConclusion(
    total,
    centerCount,
    principal,
    principalPercentage
) {
    if (centerCount === total) {
        diagnosticConclusion.innerHTML = `
            Se registraron <strong>${total}</strong>
            ${total === 1 ? "disparo" : "disparos"}.
            Todos los impactos se encuentran dentro del
            <strong>área central</strong>.
        `;
        return;
    }

    if (!principal) {
        diagnosticConclusion.innerHTML = `
            Se registraron <strong>${total}</strong>
            ${total === 1 ? "disparo" : "disparos"}.
            La distribución se concentra en el área central.
        `;
        return;
    }

    diagnosticConclusion.innerHTML = `
        Se registraron <strong>${total}</strong>
        ${total === 1 ? "disparo" : "disparos"}.
        La mayor concentración se encuentra en el
        <strong>Sector ${principal[0]}</strong>,
        con <strong>${principal[1]}</strong>
        ${principal[1] === 1 ? "impacto" : "impactos"}
        (${principalPercentage}%).
        Se recomienda prestar especial atención a los errores
        asociados a este sector.
    `;
}

/* ========================= MODAL ========================= */

function openModal() {
    resultModal.hidden = false;
    resultModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    resultModal.hidden = true;
    resultModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

closeResult.addEventListener("click", closeModal);

document.querySelector("[data-close-modal]")
    .addEventListener("click", closeModal);

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !resultModal.hidden) {
        closeModal();
    }
});

/* ========================= INICIO ========================= */

updateUI();
