# Urban Fire Pizza — Historical Multi-Page Restoration

This portfolio demo is built directly from the browser-saved HTML, CSS, imagery, video, logo, forms, and page layouts of the deployed Urban Fire Pizza college project. It is not a redesigned or newly templated frontend.

## Historical page mapping

| Saved archive page | Portfolio page | Preserved presentation |
|---|---|---|
| `Urban Fire Pizza.htm` | `index.html` | Original header/navigation, animated logo, homepage video, welcome section, six product cards, footer |
| `Pepperoni Pizza.htm` | `pepperoni.html` | Original product image, metadata, pricing area, image-led option controls, quantity and Add to Cart |
| `Margherita Pizza.htm` | `margherita.html` | Same historical product presentation; tomatoes retain the historical $0 exception |
| `Artichoke Pizza.htm` | `artichoke.html` | Original product and complete option interface |
| `Meat Lover's Pizza.htm` | `meat-lovers.html` | Original product and complete option interface |
| `Vegetarian Pizza.htm` | `vegetarian.html` | Original product and complete option interface |
| `Build Your Own Pizza.htm` | `build-your-own.html` | Original product and complete option interface |
| `Shopping Cart.htm` | `cart.html` | Original OpenCart page shell, header/footer, breadcrumb and cart-table conventions |
| `Checkout.htm` | `checkout.html` | Original checkout form, delivery fields, shipping/payment sections and review presentation |
| `Register Account.htm` | `account.html` | Original registration/account form and page composition |

`confirmation.html` uses a copy of the archived checkout shell because a separately saved server confirmation page was not present. Only its central content is replaced with the simulated confirmation.

## Static JavaScript replacement

`static-demo.js` replaces only unavailable server behavior: historical option controls now calculate integer-cent prices, quantity affects totals, configured pizzas persist across real HTML page loads, and cart editing/removal works. The original account and checkout forms are intercepted locally. Payment is explicitly simulated and never requests a card number. Placing an order creates a session-only `DEMO-` reference and an illustrative arrival time approximately 30 minutes later.

The tested catalog, pricing, configuration validation/identity, cart state, defensive persistence, and simulated-order modules in `src/` were salvaged from the later `referenced-chatgpt-conversation-this-is-an-3` project. Its HTML and visual CSS were not used.

## Run and test

Serve this directory with any static server, then open `index.html`. For example:

```text
npx serve .
```

Run tests with:

```text
node --test
```

`npm test` runs the same command when npm is installed correctly.

The site is GitHub Pages compatible and requires no build step.

## Security and provenance

The public project excludes the GoDaddy/OpenCart PHP application, databases, database credentials, password hashes, customer/order PII, sessions, logs, caches, mailbox data, admin area, hosting configuration, and raw archives. Browser-saved PayPal/Apple Pay scripts, frames, captured tokens/configuration, and live AJAX routes were also removed.

OpenCart, Bootstrap, jQuery-era styling conventions, Font Awesome, Poppins font declarations, PayPal integration conventions, and TemplateMo-derived material are third-party work. Their presence in the historical deployment is documented rather than presented as original authorship. The live payment implementation is not distributed. The historical Google font binary was not present in either archive, so browsers use the archived CSS fallback stack instead of making a live font request.

The original pizza/logo/media artwork is preserved as supplied. The project owner states that the logo is original and other artwork was created or sourced from free stock; original license records were not present in the archives, so redistribution status should be reviewed before public publication.
