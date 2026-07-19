// =================== KONFIGURASI ===================
const ukuranKertas = {
  lebar: 31,
  tinggi: 47,
};

// =================== DARK MODE ===================
const body = document.body;

document.querySelector(".nav-toggle")?.addEventListener("click", () => {
  body.classList.toggle("dark");
});

// =================== NOTIF ===================
// window.addEventListener("load", () => {
//   const notif = document.getElementById("mobile-notif");
//   const closeBtn = document.querySelector(".close-notif");

//   if (window.innerWidth > 768) {
//     notif.classList.remove("hidden");
//   }

//   closeBtn?.addEventListener("click", () => {
//     notif.classList.add("hidden");
//   });
// });

// =================== UTILITIES ===================
function closeAllDropdowns() {
  document
    .querySelectorAll(".menu")
    .forEach((menu) => menu.classList.remove("menu-open"));

  document
    .querySelectorAll(".caret")
    .forEach((caret) => caret.classList.remove("caret-rotate"));
}

function getSelectedText(title) {
  const dropdowns = document.querySelectorAll(".dropdown");

  for (const dropdown of dropdowns) {
    const label = dropdown.querySelector(".title");
    const selected = dropdown.querySelector(".selected");

    if (label?.innerText === title) {
      return selected?.innerText.trim() || "";
    }
  }

  return "";
}

// =================== DROPDOWN ===================
document.querySelectorAll(".dropdown").forEach((dropdown) => {
  const select = dropdown.querySelector(".select");
  const caret = dropdown.querySelector(".caret");
  const menu = dropdown.querySelector(".menu");
  const options = dropdown.querySelectorAll(".menu li");
  const selected = dropdown.querySelector(".selected");
  const title = dropdown.querySelector(".title");

  // Restore localStorage
  const savedValue = localStorage.getItem(title?.innerText);

  if (savedValue && selected) {
    selected.innerText = savedValue;

    options.forEach((option) => {
      option.classList.toggle(
        "active",
        option.innerText === savedValue
      );
    });
  }

  // Open dropdown
  select?.addEventListener("click", (e) => {
    e.stopPropagation();

    const isOpen = menu?.classList.contains("menu-open");

    closeAllDropdowns();

    if (!isOpen) {
      caret?.classList.add("caret-rotate");
      menu?.classList.add("menu-open");
    }
  });

  // Select option
  options.forEach((option) => {
    option.addEventListener("click", () => {
      const value = option.innerText;

      if (selected) {
        selected.innerText = value;
      }

      caret?.classList.remove("caret-rotate");
      menu?.classList.remove("menu-open");

      options.forEach((o) => o.classList.remove("active"));
      option.classList.add("active");

      localStorage.setItem(title?.innerText, value);

      calculateTotal();
    });
  });
});

// =================== CLOSE DROPDOWN ===================
window.addEventListener("click", () => {
  closeAllDropdowns();
});

// =================== INPUT HANDLING ===================
const DECIMAL_FIELDS = ["input-lebar", "input-tinggi"];

document.querySelectorAll("input").forEach((input) => {
  const key = input.id;
  const isDecimal = DECIMAL_FIELDS.includes(key);

  // Restore value
  const saved = localStorage.getItem(key);

  if (saved) {
    input.value = saved;
  }

  // Input event
  input.addEventListener("input", (e) => {
    let raw = e.target.value;

    if (isDecimal) {
      // batasi karakter: angka, koma, titik
      raw = raw.replace(/[^0-9.,]/g, "");

      // cuma boleh 1 tanda desimal (koma atau titik)
      const firstSepMatch = raw.match(/[.,]/);

      if (firstSepMatch) {
        const sepIndex = firstSepMatch.index;

        raw =
          raw.slice(0, sepIndex + 1) +
          raw.slice(sepIndex + 1).replace(/[.,]/g, "");
      }
    } else {
      // field integer (halaman, quantity): angka saja
      raw = raw.replace(/[^0-9]/g, "");
    }

    if (raw !== e.target.value) {
      e.target.value = raw;
    }

    let value = isDecimal
      ? parseFloat(raw.replace(",", ".")) || 0
      : parseInt(raw) || 0;

    if (value < 0) {
      value = 0;
      e.target.value = 0;
    }

    localStorage.setItem(key, e.target.value);

    calculateTotal();
  });
});

// =================== HITUNG KERTAS ===================
function calculateTotal() {
  const isian = getSelectedText("Isian Buku");
  const cover = getSelectedText("Cover Buku");
  const jilid = getSelectedText("Jenis Jilid");

  const halamanInput =
    parseInt(document.getElementById("input-halaman")?.value) || 0;

  const quantity =
    parseInt(document.getElementById("input-quantity")?.value) || 0;

  const lebar =
    parseFloat(
      document.getElementById("input-lebar")?.value.replace(",", ".")
    ) || 0;

  const tinggi =
    parseFloat(
      document.getElementById("input-tinggi")?.value.replace(",", ".")
    ) || 0;

  const output = document.getElementById("output");

  // Validasi
  if (
    !halamanInput ||
    !quantity ||
    !lebar ||
    !tinggi
  ) {
    output.innerHTML = "";
    return;
  }

  // =================== STEPLES ===================
  let totalHalaman = halamanInput * quantity;

  if (jilid === "Steples") {
    totalHalaman = Math.ceil(totalHalaman / 4) * 4;

    const dropdownIsian = Array.from(
      document.querySelectorAll(".dropdown")
    ).find(
      (d) =>
        d.querySelector(".title")?.innerText === "Isian Buku"
    );

    if (dropdownIsian) {
      const selected =
        dropdownIsian.querySelector(".selected");

      const options =
        dropdownIsian.querySelectorAll(".menu li");

      selected.innerText = "2 Muka";

      options.forEach((opt) => {
        opt.classList.toggle(
          "active",
          opt.innerText === "2 Muka"
        );
      });
    }
  }

  // =================== HITUNG ISI ===================
  const halamanPerLembar =
    isian === "2 Muka" ? 2 : 1;

  const muatNormal =
    Math.floor(ukuranKertas.lebar / lebar) *
    Math.floor(ukuranKertas.tinggi / tinggi);

  const muatRotate =
    Math.floor(ukuranKertas.lebar / tinggi) *
    Math.floor(ukuranKertas.tinggi / lebar);

  const maxMuat = Math.max(
    muatNormal,
    muatRotate
  );

  const isiPerLembar =
    maxMuat * halamanPerLembar;

  const kebutuhanIsi =
    isiPerLembar > 0
      ? Math.ceil(totalHalaman / isiPerLembar)
      : 0;

  // =================== HITUNG COVER ===================
  let kebutuhanCover = 0;

  if (cover !== "Tanpa Cover") {
    const coverLebar = lebar * 2;
    const coverTinggi = tinggi;

    const muatCoverNormal =
      Math.floor(
        ukuranKertas.lebar / coverLebar
      ) *
      Math.floor(
        ukuranKertas.tinggi / coverTinggi
      );

    const muatCoverRotate =
      Math.floor(
        ukuranKertas.lebar / coverTinggi
      ) *
      Math.floor(
        ukuranKertas.tinggi / coverLebar
      );

    const maxCover = Math.max(
      muatCoverNormal,
      muatCoverRotate
    );

    kebutuhanCover = Math.ceil(
      quantity / (maxCover || 1)
    );
  }

  // =================== WARNING STEPLES ===================
  let warningHTML = "";

  if (
    jilid === "Steples" &&
    halamanInput % 4 !== 0
  ) {
    const tambahan =
      4 - (halamanInput % 4);

    warningHTML = `
      <div class="warning">
        <span>⚠️ Karena jilid <strong>Steples</strong>, halaman dibulatkan ke kelipatan 4. Ditambahkan ${tambahan} halaman kosong.</span>
      </div>
    `;
  }

  // =================== OUTPUT ===================
  output.innerHTML = `
    ${warningHTML}

    <div class="result-card">
      <p class="result-title">Kebutuhan Kertas A3+</p>

      <div class="result-rows">
        <div class="result-row">
          <span class="label">Isi Buku</span>
          <span class="value">${kebutuhanIsi}<span class="value-unit">lembar</span></span>
        </div>

        <div class="result-row">
          <span class="label">Cover</span>
          <span class="value">${kebutuhanCover}<span class="value-unit">lembar</span></span>
        </div>
      </div>
    </div>
  `;
}

// =================== INIT ===================
calculateTotal();

// ==================== IG ====================
// Tombol IG sekarang berupa <a href> langsung, tidak perlu handler JS.