# Urban Fire Pizza — Website Restoration & Modernization

**A multi-page, interactive pizza-ordering website restored from a legacy college project and modernized with JavaScript.**

[**Live Website**](https://jon-best-swe.github.io/Urban-Fire-Pizza_Restoration/) | [**GitHub Repository**](https://github.com/Jon-Best-SWE/Urban-Fire-Pizza_Restoration)

## Project Overview

Urban Fire Pizza is a restoration and functional modernization of a college web development project originally deployed using OpenCart and PHP.

The project preserves the original website's visual identity, page layouts, navigation, product imagery, and overall presentation while replacing unavailable server-side functionality with a self-contained JavaScript demonstration.

The result is an interactive, multi-page ordering experience that can be hosted on GitHub Pages without a backend server.

## Key Features

- **Interactive Pizza Customization:** Configure six pizza products with available sizes, crusts, sauces, cheeses, and toppings.
- **Dynamic Pricing:** Automatically calculate product prices based on selected options and quantities using integer-cent arithmetic.
- **Persistent Shopping Cart:** Add, update, and remove configured pizzas, with cart contents preserved between page loads using browser storage.
- **Checkout Experience:** Complete a simulated checkout workflow with form validation, order review, and confirmation.
- **Demo Account Registration:** Interact with a locally simulated registration form without creating a real server-side account.
- **Multi-Page Navigation:** Browse individual product pages, shopping cart, account registration, checkout, and order confirmation.
- **Responsive Presentation:** Preserve and adapt the original website's visual design across different screen sizes.
- **Automated Testing:** Validate core pricing, configuration, cart, persistence, and order-processing functionality.

## Technologies Used

| Category | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES Modules) |
| Styling | Bootstrap, legacy CSS, responsive layouts |
| Application Logic | Modular JavaScript, DOM manipulation, event handling |
| Data Persistence | Browser localStorage and sessionStorage |
| Testing | Node.js built-in test runner |
| Version Control | Git, GitHub |
| Deployment | GitHub Pages |

## Development & Modernization

### Historical Website Restoration

The original website was recovered from browser-saved HTML pages and supporting assets, including CSS, images, video, fonts, and branding.

The restoration retains the original visual presentation rather than replacing it with a new template.

### JavaScript Application Logic

Because the original OpenCart/PHP backend is unavailable, the project implements a browser-based demonstration of its ordering functionality.

Key development work includes:

- Implementing configurable product options and dynamic pricing.
- Managing cart items, quantities, and unique configurations.
- Persisting cart information across separate HTML pages.
- Validating user input and checkout information.
- Simulating order submission and confirmation.
- Separating reusable business logic into JavaScript modules.
- Testing pricing calculations, cart behavior, and order processing.

### Application Architecture

The `src/` directory separates core functionality into reusable modules:

- `data/` — Product catalog and configuration data.
- `domain/` — Pricing, quantity, configuration, and validation logic.
- `services/` — Catalog access, cart persistence, and simulated order processing.
- `state/` — Shopping cart state management.

The `static-demo.js` file connects the application logic to the restored HTML pages and provides browser interactions.

## Historical Page Restoration

| Original Page | Restored Page |
|---|---|
| Urban Fire Pizza | `index.html` |
| Pepperoni Pizza | `pepperoni.html` |
| Margherita Pizza | `margherita.html` |
| Artichoke Pizza | `artichoke.html` |
| Meat Lover's Pizza | `meat-lovers.html` |
| Vegetarian Pizza | `vegetarian.html` |
| Build Your Own Pizza | `build-your-own.html` |
| Shopping Cart | `cart.html` |
| Checkout | `checkout.html` |
| Register Account | `account.html` |
| Order Confirmation | `confirmation.html` |

The confirmation page was reconstructed using the archived checkout layout because a separate historical confirmation page was unavailable.

## Running Locally

Clone the repository:

```bash
git clone https://github.com/Jon-Best-SWE/Urban-Fire-Pizza_Restoration.git
```

Navigate into the project:

```bash
cd Urban-Fire-Pizza_Restoration
```

Start a local static server:

```bash
npx serve .
```

Open the locally served website in your browser.

No backend installation, database configuration, or build process is required.

## Automated Tests

Run the project's automated tests:

```bash
npm test
```

Alternatively:

```bash
node --test
```

The tests cover core application behavior, including pricing calculations, product configuration, cart state, persistence, and simulated order processing.

## Demonstration Limitations

This project is intended exclusively as a portfolio demonstration.

- No real purchases or payments are processed.
- No credit card information is requested.
- Account registration is simulated locally.
- Cart information is stored in the browser.
- Order confirmations are simulated and do not represent actual restaurant orders.
- No production backend or database is connected.

## Project History & Attribution

Urban Fire Pizza originated as a college web development project and was subsequently restored and modernized for portfolio presentation.

The original website used OpenCart, PHP, and third-party frontend libraries. The current public version retains the historical visual presentation while replacing unavailable backend functionality with JavaScript.

Third-party technologies and historical assets include OpenCart-related presentation conventions, Bootstrap, Font Awesome, and other archived styling resources. These components are not claimed as original implementations.

The original logo and media assets have been preserved. Some artwork was created for the original project, while other imagery was sourced from free-stock resources. Complete historical license records were unavailable, and redistribution rights for those assets require verification.

Original server-side application files, database contents, credentials, customer information, and payment integrations are not included.

## Author

**Jon Best**  
Software / Application Developer

[GitHub Profile](https://github.com/Jon-Best-SWE)
