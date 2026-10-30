import { expect, test } from "@playwright/test";
import * as allure from "allure-js-commons";
import { createTestLogger } from "../logging/logger.js";

// import { LoginPage } from "../pages/newUI/LoginPage.js";
import { LoginPage } from "../pages/OldUI/LoginPage.js";
import { CustomerPage } from "../pages/newUI/CustomerPage.js";
import { ProductServicePage } from "../pages/newUI/Product_ServicePage.js";
import { InvoicingPage } from "../pages/newUI/InvoicingPage.js";
import { TransactionPage } from "../pages/newUI/TransactionPage.js";
import { SubscriptionPage } from "../pages/newUI/SubscriptionPage.js";
import { CheckoutPage } from "../pages/newUI/CheckoutPage.js";

test("End to End Test", async ({ page, baseURL }) => {
  const logger = createTestLogger(test.info().file);

  await allure.displayName("End to End Testing");
  await allure.severity("critical");

  try {
    // Navigate to the base URL
    await page.goto(baseURL);
    logger.info("Browser launched and navigated to base URL.");

    // New UI Login Module
    // const login = new LoginPage(page);
    // await login.login();
    // logger.info("Login successful.");

    // Old UI Login Module
    const login = new LoginPage(page);
    await login.login();
    logger.info("Login Successful.");

    await page.waitForLoadState();
    
    await page.reload();
    
    await expect(page).toHaveURL(`${baseURL}/payments/dashboard?filterStats=today`, {
      timeout: 10000,
    });
    logger.info("Verified navigation to Dashboard.");

    // Introduce a short wait to ensure stability
    await page.waitForTimeout(2000);

    // Customer Module
    const customer = new CustomerPage(page);

    // Navigate to Customer Module
    await customer.navigateToCustomers();
    await expect(page).toHaveURL(`${baseURL}/payments/customers`, {
      timeout: 10000,
    });
    logger.info("Successfully navigated to Customer module.");

    // Add Customer
    await customer.addCustomer();
    logger.info("Customer added successfully.");

    // Product/Service Module
    const productService = new ProductServicePage(page);

    // Navigate to Product/Service Module
    await productService.navigateToProduct();
    await expect(page).toHaveURL(`${baseURL}/payments/products`, {
      timeout: 5000,
    });
    logger.info("Successfully navigated to Product module.");

    // Add Product
    await productService.addProduct();
    logger.info("Product added successfully.");

    //Invoice Module
    const invoicing = new InvoicingPage(page);

    // Navigate to Invoice Module
    await invoicing.navigateToInvoicing();
    await expect(page).toHaveURL(`${baseURL}/payments/invoices`, {
      timeout: 5000,
    });
    logger.info("Successfully navigated to Invoice module.");

    // Create Invoice
    await invoicing.createInvoice();
    logger.info("Invoice created successfully.");

    //Fetch Invoice Email Payment Link
    await invoicing.fetchPaymentLink();

    //Pay the Invoice
    await invoicing.payInvoice();
    logger.info("Invoice paid successfully.");

    //Transaction Module
    const transaction = new TransactionPage(page);

    //navigate to transaction page
    await transaction.navigateToTransaction();
    await expect(page).toHaveURL(`${baseURL}/payments/transactions`, {
      timeout: 5000,
    });
    logger.info("Successfully navigated to transaction module.");

    //create transaction with custom amount
    await transaction.createTransactionWithCustomAmount();
    logger.info("Transaction created successfully with custom amount.");

    //create transaction with select product
    await transaction.createTransactionWithSelectProduct();
    logger.info("Transaction created successfully with select product.");

    //Subscription Module
    const subscription = new SubscriptionPage(page);

    //navigate to subscription page
    await subscription.navigateToSubscriptions();
    await expect(page).toHaveURL(
      `${baseURL}/payments/subscriptions`,
      {
        timeout: 5000,
      }
    );
    logger.info("Successfully navigated to subscription module.");

    // Create Start Subscription
    await subscription.createStartSubscription();
    logger.info("Successfully created a start subscription.");

    await subscription.createSchduleSubscription();
    logger.info("Successfully created a schdule subscription.");

    await page.goto(`${baseURL}/payments/subscriptions`);

    //Checkout Module
    const checkout = new CheckoutPage(page);

    //navigate to checkout page
    await checkout.navigateToCheckout();
    await expect(page).toHaveURL(`${baseURL}/payments/checkouts`, {
      timeout: 5000,
    });
    logger.info("Successfully navigated to checkout module.");

    //create checkout
    await checkout.createCheckout();
    logger.info("Successfully created a checkout.");

    //pay checkout
    await checkout.payCheckout();
    logger.info("Successfully paid the checkout.");
  } catch (error) {
    logger.error("Error performing E2E testing", error);
    expect(page).toBeFalsy();
    throw error;
  }
});
