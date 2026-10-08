import { catalog } from "./src/data/catalog.js";
import {
  calculateLineTotal,
  calculateUnitPrice,
} from "./src/domain/pricing.js";
import {
  addCartLine,
  countCartItems,
  removeCartLine,
  replaceCartLine,
  setCartLineQuantity,
} from "./src/state/cart-state.js";
import { cartStore } from "./src/services/cart-store.js";
import { orderService } from "./src/services/order-service.js";

const PRODUCTS = {
  43: {
    id: "pepperoni-pizza",
    page: "pepperoni.html",
    image: "pepporoni-pizza-200x200.jpg",
  },
  50: {
    id: "margherita-pizza",
    page: "margherita.html",
    image: "margherita-pizza-200x200.jpg",
  },
  51: {
    id: "artichoke-pizza",
    page: "artichoke.html",
    image: "artichoke-pizza-200x200.jpg",
  },
  52: {
    id: "meat-lovers-pizza",
    page: "meat-lovers.html",
    image: "meat-lovers-pizza-200x200.jpg",
  },
  53: {
    id: "vegetarian-pizza",
    page: "vegetarian.html",
    image: "vegetarian-pizza-200x200.jpg",
  },
  54: {
    id: "build-your-own-pizza",
    page: "build-your-own.html",
    image: "build-your-own-pizza-200x200.jpg",
  },
};

const PIZZA_DESCRIPTIONS = {
  "Margherita Pizza":
    "Pizza margherita, as the Italians call it, is a simple pizza hailing from Naples. When done right, margherita pizza features a bubbly crust, crushed San Marzano tomato sauce, fresh mozzarella and basil, a drizzle of olive oil, and a sprinkle of salt. That is all.",

  "Pepperoni Pizza":
    "Pepperoni pizza is an American pizza variety which includes one of the country's most beloved toppings. Pepperoni is actually a corrupted form of peperoni (one “p”), which denotes a large pepper in Italian, but nowadays it denotes a spicy salami, usually made with a mixture of beef, pork, and spices. ",

  "Artichoke Pizza":
    "Meet our favorite artichoke pizza! The golden pizza crust is topped with creamy mozzarella and artichokes marinated with hints of garlic, lemon and herbs. It’s crispy outside, soft in the middle, flavorful and amazingly delicious! ",

  "Meat Lover's Pizza":
    "This Meat Lovers Pizza is piled high with melty cheese, spicy pepperoni, crispy bacon, juicy sausage crumbles, and herby Italian seasoning!",

  "Vegetarian Pizza":
    "Piled with flavorful veggies like peppers and artichokes, this vegetarian pizza will be a hit at your next pizza night! Fresh basil takes it over the top.",

  "Build Your Own Pizza":
    "Create your own pizza by choosing a crust, sauce and toppings! Select from three crust sizes and thicknesses, three sauce choices, over 14 individual toppings (meat and vegetable), and pizza toppers.",
};

function setupExpandableDescriptions() {
  document.querySelectorAll(".product-thumb").forEach((card) => {
    const description = card.querySelector(".description");
    const paragraph = description?.querySelector("p");
    const title = description?.querySelector("h4 a");

    if (!paragraph || !title) return;

    const pizzaName = title.textContent.trim();
    const fullDescription = PIZZA_DESCRIPTIONS[pizzaName];

    if (!fullDescription) return;

    // Restore the full description.
    paragraph.textContent = fullDescription;

    // Avoid adding duplicate buttons.
    if (description.querySelector(".description-toggle")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "description-toggle";
    button.textContent = "More";
    button.setAttribute("aria-expanded", "false");

    paragraph.after(button);

    button.addEventListener("click", () => {
      const expanded = paragraph.classList.toggle("is-expanded");

      button.textContent = expanded ? "Less" : "More";
      button.setAttribute("aria-expanded", String(expanded));
    });
  });
}

const PRODUCT_BY_SLUG = Object.fromEntries(
  Object.values(PRODUCTS).map((value) => [value.id, value]),
);
const VALUE_TO_OPTION = {
  117: ["size", "small-12"],
  119: ["size", "medium-14"],
  118: ["size", "large-16"],
  121: ["crust", "hand-tossed"],
  120: ["crust", "thin"],
  122: ["crust", "deep-dish"],
  123: ["sauce", "traditional"],
  124: ["sauce", "alfredo"],
  125: ["sauce", "barbecue"],
  126: ["cheese", "mozzarella"],
  127: ["cheese", "cheddar"],
  128: ["cheese", "parmesan"],
  129: ["meats", "pepperoni"],
  130: ["meats", "chicken"],
  131: ["meats", "ham"],
  132: ["meats", "hamburger"],
  133: ["meats", "italian-sausage"],
  134: ["meats", "bacon"],
  135: ["additional-ingredients", "artichoke"],
  136: ["additional-ingredients", "bell-peppers"],
  137: ["additional-ingredients", "black-olives"],
  138: ["additional-ingredients", "mushrooms"],
  139: ["additional-ingredients", "onions"],
  140: ["additional-ingredients", "pineapples"],
  141: ["additional-ingredients", "spinach"],
  142: ["additional-ingredients", "tomatoes"],
};
const OPTION_TO_VALUE = Object.fromEntries(
  Object.entries(VALUE_TO_OPTION).map(([value, [, option]]) => [option, value]),
);

function historicalOptionForInput(input) {
  if (input.type === "checkbox") {
    const checkboxOptions = {
      233: ["meats", "pepperoni"],
      234: ["meats", "chicken"],
      235: ["meats", "ham"],
      236: ["meats", "hamburger"],
      237: ["meats", "italian-sausage"],
      238: ["meats", "bacon"],
      239: ["additional-ingredients", "artichoke"],
      240: ["additional-ingredients", "bell-peppers"],
      241: ["additional-ingredients", "black-olives"],
      242: ["additional-ingredients", "mushrooms"],
      243: ["additional-ingredients", "onions"],
      244: ["additional-ingredients", "pineapples"],
      245: ["additional-ingredients", "spinach"],
      246: ["additional-ingredients", "tomatoes"],
    };

    if (checkboxOptions[input.value]) {
      return checkboxOptions[input.value];
    }
  }

  const label = (
    input.closest("label")?.textContent ||
    input.parentElement?.textContent ||
    input.getAttribute("aria-label") ||
    ""
  )
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  const choices = [
    ["small", "size", "small-12"],
    ["medium", "size", "medium-14"],
    ["large", "size", "large-16"],
    ["hand tossed", "crust", "hand-tossed"],
    ["thin", "crust", "thin"],
    ["deep dish", "crust", "deep-dish"],
    ["traditional", "sauce", "traditional"],
    ["alfredo", "sauce", "alfredo"],
    ["barbecue", "sauce", "barbecue"],
    ["mozzarella", "cheese", "mozzarella"],
    ["cheddar", "cheese", "cheddar"],
    ["parmesan", "cheese", "parmesan"],
    ["pepperoni", "meats", "pepperoni"],
    ["chicken", "meats", "chicken"],
    ["ham", "meats", "ham"],
    ["hamburger", "meats", "hamburger"],
    ["italian sausage", "meats", "italian-sausage"],
    ["bacon", "meats", "bacon"],
    ["artichoke", "additional-ingredients", "artichoke"],
    ["bell peppers", "additional-ingredients", "bell-peppers"],
    ["black olives", "additional-ingredients", "black-olives"],
    ["mushrooms", "additional-ingredients", "mushrooms"],
    ["onions", "additional-ingredients", "onions"],
    ["pineapples", "additional-ingredients", "pineapples"],
    ["spinach", "additional-ingredients", "spinach"],
    ["tomatoes", "additional-ingredients", "tomatoes"],
  ];
  const match = choices.find(([needle]) => label.includes(needle));
  return match ? [match[1], match[2]] : VALUE_TO_OPTION[input.value];
}

const money = (cents) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
const product = (id) =>
  catalog.products.find((candidate) => candidate.id === id);
let lines = cartStore.getLines();

function cartTotal() {
  return lines.reduce(
    (total, line) => total + calculateLineTotal(catalog, line).lineTotalCents,
    0,
  );
}

function saveLines(nextLines) {
  lines = cartStore.setLines(nextLines);
  updateHeaderCart();
}

function updateHeaderCart() {
  const button = document.querySelector("#header-cart button");
  if (button) {
    button.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> ${countCartItems(lines)} item(s) - ${money(cartTotal())}`;
    button.type = "button";
    button.addEventListener(
      "click",
      () => {
        location.href = "cart.html";
      },
      { once: true },
    );
  }

  const menu = document.querySelector("#header-cart .dropdown-menu");
  if (menu) {
    menu.innerHTML = lines.length
      ? `<li><div class="p-3">${lines.map((line) => `<div>${line.quantity} × ${product(line.productId).label}</div>`).join("")}<hr><strong>Total: ${money(cartTotal())}</strong><br><a href="cart.html">View Cart</a> &nbsp; <a href="checkout.html">Checkout</a></div></li>`
      : '<li><div class="p-3 text-center">Your shopping cart is empty!</div></li>';
  }

  if (sessionStorage.getItem("ufp-demo-account")) {
    document.querySelectorAll('a[href="account.html"]').forEach((link) => {
      if (link.textContent.includes("My Account"))
        link.textContent = " Demo Account";
    });
  }
}

function selectionsFromHistoricalForm(form) {
  const selections = { meats: [], "additional-ingredients": [] };
  form
    .querySelectorAll(
      'input[type="radio"]:checked, input[type="checkbox"]:checked',
    )
    .forEach((input) => {
      const mapped = historicalOptionForInput(input);
      if (!mapped) return;
      const [group, option] = mapped;
      if (Array.isArray(selections[group])) selections[group].push(option);
      else selections[group] = option;
    });
  return selections;
}

function restoreSelections(form, line) {
  for (const value of Object.values(line.selections).flat()) {
    const input = [
      ...form.querySelectorAll('input[type="radio"], input[type="checkbox"]'),
    ].find((candidate) => historicalOptionForInput(candidate)?.[1] === value);
    if (input) input.checked = true;
  }
  const quantity = form.querySelector("#input-quantity");
  if (quantity) quantity.value = line.quantity;
}

function clearProductErrors() {
  document.querySelectorAll(".invalid-feedback").forEach((element) => {
    element.textContent = "";
    element.style.display = "";
  });
  document
    .querySelector("#static-product-error")
    ?.classList.remove("is-visible");
}

function removeIrrelevantCatalogUi() {
  document.querySelector("#wishlist-total")?.closest("li")?.remove();

  document
    .querySelectorAll(
      'button[formaction*="wishlist"], button[formaction*="compare"]',
    )
    .forEach((button) => {
      button.remove();
    });
  document.querySelectorAll(".price-tax").forEach((price) => price.remove());

  document.querySelectorAll("footer a").forEach((link) => {
    if (link.textContent.trim() === "Wish List") link.closest("li")?.remove();
  });

  document.querySelectorAll("#content li").forEach((item) => {
    if (/^(Product Code|Reward Points|Ex Tax):/i.test(item.textContent.trim()))
      item.remove();
  });

  document.querySelector('a[href="#tab-review"]')?.closest("li")?.remove();
  document.querySelector("#tab-review")?.remove();

  const relatedHeading = [...document.querySelectorAll("#content h3")].find(
    (heading) => heading.textContent.trim() === "Related Products",
  );

  const relatedGrid = relatedHeading?.nextElementSibling;

  if (relatedGrid) {
    relatedGrid.className = "row row-cols-1 row-cols-sm-2 row-cols-lg-3";
  }

  document.querySelectorAll(".product-thumb").forEach((card) => {
    const productName = card.querySelector("h4 a")?.textContent.trim();
    const cartButton = card.querySelector('button[title="Add to Cart"]');

    if (productName && cartButton) {
      cartButton.setAttribute("aria-label", `View ${productName} options`);
    }
  });

  // Remove obsolete product tags from all product pages.
  document.querySelectorAll("#content p").forEach((paragraph) => {
    if (paragraph.textContent.trim().startsWith("Tags:")) {
      paragraph.remove();
    }
  });
}

function relocateProductDescription() {
  const imageContainer = document.querySelector(
    "#content .image.magnific-popup",
  );

  const description = document.querySelector("#tab-description");

  if (!imageContainer || !description) return;

  // Create a standalone description section.
  const section = document.createElement("div");
  section.className = "static-product-description";

  // Move the existing description content into the new section.
  while (description.firstChild) {
    section.append(description.firstChild);
  }

  // Remove empty paragraphs and paragraphs containing only whitespace.
  section.querySelectorAll("p").forEach((paragraph) => {
    if (!paragraph.textContent.replace(/\u00a0/g, " ").trim()) {
      paragraph.remove();
    }
  });

  // Remove legacy inline font styling.
  section.querySelectorAll("[style]").forEach((element) => {
    element.style.removeProperty("font-family");
    element.style.removeProperty("font-size");

    if (!element.getAttribute("style")?.trim()) {
      element.removeAttribute("style");
    }
  });

  // Move the existing pizza name above the description.
  const productName = document.querySelector("#content h1");

  if (productName) {
    section.prepend(productName);
  }

  // Place the description directly beneath the pizza photograph.
  imageContainer.insertAdjacentElement("afterend", section);

  // Remove the original Description tab and its empty content.
  document.querySelector('a[href="#tab-description"]')?.closest("li")?.remove();

  description.remove();
}

function productPage() {
  const form = document.querySelector("#form-product");
  if (!form) return;
  relocateProductDescription();
  const historicalProductId = form.querySelector("#input-product-id")?.value;
  const metadata = PRODUCTS[historicalProductId];
  if (!metadata) return;
  const lineTotal = document.createElement("p");
  lineTotal.className = "static-live-total";
  lineTotal.id = "static-live-total";
  lineTotal.setAttribute("aria-live", "polite");
  const error = document.createElement("p");
  error.id = "static-product-error";
  error.className = "static-demo-error";
  error.setAttribute("role", "alert");
  form.prepend(error);

  const editId = new URLSearchParams(location.search).get("edit");
  const editLine = editId ? lines.find((line) => line.id === editId) : null;
  if (editLine?.productId === metadata.id) restoreSelections(form, editLine);
  const submitButton = form.querySelector("#button-cart");
  submitButton?.insertAdjacentElement("beforebegin", lineTotal);
  if (editLine && submitButton) submitButton.textContent = "Update Cart";

  const refreshPrice = () => {
    try {
      const unit = calculateUnitPrice(
        catalog,
        metadata.id,
        selectionsFromHistoricalForm(form),
      );
      const quantity = Number(
        form.querySelector("#input-quantity")?.value || 1,
      );
      const validQuantity =
        Number.isInteger(quantity) && quantity > 0 ? quantity : 1;

      lineTotal.innerHTML = `
    <div class="static-total-details">
      <span class="static-total-label">Your Pizza Total</span>
      <small>Updates as you customize</small>
    </div>
    <strong class="static-total-price">
      ${money(unit * validQuantity)}
    </strong>
  `;
    } catch {
      lineTotal.textContent =
        "Select all required options to calculate the configured total.";
    }
  };

  form.addEventListener("change", refreshPrice);
  form.addEventListener("input", refreshPrice);

  form.addEventListener("change", (event) => {
    if (event.target.type !== "radio") return;

    const group = event.target.closest(".mb-3.required");
    if (!group) return;

    // Remove the error displayed beneath this option's heading.
    group.querySelector(".static-option-error")?.remove();

    // Clear the general validation message.
    const error = form.querySelector("#static-product-error");
    if (error) {
      error.textContent = "";
      error.classList.remove("is-visible");
    }
  });

  const quantityInput = form.querySelector("#input-quantity");

  if (quantityInput) {
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.max = String(catalog.maximumLineQuantity);
    quantityInput.step = "1";

    quantityInput.addEventListener("change", () => {
      const quantity = Number(quantityInput.value);
      const corrected = Number.isFinite(quantity)
        ? Math.min(
            catalog.maximumLineQuantity,
            Math.max(1, Math.floor(quantity)),
          )
        : 1;

      quantityInput.value = corrected;
      refreshPrice();
    });
  }

  const validatePizzaOptions = () => {
    const requiredGroups = form.querySelectorAll(".mb-3.required");

    for (const group of requiredGroups) {
      const radios = group.querySelectorAll('input[type="radio"]');

      if (!radios.length) continue;

      const selected = [...radios].some((radio) => radio.checked);

      if (!selected) {
        const label = group.querySelector(".form-label");
        const optionName = label?.textContent.trim() || "required option";

        const errorMessages = {
          size: "Please select a pizza size.",
          sizes: "Please select a pizza size.",
          crust: "Please select a crust.",
          crusts: "Please select a crust.",
          sauce: "Please select a sauce.",
          sauces: "Please select a sauce.",
          cheese: "Please select a cheese.",
          cheeses: "Please select a cheese.",
        };

        const message =
          errorMessages[optionName.toLowerCase()] ||
          `Please select ${optionName.toLowerCase()}.`;

        error.textContent = message;
        error.classList.add("is-visible");

        let groupError = group.querySelector(".static-option-error");

        if (!groupError) {
          groupError = document.createElement("p");
          groupError.className = "static-option-error";
          groupError.setAttribute("role", "alert");
          group.querySelector(".form-label")?.after(groupError);
        }

        groupError.textContent = message;

        groupError.textContent =
          errorMessages[optionName.toLowerCase()] ||
          `Please select ${optionName.toLowerCase()}.`;

        groupError.style.color = "#dc3545";
        groupError.style.fontWeight = "bold";
        groupError.style.marginBottom = "25px";

        group.querySelector(".form-label")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        radios[0].focus({ preventScroll: true });

        return false;
      }
    }

    return true;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearProductErrors();

    if (!validatePizzaOptions()) {
      return;
    }

    try {
      const candidate = {
        productId: metadata.id,
        selections: selectionsFromHistoricalForm(form),
        quantity: Number(form.querySelector("#input-quantity")?.value),
      };
      saveLines(
        editLine
          ? replaceCartLine(catalog, lines, editLine.id, candidate)
          : addCartLine(catalog, lines, candidate),
      );
      location.href = "cart.html";
    } catch (reason) {
      error.textContent =
        reason.message || "Please complete all required pizza options.";
      error.classList.add("is-visible");
      // error.scrollIntoView({ block: "center" });
    }
  });
  refreshPrice();
}

function homePage() {
  document
    .querySelectorAll('form:not(#form-product) input[name="product_id"]')
    .forEach((input) => {
      const form = input.closest("form");
      const metadata = PRODUCTS[input.value];
      if (form && metadata)
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          location.href = metadata.page;
        });
    });
}

function optionSummary(line) {
  return catalog.optionGroups
    .map((group) => {
      const selected = Array.isArray(line.selections[group.id])
        ? line.selections[group.id]
        : [line.selections[group.id]];
      if (!selected.filter(Boolean).length) return "";
      const labels = selected
        .map((id) => group.options.find((option) => option.id === id)?.label)
        .filter(Boolean);
      return `<small> - ${group.label}: ${labels.join(", ")}</small>`;
    })
    .filter(Boolean)
    .join("<br>");
}

function cartPage() {
  const content = document.querySelector("#content");
  if (!content) return;
  if (!lines.length) {
    content.innerHTML =
      '<h1>Shopping Cart</h1><p>Your shopping cart is empty!</p><div class="d-inline-block pt-2 pd-2 w-100"><div class="float-end"><a href="index.html" class="btn btn-primary">Continue</a></div></div>';
    return;
  }
  content.innerHTML = `<h1>Shopping Cart</h1><div class="table-responsive static-responsive-table"><table class="table table-bordered"><thead><tr><th scope="col">Image</th><th scope="col">Product Name</th><th scope="col">Quantity</th><th scope="col" class="text-end">Unit Price</th><th scope="col" class="text-end">Total</th><th scope="col">Action</th></tr></thead><tbody>${lines
    .map((line) => {
      const item = product(line.productId);
      const totals = calculateLineTotal(catalog, line);
      const metadata = PRODUCT_BY_SLUG[line.productId];
      return `<tr data-line-id="${encodeURIComponent(line.id)}"><td><img src="Urban%20Fire%20Pizza_files/${metadata.image}" alt="${item.label}" class="img-thumbnail"></td><td><a href="${metadata.page}"><strong>${item.label}</strong></a><br>${optionSummary(line)}</td><td><input class="form-control static-cart-quantity" type="number" min="1" max="20" value="${line.quantity}" aria-label="Quantity for ${item.label}"></td><td class="text-end">${money(totals.unitPriceCents)}</td><td class="text-end">${money(totals.lineTotalCents)}</td><td><a class="btn btn-primary static-edit" href="${metadata.page}?edit=${encodeURIComponent(line.id)}">Edit</a> <button class="btn btn-danger static-remove" type="button">Remove</button></td></tr>`;
    })
    .join(
      "",
    )}</tbody></table></div><table class="table table-sm table-bordered"><tbody><tr><th scope="row" class="text-end"><strong>Sub-Total</strong></th><td class="text-end">${money(cartTotal())}</td></tr><tr><th scope="row" class="text-end"><strong>Total</strong></th><td class="text-end">${money(cartTotal())}</td></tr></tbody></table><div class="static-cart-actions"><a class="btn btn-secondary" href="index.html">Continue Shopping</a><a class="btn btn-primary" href="checkout.html">Checkout</a></div>`;
  content.querySelectorAll("tr[data-line-id]").forEach((row) => {
    const id = decodeURIComponent(row.dataset.lineId);
    row
      .querySelector(".static-cart-quantity")
      .addEventListener("change", (event) => {
        try {
          saveLines(
            setCartLineQuantity(catalog, lines, id, Number(event.target.value)),
          );
          cartPage();
        } catch (reason) {
          alert(reason.message);
        }
      });
    row.querySelector(".static-remove").addEventListener("click", () => {
      saveLines(removeCartLine(catalog, lines, id));
      cartPage();
    });
  });
}

function accountPage() {
  const content = document.querySelector("#content");
  const form = document.querySelector("#form-register");

  if (!content || !form) return;

  const accountActive = sessionStorage.getItem("ufp-demo-account") === "true";

  const email = document.querySelector("#input-email");

  if (email) {
    email.type = "email";
    email.required = true;

    if (!email.value) {
      email.value = "demo@example.com";
    }
  }

  function showDashboard() {
    content.innerHTML = `
      <div class="static-demo-account">
        <h1>My Demo Account</h1>

        <div class="static-demo-notice">
          <strong>Demo Account Active</strong>
          <p>
            This is a simulated account for the Urban Fire Pizza
            portfolio project. No real authentication or customer
            account is involved.
          </p>
        </div>

        <h2>Welcome to Urban Fire Pizza!</h2>

        <p>
          Your demo account is active for this browser session.
          You can explore the ordering system and place simulated orders.
        </p>

        <div class="static-account-actions">
          <a href="index.html" class="btn btn-primary">
            Continue Shopping
          </a>

          <a href="cart.html" class="btn btn-primary">
            View Shopping Cart
          </a>

          <button type="button"
                  id="static-demo-logout"
                  class="btn btn-secondary">
            End Demo Session
          </button>
        </div>
      </div>
    `;

    document.title = "My Demo Account - Urban Fire Pizza";

    // Update the breadcrumb.
    const breadcrumb = document.querySelector("#account-register .breadcrumb");

    if (breadcrumb) {
      const lastItem = breadcrumb.querySelector(".breadcrumb-item:last-child");

      if (lastItem) {
        lastItem.textContent = "My Demo Account";
      }
    }

    document
      .querySelector("#static-demo-logout")
      ?.addEventListener("click", () => {
        sessionStorage.removeItem("ufp-demo-account");
        sessionStorage.removeItem("ufp-demo-customer");
        location.href = "account.html";
      });
  }

  // Returning visitor with an active demo session.
  if (accountActive) {
    showDashboard();
    return;
  }

  // New visitor: display the existing registration form.
  const notice = document.createElement("div");
  notice.className = "static-demo-notice";

  notice.innerHTML = `
    <strong>Simulated account:</strong>
    Use only fictional details. Nothing is transmitted,
    and passwords are never stored.
  `;

  content.querySelector("h1")?.insertAdjacentElement("afterend", notice);

  const password = form.querySelector('input[type="password"]');

  if (password) {
    password.value = "demo-only";
    password.autocomplete = "off";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // Verify all required fields before activating the demo account.
    if (!form.reportValidity()) {
      return;
    }

    // Reject fields containing only whitespace.
    const requiredFields = form.querySelectorAll("[required]");

    for (const input of requiredFields) {
      if (!input.value.trim()) {
        input.setCustomValidity("Please complete this field.");
        input.reportValidity();
        input.setCustomValidity("");
        return;
      }
    }

    // Save fictional customer details for this demo session.
    const demoCustomer = {
      firstName: form.querySelector("#input-firstname")?.value.trim() || "",
      lastName: form.querySelector("#input-lastname")?.value.trim() || "",
      email: form.querySelector("#input-email")?.value.trim() || "",
    };

    sessionStorage.setItem("ufp-demo-customer", JSON.stringify(demoCustomer));

    // Activate the existing demo session.
    sessionStorage.setItem("ufp-demo-account", "true");

    showDashboard();
  });
}

function checkoutReview() {
  return `<div class="table-responsive"><table class="table table-bordered"><thead><tr><th scope="col">Product</th><th scope="col" class="text-end">Quantity</th><th scope="col" class="text-end">Total</th></tr></thead><tbody>${lines
    .map((line) => {
      const item = product(line.productId);
      const totals = calculateLineTotal(catalog, line);
      return `<tr><td><strong>${item.label}</strong><br>${optionSummary(line)}</td><td class="text-end">${line.quantity}</td><td class="text-end">${money(totals.lineTotalCents)}</td></tr>`;
    })
    .join(
      "",
    )}<tr><td colspan="2" class="text-end"><strong>Total</strong></td><td class="text-end"><strong>${money(cartTotal())}</strong></td></tr></tbody></table></div>`;
}

function checkoutPage() {
  const content = document.querySelector("#content");
  if (!content) return;
  if (!lines.length) {
    content.innerHTML =
      '<h1>Checkout</h1><p>Your shopping cart is empty!</p><a class="btn btn-primary" href="index.html">Continue</a>';
    return;
  }
  const h1 = content.querySelector("h1");
  const notice = document.createElement("div");
  notice.className = "static-demo-notice";
  notice.innerHTML =
    "<strong>Safe portfolio simulation:</strong> use fictional delivery details. No information leaves this browser. Real payment credentials are not requested or accepted.";
  h1?.insertAdjacentElement("afterend", notice);

  const register = document.querySelector("#input-register");
  const guest = document.querySelector("#input-guest");

  const demoAccountActive =
    sessionStorage.getItem("ufp-demo-account") === "true";

  if (demoAccountActive) {
    if (register) register.checked = false;
    if (guest) guest.checked = true;

    const accountOptions = document.querySelector("#checkout-register");

    if (accountOptions) {
      const radioContainer = guest?.closest(".row");

      if (radioContainer) {
        radioContainer.style.display = "none";
      }

      const message = document.createElement("div");
      message.className = "static-demo-notice";

      message.innerHTML = `
        <strong>Demo Account Recognized</strong>
        <p>
          You're checking out using your active Demo Account.
          Please enter your simulated delivery information below.
        </p>
      `;

      accountOptions.prepend(message);
    }

    const loginMessage = [...document.querySelectorAll("#content p")].find(
      (paragraph) =>
        paragraph.textContent.includes("If you already have an account"),
    );

    if (loginMessage) {
      loginMessage.style.display = "none";
    }
  } else {
    if (register) register.checked = false;
    if (guest) guest.checked = true;
  }

  document.querySelector("#shipping-address")?.classList.remove("d-none");
  const passwordFieldset = document
    .querySelector("#input-password")
    ?.closest("fieldset");
  const accountActions = document.querySelector(".static-checkout-actions");
  const registerForm = document.querySelector("#form-register");
  const accountChoice = guest?.closest(".col");
  accountChoice?.classList.add("static-account-choice");
  const accountType = document
    .querySelector("#input-customer-group")
    ?.closest(".col");
  accountType?.style.setProperty("display", "none", "important");
  const guestStatus = document.createElement("p");
  guestStatus.className = "static-guest-status";
  guestStatus.textContent =
    "Guest checkout selected. Your details stay on this page while you review the order.";
  accountChoice?.append(guestStatus);

  const syncAccountMode = () => {
    const isGuest = Boolean(guest?.checked);
    if (passwordFieldset)
      passwordFieldset.style.display = isGuest ? "none" : "block";
    if (accountActions)
      accountActions.style.display = isGuest ? "none" : "block";
    guestStatus.hidden = !isGuest;
  };
  register?.addEventListener("change", syncAccountMode);
  guest?.addEventListener("change", syncAccountMode);
  registerForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    syncAccountMode();
  });
  syncAccountMode();

  const email = document.querySelector("#input-email");

  if (email) {
    email.type = "email";
    email.required = true;
  }

  const demoCustomer =
    sessionStorage.getItem("ufp-demo-account") === "true"
      ? JSON.parse(sessionStorage.getItem("ufp-demo-customer") || "null")
      : null;

  if (demoCustomer) {
    const firstName = document.querySelector("#input-firstname");
    const lastName = document.querySelector("#input-lastname");

    if (firstName) firstName.value = demoCustomer.firstName;
    if (lastName) lastName.value = demoCustomer.lastName;
    if (email) email.value = demoCustomer.email;
  } else if (email && !email.value) {
    email.value = "demo@example.com";
  }

  const shipping = document.querySelector("#input-shipping-method");
  if (shipping) {
    shipping.setAttribute("aria-label", "Shipping Method");
  }
  if (shipping) {
    shipping.disabled = false;
    shipping.innerHTML =
      '<option value="pickup">Pickup (simulated)</option><option value="delivery" selected>Flat Rate Delivery (simulated)</option>';
  }

  const payment = document.querySelector("#input-payment-method");
  if (payment) {
    payment.setAttribute("aria-label", "Payment Method");
    payment.disabled = false;
    payment.innerHTML =
      '<option value="demo-card">Demo card — no number required</option><option value="mock-delivery">Pay on simulated delivery</option>';

    payment
      .closest("form")
      ?.insertAdjacentHTML(
        "afterend",
        '<p class="static-payment-note">This demo never asks for, stores, or transmits a card number.</p>',
      );
  }
  document
    .querySelectorAll("#button-shipping-method,#button-payment-method")
    .forEach((button) => {
      button.style.display = "none";
    });

  let confirm = document.querySelector("#checkout-confirm");
  if (!confirm) {
    confirm = document.createElement("div");
    content.append(confirm);
  }
  confirm.innerHTML = `<fieldset><legend>Review Your Order</legend>${checkoutReview()}<div class="text-end"><button class="btn btn-primary" id="static-place-order" type="button">Place Simulated Order</button></div></fieldset>`;
  document
    .querySelector("#static-place-order")
    .addEventListener("click", () => {
      // Required customer and delivery fields.
      const firstName = document.querySelector("#input-firstname");
      const lastName = document.querySelector("#input-lastname");
      const email = document.querySelector("#input-email");
      const address = document.querySelector("#input-shipping-address-1");
      const city = document.querySelector("#input-shipping-city");
      const postCode = document.querySelector("#input-shipping-postcode");
      const country = document.querySelector("#input-shipping-country");
      const region = document.querySelector("#input-shipping-zone");

      // Validate all required fields.
      const requiredFields = [
        firstName,
        lastName,
        email,
        address,
        city,
        postCode,
        country,
        region,
      ];

      for (const input of requiredFields) {
        if (!input) {
          console.error("Missing checkout field");
          return;
        }

        input.required = true;

        const value = input.value.trim();

        if (!value) {
          input.setCustomValidity("Please complete this field.");
        } else if (
          input === email &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
          input.setCustomValidity("Please enter a valid email address.");
        } else {
          input.setCustomValidity("");
        }

        if (!input.reportValidity()) {
          input.focus();
          return;
        }
      }

      // Ensure a valid shipping and payment method is selected.
      if (!shipping?.value || !payment?.value) {
        alert("Please select a shipping and payment method.");
        return;
      }
      orderService.placeDemoOrder({
        lines,
        details: {
          firstName: firstName?.value || "Demo",
          city: city?.value || "",
          shipping: shipping?.value,
          payment: payment?.value,
        },
      });
      cartStore.clear();
      lines = [];
      location.href = "confirmation.html";
    });
}

function confirmationPage() {
  const content = document.querySelector("#content");
  if (!content) return;
  const confirmation = orderService.getConfirmation();
  content.innerHTML = `<div class="static-confirmation"><h1>Your Order Has Been Placed!</h1>${confirmation ? `<p>Thank you for ordering from Urban Fire Pizza.</p><p class="static-confirmation-reference">${confirmation.reference}</p><p>Your simulated order should arrive in approximately <strong>30 minutes</strong>.</p><p>Estimated arrival: <strong>${new Date(confirmation.estimatedArrival).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</strong></p>` : "<p>No current simulated order was found.</p>"}<a class="btn btn-primary" href="index.html">Continue</a></div>`;
}

function searchAdapter() {
  const search = document.querySelector("#search");
  const input = search?.querySelector("input");
  const button = search?.querySelector("button");
  if (!search || !input || !button) return;
  input.setAttribute("aria-label", "Search pizzas");
  button.setAttribute("aria-label", "Search pizzas");

  const run = () => {
    const query = input.value.trim();
    if (document.body.dataset.staticPage !== "index.html") {
      if (query)
        location.href = `index.html?search=${encodeURIComponent(query)}`;
      return;
    }

    const normalized = query.toLocaleLowerCase();
    const cards = [
      ...document.querySelectorAll('#content form input[name="product_id"]'),
    ]
      .map((productId) => productId.closest("form"))
      .filter(Boolean);
    let matches = 0;
    cards.forEach((card) => {
      const isMatch =
        !normalized ||
        card.textContent.toLocaleLowerCase().includes(normalized);
      card.closest(".col").hidden = !isMatch;
      if (isMatch) matches += 1;
    });

    let status = document.querySelector("#static-search-status");
    if (!status) {
      status = document.createElement("p");
      status.id = "static-search-status";
      status.className = "static-search-status";
      status.setAttribute("role", "status");
      document
        .querySelector("#content h3")
        ?.insertAdjacentElement("afterend", status);
    }
    status.textContent = query
      ? `${matches} pizza${matches === 1 ? "" : "s"} found for “${query}”.`
      : "Showing all pizzas.";
    history.replaceState(
      null,
      "",
      query ? `index.html?search=${encodeURIComponent(query)}` : "index.html",
    );
  };
  button?.addEventListener("click", run);
  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      run();
    }
  });
  if (document.body.dataset.staticPage === "index.html") {
    input.value = new URLSearchParams(location.search).get("search") || "";
    if (input.value) run();
  }
}

function updateDemoNavigation() {
  // Replace the original currency dropdown with a static USD label.
  document.querySelectorAll("#form-currency").forEach((form) => {
    form.innerHTML = '<span class="static-currency-label">$ USD</span>';
  });

  // Rename My Account while preserving its icon and link.
  document.querySelectorAll("#top .dropdown-toggle").forEach((link) => {
    const label = link.querySelector("span");

    if (label?.textContent.trim() === "My Account") {
      label.textContent = "Demo Account";
      link.href = "account.html";
      link.removeAttribute("data-bs-toggle");
      link.classList.remove("dropdown-toggle");

      const menu = link.parentElement.querySelector(".dropdown-menu");
      menu?.remove();
    }
  });
}

function setupSharedFooter() {
  const footer = document.querySelector("footer");
  if (!footer) return;

  footer.innerHTML = `
    <div class="container">
      <div class="row">
        <div class="col-sm-4">
          <h5>Explore</h5>
          <ul class="list-unstyled">
            <li><a href="index.html">Home</a></li>
            <li><a href="index.html#featured-products">Our Pizzas</a></li>
            <li><a href="build-your-own.html">Build Your Own</a></li>
          </ul>
        </div>

        <div class="col-sm-4">
          <h5>Your Order</h5>
          <ul class="list-unstyled">
            <li><a href="cart.html">Shopping Cart</a></li>
            <li><a href="checkout.html">Checkout</a></li>
            <li><a href="account.html">My Account</a></li>
          </ul>
        </div>

        <div class="col-sm-4">
          <h5>About This Project</h5>
          <ul class="list-unstyled">
            <li><a href="https://github.com/YOUR-USERNAME/YOUR-REPOSITORY" target="_blank" rel="noopener noreferrer">GitHub Repository</a></li>
          </ul>
        </div>
      </div>

      <hr>

      <p>Urban Fire Pizza Project &copy; 2023-2026</p>
      <p class="demo-disclaimer">
        Interactive portfolio demonstration. No real orders or payments are processed.
      </p>
    </div>
  `;
}

function setupBreadcrumbAccessibility() {
  document.querySelectorAll(".breadcrumb a").forEach((link) => {
    const icon = link.querySelector(".fa-home");

    if (icon) {
      link.setAttribute("aria-label", "Home");
      icon.setAttribute("aria-hidden", "true");
    }
  });
}

function cleanupDemoPhoneLink() {
  document.querySelectorAll("#top .fa-phone").forEach((icon) => {
    icon.closest(".list-inline-item")?.remove();
  });
}

updateDemoNavigation();
removeIrrelevantCatalogUi();
updateHeaderCart();
searchAdapter();
setupExpandableDescriptions();
setupSharedFooter();
setupBreadcrumbAccessibility();
cleanupDemoPhoneLink();
const page = document.body.dataset.staticPage;
if (page === "index.html") {
  homePage();
} else if (
  [
    "pepperoni.html",
    "margherita.html",
    "artichoke.html",
    "meat-lovers.html",
    "vegetarian.html",
    "build-your-own.html",
  ].includes(page)
) {
  homePage();
  productPage();
} else if (page === "cart.html") cartPage();
else if (page === "account.html") accountPage();
else if (page === "checkout.html") checkoutPage();
else if (page === "confirmation.html") confirmationPage();
