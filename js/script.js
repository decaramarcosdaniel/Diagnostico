const svg = document.getElementById("ruleta");
const botones = document.querySelectorAll(".btn");
const modal = document.getElementById("modal");
const titulo = document.getElementById("titulo");
const contenido = document.getElementById("contenido");
const cerrar = document.querySelector(".cerrar");

let mano = "diestro";

const cx = 100;
const cy = 100;
const r = 90;
const rCentro = 25;

// 🔥 ÁNGULOS (1 y 5 más grandes)
const angulos = {
  1: 72,
  2: 36,
  3: 36,
  4: 36,
  5: 72,
  6: 36,
  7: 36,
  8: 36
};

// DATOS COMPLETOS
const datos = {
  1:{titulo:"En este sector, los disparos se concentrarán cuando:",
     items:[
      "Al alinear la mira, se deje el guión grueso.",
      "Se mueva la muñeca hacia arriba en el disparo.",
      "Se anticipe el retroceso del arma hacia arriba."
     ]},

  2:{titulo:"Errores de mano:",
     items:[
      "Aflojar la mano antes del disparo.",
      "Empujar con la base de la mano."
     ]},

  3:{titulo:"Influencia del pulgar e índice:",
     items:[
      "El pulgar empuja a la derecha.",
      "Índice muy adentro en el disparador."
     ]},

  4:{titulo:"Influencia de los dedos:",
     items:[
      "Exceso de presión en la empuñadura."
     ]},

  5:{titulo:"Errores comunes:",
     items:[
      "Guión bajo (quiebre de muñeca).",
      "Muñeca hacia abajo.",
      "Relajación prematura.",
      "Tironeo del disparador."
     ]},

  6:{titulo:"Conjunción de errores:",
     items:[
      "Tironeo + gancho de índice."
     ]},

  7:{titulo:"Causa principal:",
     items:[
      "Gancho de índice."
     ]},

  8:{titulo:"Errores corregibles:",
     items:[
      "Falta de follow through.",
      "Anticipación del retroceso."
     ]}
};

// 🔁 ÓRDENES VISUALES
const ordenDiestro = [1,2,3,4,5,6,7,8];
const ordenZurdo  = [1,8,7,6,5,4,3,2];

// 🎯 DIBUJAR RULETA
function dibujar() {
  svg.innerHTML = "";

  const orden = mano === "diestro" ? ordenDiestro : ordenZurdo;

  let inicio = -90 - (angulos[1]/2);

  orden.forEach(num => {

    const angulo = angulos[num];

    const ang1 = (Math.PI/180)*inicio;
    const ang2 = (Math.PI/180)*(inicio + angulo);

    const x1 = cx + r*Math.cos(ang1);
    const y1 = cy + r*Math.sin(ang1);

    const x2 = cx + r*Math.cos(ang2);
    const y2 = cy + r*Math.sin(ang2);

    // sector
    const path = document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d",`
      M ${cx} ${cy}
      L ${x1} ${y1}
      A ${r} ${r} 0 0 1 ${x2} ${y2}
      Z
    `);
    path.setAttribute("class","sector");
    path.addEventListener("click",()=>abrirModal(num));
    svg.appendChild(path);

    // línea
    const linea = document.createElementNS("http://www.w3.org/2000/svg","line");
    linea.setAttribute("x1",cx);
    linea.setAttribute("y1",cy);
    linea.setAttribute("x2",x1);
    linea.setAttribute("y2",y1);
    linea.setAttribute("class","linea");
    svg.appendChild(linea);

    // número
    const angMedio = (ang1+ang2)/2;
    const tx = cx + (r*0.65)*Math.cos(angMedio);
    const ty = cy + (r*0.65)*Math.sin(angMedio);

    const text = document.createElementNS("http://www.w3.org/2000/svg","text");
    text.setAttribute("x",tx);
    text.setAttribute("y",ty);
    text.setAttribute("class","numero");
    text.setAttribute("text-anchor","middle");
    text.setAttribute("dominant-baseline","middle");
    text.textContent = num;
    svg.appendChild(text);

    inicio += angulo;
  });

  // centro blanco
  const centro = document.createElementNS("http://www.w3.org/2000/svg","circle");
  centro.setAttribute("cx",cx);
  centro.setAttribute("cy",cy);
  centro.setAttribute("r",rCentro);
  centro.setAttribute("class","centro");
  svg.appendChild(centro);
}

// MODAL
function abrirModal(sector){
  titulo.textContent = "Sector " + sector;
  contenido.innerHTML = "";

  const data = datos[sector];

  const p = document.createElement("p");
  p.style.fontWeight = "bold";
  p.textContent = data.titulo;
  contenido.appendChild(p);

  const ul = document.createElement("ul");

  data.items.forEach(i=>{
    const li = document.createElement("li");
    li.textContent = i;
    ul.appendChild(li);
  });

  contenido.appendChild(ul);

  modal.style.display="flex";
}

// EVENTOS
botones.forEach(btn=>{
  btn.addEventListener("click",()=>{
    botones.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    mano = btn.dataset.mano;
    dibujar();
  });
});

cerrar.onclick=()=>modal.style.display="none";
window.onclick=(e)=>{ if(e.target===modal) modal.style.display="none"; }

// INIT
dibujar();