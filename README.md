# Inventario de Infraestructura — Preparatoria Tonalá Sur

Sistema institucional de auditoría física, mapeo arquitectónico y relevamiento de infraestructura tecnológica y protección eléctrica para los laboratorios de cómputo de la **Preparatoria Tonalá Sur (Universidad de Guadalajara)**.

## 📌 Resumen de Infraestructura

- **Total de computadoras:** 74 equipos (calculados dinámicamente)
- **Laboratorios:** 2 salas activas (LAB A y LAB B)
- **Distribución:**
  - **Laboratorio A:** 41 equipos (40 alumnos en 5 filas + 1 docente PC00) &bull; 20 UPS APC (1 UPS cada 2 PCs).
  - **Laboratorio B:** 33 equipos (32 alumnos en 4 filas + 1 docente PC00) &bull; 8 reguladores Volteck (Filas 1-2 provisionales) + 8 UPS APC (Filas 3-4 provisionales).
- **Protección eléctrica modelada:** 28 UPS APC de alumnos + 8 reguladores Volteck de alumnos.

## 🛠️ Tecnologías Utilizadas

- **HTML5 Semántico y Accesible:** Roles ARIA, botones nativos para estaciones de trabajo, navegación mediante pestañas.
- **CSS3 Puro:** Diseño minimalista, institucional y responsivo con paleta sobria (azul discreto para UPS APC y verde para reguladores Volteck), sin librerías externas.
- **JavaScript Moderno (ES Modules):** Mapeo reactivo, cálculo de métricas en tiempo real e interacción con el plano interactivo.
- **Vite & `vite-plugin-singlefile`:** Compilación a un único archivo HTML autónomo (`dist/index.html`) ejecutable localmente sin servidor ni internet (`file://`).

## 🚀 Comandos de Ejecución y Compilación

### 1. Instalación de dependencias
```bash
npm install
```

### 2. Entorno de desarrollo
Inicia el servidor local de Vite con recarga rápida (HMR):
```bash
npm run dev
```

### 3. Compilación a HTML Autónomo (Producción)
Genera el archivo empaquetado en `dist/index.html`:
```bash
npm run build
```

> **Apertura directa:** El archivo generado en `dist/index.html` puede abrirse con doble clic directamente en cualquier navegador web bajo el protocolo `file://`, sin necesidad de Node.js, servidores web ni conexión a internet.
