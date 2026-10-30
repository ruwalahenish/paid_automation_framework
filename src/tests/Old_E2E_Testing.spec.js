import { test } from "@playwright/test";
import { createTestLogger } from "../logging/logger.js";
import { LoginPage } from "../pages/OldUI/LoginPage.js";
import { CustomerPage } from "../pages/OldUI/CustomersPage.js";
import { ProductsPage } from "../pages/OldUI/ProductsPage.js";
import { QuickCharge } from "../pages/OldUI/QuickCharge.js";
import { Invoicing } from "../pages/OldUI/InvoicingPage.js";
import { POS } from "../pages/OldUI/PosPage.js";
import { Checkout } from "../pages/OldUI/CheckOutPage.js";
import { Subscription } from "../pages/OldUI/SubscriptionPage.js";

test("End to End test", async ({ page, baseURL }) => {
  const logger = createTestLogger(test.info().file);
  await page.goto(baseURL);
  logger.info("Browser Invoked!!");

  // Login
  const login = new LoginPage(page);
  await login.login();
  logger.info("Login Successful.");

  // Add Customers
  const customer = new CustomerPage(page);
  await customer.addCustomer();
  logger.info("Customer added successful.");

  await page.waitForTimeout(2000);

  //add Products
  const products = new ProductsPage(page);
  await products.addProducts();
  logger.info("Product added successful.");

  await page.waitForTimeout(3000);

  //Quick Charge
  const quickCharge = new QuickCharge(page);
  await quickCharge.customAmountQC();
  logger.info("Custom Amount - Quick Charge done successfully.");
  await quickCharge.productSelectionQC();
  logger.info("Product Selection - Quick Charge done successfully.");

  await page.waitForTimeout(2000);

  //Invoicing
  const invoicing = new Invoicing(page);
  await invoicing.SendInvoice();
  logger.info("Invoicing done successfully");

  // //Point of Sale
  // const pos = new POS(page);
  // await pos.CheckPOSRedirection();
  // logger.info("POS check redirection successfully");

  await page.waitForTimeout(2000);

  //Check Out
  const checkout = new Checkout(page);
  await checkout.addCheckOut();
  logger.info("Checkout payment successfully");

  await page.waitForTimeout(2000);

  //Subscription
  const subscription = new Subscription(page);
  await subscription.startSubscription();
  logger.info("Start subscription successfully");
  await subscription.scheduleSubscription();
  logger.info("Subscription scheduled successfully");
});
